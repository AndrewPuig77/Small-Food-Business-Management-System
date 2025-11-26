const { getDb, saveDatabase } = require('../database/database');

// Helper function to escape SQL strings
const escape = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

// Get shifts for a date range
const getShifts = (businessId, startDate, endDate) => {
  const db = getDb();
  let query = `
    SELECT * FROM shifts 
    WHERE business_id = ${businessId}
  `;
  
  if (startDate) query += ` AND shift_date >= ${escape(startDate)}`;
  if (endDate) query += ` AND shift_date <= ${escape(endDate)}`;
  
  query += ' ORDER BY shift_date, start_time';
  
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const shift = {};
    columns.forEach((col, idx) => {
      shift[col] = row[idx];
    });
    return shift;
  });
};

// Create shift
const createShift = (businessId, shiftData) => {
  const db = getDb();
  
  const query = `
    INSERT INTO shifts (
      business_id, employee_id, shift_date, start_time, end_time, role, notes
    ) VALUES (
      ${businessId},
      ${shiftData.employeeId},
      ${escape(shiftData.shiftDate)},
      ${escape(shiftData.startTime)},
      ${escape(shiftData.endTime)},
      ${escape(shiftData.role)},
      ${escape(shiftData.notes)}
    )
  `;
  
  db.run(query);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const shiftId = lastIdResult[0].values[0][0];
  
  return getShiftById(shiftId);
};

// Get shift by ID
const getShiftById = (shiftId) => {
  const db = getDb();
  const query = `SELECT * FROM shifts WHERE id = ${shiftId}`;
  const result = db.exec(query);
  
  if (result.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  
  const shift = {};
  columns.forEach((col, idx) => {
    shift[col] = values[idx];
  });
  
  return shift;
};

// Update shift
const updateShift = (businessId, shiftId, shiftData) => {
  const db = getDb();
  
  const query = `
    UPDATE shifts SET
      employee_id = ${shiftData.employeeId},
      shift_date = ${escape(shiftData.shiftDate)},
      start_time = ${escape(shiftData.startTime)},
      end_time = ${escape(shiftData.endTime)},
      role = ${escape(shiftData.role)},
      notes = ${escape(shiftData.notes)},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${shiftId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getShiftById(shiftId);
};

// Delete shift
const deleteShift = (businessId, shiftId) => {
  const db = getDb();
  
  const query = `
    DELETE FROM shifts 
    WHERE id = ${shiftId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return { success: true };
};

module.exports = {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
  getShiftById
};
