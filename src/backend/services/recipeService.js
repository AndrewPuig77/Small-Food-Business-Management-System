// Recipes link menu items to the inventory they use, so stock follows sales.
//
//   Margherita: 0.25 kg Flour, 0.15 kg Mozzarella
//
// When a sale is completed (or a tab is paid) each item's ingredients are
// taken out of inventory, recorded as "sale" movements. Voiding the sale puts
// them back ("sale_reversal"). Refunds don't restock: refunded food has
// usually been made already. Each sale is deducted at most once.
const { getDb, saveDatabase } = require('../database/database');
const { sql } = require('../database/sql');
const Inventory = require('./inventoryService');

const round3 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 1000) / 1000;

const rows = (result) => {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((v) => Object.fromEntries(columns.map((c, i) => [c, v[i]])));
};

const getRecipe = (businessId, menuItemId) =>
  rows(getDb().exec(sql`
    SELECT r.inventory_item_id, r.quantity, i.name, i.unit, i.quantity AS in_stock
    FROM menu_item_recipes r
    JOIN inventory_items i ON i.id = r.inventory_item_id
    WHERE r.menu_item_id = ${menuItemId} AND i.business_id = ${businessId}
    ORDER BY i.name
  `)).map((r) => ({
    inventoryItemId: r.inventory_item_id,
    name: r.name,
    unit: r.unit,
    quantity: round3(r.quantity),
    inStock: round3(r.in_stock)
  }));

// { [menuItemId]: [line, ...] } for every item that has a recipe
const getRecipesByItem = (businessId) => {
  const list = rows(getDb().exec(sql`
    SELECT r.menu_item_id, r.inventory_item_id, r.quantity, i.name, i.unit, i.quantity AS in_stock
    FROM menu_item_recipes r
    JOIN inventory_items i ON i.id = r.inventory_item_id
    WHERE i.business_id = ${businessId}
    ORDER BY i.name
  `));
  const byItem = {};
  list.forEach((r) => {
    (byItem[r.menu_item_id] = byItem[r.menu_item_id] || []).push({
      inventoryItemId: r.inventory_item_id,
      name: r.name,
      unit: r.unit,
      quantity: round3(r.quantity),
      inStock: round3(r.in_stock)
    });
  });
  return byItem;
};

// Replace a menu item's recipe. lines: [{ inventoryItemId, quantity }]
const setRecipe = (businessId, menuItemId, lines) => {
  const db = getDb();
  const item = db.exec(sql`SELECT id FROM menu_items WHERE id = ${menuItemId} AND business_id = ${businessId}`);
  if (!item.length) throw new Error('Menu item not found');

  const merged = new Map();
  for (const line of lines || []) {
    const invId = Number(line.inventoryItemId);
    const qty = Number(line.quantity);
    if (!invId) continue;
    if (!Number.isFinite(qty) || qty <= 0) throw new Error('Ingredient amounts must be more than zero');
    const inv = db.exec(sql`SELECT id FROM inventory_items WHERE id = ${invId} AND business_id = ${businessId}`);
    if (!inv.length) throw new Error('Ingredient not found in inventory');
    merged.set(invId, round3((merged.get(invId) || 0) + qty));
  }

  db.run(sql`DELETE FROM menu_item_recipes WHERE menu_item_id = ${menuItemId}`);
  merged.forEach((qty, invId) => {
    db.run(sql`INSERT INTO menu_item_recipes (menu_item_id, inventory_item_id, quantity) VALUES (${menuItemId}, ${invId}, ${qty})`);
  });
  saveDatabase();
  return getRecipe(businessId, menuItemId);
};

// Ingredients used by a sale: { [inventoryItemId]: quantity }
const usageForTransaction = (businessId, transactionId) => {
  const lines = rows(getDb().exec(sql`
    SELECT r.inventory_item_id, SUM(r.quantity * ti.quantity) AS used
    FROM transaction_items ti
    JOIN menu_item_recipes r ON r.menu_item_id = ti.menu_item_id
    JOIN inventory_items i ON i.id = r.inventory_item_id AND i.business_id = ${businessId}
    WHERE ti.transaction_id = ${transactionId}
    GROUP BY r.inventory_item_id
  `));
  return Object.fromEntries(lines.map((l) => [l.inventory_item_id, round3(l.used)]));
};

const stockState = (transactionId) => {
  const r = getDb().exec(sql`SELECT stock_deducted FROM transactions WHERE id = ${transactionId}`);
  return r.length && r[0].values.length ? Number(r[0].values[0][0]) || 0 : 0;
};

// Take a completed sale's ingredients out of inventory (once).
const deductForSale = (businessId, transactionId, userId) => {
  if (stockState(transactionId) === 1) return {};
  const usage = usageForTransaction(businessId, transactionId);
  Object.entries(usage).forEach(([invId, qty]) => {
    Inventory.adjustStock(businessId, Number(invId), -qty, userId, `Sale #${transactionId}`, 'sale');
  });
  getDb().run(sql`UPDATE transactions SET stock_deducted = 1 WHERE id = ${transactionId}`);
  saveDatabase();
  return usage;
};

// Put a voided sale's ingredients back (only if they were taken out).
const restoreForVoid = (businessId, transactionId, userId) => {
  if (stockState(transactionId) !== 1) return {};
  const usage = usageForTransaction(businessId, transactionId);
  Object.entries(usage).forEach(([invId, qty]) => {
    Inventory.adjustStock(businessId, Number(invId), qty, userId, `Void of sale #${transactionId}`, 'sale_reversal');
  });
  getDb().run(sql`UPDATE transactions SET stock_deducted = 2 WHERE id = ${transactionId}`);
  saveDatabase();
  return usage;
};

const removeForMenuItem = (menuItemId) => {
  getDb().run(sql`DELETE FROM menu_item_recipes WHERE menu_item_id = ${menuItemId}`);
};

const removeForInventoryItem = (inventoryItemId) => {
  getDb().run(sql`DELETE FROM menu_item_recipes WHERE inventory_item_id = ${inventoryItemId}`);
};

module.exports = {
  getRecipe,
  getRecipesByItem,
  setRecipe,
  usageForTransaction,
  deductForSale,
  restoreForVoid,
  removeForMenuItem,
  removeForInventoryItem
};
