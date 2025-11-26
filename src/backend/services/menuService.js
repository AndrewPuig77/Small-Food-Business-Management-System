const { getDb, saveDatabase } = require('../models/database');

class MenuService {
  // Get all menu items for a business
  static getAllItems(businessId) {
    try {
      const db = getDb();
      const result = db.exec(`
        SELECT 
          mi.*,
          mc.name as category_name
        FROM menu_items mi
        LEFT JOIN menu_categories mc ON mi.category_id = mc.id
        WHERE mi.business_id = ${businessId}
        ORDER BY mc.display_order, mi.name
      `);

      if (!result.length || !result[0].values.length) {
        return { success: true, items: [] };
      }

      const items = this.parseResults(result[0]);
      return { success: true, items };
    } catch (error) {
      console.error('Get menu items error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get single menu item by ID
  static getItemById(itemId) {
    try {
      const db = getDb();
      const result = db.exec(`
        SELECT 
          mi.*,
          mc.name as category_name
        FROM menu_items mi
        LEFT JOIN menu_categories mc ON mi.category_id = mc.id
        WHERE mi.id = ${itemId}
      `);

      if (!result.length || !result[0].values.length) {
        return { success: false, error: 'Item not found' };
      }

      const item = this.parseResults(result[0])[0];
      return { success: true, item };
    } catch (error) {
      console.error('Get menu item error:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new menu item
  static createItem(businessId, itemData) {
    try {
      const db = getDb();
      const { name, description, categoryId, price, cost, imageUrl, available } = itemData;

      db.exec(`
        INSERT INTO menu_items 
        (business_id, category_id, name, description, price, cost, image_url, available)
        VALUES (
          ${businessId},
          ${categoryId || 'NULL'},
          '${this.escape(name)}',
          ${description ? `'${this.escape(description)}'` : 'NULL'},
          ${price},
          ${cost || 'NULL'},
          ${imageUrl ? `'${this.escape(imageUrl)}'` : 'NULL'},
          ${available !== undefined ? available : 1}
        )
      `);

      const result = db.exec('SELECT last_insert_rowid() as id');
      const itemId = result[0].values[0][0];

      saveDatabase();

      return { success: true, itemId };
    } catch (error) {
      console.error('Create menu item error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update menu item
  static updateItem(itemId, itemData) {
    try {
      const db = getDb();
      const { name, description, categoryId, price, cost, imageUrl, available } = itemData;

      db.exec(`
        UPDATE menu_items
        SET 
          name = '${this.escape(name)}',
          description = ${description ? `'${this.escape(description)}'` : 'NULL'},
          category_id = ${categoryId || 'NULL'},
          price = ${price},
          cost = ${cost || 'NULL'},
          image_url = ${imageUrl ? `'${this.escape(imageUrl)}'` : 'NULL'},
          available = ${available !== undefined ? available : 1},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${itemId}
      `);

      saveDatabase();

      return { success: true };
    } catch (error) {
      console.error('Update menu item error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete menu item
  static deleteItem(itemId) {
    try {
      const db = getDb();
      db.exec(`DELETE FROM menu_items WHERE id = ${itemId}`);
      saveDatabase();

      return { success: true };
    } catch (error) {
      console.error('Delete menu item error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all categories for a business
  static getCategories(businessId) {
    try {
      const db = getDb();
      const result = db.exec(`
        SELECT * FROM menu_categories
        WHERE business_id = ${businessId}
        ORDER BY display_order, name
      `);

      if (!result.length || !result[0].values.length) {
        return { success: true, categories: [] };
      }

      const categories = this.parseResults(result[0]);
      return { success: true, categories };
    } catch (error) {
      console.error('Get categories error:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new category
  static createCategory(businessId, categoryData) {
    try {
      const db = getDb();
      const { name, displayOrder } = categoryData;

      db.exec(`
        INSERT INTO menu_categories (business_id, name, display_order)
        VALUES (
          ${businessId},
          '${this.escape(name)}',
          ${displayOrder !== undefined ? displayOrder : 0}
        )
      `);

      const result = db.exec('SELECT last_insert_rowid() as id');
      const categoryId = result[0].values[0][0];

      saveDatabase();

      return { success: true, categoryId };
    } catch (error) {
      console.error('Create category error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update category
  static updateCategory(categoryId, categoryData) {
    try {
      const db = getDb();
      const { name, displayOrder } = categoryData;

      db.exec(`
        UPDATE menu_categories
        SET 
          name = '${this.escape(name)}',
          display_order = ${displayOrder || 0}
        WHERE id = ${categoryId}
      `);

      saveDatabase();

      return { success: true };
    } catch (error) {
      console.error('Update category error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete category
  static deleteCategory(categoryId) {
    try {
      const db = getDb();
      
      // Set category_id to NULL for items in this category
      db.exec(`UPDATE menu_items SET category_id = NULL WHERE category_id = ${categoryId}`);
      
      // Delete category
      db.exec(`DELETE FROM menu_categories WHERE id = ${categoryId}`);
      
      saveDatabase();

      return { success: true };
    } catch (error) {
      console.error('Delete category error:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper: Parse SQL result to array of objects
  static parseResults(result) {
    const items = [];
    result.values.forEach(row => {
      const item = {};
      result.columns.forEach((col, idx) => {
        item[col] = row[idx];
      });
      items.push(item);
    });
    return items;
  }

  // Helper: Escape single quotes in SQL strings
  static escape(str) {
    return str ? str.replace(/'/g, "''") : '';
  }
}

module.exports = MenuService;
