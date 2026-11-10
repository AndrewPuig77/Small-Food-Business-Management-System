// Feature 2: order type (dine-in / takeout / delivery) and table number.
const { backend, setupBusiness, silenceLogs } = require('../helpers/setup');

let ctx, POS, itemId;

beforeAll(async () => {
  silenceLogs();
  ctx = await setupBusiness();
  POS = backend('services/posService');
  itemId = backend('services/menuService').createItem(1, { name: 'Burger', price: 10, available: 1 }).itemId;
});

afterAll(() => ctx.database.flushDatabase());

const sale = (extra) => POS.createTransaction(1, {
  cashierId: ctx.ownerId, subtotal: 10, tax: 0, total: 10,
  items: [{ menuItemId: itemId, quantity: 1, unitPrice: 10, totalPrice: 10 }],
  payments: [{ methodType: 'cash', amount: 10 }],
  ...extra
});

const saved = (tx) => POS.getTransactionById(1, tx.id);

test('dine-in with a table number is saved', () => {
  const tx = sale({ orderType: 'dine-in', tableNumber: ' 12 ' });
  expect(saved(tx).order_type).toBe('dine-in');
  expect(saved(tx).table_number).toBe('12');
});

test('takeout and delivery are saved without a table number', () => {
  const takeout = sale({ orderType: 'takeout', tableNumber: '5' });
  expect(saved(takeout).order_type).toBe('takeout');
  expect(saved(takeout).table_number).toBeNull();

  const delivery = sale({ orderType: 'delivery' });
  expect(saved(delivery).order_type).toBe('delivery');
  expect(saved(delivery).table_number).toBeNull();
});

test('orders without an order type default to dine-in', () => {
  const tx = sale({});
  expect(saved(tx).order_type).toBe('dine-in');
  expect(saved(tx).table_number).toBeNull();
});

test('an unknown order type is rejected', () => {
  expect(() => sale({ orderType: 'drive-thru' })).toThrow(/Invalid order type/);
});

test('an overly long table number is rejected', () => {
  expect(() => sale({ orderType: 'dine-in', tableNumber: 'x'.repeat(21) })).toThrow(/too long/);
});

test('the kitchen sees order type and table', () => {
  const orders = POS.getOrders(1);
  const withTable = orders.find((o) => o.table_number === '12');
  expect(withTable.order_type).toBe('dine-in');
  expect(orders.some((o) => o.order_type === 'takeout')).toBe(true);
});

describe('tax rate is stored on the business', () => {
  test('the rate from setup is read from the database', () => {
    expect(POS.getTaxRate(1)).toBe(7);
  });

  test('updating the rate persists it', () => {
    expect(POS.updateTaxRate(1, '8.25')).toBe(8.25);
    expect(POS.getTaxRate(1)).toBe(8.25);
  });

  test('invalid rates are rejected', () => {
    expect(() => POS.updateTaxRate(1, -1)).toThrow(/between 0 and 100/);
    expect(() => POS.updateTaxRate(1, 101)).toThrow(/between 0 and 100/);
    expect(() => POS.updateTaxRate(1, 'abc')).toThrow(/between 0 and 100/);
    expect(() => POS.updateTaxRate(1, '')).toThrow(/between 0 and 100/);
    expect(POS.getTaxRate(1)).toBe(8.25);
  });
});
