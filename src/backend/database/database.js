const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Get user data directory for storing database
const getUserDataPath = () => {
  try {
    return app.getPath('userData');
  } catch (e) {
    // Fallback for when app is not available
    return path.join(__dirname, '../../../database');
  }
};

const dbPath = path.join(getUserDataPath(), 'foodbusiness.db');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;
let SQL;

// Initialize database
const initDatabase = async () => {
  SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  createTables();
  saveDatabase();
};

// Save database to file
const saveDatabase = () => {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
};

// Create tables
const createTables = () => {
  // Businesses table
  db.run(`
    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      reservation_enabled INTEGER DEFAULT 0,
      reservation_capacity INTEGER DEFAULT 10,
      reservation_interval_minutes INTEGER DEFAULT 30,
      reservation_opening_hour INTEGER DEFAULT 11,
      reservation_closing_hour INTEGER DEFAULT 22,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'staff',
      pin TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )
  `);

  // Sessions table for JWT tokens
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Menu categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )
  `);

  // Menu items table
  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      cost DECIMAL(10,2),
      image_url TEXT,
      available INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (category_id) REFERENCES menu_categories(id)
    )
  `);

  // Employees table
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      user_id INTEGER,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'staff',
      hourly_rate DECIMAL(10,2),
      hire_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      permissions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Employee schedules table
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `);

  // Employee notes table
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      created_by INTEGER NOT NULL,
      note_type TEXT NOT NULL,
      note_text TEXT NOT NULL,
      rating INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Emergency contacts table
  db.run(`
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      relationship TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `);

  // Employee documents table
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      document_name TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_data TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `);

  // Time logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS time_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      clock_in DATETIME NOT NULL,
      clock_out DATETIME,
      hours_worked DECIMAL(10,2),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `);

  // Shifts table for weekly schedule
  db.run(`
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      employee_id INTEGER NOT NULL,
      shift_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      role TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `);

  // Suppliers table
  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )
  `);

  // Inventory categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )
  `);

  // Inventory items table
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      category_id INTEGER,
      supplier_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      sku TEXT,
      unit TEXT NOT NULL DEFAULT 'unit',
      quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
      min_quantity DECIMAL(10,2) DEFAULT 0,
      enable_low_stock_alert BOOLEAN DEFAULT 1,
      unit_cost DECIMAL(10,2),
      total_value DECIMAL(10,2),
      location TEXT,
      expiry_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES inventory_categories(id) ON DELETE SET NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    )
  `);

  // Inventory transactions table (for tracking stock in/out)
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      quantity DECIMAL(10,2) NOT NULL,
      unit_cost DECIMAL(10,2),
      total_cost DECIMAL(10,2),
      reference_number TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Inventory waste tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_waste (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      quantity DECIMAL(10,2) NOT NULL,
      unit TEXT,
      cost_per_unit DECIMAL(10,2),
      reason TEXT NOT NULL,
      notes TEXT,
      recorded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // POS Tables
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      loyalty_points INTEGER DEFAULT 0,
      total_spent DECIMAL(10,2) DEFAULT 0,
      visit_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      cashier_id INTEGER NOT NULL,
      customer_id INTEGER,
      subtotal DECIMAL(10,2) NOT NULL,
      tax DECIMAL(10,2) NOT NULL DEFAULT 0,
      discount DECIMAL(10,2) DEFAULT 0,
      tip_amount DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) NOT NULL,
      points_earned INTEGER DEFAULT 0,
      points_redeemed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed',
      void_reason TEXT,
      notes TEXT,
      order_type TEXT DEFAULT 'dine-in',
      table_number TEXT,
      kitchen_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      notes TEXT,
      modifiers TEXT,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      method_type TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      reference_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      vendor TEXT,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      expense_date DATE NOT NULL,
      receipt_image TEXT,
      created_by INTEGER,
      is_automatic BOOLEAN DEFAULT 0,
      linked_inventory_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (linked_inventory_id) REFERENCES inventory(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS recurring_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      vendor TEXT,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      frequency TEXT NOT NULL,
      day_of_month INTEGER,
      day_of_week INTEGER,
      is_active BOOLEAN DEFAULT 1,
      last_generated DATE,
      next_due_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      customer_id INTEGER,
      guest_name TEXT,
      guest_phone TEXT,
      guest_email TEXT,
      reservation_date DATE NOT NULL,
      reservation_time TIME NOT NULL,
      party_size INTEGER NOT NULL,
      table_number TEXT,
      special_requests TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )
  `);

  // Time off requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS time_off_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      request_type TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      review_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Employee availability table
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      is_available BOOLEAN DEFAULT 1,
      start_time TIME,
      end_time TIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE(employee_id, day_of_week)
    )
  `);

  // Employee tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      assigned_to INTEGER,
      assigned_by INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      task_type TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      due_date DATE,
      status TEXT DEFAULT 'pending',
      completed_at DATETIME,
      completed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES employees(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Announcements table
  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_id INTEGER NOT NULL,
      created_by INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      target_roles TEXT,
      is_active BOOLEAN DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Shift swap requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS shift_swap_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_id INTEGER NOT NULL,
      requesting_employee_id INTEGER NOT NULL,
      target_employee_id INTEGER,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      review_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
      FOREIGN KEY (requesting_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (target_employee_id) REFERENCES employees(id) ON DELETE SET NULL,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Run migrations for existing databases
  runMigrations();
  
  saveDatabase();
  console.log('Database tables created successfully');
};

// Run database migrations to add new columns to existing tables
const runMigrations = () => {
  console.log('Running database migrations...');
  
  // Check if enable_low_stock_alert column exists in inventory_items
  try {
    const tableInfo = db.exec("PRAGMA table_info(inventory_items)");
    if (tableInfo.length > 0) {
      const columns = tableInfo[0].values.map(col => col[1]); // column name is at index 1
      
      if (!columns.includes('enable_low_stock_alert')) {
        console.log('Adding enable_low_stock_alert column to inventory_items...');
        db.run('ALTER TABLE inventory_items ADD COLUMN enable_low_stock_alert BOOLEAN DEFAULT 1');
        saveDatabase();
        console.log('Migration completed: enable_low_stock_alert column added');
      }
    }
  } catch (error) {
    console.error('Migration error:', error);
  }

  // Add reservation columns to businesses table
  try {
    const businessTableInfo = db.exec("PRAGMA table_info(businesses)");
    console.log('Checking businesses table columns...', businessTableInfo);
    
    if (businessTableInfo.length > 0 && businessTableInfo[0].values) {
      const columns = businessTableInfo[0].values.map(col => col[1]);
      console.log('Existing columns:', columns);
      
      let needsSave = false;
      if (!columns.includes('reservation_enabled')) {
        console.log('Adding reservation columns to businesses table...');
        db.run('ALTER TABLE businesses ADD COLUMN reservation_enabled INTEGER DEFAULT 0');
        needsSave = true;
      }
      if (!columns.includes('reservation_capacity')) {
        db.run('ALTER TABLE businesses ADD COLUMN reservation_capacity INTEGER DEFAULT 10');
        needsSave = true;
      }
      if (!columns.includes('reservation_interval_minutes')) {
        db.run('ALTER TABLE businesses ADD COLUMN reservation_interval_minutes INTEGER DEFAULT 30');
        needsSave = true;
      }
      if (!columns.includes('reservation_opening_hour')) {
        db.run('ALTER TABLE businesses ADD COLUMN reservation_opening_hour INTEGER DEFAULT 11');
        needsSave = true;
      }
      if (!columns.includes('reservation_closing_hour')) {
        db.run('ALTER TABLE businesses ADD COLUMN reservation_closing_hour INTEGER DEFAULT 22');
        needsSave = true;
      }
      if (!columns.includes('tax_rate')) {
        db.run('ALTER TABLE businesses ADD COLUMN tax_rate REAL DEFAULT 7.5');
        needsSave = true;
      }
      
      if (needsSave) {
        saveDatabase();
        console.log('Migration completed: reservation columns added to businesses');
      } else {
        console.log('No migration needed - all columns exist');
      }
    }
  } catch (error) {
    console.error('Reservation migration error:', error);
  }
  
  // Kitchen Display System Migration
  try {
    const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'");
    if (tableCheck.length > 0) {
      const columnsResult = db.exec("PRAGMA table_info(transactions)");
      const columns = columnsResult[0].values.map(row => row[1]);
      
      let needsSave = false;
      
      if (!columns.includes('order_type')) {
        db.run("ALTER TABLE transactions ADD COLUMN order_type TEXT DEFAULT 'dine-in'");
        needsSave = true;
      }
      if (!columns.includes('table_number')) {
        db.run('ALTER TABLE transactions ADD COLUMN table_number TEXT');
        needsSave = true;
      }
      if (!columns.includes('kitchen_status')) {
        db.run("ALTER TABLE transactions ADD COLUMN kitchen_status TEXT DEFAULT 'pending'");
        needsSave = true;
      }
      if (!columns.includes('updated_at')) {
        // sql.js doesn't support DEFAULT CURRENT_TIMESTAMP in ALTER TABLE
        // Add as nullable column, NULL will be handled by COALESCE in queries
        db.run('ALTER TABLE transactions ADD COLUMN updated_at DATETIME');
        needsSave = true;
      }
      if (!columns.includes('daily_order_number')) {
        db.run('ALTER TABLE transactions ADD COLUMN daily_order_number INTEGER');
        needsSave = true;
      }
      
      if (needsSave) {
        saveDatabase();
        console.log('Migration completed: kitchen display columns added to transactions');
      }
    }
  } catch (error) {
    console.error('Kitchen display migration error:', error);
  }

  // Add owner_code column to businesses table
  try {
    const businessResult = db.exec('PRAGMA table_info(businesses)');
    if (businessResult.length > 0) {
      const columns = businessResult[0].values.map(row => row[1]);
      if (!columns.includes('owner_code')) {
        db.run('ALTER TABLE businesses ADD COLUMN owner_code TEXT');
        saveDatabase();
        console.log('Migration completed: owner_code column added to businesses');
      }
    }
  } catch (error) {
    console.error('Owner code migration error:', error);
  }

  // Add permissions column to employees table
  try {
    const employeesResult = db.exec('PRAGMA table_info(employees)');
    if (employeesResult.length > 0) {
      const columns = employeesResult[0].values.map(row => row[1]);
      if (!columns.includes('permissions')) {
        db.run('ALTER TABLE employees ADD COLUMN permissions TEXT');
        saveDatabase();
        console.log('Migration completed: permissions column added to employees');
      }
    }
  } catch (error) {
    console.error('Permissions migration error:', error);
  }
};

// Export database instance and helper methods
module.exports = {
  getDb: () => db,
  saveDatabase,
  
  // Check if setup is complete (any users exist)
  isSetupComplete() {
    if (!db) return false;
    const result = db.exec('SELECT COUNT(*) as count FROM users');
    return result.length > 0 && result[0].values[0][0] > 0;
  },
  
  // Get database path for debugging
  getDbPath() {
    return dbPath;
  },
  
  // Initialize (must be called before use)
  init: initDatabase
};
