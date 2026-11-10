// Feature 4: partial refunds (by item or amount) and their effect on reports.
const { backend, setupBusiness, silenceLogs } = require('../helpers/setup');

let ctx, POS, Refunds, Drawer, burgerId, sodaId;

beforeAll(async () => {
  silenceLogs();
  ctx = await setupBusiness();
  POS = backend('services/posService');
  Refunds = backend('services/refundService');
  Drawer = backend('services/cashDrawerService');
  const Menu = backend('services/menuService');
  burgerId = Menu.createItem(1, { name: 'Burger', price: 10, available: 1 }).itemId;
  sodaId = Menu.createItem(1, { name: 'Soda', price: 2, available: 1 }).itemId;
});

afterAll(() => ctx.database.flushDatabase());

// 2 burgers + 3 sodas = 26.00, 10% discount = 2.60, tax 7% of 26 = 1.82, tip 3
// total = 26 - 2.60 + 1.82 + 3 = 28.22
const bigSale = (method = 'Cash') => POS.createTransaction(1, {
  cashierId: ctx.ownerId, subtotal: 26, discount: 2.6, tax: 1.82, tipAmount: 3, total: 28.22,
  items: [
    { menuItemId: burgerId, quantity: 2, unitPrice: 10, totalPrice: 20 },
    { menuItemId: sodaId, quantity: 3, unitPrice: 2, totalPrice: 6 }
  ],
  payments: [{ methodType: method, amount: 28.22 }]
});

const itemId = (info, name) => info.items.find((i) => i.name === name).transactionItemId;

describe('what can be refunded', () => {
  test('lists items with the per-unit amount actually paid (after discount, with tax)', () => {
    const tx = bigSale();
    const info = Refunds.getRefundable(1, tx.id);
    // factor = (26 - 2.6 + 1.82) / 26 = 0.97: burger 9.70, soda 1.94
    expect(info.items.map((i) => [i.name, i.refundableQuantity, i.unitRefund])).toEqual([['Burger', 2, 9.7], ['Soda', 3, 1.94]]);
    expect(info.remaining).toBe(28.22);
  });
});

describe('item refunds', () => {
  let tx;
  beforeAll(() => { tx = bigSale(); });

  test('refunding one burger returns its paid share', () => {
    const info = Refunds.getRefundable(1, tx.id);
    const after = Refunds.createRefund(1, tx.id, ctx.ownerId, {
      items: [{ transactionItemId: itemId(info, 'Burger'), quantity: 1 }], method: 'cash', reason: 'Cold'
    });
    expect(after.refundedTotal).toBe(9.7);
    expect(after.remaining).toBe(18.52);
    expect(after.items.find((i) => i.name === 'Burger').refundableQuantity).toBe(1);
  });

  test('cannot refund more of an item than is left', () => {
    const info = Refunds.getRefundable(1, tx.id);
    expect(() => Refunds.createRefund(1, tx.id, ctx.ownerId, {
      items: [{ transactionItemId: itemId(info, 'Burger'), quantity: 2 }], method: 'cash', reason: 'x'
    })).toThrow(/Only 1 of Burger/);
  });

  test('items from another sale are rejected', () => {
    const other = bigSale();
    const otherInfo = Refunds.getRefundable(1, other.id);
    expect(() => Refunds.createRefund(1, tx.id, ctx.ownerId, {
      items: [{ transactionItemId: itemId(otherInfo, 'Soda'), quantity: 1 }], method: 'cash', reason: 'x'
    })).toThrow(/not part of this sale/);
  });

  test('a reason and a refund method are required', () => {
    const info = Refunds.getRefundable(1, tx.id);
    const items = [{ transactionItemId: itemId(info, 'Soda'), quantity: 1 }];
    expect(() => Refunds.createRefund(1, tx.id, ctx.ownerId, { items, method: 'cash', reason: ' ' })).toThrow(/reason is required/);
    expect(() => Refunds.createRefund(1, tx.id, ctx.ownerId, { items, method: 'bitcoin', reason: 'x' })).toThrow(/how the refund is paid/);
    expect(() => Refunds.createRefund(1, tx.id, ctx.ownerId, { items: [], method: 'cash', reason: 'x' })).toThrow(/Choose items or an amount/);
  });
});

