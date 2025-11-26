const { getDb, saveDatabase } = require('../database/database');
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

// ============ SCHEDULES ============

// Get employee schedules
const getEmployeeSchedules = (employeeId) => {
  const db = getDb();
  const query = `SELECT * FROM employee_schedules WHERE employee_id = ${employeeId} ORDER BY day_of_week`;
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
  db.run(`DELETE FROM employee_schedules WHERE employee_id = ${employeeId}`);
  
  // Insert new schedules
  scheduleData.forEach(schedule => {
    const query = `
      INSERT INTO employee_schedules (employee_id, day_of_week, start_time, end_time)
      VALUES (${employeeId}, ${schedule.day}, ${escape(schedule.startTime)}, ${escape(schedule.endTime)})
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
  const query = `
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
  
  const query = `
    INSERT INTO employee_notes (employee_id, created_by, note_type, note_text, rating)
    VALUES (
      ${employeeId},
      ${noteData.createdBy},
      ${escape(noteData.noteType)},
      ${escape(noteData.noteText)},
      ${noteData.rating || 'NULL'}
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
  const query = `SELECT * FROM emergency_contacts WHERE employee_id = ${employeeId}`;
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
    const query = `
      UPDATE emergency_contacts SET
        name = ${escape(contactData.name)},
        relationship = ${escape(contactData.relationship)},
        phone = ${escape(contactData.phone)},
        email = ${escape(contactData.email)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${contactData.id} AND employee_id = ${employeeId}
    `;
    db.run(query);
  } else {
    // Create new
    const query = `
      INSERT INTO emergency_contacts (employee_id, name, relationship, phone, email)
      VALUES (${employeeId}, ${escape(contactData.name)}, ${escape(contactData.relationship)}, 
              ${escape(contactData.phone)}, ${escape(contactData.email)})
    `;
    db.run(query);
  }
  
  saveDatabase();
  return getEmergencyContacts(employeeId);
};

// Delete emergency contact
const deleteEmergencyContact = (contactId) => {
  const db = getDb();
  db.run(`DELETE FROM emergency_contacts WHERE id = ${contactId}`);
  saveDatabase();
  return { success: true };
};

// ============ DOCUMENTS ============

// Get employee documents
const getEmployeeDocuments = (employeeId) => {
  const db = getDb();
  // Don't return file_data in list view for performance
  const query = `
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
  const query = `SELECT * FROM employee_documents WHERE id = ${documentId}`;
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
  
  const query = `
    INSERT INTO employee_documents (employee_id, document_name, document_type, file_data)
    VALUES (${employeeId}, ${escape(documentData.name)}, ${escape(documentData.type)}, 
            ${escape(documentData.fileData)})
  `;
  
  db.run(query);
  saveDatabase();
  
  return getEmployeeDocuments(employeeId);
};

// Delete document
const deleteEmployeeDocument = (documentId) => {
  const db = getDb();
  db.run(`DELETE FROM employee_documents WHERE id = ${documentId}`);
  saveDatabase();
  return { success: true };
};

// ============ TIME LOGS ============

// Get time logs for employee
const getTimeLogs = (employeeId, startDate = null, endDate = null) => {
  const db = getDb();
  let query = `SELECT * FROM time_logs WHERE employee_id = ${employeeId}`;
  
  if (startDate) query += ` AND clock_in >= ${escape(startDate)}`;
  if (endDate) query += ` AND clock_in <= ${escape(endDate)}`;
  
  query += ` ORDER BY clock_in DESC`;
  
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

// Clock in
const clockIn = (employeeId) => {
  const db = getDb();
  
  const query = `
    INSERT INTO time_logs (employee_id, clock_in)
    VALUES (${employeeId}, datetime('now'))
  `;
  
  db.run(query);
  saveDatabase();
  
  return { success: true, message: 'Clocked in successfully' };
};

// Clock out
const clockOut = (employeeId) => {
  const db = getDb();
  
  // Find the most recent clock-in without a clock-out
  const findQuery = `
    SELECT id, clock_in FROM time_logs 
    WHERE employee_id = ${employeeId} AND clock_out IS NULL 
    ORDER BY clock_in DESC LIMIT 1
  `;
  const result = db.exec(findQuery);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return { success: false, message: 'No active clock-in found' };
  }
  
  const logId = result[0].values[0][0];
  const clockInTime = result[0].values[0][1];
  
  // Calculate hours worked
  const updateQuery = `
    UPDATE time_logs SET
      clock_out = datetime('now'),
      hours_worked = (julianday(datetime('now')) - julianday(${escape(clockInTime)})) * 24
    WHERE id = ${logId}
  `;
  
  db.run(updateQuery);
  saveDatabase();
  
  return { success: true, message: 'Clocked out successfully' };
};

// Calculate payroll for employee
const calculatePayroll = (employeeId, startDate, endDate) => {
  const db = getDb();
  
  // Get employee hourly rate
  const empQuery = `SELECT hourly_rate, first_name, last_name FROM employees WHERE id = ${employeeId}`;
  const empResult = db.exec(empQuery);
  
  if (empResult.length === 0) return null;
  
  const hourlyRate = empResult[0].values[0][0];
  const firstName = empResult[0].values[0][1];
  const lastName = empResult[0].values[0][2];
  
  if (!hourlyRate) return { error: 'Employee has no hourly rate set' };
  
  // Get time logs in date range
  const logs = getTimeLogs(employeeId, startDate, endDate);
  const totalHours = logs.reduce((sum, log) => sum + (log.hours_worked || 0), 0);
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
  calculatePayroll
};
