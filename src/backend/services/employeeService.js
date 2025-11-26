const { getDb, saveDatabase } = require('../models/database');
const bcrypt = require('bcryptjs');

// Helper function to escape SQL strings
const escape = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

// Get all employees for a business
const getAllEmployees = (businessId) => {
  const db = getDb();
  const query = `
    SELECT * FROM employees 
    WHERE business_id = ${businessId}
    ORDER BY hire_date DESC
  `;
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const employee = {};
    columns.forEach((col, idx) => {
      employee[col] = row[idx];
    });
    return employee;
  });
};

// Get employee by ID
const getEmployeeById = (businessId, employeeId) => {
  const db = getDb();
  const query = `
    SELECT * FROM employees 
    WHERE id = ${employeeId} AND business_id = ${businessId}
  `;
  const result = db.exec(query);
  
  if (result.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  
  const employee = {};
  columns.forEach((col, idx) => {
    employee[col] = values[idx];
  });
  
  return employee;
};

// Create new employee
const createEmployee = async (businessId, employeeData) => {
  const db = getDb();
  let userId = null;
  
  // Create user account if credentials provided
  if (employeeData.createAccount && employeeData.username && employeeData.password) {
    // Hash password
    const passwordHash = await bcrypt.hash(employeeData.password, 10);
    
    // Create user account
    const userQuery = `
      INSERT INTO users (
        business_id, username, password_hash, full_name, email, role, active
      ) VALUES (
        ${businessId},
        ${escape(employeeData.username)},
        ${escape(passwordHash)},
        ${escape(`${employeeData.firstName} ${employeeData.lastName}`)},
        ${escape(employeeData.email)},
        ${escape(employeeData.role)},
        1
      )
    `;
    
    db.run(userQuery);
    saveDatabase();
    
    // Get the user ID
    const userIdResult = db.exec('SELECT last_insert_rowid() as id');
    userId = userIdResult[0].values[0][0];
  }
  
  // Create employee record
  const query = `
    INSERT INTO employees (
      business_id, user_id, first_name, last_name, email, phone, 
      role, hourly_rate, hire_date, status
    ) VALUES (
      ${businessId},
      ${userId || 'NULL'},
      ${escape(employeeData.firstName)},
      ${escape(employeeData.lastName)},
      ${escape(employeeData.email)},
      ${escape(employeeData.phone)},
      ${escape(employeeData.role)},
      ${employeeData.hourlyRate || 'NULL'},
      ${escape(employeeData.hireDate)},
      ${escape(employeeData.status || 'active')}
    )
  `;
  
  db.run(query);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const employeeId = lastIdResult[0].values[0][0];
  
  return getEmployeeById(businessId, employeeId);
};

// Update employee
const updateEmployee = (businessId, employeeId, employeeData) => {
  const db = getDb();
  
  const query = `
    UPDATE employees SET
      first_name = ${escape(employeeData.firstName)},
      last_name = ${escape(employeeData.lastName)},
      email = ${escape(employeeData.email)},
      phone = ${escape(employeeData.phone)},
      role = ${escape(employeeData.role)},
      hourly_rate = ${employeeData.hourlyRate || 'NULL'},
      hire_date = ${escape(employeeData.hireDate)},
      status = ${escape(employeeData.status)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${employeeId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getEmployeeById(businessId, employeeId);
};

// Delete employee
const deleteEmployee = (businessId, employeeId) => {
  const db = getDb();
  
  const query = `
    DELETE FROM employees 
    WHERE id = ${employeeId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return { success: true };
};

// Update employee status
const updateEmployeeStatus = (businessId, employeeId, status) => {
  const db = getDb();
  
  const query = `
    UPDATE employees SET
      status = ${escape(status)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${employeeId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getEmployeeById(businessId, employeeId);
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus
};
