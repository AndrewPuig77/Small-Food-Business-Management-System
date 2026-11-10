// Cash drawer sessions and end-of-day (Z) reports.
//
// A session runs from "open drawer" (with the starting cash) to "close drawer"
// (with a cash count). While open, the expected cash in the drawer is:
//
//   starting cash + cash sales + cash added - cash removed - cash refunds
//
// Closing stores the count, the variance (counted - expected) and a snapshot
// of the report, so past close-outs never change.
const { getDb, saveDatabase } = require('../database/database');
const { sql } = require('../database/sql');

const round2 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;

const rows = (result) => {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((v) => Object.fromEntries(columns.map((c, i) => [c, v[i]])));
};
const one = (result) => rows(result)[0] || null;

// Same local 'YYYY-MM-DD HH:MM:SS' format that transactions use.
const pad = (n) => String(n).padStart(2, '0');
const localNow = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const userName = (userId) => {
  const r = one(getDb().exec(sql`SELECT full_name FROM users WHERE id = ${userId}`));
  return r ? r.full_name : null;
};

// Which sales/refunds a report covers: one drawer session (exact, by the
// session each sale was rung up in) or a time window (e.g. a calendar day).
const scopeFor = (alias, scope) =>
  scope.sessionId
    ? sql`${sql.raw(alias)}.drawer_session_id = ${scope.sessionId}`
    : sql`${sql.raw(alias)}.created_at >= ${scope.from} AND ${sql.raw(alias)}.created_at <= ${scope.to}`;

// Refunds in scope, by payment method.
const refundsIn = (businessId, scope) => {
  const r = one(getDb().exec(sql`
    SELECT COUNT(*) AS count,
           COALESCE(SUM(r.amount), 0) AS total,
           COALESCE(SUM(CASE WHEN LOWER(r.method_type) = 'cash' THEN r.amount ELSE 0 END), 0) AS cash
    FROM refunds r
    WHERE r.business_id = ${businessId} AND ${scopeFor('r', scope)}
  `));
  return { count: r.count, total: round2(r.total), cash: round2(r.cash) };
};

// Sales summary. scope: { from, to } or { sessionId, from, to } (from/to are
// then only shown as the period).
const buildReport = (businessId, scope) => {
  const db = getDb();
  const where = scopeFor('t', scope);
  const sales = one(db.exec(sql`
    SELECT COUNT(*) AS transactions,
           COALESCE(SUM(t.subtotal), 0) AS gross_sales,
           COALESCE(SUM(t.discount), 0) AS discounts,
           COALESCE(SUM(t.tax), 0) AS tax,
           COALESCE(SUM(t.tip_amount), 0) AS tips,
           COALESCE(SUM(t.total), 0) AS total
    FROM transactions t
    WHERE t.business_id = ${businessId} AND t.status = 'completed' AND ${where}
  `));

  const byPaymentMethod = rows(db.exec(sql`
    SELECT LOWER(p.method_type) AS method, COUNT(*) AS count, COALESCE(SUM(p.amount), 0) AS amount
    FROM payment_methods p
    JOIN transactions t ON t.id = p.transaction_id
    WHERE t.business_id = ${businessId} AND t.status = 'completed' AND ${where}
    GROUP BY LOWER(p.method_type)
    ORDER BY amount DESC
  `)).map((r) => ({ method: r.method, count: r.count, amount: round2(r.amount) }));

  const byOrderType = rows(db.exec(sql`
    SELECT COALESCE(t.order_type, 'dine-in') AS order_type, COUNT(*) AS count, COALESCE(SUM(t.total), 0) AS total
    FROM transactions t
    WHERE t.business_id = ${businessId} AND t.status = 'completed' AND ${where}
    GROUP BY COALESCE(t.order_type, 'dine-in')
    ORDER BY total DESC
  `)).map((r) => ({ orderType: r.order_type, count: r.count, total: round2(r.total) }));

  const voids = one(db.exec(sql`
    SELECT COUNT(*) AS count, COALESCE(SUM(t.total), 0) AS total
    FROM transactions t
    WHERE t.business_id = ${businessId} AND t.status = 'voided' AND ${where}
  `));

  const cashSales = byPaymentMethod.find((m) => m.method === 'cash');
  const refunds = refundsIn(businessId, scope);

  return {
    period: { from: scope.from, to: scope.to },
    sales: {
      transactions: sales.transactions,
      grossSales: round2(sales.gross_sales),
      discounts: round2(sales.discounts),
      tax: round2(sales.tax),
      tips: round2(sales.tips),
      total: round2(sales.total),
      netSales: round2(sales.total - refunds.total)
    },
    byPaymentMethod,
    byOrderType,
    voids: { count: voids.count, total: round2(voids.total) },
    refunds,
    cashSales: cashSales ? cashSales.amount : 0
  };
};

