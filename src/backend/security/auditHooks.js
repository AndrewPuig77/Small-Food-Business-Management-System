// Audit entries for sensitive backend channels.
// before(channel, args) captures anything needed from before the change
// (e.g. the old price); after(...) records an entry when the call succeeded.
const { getDb } = require('../database/database');
const { sql } = require('../database/sql');
const Audit = require('../services/auditService');

const row = (query) => {
  const r = getDb().exec(query);
  if (!r.length || !r[0].values.length) return null;
  return Object.fromEntries(r[0].columns.map((c, i) => [c, r[0].values[0][i]]));
};

const succeeded = (result) => {
  if (result === false || result === null || result === undefined) return false;
  if (typeof result === 'object' && result.success === false) return false;
  return true;
};

const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

const recipeText = (menuItemId) => {
  const r = getDb().exec(sql`
    SELECT i.name, r.quantity, i.unit FROM menu_item_recipes r
    JOIN inventory_items i ON i.id = r.inventory_item_id
    WHERE r.menu_item_id = ${menuItemId} ORDER BY i.name
  `);
  return r.length ? r[0].values.map(([name, qty, unit]) => `${Number(qty)} ${unit} ${name}`).join(', ') : '';
};

const groupNames = (query) => {
  const r = getDb().exec(query);
  return r.length ? r[0].values.map((v) => v[0]) : [];
};

const before = (channel, args) => {
  const a = args[0] || {};
  switch (channel) {
    case 'menu:update-item':
    case 'menu:delete-item': {
      const id = channel === 'menu:delete-item' ? args[0] : a.itemId;
      return { item: row(sql`SELECT id, name, price FROM menu_items WHERE id = ${id}`) };
    }
    case 'business:update-tax-rate':
      return { business: row(sql`SELECT tax_rate FROM businesses WHERE id = ${a.businessId}`) };
    case 'pos:delete-transaction':
      return { tx: row(sql`SELECT id, total, status FROM transactions WHERE id = ${a.orderId}`) };
    case 'refunds:create':
      return { before: row(sql`SELECT COALESCE(SUM(amount), 0) AS refunded FROM refunds WHERE transaction_id = ${a.transactionId}`) };
    case 'pos:delete-customer':
      return { customer: row(sql`SELECT id, name FROM customers WHERE id = ${a.customerId}`) };
    case 'recipes:set':
      return { recipe: recipeText(a.menuItemId) };
    case 'modifiers:set-item-groups':
      return { groups: groupNames(sql`
        SELECT g.name FROM menu_item_modifier_groups l JOIN modifier_groups g ON g.id = l.group_id
        WHERE l.menu_item_id = ${a.menuItemId} ORDER BY g.name
      `) };
    default:
      return null;
  }
};

