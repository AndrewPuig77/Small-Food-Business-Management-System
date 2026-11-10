// Refunds: return money for some or all of a completed sale.
//
// Item refunds give back each returned item's share of what the customer
// actually paid: its line price, less its share of any discount, plus its
// share of tax. Tips are not refunded by item; use an amount refund for that.
// Refunds can never exceed what was collected on the sale.
const { getDb, saveDatabase } = require('../database/database');
const { sql } = require('../database/sql');

const round2 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;

const rows = (result) => {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((v) => Object.fromEntries(columns.map((c, i) => [c, v[i]])));
};
const one = (result) => rows(result)[0] || null;

const pad = (n) => String(n).padStart(2, '0');
const localNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const METHODS = ['cash', 'card', 'mobile payment', 'store credit'];

// Refunds paid while a drawer session is open belong to that session
const openSessionId = (businessId) => {
  const r = one(getDb().exec(sql`SELECT id FROM cash_drawer_sessions WHERE business_id = ${businessId} AND status = 'open' ORDER BY id DESC LIMIT 1`));
  return r ? r.id : null;
};

const getRefunds = (businessId, transactionId) =>
  rows(getDb().exec(sql`
    SELECT r.id, r.amount, r.method_type, r.reason, r.items_json, r.created_at, u.full_name AS refunded_by_name
    FROM refunds r
    LEFT JOIN users u ON u.id = r.refunded_by
    WHERE r.business_id = ${businessId} AND r.transaction_id = ${transactionId}
    ORDER BY r.id
  `)).map((r) => ({ ...r, amount: round2(r.amount), items: r.items_json ? JSON.parse(r.items_json) : [] }));

// What can still be refunded on a sale, per item and in total.
const getRefundable = (businessId, transactionId) => {
  const db = getDb();
  const tx = one(db.exec(sql`
    SELECT id, status, subtotal, discount, tax, tip_amount, total
    FROM transactions
    WHERE id = ${transactionId} AND business_id = ${businessId}
  `));
  if (!tx) throw new Error('Transaction not found');

  const items = rows(db.exec(sql`
    SELECT ti.id, ti.quantity, ti.unit_price, ti.total_price, mi.name
    FROM transaction_items ti
    LEFT JOIN menu_items mi ON mi.id = ti.menu_item_id
    WHERE ti.transaction_id = ${transactionId}
    ORDER BY ti.id
  `));
  const payments = rows(db.exec(sql`
    SELECT LOWER(method_type) AS method, amount FROM payment_methods WHERE transaction_id = ${transactionId}
  `));
  const refunds = getRefunds(businessId, transactionId);

  const refundedQty = {};
  refunds.forEach((r) => r.items.forEach((i) => {
    refundedQty[i.transactionItemId] = (refundedQty[i.transactionItemId] || 0) + i.quantity;
  }));

  // Share of discount and tax per $1 of item price.
  const subtotal = Number(tx.subtotal) || 0;
  const factor = subtotal > 0 ? (subtotal - (Number(tx.discount) || 0) + (Number(tx.tax) || 0)) / subtotal : 0;

  const refundedTotal = round2(refunds.reduce((s, r) => s + r.amount, 0));
  return {
    transactionId: tx.id,
    status: tx.status,
    total: round2(tx.total),
    refundedTotal,
    remaining: round2(Math.max(0, tx.total - refundedTotal)),
    payments: payments.map((p) => ({ method: p.method, amount: round2(p.amount) })),
    items: items.map((i) => {
      const unitPaid = round2((Number(i.total_price) / i.quantity) * factor);
      const refunded = refundedQty[i.id] || 0;
      return {
        transactionItemId: i.id,
        name: i.name || 'Item',
        quantity: i.quantity,
        refundedQuantity: refunded,
        refundableQuantity: i.quantity - refunded,
        unitRefund: unitPaid
      };
    }),
    refunds
  };
};

// data: { items: [{ transactionItemId, quantity }], amount, method, reason }
// Give items, or an amount, or both (items + an extra amount).
const createRefund = (businessId, transactionId, userId, data) => {
  const info = getRefundable(businessId, transactionId);
  if (info.status !== 'completed') throw new Error('Only completed sales can be refunded');

  const reason = String(data.reason || '').trim();
  if (!reason) throw new Error('A reason is required');

  const method = String(data.method || '').trim().toLowerCase();
  if (!METHODS.includes(method)) throw new Error('Choose how the refund is paid');

  // Items
  const byId = new Map(info.items.map((i) => [i.transactionItemId, i]));
  const refundItems = [];
  for (const req of data.items || []) {
    const qty = Number.parseInt(req.quantity, 10);
    if (!qty) continue;
    const item = byId.get(Number(req.transactionItemId));
    if (!item) throw new Error('Item is not part of this sale');
    if (qty < 0 || qty > item.refundableQuantity) {
      throw new Error(`Only ${item.refundableQuantity} of ${item.name} can be refunded`);
    }
    refundItems.push({
      transactionItemId: item.transactionItemId,
      name: item.name,
      quantity: qty,
      amount: round2(item.unitRefund * qty)
    });
  }

  const itemsAmount = round2(refundItems.reduce((s, i) => s + i.amount, 0));
  const extra = data.amount === undefined || data.amount === null || data.amount === '' ? 0 : Number(data.amount);
  if (!Number.isFinite(extra) || extra < 0) throw new Error('Refund amount must be zero or more');

  // Item shares are capped by what's left so rounding never exceeds the sale
  const amount = round2(Math.min(itemsAmount + extra, info.remaining));
  if (itemsAmount + extra > info.remaining + 0.005 && extra > 0) {
    throw new Error(`Refund is more than the $${info.remaining.toFixed(2)} left on this sale`);
  }
  if (amount <= 0) throw new Error('Choose items or an amount to refund');

  getDb().run(sql`
    INSERT INTO refunds (business_id, transaction_id, amount, method_type, reason, items_json, refunded_by, created_at, drawer_session_id)
    VALUES (${businessId}, ${transactionId}, ${amount}, ${method}, ${reason},
            ${refundItems.length ? JSON.stringify(refundItems) : null}, ${userId}, ${localNow()}, ${openSessionId(businessId)})
  `);
  saveDatabase();
  return getRefundable(businessId, transactionId);
};

const hasRefunds = (businessId, transactionId) => getRefunds(businessId, transactionId).length > 0;

module.exports = { getRefundable, createRefund, getRefunds, hasRefunds, METHODS };