const getMovements = (sessionId) =>
  rows(getDb().exec(sql`
    SELECT m.id, m.type, m.amount, m.reason, m.created_at, u.full_name AS created_by_name
    FROM cash_drawer_movements m
    LEFT JOIN users u ON u.id = m.created_by
    WHERE m.session_id = ${sessionId}
    ORDER BY m.id
  `)).map((m) => ({ ...m, amount: round2(m.amount) }));

// Live cash position for a session up to `to` (now, for an open session).
const cashSummary = (businessId, session, to) => {
  const report = buildReport(businessId, { sessionId: session.id, from: session.opened_at, to });
  const movements = getMovements(session.id);
  const payIns = round2(movements.filter((m) => m.type === 'pay_in').reduce((s, m) => s + m.amount, 0));
  const payOuts = round2(movements.filter((m) => m.type === 'pay_out').reduce((s, m) => s + m.amount, 0));
  const openingFloat = round2(session.opening_float);
  const expected = round2(openingFloat + report.cashSales + payIns - payOuts - report.refunds.cash);
  return {
    report,
    movements,
    cash: { openingFloat, cashSales: report.cashSales, payIns, payOuts, cashRefunds: report.refunds.cash, expected }
  };
};

const getOpenSessionRow = (businessId) =>
  one(getDb().exec(sql`
    SELECT * FROM cash_drawer_sessions
    WHERE business_id = ${businessId} AND status = 'open'
    ORDER BY id DESC LIMIT 1
  `));

// The open session with its live summary, or null when the drawer is closed.
const getCurrentSession = (businessId) => {
  const session = getOpenSessionRow(businessId);
  if (!session) return null;
  const summary = cashSummary(businessId, session, localNow());
  return {
    id: session.id,
    status: 'open',
    openedAt: session.opened_at,
    openedBy: userName(session.opened_by),
    ...summary
  };
};

const openSession = (businessId, userId, openingFloat) => {
  const amount = Number(openingFloat);
  if (openingFloat === '' || openingFloat === null || !Number.isFinite(amount) || amount < 0) {
    throw new Error('Starting cash must be zero or more');
  }
  if (getOpenSessionRow(businessId)) {
    throw new Error('The drawer is already open. Close it before opening a new session.');
  }
  getDb().run(sql`
    INSERT INTO cash_drawer_sessions (business_id, status, opened_by, opened_at, opening_float)
    VALUES (${businessId}, 'open', ${userId}, ${localNow()}, ${round2(amount)})
  `);
  saveDatabase();
  return getCurrentSession(businessId);
};

