// Modifier groups: per-item customization rules such as
//   "Size"     pick exactly 1 (min 1, max 1)  -> required single choice
//   "Toppings" pick up to 3   (min 0, max 3)  -> optional multi choice
// Each group has priced options and can be attached to many menu items.
const { getDb, saveDatabase } = require('../database/database');
const { sql } = require('../database/sql');

const rows = (result) => {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((v) => Object.fromEntries(columns.map((c, i) => [c, v[i]])));
};

const lastId = (db) => db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

// Normalize and validate a group definition coming from the UI.
const cleanGroup = (data) => {
  const name = String(data.name || '').trim();
  const options = (data.options || [])
    .map((o, i) => ({
      name: String(o.name || '').trim(),
      price: Number(o.price) || 0,
      displayOrder: i
    }))
    .filter((o) => o.name);
  const minSelect = Math.max(0, toInt(data.minSelect, 0));
  const maxSelect = Math.max(1, toInt(data.maxSelect, 1));

  if (!name) throw new Error('Group name is required');
  if (options.length === 0) throw new Error('Add at least one option');
  if (options.some((o) => o.price < 0)) throw new Error('Option prices cannot be negative');
  if (minSelect > maxSelect) throw new Error('Minimum picks cannot be more than maximum picks');
  if (minSelect > options.length) throw new Error('Minimum picks cannot be more than the number of options');

  return { name, options, minSelect, maxSelect: Math.min(maxSelect, options.length) };
};

const insertOptions = (db, groupId, options) => {
  options.forEach((o) => {
    db.run(sql`
      INSERT INTO modifier_options (group_id, name, price, display_order)
      VALUES (${groupId}, ${o.name}, ${o.price}, ${o.displayOrder})
    `);
  });
};

// All groups for a business, each with its options and the ids of the menu
// items it is attached to.
const getGroups = (businessId) => {
  const db = getDb();
  const groups = rows(db.exec(sql`
    SELECT id, name, min_select, max_select
    FROM modifier_groups
    WHERE business_id = ${businessId}
    ORDER BY name
  `));
  if (!groups.length) return [];

  const options = rows(db.exec(sql`
    SELECT o.id, o.group_id, o.name, o.price
    FROM modifier_options o
    JOIN modifier_groups g ON g.id = o.group_id
    WHERE g.business_id = ${businessId}
    ORDER BY o.group_id, o.display_order, o.id
  `));
  const links = rows(db.exec(sql`
    SELECT l.menu_item_id, l.group_id
    FROM menu_item_modifier_groups l
    JOIN modifier_groups g ON g.id = l.group_id
    WHERE g.business_id = ${businessId}
  `));

  return groups.map((g) => ({
    ...g,
    options: options.filter((o) => o.group_id === g.id).map(({ id, name, price }) => ({ id, name, price: Number(price) })),
    menu_item_ids: links.filter((l) => l.group_id === g.id).map((l) => l.menu_item_id)
  }));
};

const createGroup = (businessId, data) => {
  const db = getDb();
  const group = cleanGroup(data);
  db.run(sql`
    INSERT INTO modifier_groups (business_id, name, min_select, max_select)
    VALUES (${businessId}, ${group.name}, ${group.minSelect}, ${group.maxSelect})
  `);
  const groupId = lastId(db);
  insertOptions(db, groupId, group.options);
  saveDatabase();
  return getGroups(businessId).find((g) => g.id === groupId);
};

// Options are replaced wholesale. Past orders keep their own copy of the
// option names and prices, so editing a group never changes order history.
const updateGroup = (businessId, groupId, data) => {
  const db = getDb();
  const group = cleanGroup(data);
  const exists = db.exec(sql`SELECT id FROM modifier_groups WHERE id = ${groupId} AND business_id = ${businessId}`);
  if (!exists.length) throw new Error('Modifier group not found');

  db.run(sql`
    UPDATE modifier_groups
    SET name = ${group.name}, min_select = ${group.minSelect}, max_select = ${group.maxSelect}
    WHERE id = ${groupId}
  `);
  db.run(sql`DELETE FROM modifier_options WHERE group_id = ${groupId}`);
  insertOptions(db, groupId, group.options);
  saveDatabase();
  return getGroups(businessId).find((g) => g.id === groupId);
};

