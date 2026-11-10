// Audit log: who did what sensitive thing, and when. Entries are only ever
// added, never edited or deleted by the app.
const { getDb, saveDatabase } = require('../database/database');
const { sql } = require('../database/sql');

const pad = (n) => String(n).padStart(2, '0');
const localNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// Labels shown in the Audit Log screen
const ACTIONS = {
  'login.success': 'Signed in',
  'login.failed': 'Failed sign-in',
  'owner_code.approved': 'Owner code entered',
  'owner_code.rejected': 'Wrong owner code',
  'owner_code.changed': 'Owner code changed',
  'sale.discount': 'Sale with discount',
  'sale.void': 'Sale voided',
  'sale.deleted': 'Sale deleted',
  'sales.purged': 'All sales deleted',
  'refund.created': 'Refund',
  'tab.cancelled': 'Tab cancelled',
  'drawer.opened': 'Drawer opened',
  'drawer.closed': 'Drawer closed',
  'drawer.pay_in': 'Cash added to drawer',
  'drawer.pay_out': 'Cash removed from drawer',
  'menu.item_created': 'Menu item added',
  'menu.item_updated': 'Menu item changed',
  'menu.price_changed': 'Menu price changed',
  'menu.item_deleted': 'Menu item deleted',
  'menu.category_changed': 'Menu category changed',
  'menu.recipe_changed': 'Recipe changed',
  'modifiers.changed': 'Modifier groups changed',
  'customer.deleted': 'Customer deleted',
  'customer.points_changed': 'Loyalty points changed',
  'settings.tax_rate': 'Tax rate changed',
  'backup.created': 'Backup created',
  'backup.exported': 'Backup exported',
  'backup.restored': 'Backup restored',
  'employee.changed': 'Employee changed',
  'password.reset': 'Password reset',
  'access.denied': 'Action blocked'
};

const record = (businessId, userId, action, details = {}) => {
  getDb().run(sql`
    INSERT INTO audit_log (business_id, user_id, action, details_json, created_at)
    VALUES (${businessId || null}, ${userId || null}, ${action}, ${JSON.stringify(details)}, ${localNow()})
  `);
  saveDatabase();
};

// filters: { from, to ('YYYY-MM-DD'), action, userId, limit }
const list = (businessId, filters = {}) => {
  let where = sql`a.business_id = ${businessId}`;
  if (filters.from) where = sql`${where} AND a.created_at >= ${filters.from + ' 00:00:00'}`;
  if (filters.to) where = sql`${where} AND a.created_at <= ${filters.to + ' 23:59:59'}`;
  if (filters.action) where = sql`${where} AND a.action = ${filters.action}`;
  if (filters.userId) where = sql`${where} AND a.user_id = ${filters.userId}`;
  const limit = Math.min(Number(filters.limit) || 500, 2000);

  const result = getDb().exec(sql`
    SELECT a.id, a.action, a.details_json, a.created_at, a.user_id, u.full_name AS user_name, u.role AS user_role
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE ${where}
    ORDER BY a.id DESC
    LIMIT ${limit}
  `);
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((v) => {
    const row = Object.fromEntries(columns.map((c, i) => [c, v[i]]));
    return {
      id: row.id,
      action: row.action,
      label: ACTIONS[row.action] || row.action,
      details: row.details_json ? JSON.parse(row.details_json) : {},
      createdAt: row.created_at,
      userId: row.user_id,
      userName: row.user_name,
      userRole: row.user_role
    };
  });
};

module.exports = { record, list, ACTIONS };
