// Feature 1: modifier groups per menu item.
const { backend, setupBusiness, silenceLogs } = require('../helpers/setup');

let ctx, Mod, Menu, POS;
let pizzaId, drinkId, size, toppings, crust;

beforeAll(async () => {
  silenceLogs();
  ctx = await setupBusiness();
  Mod = backend('services/modifierService');
  Menu = backend('services/menuService');
  POS = backend('services/posService');

  pizzaId = Menu.createItem(1, { name: 'Margherita', price: 12, available: 1 }).itemId;
  drinkId = Menu.createItem(1, { name: 'Lemonade', price: 3.5, available: 1 }).itemId;

  size = Mod.createGroup(1, {
    name: 'Size', minSelect: 1, maxSelect: 1,
    options: [{ name: 'Small', price: 0 }, { name: 'Large', price: 4 }]
  });
  toppings = Mod.createGroup(1, {
    name: 'Toppings', minSelect: 0, maxSelect: 2,
    options: [{ name: 'Mushrooms', price: 1.5 }, { name: "Chef's olives", price: 1 }, { name: 'Basil', price: 0.5 }]
  });
  crust = Mod.createGroup(1, { name: 'Crust', minSelect: 0, maxSelect: 1, options: [{ name: 'Thin', price: 0 }] });

  Mod.setItemGroups(1, pizzaId, [size.id, toppings.id]);
});

afterAll(() => ctx.database.flushDatabase());

const opt = (group, name) => group.options.find((o) => o.name === name).id;
const sale = (items) => ({
  cashierId: ctx.ownerId, subtotal: 20, tax: 0, total: 20,
  items, payments: [{ methodType: 'cash', amount: 20 }]
});

describe('managing groups', () => {
  test('creates groups with ordered, priced options', () => {
    expect(size.options.map((o) => [o.name, o.price])).toEqual([['Small', 0], ['Large', 4]]);
    expect(toppings.max_select).toBe(2);
  });

  test('rejects invalid group definitions', () => {
    expect(() => Mod.createGroup(1, { name: '', options: [{ name: 'x' }] })).toThrow(/name is required/);
    expect(() => Mod.createGroup(1, { name: 'Empty', options: [] })).toThrow(/at least one option/);
    expect(() => Mod.createGroup(1, { name: 'Bad', minSelect: 3, maxSelect: 1, options: [{ name: 'a' }] })).toThrow(/Minimum/);
    expect(() => Mod.createGroup(1, { name: 'Neg', options: [{ name: 'a', price: -1 }] })).toThrow(/negative/);
  });

  test('max picks are capped at the number of options', () => {
    const g = Mod.createGroup(1, { name: 'Sauce', minSelect: 0, maxSelect: 9, options: [{ name: 'Red' }, { name: 'White' }] });
    expect(g.max_select).toBe(2);
    Mod.deleteGroup(1, g.id);
  });

  test('only the groups attached to an item are returned for it', () => {
    const byItem = Mod.getModifiersByItem(1);
    expect(byItem[pizzaId].map((g) => g.name)).toEqual(['Size', 'Toppings']);
    expect(byItem[drinkId]).toBeUndefined();
  });

  test('attaching an unknown group or to an unknown item fails', () => {
    expect(() => Mod.setItemGroups(1, pizzaId, [99999])).toThrow(/Unknown modifier group/);
    expect(() => Mod.setItemGroups(1, 99999, [size.id])).toThrow(/Menu item not found/);
  });

  test('updating a group replaces its options', () => {
    const updated = Mod.updateGroup(1, crust.id, {
      name: 'Crust', minSelect: 0, maxSelect: 1, options: [{ name: 'Thin', price: 0 }, { name: 'Stuffed', price: 2 }]
    });
    expect(updated.options.map((o) => o.name)).toEqual(['Thin', 'Stuffed']);
  });
});