const deleteGroup = (businessId, groupId) => {
  const db = getDb();
  const exists = db.exec(sql`SELECT id FROM modifier_groups WHERE id = ${groupId} AND business_id = ${businessId}`);
  if (!exists.length) throw new Error('Modifier group not found');
  // Foreign-key cascades aren't enforced by default in SQLite, so clean up
  // explicitly.
  db.run(sql`DELETE FROM menu_item_modifier_groups WHERE group_id = ${groupId}`);
  db.run(sql`DELETE FROM modifier_options WHERE group_id = ${groupId}`);
  db.run(sql`DELETE FROM modifier_groups WHERE id = ${groupId}`);
  saveDatabase();
  return { success: true };
};

// Replace the set of groups attached to a menu item (order = display order).
const setItemGroups = (businessId, menuItemId, groupIds) => {
  const db = getDb();
  const item = db.exec(sql`SELECT id FROM menu_items WHERE id = ${menuItemId} AND business_id = ${businessId}`);
  if (!item.length) throw new Error('Menu item not found');

  const valid = new Set(getGroups(businessId).map((g) => g.id));
  const ids = [...new Set((groupIds || []).map(Number))];
  const unknown = ids.filter((id) => !valid.has(id));
  if (unknown.length) throw new Error('Unknown modifier group: ' + unknown.join(', '));

  db.run(sql`DELETE FROM menu_item_modifier_groups WHERE menu_item_id = ${menuItemId}`);
  ids.forEach((groupId, i) => {
    db.run(sql`
      INSERT INTO menu_item_modifier_groups (menu_item_id, group_id, display_order)
      VALUES (${menuItemId}, ${groupId}, ${i})
    `);
  });
  saveDatabase();
  return { success: true };
};

// Groups (with options) for each menu item: { [menuItemId]: [group, ...] }.
// Loaded once by the POS so opening an item needs no round trip.
const getModifiersByItem = (businessId) => {
  const db = getDb();
  const groups = new Map(getGroups(businessId).map((g) => [g.id, g]));
  const links = rows(db.exec(sql`
    SELECT l.menu_item_id, l.group_id
    FROM menu_item_modifier_groups l
    JOIN modifier_groups g ON g.id = l.group_id
    WHERE g.business_id = ${businessId}
    ORDER BY l.menu_item_id, l.display_order
  `));
  const byItem = {};
  links.forEach((l) => {
    const g = groups.get(l.group_id);
    if (!g) return;
    (byItem[l.menu_item_id] = byItem[l.menu_item_id] || []).push({
      id: g.id, name: g.name, min_select: g.min_select, max_select: g.max_select, options: g.options
    });
  });
  return byItem;
};

// Check a selection of option ids against the item's groups.
// Returns { valid, errors, modifiers, priceDelta } where `modifiers` is the
// authoritative list of chosen options (names/prices from the database).
const validateSelection = (businessId, menuItemId, optionIds) => {
  const groups = getModifiersByItem(businessId)[menuItemId] || [];
  const chosen = new Set((optionIds || []).map(Number));
  const errors = [];
  const modifiers = [];

  groups.forEach((g) => {
    const picked = g.options.filter((o) => chosen.has(o.id));
    picked.forEach((o) => chosen.delete(o.id));
    if (picked.length < g.min_select) {
      errors.push(g.min_select === 1 ? `Choose a ${g.name}` : `Choose at least ${g.min_select} for ${g.name}`);
    }
    if (picked.length > g.max_select) {
      errors.push(`Choose at most ${g.max_select} for ${g.name}`);
    }
    picked.forEach((o) => modifiers.push({ id: o.id, name: o.name, price: o.price, group: g.name }));
  });

  if (chosen.size) errors.push('Some selected options are not available for this item');

  const priceDelta = Math.round(modifiers.reduce((sum, m) => sum + m.price, 0) * 100) / 100;
  return { valid: errors.length === 0, errors, modifiers, priceDelta };
};

// Remove a deleted menu item's group links.
const removeItemLinks = (menuItemId) => {
  getDb().run(sql`DELETE FROM menu_item_modifier_groups WHERE menu_item_id = ${menuItemId}`);
};

module.exports = {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  setItemGroups,
  getModifiersByItem,
  validateSelection,
  removeItemLinks
};