describe('amount refunds', () => {
  test('a goodwill amount can be refunded, but never more than what is left', () => {
    const tx = bigSale('Card');
    expect(() => Refunds.createRefund(1, tx.id, ctx.ownerId, { amount: 50, method: 'card', reason: 'x' })).toThrow(/more than the \$28.22/);
    expect(() => Refunds.createRefund(1, tx.id, ctx.ownerId, { amount: -1, method: 'card', reason: 'x' })).toThrow(/zero or more/);
    Refunds.createRefund(1, tx.id, ctx.ownerId, { amount: 5, method: 'card', reason: 'Long wait' });
    const after = Refunds.createRefund(1, tx.id, ctx.ownerId, { amount: 23.22, method: 'card', reason: 'Rest of order' });
    expect(after.remaining).toBe(0);
    expect(() => Refunds.createRefund(1, tx.id, ctx.ownerId, { amount: 0.01, method: 'card', reason: 'x' })).toThrow(/more than the \$0.00/);
  });

  test('refunding every item returns exactly what was paid, excluding the tip', () => {
    const tx = bigSale();
    const info = Refunds.getRefundable(1, tx.id);
    const after = Refunds.createRefund(1, tx.id, ctx.ownerId, {
      items: info.items.map((i) => ({ transactionItemId: i.transactionItemId, quantity: i.quantity })),
      method: 'cash', reason: 'Wrong order'
    });
    expect(after.refundedTotal).toBe(25.22); // 28.22 - 3.00 tip
    expect(after.remaining).toBe(3);
  });
});

describe('interaction with voids and reports', () => {
  test('a sale with refunds cannot also be voided', () => {
    const tx = bigSale();
    const info = Refunds.getRefundable(1, tx.id);
    Refunds.createRefund(1, tx.id, ctx.ownerId, { items: [{ transactionItemId: itemId(info, 'Soda'), quantity: 1 }], method: 'cash', reason: 'x' });
    expect(() => POS.voidTransaction(1, tx.id, 'x', ctx.ownerId)).toThrow(/has refunds/);
  });

  test('voided sales cannot be refunded', () => {
    const tx = bigSale();
    POS.voidTransaction(1, tx.id, 'mistake', ctx.ownerId);
    expect(() => Refunds.createRefund(1, tx.id, ctx.ownerId, { amount: 1, method: 'cash', reason: 'x' })).toThrow(/Only completed sales/);
  });

  test('transactions include their refunds for receipts', () => {
    const tx = bigSale();
    Refunds.createRefund(1, tx.id, ctx.ownerId, { amount: 2, method: 'cash', reason: 'Spilled' });
    const saved = POS.getTransactionById(1, tx.id);
    expect(saved.refunded_amount).toBe(2);
    expect(saved.refunds[0]).toMatchObject({ amount: 2, method_type: 'cash', reason: 'Spilled', refunded_by_name: 'Pat Lee' });
  });

  test('cash refunds lower the expected drawer cash; card refunds do not', () => {
    Drawer.openSession(1, ctx.ownerId, 100);
    const cashSale = bigSale('Cash');
    const cardSale = bigSale('Card');
    expect(Drawer.getCurrentSession(1).cash.expected).toBe(128.22);
    Refunds.createRefund(1, cashSale.id, ctx.ownerId, { amount: 4, method: 'cash', reason: 'x' });
    Refunds.createRefund(1, cardSale.id, ctx.ownerId, { amount: 6, method: 'card', reason: 'x' });
    const s = Drawer.getCurrentSession(1);
    expect(s.cash.cashRefunds).toBe(4);
    expect(s.cash.expected).toBe(124.22);
    expect(s.report.refunds).toEqual({ count: 2, total: 10, cash: 4 });
    expect(s.report.sales.netSales).toBe(round(s.report.sales.total - 10));
  });
});

function round(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
