const { getDb, saveDatabase } = require('../database/database');
const { sql } = require('../database/sql');
const bcrypt = require('bcryptjs');


// Get all employees for a business
const getAllEmployees = (businessId) => {
  const db = getDb();
  const query = sql`
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
  const query = sql`
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
    const userQuery = sql`
      INSERT INTO users (
        business_id, username, password_hash, full_name, email, role, active
      ) VALUES (
        ${businessId},
        ${employeeData.username},
        ${passwordHash},
        ${`${employeeData.firstName} ${employeeData.lastName}`},
        ${employeeData.email},
        ${employeeData.role},
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
  const hourlyRateValue = employeeData.hourlyRate != null && employeeData.hourlyRate !== '' 
    ? parseFloat(employeeData.hourlyRate) 
    : 'NULL';
  
  const permissionsJson = employeeData.permissions ? JSON.stringify(employeeData.permissions) : null;
  
  const query = sql`
    INSERT INTO employees (
      business_id, user_id, first_name, last_name, email, phone, 
      role, hourly_rate, hire_date, status, permissions
    ) VALUES (
      ${businessId},
      ${userId || null},
      ${employeeData.firstName},
      ${employeeData.lastName},
      ${employeeData.email},
      ${employeeData.phone},
      ${employeeData.role},
      ${hourlyRateValue},
      ${employeeData.hireDate},
      ${employeeData.status || 'active'},
      ${permissionsJson}
    )
  `;
  
  db.run(query);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const employeeId = lastIdResult[0].values[0][0];
  
  return getEmployeeById(businessId, employeeId);
};

// Update employee
const updateEmployee = async (businessId, employeeId, employeeData) => {
  const db = getDb();
  
  const hourlyRateValue = employeeData.hourlyRate != null && employeeData.hourlyRate !== '' 
    ? parseFloat(employeeData.hourlyRate) 
    : 'NULL';
  
  const permissionsJson = employeeData.permissions ? JSON.stringify(employeeData.permissions) : null;
  
  const query = sql`
    UPDATE employees SET
      first_name = ${employeeData.firstName},
      last_name = ${employeeData.lastName},
      email = ${employeeData.email},
      phone = ${employeeData.phone},
      role = ${employeeData.role},
      hourly_rate = ${hourlyRateValue},
      hire_date = ${employeeData.hireDate},
      status = ${employeeData.status},
      permissions = ${permissionsJson},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${employeeId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  
  // If employee has an account and password is provided, update it
  if (employeeData.hasAccount && employeeData.password) {
    const employee = getEmployeeById(businessId, employeeId);
    if (employee && employee.user_id) {
      const passwordHash = await bcrypt.hash(employeeData.password, 10);
      db.run(sql`
        UPDATE users 
        SET password_hash = ${passwordHash},
            full_name = ${`${employeeData.firstName} ${employeeData.lastName}`}
        WHERE id = ${employee.user_id} AND business_id = ${businessId}
      `);
    }
  }
  
  // If createAccount is true and employee doesn't have account, create one
  if (employeeData.createAccount && !employeeData.hasAccount && employeeData.username && employeeData.password) {
    const passwordHash = await bcrypt.hash(employeeData.password, 10);
    
    const userQuery = sql`
      INSERT INTO users (
        business_id, username, password_hash, full_name, email, role, active
      ) VALUES (
        ${businessId},
        ${employeeData.username},
        ${passwordHash},
        ${`${employeeData.firstName} ${employeeData.lastName}`},
        ${employeeData.email},
        ${employeeData.role},
        1
      )
    `;
    
    db.run(userQuery);
    const userIdResult = db.exec('SELECT last_insert_rowid() as id');
    const newUserId = userIdResult[0].values[0][0];
    
    // Link user to employee
    db.run(sql`UPDATE employees SET user_id = ${newUserId} WHERE id = ${employeeId}`);
  }
  
  saveDatabase();
  
  return getEmployeeById(businessId, employeeId);
};

// Delete employee
const deleteEmployee = (businessId, employeeId) => {
  const db = getDb();
  
  const query = sql`
    DELETE FROM employees 
    WHERE id = ${employeeId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return { success: true };
};

// Create a user account for an existing employee (if none linked)
const createUserAccountForEmployee = async (businessId, employeeId, accountData) => {
  const db = getDb();

  // Ensure employee exists and has no linked user
  const empRes = db.exec(sql`SELECT first_name, last_name, email, role, user_id FROM employees WHERE id = ${employeeId} AND business_id = ${businessId}`);
  if (empRes.length === 0 || empRes[0].values.length === 0) {
    return { success: false, error: 'Employee not found' };
  }
  const [firstName, lastName, email, role, userId] = empRes[0].values[0];
  if (userId) {
    return { success: false, error: 'Employee already has a user account' };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(accountData.password, 10);

  // Insert user
  const fullName = `${firstName} ${lastName}`;
  const insertUserSql = sql`
    INSERT INTO users (business_id, username, password_hash, full_name, email, role, active)
    VALUES (
      ${businessId},
      ${accountData.username},
      ${passwordHash},
      ${fullName},
      ${email},
      ${role},
      1
    )
  `;
  db.run(insertUserSql);

  // Get new user id
  const userIdResult = db.exec('SELECT last_insert_rowid() as id');
  const newUserId = userIdResult[0].values[0][0];

  // Link employee
  db.run(sql`UPDATE employees SET user_id = ${newUserId}, updated_at = CURRENT_TIMESTAMP WHERE id = ${employeeId} AND business_id = ${businessId}`);

  saveDatabase();
  return { success: true, userId: newUserId };
};

// Update employee status
const updateEmployeeStatus = (businessId, employeeId, status) => {
  const db = getDb();
  
  const query = sql`
    UPDATE employees SET
      status = ${status},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${employeeId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getEmployeeById(businessId, employeeId);
};

// ============ SCHEDULES ============

// Get employee schedules
const getEmployeeSchedules = (employeeId) => {
  const db = getDb();
  const query = sql`SELECT * FROM employee_schedules WHERE employee_id = ${employeeId} ORDER BY day_of_week`;
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const schedule = {};
    columns.forEach((col, idx) => {
      schedule[col] = row[idx];
    });
    return schedule;
  });
};

