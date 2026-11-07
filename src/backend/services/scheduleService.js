const { getDb, saveDatabase } = require('../database/database');
const { sql } = require('../database/sql');


// Get shifts for a date range
const getShifts = (businessId, startDate, endDate) => {
  const db = getDb();
  let query = sql`
    SELECT * FROM shifts 
    WHERE business_id = ${businessId}
  `;
  
  if (startDate) query = sql`${query} AND shift_date >= ${startDate}`;
  if (endDate) query = sql`${query} AND shift_date <= ${endDate}`;
  
  query = sql`${query} ORDER BY shift_date, start_time`;
  
  console.log('[ScheduleService] getShifts query:', query);
  const result = db.exec(query);
  console.log('[ScheduleService] getShifts result length:', result.length);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  const shifts = values.map(row => {
    const shift = {};
    columns.forEach((col, idx) => {
      shift[col] = row[idx];
    });
    return shift;
  });
  console.log('[ScheduleService] Returning', shifts.length, 'shifts:', shifts);
  return shifts;
};

// Create shift
const createShift = (businessId, shiftData) => {
  const db = getDb();
  console.log('[ScheduleService] Creating shift:', { businessId, shiftData });
  
  const query = sql`
    INSERT INTO shifts (
      business_id, employee_id, shift_date, start_time, end_time, role, notes
    ) VALUES (
      ${businessId},
      ${shiftData.employeeId},
      ${shiftData.shiftDate},
      ${shiftData.startTime},
      ${shiftData.endTime},
      ${shiftData.role},
      ${shiftData.notes}
    )
  `;
  
  console.log('[ScheduleService] Insert query:', query);
  db.run(query);
  saveDatabase();
  console.log('[ScheduleService] Shift saved to database');
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const shiftId = lastIdResult[0].values[0][0];
  
  return getShiftById(shiftId);
};

// Get shift by ID
const getShiftById = (shiftId) => {
  const db = getDb();
  const query = sql`SELECT * FROM shifts WHERE id = ${shiftId}`;
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
  
  const query = sql`
    UPDATE shifts SET
      employee_id = ${shiftData.employeeId},
      shift_date = ${shiftData.shiftDate},
      start_time = ${shiftData.startTime},
      end_time = ${shiftData.endTime},
      role = ${shiftData.role},
      notes = ${shiftData.notes},
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
  
  const query = sql`
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