const after = (channel, args, result, ctx, user) => {
  if (!user || !succeeded(result)) return;
  const a = args[0] || {};
  const log = (action, details) => Audit.record(user.businessId, user.userId, action, details);
  const data = result && typeof result === 'object' && 'data' in result ? result.data : result;

  switch (channel) {
    case 'pos:create-transaction':
    case 'tabs:close': {
      const t = a.transactionData || {};
      if (t.discountType && Number(t.discount) > 0) {
        log('sale.discount', {
          transactionId: data && data.id,
          discount: money(t.discount),
          discountType: t.discountType,
          reason: t.discountReason || null,
          total: money(t.total)
        });
      }
      break;
    }
    case 'pos:void-transaction':
      log('sale.void', { transactionId: a.transactionId, reason: a.voidReason, total: data && money(data.total) });
      break;
    case 'refunds:create': {
      const amount = data ? money(data.refundedTotal - ((ctx && ctx.before && ctx.before.refunded) || 0)) : null;
      log('refund.created', { transactionId: a.transactionId, amount, method: (a.refund || {}).method, reason: (a.refund || {}).reason });
      break;
    }
    case 'tabs:cancel':
      log('tab.cancelled', { tabId: a.tabId, reason: a.reason });
      break;
    case 'drawer:open':
      log('drawer.opened', { openingFloat: money(a.openingFloat) });
      break;
    case 'drawer:close':
      log('drawer.closed', {
        expected: data && data.cash && data.cash.expected,
        counted: data && data.cash && data.cash.counted,
        variance: data && data.cash && data.cash.variance,
        notes: a.notes || null
      });
      break;
    case 'drawer:add-movement':
      log(a.type === 'pay_in' ? 'drawer.pay_in' : 'drawer.pay_out', { amount: money(a.amount), reason: a.reason });
      break;
    case 'menu:create-item':
      log('menu.item_created', { name: (a.itemData || {}).name, price: money((a.itemData || {}).price) });
      break;
    case 'menu:update-item': {
      const old = ctx && ctx.item;
      const next = a.itemData || {};
      if (old && money(old.price) !== money(next.price)) {
        log('menu.price_changed', { itemId: a.itemId, name: next.name || old.name, from: money(old.price), to: money(next.price) });
      } else {
        log('menu.item_updated', { itemId: a.itemId, name: next.name || (old && old.name) });
      }
      break;
    }
    case 'menu:delete-item':
      log('menu.item_deleted', { itemId: args[0], name: ctx && ctx.item && ctx.item.name, price: ctx && ctx.item && money(ctx.item.price) });
      break;
    case 'menu:create-category':
    case 'menu:update-category':
    case 'menu:delete-category':
      log('menu.category_changed', { change: channel.split(':')[1], name: (a.categoryData || {}).name || null });
      break;
    case 'modifiers:create-group':
    case 'modifiers:update-group':
    case 'modifiers:delete-group':
      log('modifiers.changed', { change: channel.split(':')[1], group: (a.groupData || {}).name || a.groupId || null });
      break;
    case 'recipes:set': {
      // Saving a menu item re-saves its recipe; only log real changes
      const now = recipeText(a.menuItemId);
      const was = (ctx && ctx.recipe) || '';
      if (now !== was) {
        const item = row(sql`SELECT name FROM menu_items WHERE id = ${a.menuItemId}`);
        log('menu.recipe_changed', { item: item && item.name, from: was || 'none', to: now || 'none' });
      }
      break;
    }
    case 'modifiers:set-item-groups': {
      // Saving a menu item re-saves its groups; only log real changes
      const now = groupNames(sql`
        SELECT g.name FROM menu_item_modifier_groups l JOIN modifier_groups g ON g.id = l.group_id
        WHERE l.menu_item_id = ${a.menuItemId} ORDER BY g.name
      `);
      const was = (ctx && ctx.groups) || [];
      if (now.join('|') !== was.join('|')) {
        const item = row(sql`SELECT name FROM menu_items WHERE id = ${a.menuItemId}`);
        log('modifiers.changed', { change: 'item groups', item: item && item.name, from: was.join(', ') || 'none', to: now.join(', ') || 'none' });
      }
      break;
    }
    case 'pos:delete-customer':
      log('customer.deleted', { customerId: a.customerId, name: ctx && ctx.customer && ctx.customer.name });
      break;
    case 'pos:update-customer-points':
      log('customer.points_changed', { customerId: a.customerId, change: a.pointsChange });
      break;
    case 'business:update-tax-rate':
      log('settings.tax_rate', { from: ctx && ctx.business && ctx.business.tax_rate, to: data && data.taxRate !== undefined ? data.taxRate : a.taxRate });
      break;
    case 'business:update-owner-code':
      log('owner_code.changed', {});
      break;
    case 'backup:create':
      log('backup.created', { file: data && data.file });
      break;
    case 'backup:export':
      if (data) log('backup.exported', { path: data.path });
      break;
    case 'backup:restore':
    case 'backup:restore-chosen':
      log('backup.restored', { from: a.file || 'file', safetyBackup: data && data.safetyBackup });
      break;
    case 'pos:delete-transaction':
      log('sale.deleted', { transactionId: a.orderId, total: ctx && ctx.tx && money(ctx.tx.total), status: ctx && ctx.tx && ctx.tx.status });
      break;
    case 'pos:purge-transactions':
      log('sales.purged', {});
      break;
    default:
      if (channel.startsWith('employee:') && /create|update|delete|status|account|document/.test(channel)) {
        log('employee.changed', { change: channel.split(':')[1], employeeId: a.employeeId || a.id || null });
      }
  }
};

module.exports = { before, after };