// Save employee schedule
const saveEmployeeSchedule = (employeeId, scheduleData) => {
  const db = getDb();
  
  // Delete existing schedules for this employee
  db.run(sql`DELETE FROM employee_schedules WHERE employee_id = ${employeeId}`);
  
  // Insert new schedules
  scheduleData.forEach(schedule => {
    const query = sql`
      INSERT INTO employee_schedules (employee_id, day_of_week, start_time, end_time)
      VALUES (${employeeId}, ${schedule.day}, ${schedule.startTime}, ${schedule.endTime})
    `;
    db.run(query);
  });
  
  saveDatabase();
  return getEmployeeSchedules(employeeId);
};

// ============ NOTES & PERFORMANCE ============

// Get employee notes
const getEmployeeNotes = (employeeId) => {
  const db = getDb();
  const query = sql`
    SELECT en.*, u.full_name as created_by_name 
    FROM employee_notes en
    LEFT JOIN users u ON en.created_by = u.id
    WHERE en.employee_id = ${employeeId}
    ORDER BY en.created_at DESC
  `;
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const note = {};
    columns.forEach((col, idx) => {
      note[col] = row[idx];
    });
    return note;
  });
};

// Add employee note
const addEmployeeNote = (employeeId, noteData) => {
  const db = getDb();
  
  const query = sql`
    INSERT INTO employee_notes (employee_id, created_by, note_type, note_text, rating)
    VALUES (
      ${employeeId},
      ${noteData.createdBy},
      ${noteData.noteType},
      ${noteData.noteText},
      ${noteData.rating || null}
    )
  `;
  
  db.run(query);
  saveDatabase();
  
  return getEmployeeNotes(employeeId);
};

// ============ EMERGENCY CONTACTS ============

// Get emergency contacts
const getEmergencyContacts = (employeeId) => {
  const db = getDb();
  const query = sql`SELECT * FROM emergency_contacts WHERE employee_id = ${employeeId}`;
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const contact = {};
    columns.forEach((col, idx) => {
      contact[col] = row[idx];
    });
    return contact;
  });
};

// Save emergency contact
const saveEmergencyContact = (employeeId, contactData) => {
  const db = getDb();
  
  if (contactData.id) {
    // Update existing
    const query = sql`
      UPDATE emergency_contacts SET
        name = ${contactData.name},
        relationship = ${contactData.relationship},
        phone = ${contactData.phone},
        email = ${contactData.email},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${contactData.id} AND employee_id = ${employeeId}
    `;
    db.run(query);
  } else {
    // Create new
    const query = sql`
      INSERT INTO emergency_contacts (employee_id, name, relationship, phone, email)
      VALUES (${employeeId}, ${contactData.name}, ${contactData.relationship}, 
              ${contactData.phone}, ${contactData.email})
    `;
    db.run(query);
  }
  
  saveDatabase();
  return getEmergencyContacts(employeeId);
};

