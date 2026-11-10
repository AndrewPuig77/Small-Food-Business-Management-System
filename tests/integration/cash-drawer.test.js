// Feature 3: cash drawer sessions and end-of-day close-out.
const { backend, setupBusiness, silenceLogs } = require('../helpers/setup');

let ctx, POS, Drawer, burgerId;

beforeAll(async () => {
  silenceLogs();
  ctx = await setupBusiness();
  POS = backend('services/posService');
  Drawer = backend('services/cashDrawerService');
  burgerId = backend('services/menuService').createItem(1, { name: 'Burger', price: 10, available: 1 }).itemId;
});

afterAll(() => ctx.database.flushDatabase());

const sale = (total, payments, extra = {}) => POS.createTransaction(1, {
  cashierId: ctx.ownerId, subtotal: total, tax: 0, total,
  items: [{ menuItemId: burgerId, quantity: 1, unitPrice: total, totalPrice: total }],
  payments,
  ...extra
});

describe('recording payments', () => {
  test('cash overpayment is recorded as the amount applied (change is not counted)', () => {
    expect(POS.normalizePayments([{ methodType: 'Cash', amount: 50 }], 30.65)).toEqual([{ methodType: 'Cash', amount: 30.65 }]);
  });

  test('split payment: card stays as entered, cash covers the rest', () => {
    const out = POS.normalizePayments([{ methodType: 'Card', amount: 20 }, { methodType: 'Cash', amount: 20 }], 30);
    expect(out).toEqual([{ methodType: 'Card', amount: 20 }, { methodType: 'Cash', amount: 10 }]);
  });

  test('exact payments are unchanged', () => {
    expect(POS.normalizePayments([{ methodType: 'Card', amount: 12.5 }], 12.5)).toEqual([{ methodType: 'Card', amount: 12.5 }]);
  });
});

