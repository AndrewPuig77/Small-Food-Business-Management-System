// Feature 5: open tabs / held orders.
const { backend, setupBusiness, silenceLogs } = require('../helpers/setup');

let ctx, POS, Drawer, Mod, burgerId, beerId, size;

beforeAll(async () => {
  silenceLogs();
  ctx = await setupBusiness();
  POS = backend('services/posService');
  Drawer = backend('services/cashDrawerService');
  Mod = backend('services/modifierService');
  const Menu = backend('services/menuService');
  burgerId = Menu.createItem(1, { name: 'Burger', price: 10, available: 1 }).itemId;
  beerId = Menu.createItem(1, { name: 'Beer', price: 6, available: 1 }).itemId;
  size = Mod.createGroup(1, { name: 'Size', minSelect: 1, maxSelect: 1, options: [{ name: 'Pint', price: 2 }, { name: 'Half', price: 0 }] });
  Mod.setItemGroups(1, beerId, [size.id]);
});

afterAll(() => ctx.database.flushDatabase());

const pint = () => size.options.find((o) => o.name === 'Pint').id;
const beer = (qty = 1) => ({ menuItemId: beerId, quantity: qty, unitPrice: 8, modifierOptionIds: [pint()] });
const burger = (qty = 1) => ({ menuItemId: burgerId, quantity: qty, unitPrice: 10 });

describe('opening a tab', () => {
  test('needs a name and at least one valid item', () => {
    expect(() => POS.openTab(1, ctx.ownerId, { name: ' ', items: [burger()] })).toThrow(/name/);
    expect(() => POS.openTab(1, ctx.ownerId, { name: 'Bar 1', items: [] })).toThrow(/at least one item/);
    expect(() => POS.openTab(1, ctx.ownerId, { name: 'Bar 1', items: [{ menuItemId: beerId, quantity: 1, unitPrice: 6 }] })).toThrow(/Choose a Size/);
    expect(() => POS.openTab(1, ctx.ownerId, { name: 'Bar 1', items: [burger(0)] })).toThrow(/at least 1/);
  });

  test('is saved open, sent to the kitchen, and not counted as a sale', () => {
    const tab = POS.openTab(1, ctx.ownerId, { name: "Sam's table", orderType: 'dine-in', tableNumber: '4', items: [burger(2), beer()] });
    expect(tab.status).toBe('open');
    expect(tab.tab_name).toBe("Sam's table");
    expect(tab.table_number).toBe('4');
    expect(tab.subtotal).toBe(28);
    expect(tab.total).toBe(0);
    expect(POS.getOrders(1).some((o) => o.id === tab.id)).toBe(true);

    const today = Drawer.localNow().slice(0, 10);
    expect(Drawer.getDailyReport(1, today).sales.transactions).toBe(0);
  });

  test('is listed with its items and modifiers', () => {
    const tabs = POS.getOpenTabs(1);
    expect(tabs).toHaveLength(1);
    const beerLine = tabs[0].items.find((i) => i.menu_item_id === beerId);
    expect(beerLine.modifiers.map((m) => m.name)).toEqual(['Pint']);
  });
});

describe('adding to a tab', () => {
  test('updating items resends the order to the kitchen', () => {
    const [tab] = POS.getOpenTabs(1);
    POS.updateOrderKitchenStatus(1, tab.id, 'completed');
    expect(POS.getOrders(1).some((o) => o.id === tab.id)).toBe(false);

    const updated = POS.updateTab(1, tab.id, { items: [burger(2), beer(2)] });
    expect(updated.subtotal).toBe(36);
    expect(updated.kitchen_status).toBe('pending');
    expect(POS.getOrders(1).some((o) => o.id === tab.id)).toBe(true);
  });

  test('saving the same items does not resend to the kitchen', () => {
    const [tab] = POS.getOpenTabs(1);
    POS.updateOrderKitchenStatus(1, tab.id, 'completed');
    const same = POS.updateTab(1, tab.id, { items: [burger(2), beer(2)] });
    expect(same.kitchen_status).toBe('completed');
  });

  test('can be renamed and moved to another table', () => {
    const [tab] = POS.getOpenTabs(1);
    const moved = POS.updateTab(1, tab.id, { name: 'Window', tableNumber: '9', items: [burger(2), beer(2)] });
    expect(moved.tab_name).toBe('Window');
    expect(moved.table_number).toBe('9');
  });
});

describe('paying a tab', () => {
  test('completes it as a sale at the time of payment, in the open drawer', () => {
    const session = Drawer.openSession(1, ctx.ownerId, 50);
    const [tab] = POS.getOpenTabs(1);
    const paid = POS.closeTab(1, tab.id, {
      cashierId: ctx.ownerId, subtotal: 36, tax: 2.52, discount: 0, tipAmount: 5, total: 43.52,
      items: [burger(2), beer(2)],
      payments: [{ methodType: 'Cash', amount: 50 }]
    });
    expect(paid.status).toBe('completed');
    expect(paid.total).toBe(43.52);
    expect(paid.payments[0].amount).toBe(43.52);
    expect(paid.drawer_session_id).toBe(session.id);
    expect(POS.getOpenTabs(1)).toHaveLength(0);
    expect(Drawer.getCurrentSession(1).cash.expected).toBe(93.52);
    expect(() => POS.closeTab(1, tab.id, { items: [burger()], total: 1, payments: [] })).toThrow(/no longer open/);
    expect(() => POS.updateTab(1, tab.id, { items: [burger()] })).toThrow(/no longer open/);
  });

  test('paid tabs can be refunded like any sale', () => {
    const [last] = POS.getRecentTransactions(1, 1);
    const after = backend('services/refundService').createRefund(1, last.id, ctx.ownerId, { amount: 5, method: 'cash', reason: 'Tip refund' });
    expect(after.refundedTotal).toBe(5);
  });
});

describe('cancelling a tab', () => {
  test('needs a reason and removes it from the kitchen and the open list', () => {
    const tab = POS.openTab(1, ctx.ownerId, { name: 'Walkout', items: [burger()] });
    expect(() => POS.cancelTab(1, tab.id, '')).toThrow(/reason/);
    POS.cancelTab(1, tab.id, 'Left without paying');
    expect(POS.getOpenTabs(1)).toHaveLength(0);
    expect(POS.getOrders(1).some((o) => o.id === tab.id)).toBe(false);
    expect(POS.getTransactionById(1, tab.id).status).toBe('cancelled');
  });

  test('voided sales also leave the kitchen display', () => {
    const tx = POS.createTransaction(1, {
      cashierId: ctx.ownerId, subtotal: 10, tax: 0, total: 10,
      items: [burger()], payments: [{ methodType: 'Card', amount: 10 }]
    });
    expect(POS.getOrders(1).some((o) => o.id === tx.id)).toBe(true);
    POS.voidTransaction(1, tx.id, 'mistake', ctx.ownerId);
    expect(POS.getOrders(1).some((o) => o.id === tx.id)).toBe(false);
  });
});

describe('normal checkout cannot create open sales', () => {
  test('createTransaction ignores a client-supplied status', () => {
    const tx = POS.createTransaction(1, {
      cashierId: ctx.ownerId, subtotal: 10, tax: 0, total: 10, status: 'open',
      items: [burger()], payments: [{ methodType: 'Card', amount: 10 }]
    });
    expect(tx.status).toBe('completed');
  });
});