// Delete emergency contact
const deleteEmergencyContact = (contactId) => {
  const db = getDb();
  db.run(sql`DELETE FROM emergency_contacts WHERE id = ${contactId}`);
  saveDatabase();
  return { success: true };
};

// ============ DOCUMENTS ============

// Get employee documents
const getEmployeeDocuments = (employeeId) => {
  const db = getDb();
  // Don't return file_data in list view for performance
  const query = sql`
    SELECT id, employee_id, document_name, document_type, uploaded_at 
    FROM employee_documents WHERE employee_id = ${employeeId}
    ORDER BY uploaded_at DESC
  `;
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const doc = {};
    columns.forEach((col, idx) => {
      doc[col] = row[idx];
    });
    return doc;
  });
};

// Get single document with file data
const getEmployeeDocument = (documentId) => {
  const db = getDb();
  const query = sql`SELECT * FROM employee_documents WHERE id = ${documentId}`;
  const result = db.exec(query);
  
  if (result.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  
  const doc = {};
  columns.forEach((col, idx) => {
    doc[col] = values[idx];
  });
  
  return doc;
};

// Upload employee document
const uploadEmployeeDocument = (employeeId, documentData) => {
  const db = getDb();
  
  const query = sql`
    INSERT INTO employee_documents (employee_id, document_name, document_type, file_data)
    VALUES (${employeeId}, ${documentData.name}, ${documentData.type}, 
            ${documentData.fileData})
  `;
  
  db.run(query);
  saveDatabase();
  
  return getEmployeeDocuments(employeeId);
};

// Delete document
const deleteEmployeeDocument = (documentId) => {
  const db = getDb();
  db.run(sql`DELETE FROM employee_documents WHERE id = ${documentId}`);
  saveDatabase();
  return { success: true };
};

// ============ TIME LOGS ============

// Get time logs for employee
const getTimeLogs = (employeeId, startDate = null, endDate = null) => {
  const db = getDb();
  let query = sql`SELECT * FROM time_logs WHERE employee_id = ${employeeId}`;
  
  if (startDate) query = sql`${query} AND clock_in >= ${startDate}`;
  if (endDate) query = sql`${query} AND clock_in <= ${endDate}`;
  
  query = sql`${query} ORDER BY clock_in DESC`;
  
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const log = {};
    columns.forEach((col, idx) => {
      log[col] = row[idx];
    });
    return log;
  });
};

// Clock in (delegate to timeLogService for consistent behavior)
const TimeLogService = require('./timeLogService');
const clockIn = (employeeId) => {
  return TimeLogService.clockIn(employeeId);
};

// Clock out (delegate to timeLogService for consistent behavior)
const clockOut = (employeeId) => {
  return TimeLogService.clockOut(employeeId);
};

// Calculate payroll for employee
const calculatePayroll = (employeeId, startDate, endDate) => {
  const db = getDb();
  
  // Get employee hourly rate
  const empQuery = sql`SELECT hourly_rate, first_name, last_name FROM employees WHERE id = ${employeeId}`;
  const empResult = db.exec(empQuery);
  
  if (empResult.length === 0) return null;
  
  const hourlyRate = empResult[0].values[0][0];
  const firstName = empResult[0].values[0][1];
  const lastName = empResult[0].values[0][2];
  
  if (!hourlyRate) return { error: 'Employee has no hourly rate set' };
  
  // Get time logs in date range
  const logs = getTimeLogs(employeeId, startDate, endDate);
  // Sum only non-negative hours (defensive against malformed older rows)
  const totalHours = logs.reduce((sum, log) => {
    const h = Number(log.hours_worked) || 0;
    return sum + (h > 0 ? h : 0);
  }, 0);
  const totalPay = totalHours * hourlyRate;
  
  return {
    employeeId,
    employeeName: `${firstName} ${lastName}`,
    hourlyRate,
    totalHours: totalHours.toFixed(2),
    totalPay: totalPay.toFixed(2),
    logs
  };
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeStatus,
  // Schedules
  getEmployeeSchedules,
  saveEmployeeSchedule,
  // Notes
  getEmployeeNotes,
  addEmployeeNote,
  // Emergency contacts
  getEmergencyContacts,
  saveEmergencyContact,
  deleteEmergencyContact,
  // Documents
  getEmployeeDocuments,
  getEmployeeDocument,
  uploadEmployeeDocument,
  deleteEmployeeDocument,
  // Time logs
  getTimeLogs,
  clockIn,
  clockOut,
  calculatePayroll,
  createUserAccountForEmployee
};
