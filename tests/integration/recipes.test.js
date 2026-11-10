// Feature 8: recipes, and stock that follows sales.
const { backend, setupBusiness, silenceLogs } = require('../helpers/setup');

let ctx, POS, Inv, Recipes, Menu, pizzaId, sodaId, flourId, cheeseId, canId;

beforeAll(async () => {
  silenceLogs();
  ctx = await setupBusiness();
  POS = backend('services/posService');
  Inv = backend('services/inventoryService');
  Recipes = backend('services/recipeService');
  Menu = backend('services/menuService');

  pizzaId = Menu.createItem(1, { name: 'Margherita', price: 12, available: 1 }).itemId;
  sodaId = Menu.createItem(1, { name: 'Soda', price: 2, available: 1 }).itemId;
  flourId = Inv.createItem(1, { name: 'Flour', quantity: 10, unit: 'kg', minQuantity: 2, unitCost: 1.2 }).id;
  cheeseId = Inv.createItem(1, { name: 'Mozzarella', quantity: 3, unit: 'kg', minQuantity: 1, unitCost: 8 }).id;
  canId = Inv.createItem(1, { name: 'Soda can', quantity: 24, unit: 'each', minQuantity: 6, unitCost: 0.4 }).id;
});

afterAll(() => ctx.database.flushDatabase());

const stock = (id) => Number(Inv.getItemById(1, id).quantity);
const sell = (items, method = 'Card') => {
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  return POS.createTransaction(1, {
    cashierId: ctx.ownerId, subtotal: total, tax: 0, total,
    items: items.map((i) => ({ ...i, totalPrice: i.unitPrice * i.quantity })),
    payments: [{ methodType: method, amount: total }]
  });
};

describe('setting recipes', () => {
  test('a recipe lists ingredients with their units and stock', () => {
    const recipe = Recipes.setRecipe(1, pizzaId, [
      { inventoryItemId: flourId, quantity: 0.25 },
      { inventoryItemId: cheeseId, quantity: 0.15 }
    ]);
    expect(recipe.map((r) => [r.name, r.quantity, r.unit])).toEqual([['Flour', 0.25, 'kg'], ['Mozzarella', 0.15, 'kg']]);
    Recipes.setRecipe(1, sodaId, [{ inventoryItemId: canId, quantity: 1 }]);
    expect(Object.keys(Recipes.getRecipesByItem(1)).map(Number).sort()).toEqual([pizzaId, sodaId].sort());
  });

  test('duplicate ingredients are combined', () => {
    const recipe = Recipes.setRecipe(1, sodaId, [{ inventoryItemId: canId, quantity: 0.5 }, { inventoryItemId: canId, quantity: 0.5 }]);
    expect(recipe).toHaveLength(1);
    expect(recipe[0].quantity).toBe(1);
  });

  test('invalid amounts and unknown ingredients are rejected', () => {
    expect(() => Recipes.setRecipe(1, pizzaId, [{ inventoryItemId: flourId, quantity: 0 }])).toThrow(/more than zero/);
    expect(() => Recipes.setRecipe(1, pizzaId, [{ inventoryItemId: flourId, quantity: -1 }])).toThrow(/more than zero/);
    expect(() => Recipes.setRecipe(1, pizzaId, [{ inventoryItemId: 99999, quantity: 1 }])).toThrow(/not found/);
    expect(() => Recipes.setRecipe(1, 99999, [])).toThrow(/Menu item not found/);
    expect(Recipes.getRecipesByItem(1)[pizzaId]).toHaveLength(2); // unchanged after failures
  });
});