describe('validating selections', () => {
  test('a valid selection returns options and the price added', () => {
    const r = Mod.validateSelection(1, pizzaId, [opt(size, 'Large'), opt(toppings, 'Mushrooms'), opt(toppings, 'Basil')]);
    expect(r.valid).toBe(true);
    expect(r.priceDelta).toBe(6);
    expect(r.modifiers.map((m) => m.name)).toEqual(['Large', 'Mushrooms', 'Basil']);
  });

  test('missing a required group is rejected', () => {
    const r = Mod.validateSelection(1, pizzaId, [opt(toppings, 'Basil')]);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('Choose a Size');
  });

  test('too many picks in a group is rejected', () => {
    const r = Mod.validateSelection(1, pizzaId, [
      opt(size, 'Small'), opt(toppings, 'Mushrooms'), opt(toppings, "Chef's olives"), opt(toppings, 'Basil')
    ]);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('Choose at most 2 for Toppings');
  });

  test('two choices in a pick-one group is rejected', () => {
    const r = Mod.validateSelection(1, pizzaId, [opt(size, 'Small'), opt(size, 'Large')]);
    expect(r.valid).toBe(false);
  });

  test('options from a group not attached to the item are rejected', () => {
    const r = Mod.validateSelection(1, pizzaId, [opt(size, 'Small'), crust.options[0].id]);
    expect(r.valid).toBe(false);
    expect(r.errors).toContain('Some selected options are not available for this item');
  });

  test('items without groups accept no options', () => {
    expect(Mod.validateSelection(1, drinkId, []).valid).toBe(true);
    expect(Mod.validateSelection(1, drinkId, [opt(size, 'Small')]).valid).toBe(false);
  });
});

describe('checkout', () => {
  test('stores the chosen options with names and prices from the database', () => {
    const tx = POS.createTransaction(1, sale([
      { menuItemId: pizzaId, quantity: 1, unitPrice: 17.5, totalPrice: 17.5,
        modifierOptionIds: [opt(size, 'Large'), opt(toppings, 'Mushrooms')],
        // A client-supplied list is ignored in favour of the database values
        modifiers: [{ name: 'Free lobster', price: 0 }] },
      { menuItemId: drinkId, quantity: 1, unitPrice: 3.5, totalPrice: 3.5 }
    ]));
    const items = POS.getTransactionById(1, tx.id).items;
    const pizza = items.find((i) => i.menu_item_id === pizzaId);
    const mods = JSON.parse(pizza.modifiers);
    expect(mods.map((m) => [m.group, m.name, m.price])).toEqual([['Size', 'Large', 4], ['Toppings', 'Mushrooms', 1.5]]);
    expect(items.find((i) => i.menu_item_id === drinkId).modifiers).toBeNull();
  });

  test('an order missing a required choice is rejected and nothing is saved', () => {
    const before = POS.getRecentTransactions(1, 100).length;
    expect(() => POS.createTransaction(1, sale([
      { menuItemId: pizzaId, quantity: 1, unitPrice: 12, totalPrice: 12, modifierOptionIds: [] }
    ]))).toThrow(/Choose a Size/);
    expect(POS.getRecentTransactions(1, 100).length).toBe(before);
  });

  test('the kitchen sees the modifiers on the order', () => {
    const orders = POS.getOrders(1);
    const pizza = orders.flatMap((o) => o.items).find((i) => i.menu_item_id === pizzaId);
    expect(pizza.modifiers.map((m) => m.name)).toEqual(['Large', 'Mushrooms']);
  });
});

describe('cleanup', () => {
  test('deleting a group detaches it from items', () => {
    Mod.deleteGroup(1, toppings.id);
    expect(Mod.getModifiersByItem(1)[pizzaId].map((g) => g.name)).toEqual(['Size']);
  });

  test('deleting a menu item removes its links', () => {
    Menu.deleteItem(pizzaId);
    expect(Mod.getModifiersByItem(1)[pizzaId]).toBeUndefined();
    expect(Mod.getGroups(1).find((g) => g.id === size.id).menu_item_ids).toEqual([]);
  });
});