const addMovement = (businessId, userId, type, amount, reason) => {
  if (!['pay_in', 'pay_out'].includes(type)) throw new Error('Unknown movement type');
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) throw new Error('Amount must be more than zero');
  const text = String(reason || '').trim();
  if (!text) throw new Error('A reason is required');
  const session = getOpenSessionRow(businessId);
  if (!session) throw new Error('Open the drawer first');

  if (type === 'pay_out') {
    const { cash } = cashSummary(businessId, session, localNow());
    if (round2(value) > cash.expected) {
      throw new Error(`You can't remove more than should be in the drawer ($${cash.expected.toFixed(2)})`);
    }
  }

  getDb().run(sql`
    INSERT INTO cash_drawer_movements (session_id, business_id, type, amount, reason, created_by, created_at)
    VALUES (${session.id}, ${businessId}, ${type}, ${round2(value)}, ${text}, ${userId}, ${localNow()})
  `);
  saveDatabase();
  return getCurrentSession(businessId);
};

const closeSession = (businessId, userId, countedCash, notes) => {
  const counted = Number(countedCash);
  if (countedCash === '' || countedCash === null || !Number.isFinite(counted) || counted < 0) {
    throw new Error('Enter the counted cash (zero or more)');
  }
  const session = getOpenSessionRow(businessId);
  if (!session) throw new Error('The drawer is not open');

  const closedAt = localNow();
  const summary = cashSummary(businessId, session, closedAt);
  const variance = round2(counted - summary.cash.expected);
  const report = {
    ...summary.report,
    cash: { ...summary.cash, counted: round2(counted), variance },
    movements: summary.movements,
    session: {
      id: session.id,
      openedAt: session.opened_at,
      openedBy: userName(session.opened_by),
      closedAt,
      closedBy: userName(userId),
      notes: String(notes || '').trim() || null
    }
  };

  getDb().run(sql`
    UPDATE cash_drawer_sessions
    SET status = 'closed', closed_by = ${userId}, closed_at = ${closedAt},
        expected_cash = ${summary.cash.expected}, counted_cash = ${round2(counted)},
        variance = ${variance}, closing_notes = ${report.session.notes},
        report_json = ${JSON.stringify(report)}
    WHERE id = ${session.id}
  `);
  saveDatabase();
  return report;
};

const getSessions = (businessId, limit = 30) =>
  rows(getDb().exec(sql`
    SELECT s.id, s.status, s.opened_at, s.closed_at, s.opening_float, s.expected_cash,
           s.counted_cash, s.variance, ou.full_name AS opened_by_name, cu.full_name AS closed_by_name
    FROM cash_drawer_sessions s
    LEFT JOIN users ou ON ou.id = s.opened_by
    LEFT JOIN users cu ON cu.id = s.closed_by
    WHERE s.business_id = ${businessId}
    ORDER BY s.id DESC
    LIMIT ${Number(limit) || 30}
  `));

const getSessionReport = (businessId, sessionId) => {
  const r = one(getDb().exec(sql`
    SELECT report_json FROM cash_drawer_sessions
    WHERE id = ${sessionId} AND business_id = ${businessId} AND status = 'closed'
  `));
  if (!r) throw new Error('Closed session not found');
  return JSON.parse(r.report_json);
};

// End-of-day report for a calendar date ('YYYY-MM-DD'), across all sessions.
const getDailyReport = (businessId, date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error('Date must be YYYY-MM-DD');
  const report = buildReport(businessId, { from: `${date} 00:00:00`, to: `${date} 23:59:59` });
  const sessions = getSessions(businessId, 500).filter((s) => String(s.opened_at).startsWith(date));
  return {
    ...report,
    date,
    drawerSessions: sessions.map((s) => ({
      id: s.id,
      status: s.status,
      openedBy: s.opened_by_name,
      expected: s.expected_cash === null ? null : round2(s.expected_cash),
      counted: s.counted_cash === null ? null : round2(s.counted_cash),
      variance: s.variance === null ? null : round2(s.variance)
    }))
  };
};

module.exports = {
  getCurrentSession,
  openSession,
  addMovement,
  closeSession,
  getSessions,
  getSessionReport,
  getDailyReport,
  buildReport,
  localNow
};