describe('sales deduct stock', () => {
  test('selling 2 pizzas and 3 sodas uses the right amounts', () => {
    sell([
      { menuItemId: pizzaId, quantity: 2, unitPrice: 12 },
      { menuItemId: sodaId, quantity: 3, unitPrice: 2 }
    ]);
    expect(stock(flourId)).toBe(9.5);
    expect(stock(cheeseId)).toBe(2.7);
    expect(stock(canId)).toBe(21);
  });

  test('each deduction is recorded as a sale movement', () => {
    const moves = Inv.getItemTransactions(1, flourId, 10);
    const sale = moves.find((m) => m.transaction_type === 'sale');
    expect(sale.quantity).toBe(0.5);
    expect(sale.notes).toMatch(/^Sale #\d+$/);
  });

  test('sale movements do not create expenses', () => {
    const today = new Date().toISOString().slice(0, 10);
    const expenses = backend('services/expenseService').getAllExpenses(1);
    expect(expenses.filter((e) => /Sale #/.test(e.description || ''))).toHaveLength(0);
    expect(today).toBeTruthy();
  });

  test('items without a recipe change nothing', () => {
    const plainId = Menu.createItem(1, { name: 'Gift card', price: 25, available: 1 }).itemId;
    const before = [stock(flourId), stock(cheeseId), stock(canId)];
    sell([{ menuItemId: plainId, quantity: 1, unitPrice: 25 }]);
    expect([stock(flourId), stock(cheeseId), stock(canId)]).toEqual(before);
  });

  test('repeated fractional usage stays exact', () => {
    for (let i = 0; i < 10; i++) sell([{ menuItemId: pizzaId, quantity: 1, unitPrice: 12 }]);
    expect(stock(cheeseId)).toBe(1.2); // 2.7 - 10 x 0.15
  });

  test('stock can go below the minimum and shows as low stock', () => {
    expect(Inv.getLowStockItems(1).map((i) => i.name)).not.toContain('Mozzarella'); // 1.2 kg, minimum 1
    sell([{ menuItemId: pizzaId, quantity: 2, unitPrice: 12 }]); // uses 0.3 kg
    expect(stock(cheeseId)).toBe(0.9);
    expect(Inv.getLowStockItems(1).map((i) => i.name)).toContain('Mozzarella');
  });
});

describe('voids, refunds and tabs', () => {
  test('voiding a sale puts the stock back, once', () => {
    const tx = sell([{ menuItemId: sodaId, quantity: 4, unitPrice: 2 }]);
    expect(stock(canId)).toBe(17);
    POS.voidTransaction(1, tx.id, 'mistake', ctx.ownerId);
    expect(stock(canId)).toBe(21);
    const reversal = Inv.getItemTransactions(1, canId, 10).find((m) => m.transaction_type === 'sale_reversal');
    expect(reversal.quantity).toBe(4);
  });

  test('refunds do not restock', () => {
    const tx = sell([{ menuItemId: sodaId, quantity: 2, unitPrice: 2 }]);
    expect(stock(canId)).toBe(19);
    backend('services/refundService').createRefund(1, tx.id, ctx.ownerId, { amount: 2, method: 'card', reason: 'flat' });
    expect(stock(canId)).toBe(19);
  });

  test('tabs deduct when paid, not when opened, and only once', () => {
    const tab = POS.openTab(1, ctx.ownerId, { name: 'Table 2', items: [{ menuItemId: sodaId, quantity: 1, unitPrice: 2 }] });
    expect(stock(canId)).toBe(19);
    POS.updateTab(1, tab.id, { items: [{ menuItemId: sodaId, quantity: 3, unitPrice: 2 }] });
    expect(stock(canId)).toBe(19);
    POS.closeTab(1, tab.id, {
      cashierId: ctx.ownerId, subtotal: 6, tax: 0, total: 6,
      items: [{ menuItemId: sodaId, quantity: 3, unitPrice: 2 }],
      payments: [{ methodType: 'Card', amount: 6 }]
    });
    expect(stock(canId)).toBe(16);
  });

  test('cancelled tabs never touch stock', () => {
    const tab = POS.openTab(1, ctx.ownerId, { name: 'Walkout', items: [{ menuItemId: sodaId, quantity: 5, unitPrice: 2 }] });
    POS.cancelTab(1, tab.id, 'left');
    expect(stock(canId)).toBe(16);
  });
});

describe('cleanup', () => {
  test('deleting an inventory item removes it from recipes', () => {
    Inv.deleteItem(1, cheeseId);
    expect(Recipes.getRecipesByItem(1)[pizzaId].map((r) => r.name)).toEqual(['Flour']);
  });

  test('deleting a menu item removes its recipe', () => {
    Menu.deleteItem(sodaId);
    expect(Recipes.getRecipesByItem(1)[sodaId]).toBeUndefined();
  });
});