describe('a drawer session from open to close', () => {
  test('no session at first', () => {
    expect(Drawer.getCurrentSession(1)).toBeNull();
  });

  test('opening requires a valid float, and only one session at a time', () => {
    expect(() => Drawer.openSession(1, ctx.ownerId, -5)).toThrow(/zero or more/);
    expect(() => Drawer.openSession(1, ctx.ownerId, '')).toThrow(/zero or more/);
    const s = Drawer.openSession(1, ctx.ownerId, 150);
    expect(s.cash.openingFloat).toBe(150);
    expect(s.cash.expected).toBe(150);
    expect(s.openedBy).toBe('Pat Lee');
    expect(() => Drawer.openSession(1, ctx.ownerId, 100)).toThrow(/already open/);
  });

  test('cash sales raise the expected cash; card sales do not', () => {
    sale(30, [{ methodType: 'Cash', amount: 50 }]); // $20 change given
    sale(25, [{ methodType: 'Card', amount: 25 }]);
    sale(40, [{ methodType: 'Card', amount: 15 }, { methodType: 'Cash', amount: 30 }]); // cash covers 25, $5 change
    const s = Drawer.getCurrentSession(1);
    expect(s.cash.cashSales).toBe(55);
    expect(s.cash.expected).toBe(205);
  });

  test('voided cash sales are not expected in the drawer', () => {
    const tx = sale(12, [{ methodType: 'Cash', amount: 12 }]);
    expect(Drawer.getCurrentSession(1).cash.expected).toBe(217);
    POS.voidTransaction(1, tx.id, 'mistake', ctx.ownerId);
    expect(Drawer.getCurrentSession(1).cash.expected).toBe(205);
  });

  test('pay-ins and pay-outs adjust the expected cash, with validation', () => {
    expect(() => Drawer.addMovement(1, ctx.ownerId, 'pay_in', 0, 'x')).toThrow(/more than zero/);
    expect(() => Drawer.addMovement(1, ctx.ownerId, 'pay_out', 5, '  ')).toThrow(/reason is required/);
    expect(() => Drawer.addMovement(1, ctx.ownerId, 'pay_out', 999, 'too much')).toThrow(/more than should be in the drawer/);
    expect(() => Drawer.addMovement(1, ctx.ownerId, 'refund', 5, 'x')).toThrow(/Unknown movement/);

    Drawer.addMovement(1, ctx.ownerId, 'pay_in', 20, 'Extra change');
    const s = Drawer.addMovement(1, ctx.ownerId, 'pay_out', 35.5, "Bob's produce delivery");
    expect(s.cash.payIns).toBe(20);
    expect(s.cash.payOuts).toBe(35.5);
    expect(s.cash.expected).toBe(189.5);
    expect(s.movements.map((m) => m.reason)).toEqual(['Extra change', "Bob's produce delivery"]);
  });

  test('the live report summarises the session', () => {
    const { report } = Drawer.getCurrentSession(1);
    expect(report.sales.transactions).toBe(3);
    expect(report.sales.total).toBe(95);
    expect(report.voids).toEqual({ count: 1, total: 12 });
    const methods = Object.fromEntries(report.byPaymentMethod.map((m) => [m.method, m.amount]));
    expect(methods).toEqual({ card: 40, cash: 55 });
  });

  test('closing records the count and the variance', () => {
    expect(() => Drawer.closeSession(1, ctx.ownerId, 'abc')).toThrow(/counted cash/);
    const report = Drawer.closeSession(1, ctx.ownerId, 187, 'Short $2.50');
    expect(report.cash.expected).toBe(189.5);
    expect(report.cash.counted).toBe(187);
    expect(report.cash.variance).toBe(-2.5);
    expect(report.session.closedBy).toBe('Pat Lee');
    expect(report.session.notes).toBe('Short $2.50');
    expect(Drawer.getCurrentSession(1)).toBeNull();
    expect(() => Drawer.closeSession(1, ctx.ownerId, 10)).toThrow(/not open/);
    expect(() => Drawer.addMovement(1, ctx.ownerId, 'pay_in', 5, 'x')).toThrow(/Open the drawer first/);
  });

  test('closed sessions keep their report, unchanged by later sales', () => {
    const [last] = Drawer.getSessions(1);
    expect(last.status).toBe('closed');
    expect(last.variance).toBe(-2.5);
    sale(10, [{ methodType: 'Cash', amount: 10 }]);
    const saved = Drawer.getSessionReport(1, last.id);
    expect(saved.sales.total).toBe(95);
    expect(saved.cash.variance).toBe(-2.5);
  });
});

describe('end-of-day report', () => {
  test('covers all of today, including sales outside a drawer session', () => {
    const today = Drawer.localNow().slice(0, 10);
    const day = Drawer.getDailyReport(1, today);
    expect(day.sales.transactions).toBe(4);
    expect(day.sales.total).toBe(105);
    expect(day.drawerSessions).toHaveLength(1);
    expect(day.drawerSessions[0].variance).toBe(-2.5);
    const byType = Object.fromEntries(day.byOrderType.map((o) => [o.orderType, o.total]));
    expect(byType['dine-in']).toBe(105);
  });

  test('rejects a malformed date', () => {
    expect(() => Drawer.getDailyReport(1, 'yesterday')).toThrow(/YYYY-MM-DD/);
  });
});

describe('money is stored in cents', () => {
  test('totals with fractions of a cent are rounded when saved', () => {
    const tx = POS.createTransaction(1, {
      cashierId: ctx.ownerId, subtotal: 3.5, tax: 0.245, total: 3.745,
      items: [{ menuItemId: burgerId, quantity: 1, unitPrice: 3.5, totalPrice: 3.5 }],
      payments: [{ methodType: 'Cash', amount: 20 }]
    });
    const saved = POS.getTransactionById(1, tx.id);
    expect(saved.total).toBe(3.75);
    expect(saved.tax).toBe(0.25);
    expect(saved.payments[0].amount).toBe(3.75);
  });
});
