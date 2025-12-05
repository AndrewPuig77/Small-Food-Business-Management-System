const { getDb, saveDatabase } = require('../database/database');

// Helper function to escape SQL strings
const escape = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

// Get all shift swap requests for a business
const getAllShiftSwapRequests = (businessId, filters = {}) => {
  const db = getDb();
  
  let whereClause = `WHERE s.business_id = ${businessId}`;
  
  if (filters.status) {
    whereClause += ` AND ssr.status = ${escape(filters.status)}`;
  }
  
  if (filters.requestingEmployeeId) {
    whereClause += ` AND ssr.requesting_employee_id = ${filters.requestingEmployeeId}`;
  }
  
  if (filters.targetEmployeeId) {
    whereClause += ` AND ssr.target_employee_id = ${filters.targetEmployeeId}`;
  }
  
  const query = `
    SELECT 
      ssr.*,
      s.shift_date,
      s.start_time,
      s.end_time,
      s.role as shift_role,
      (e1.first_name || ' ' || e1.last_name) as requesting_employee_name,
      e1.role as requesting_employee_role,
      (e2.first_name || ' ' || e2.last_name) as target_employee_name,
      e2.role as target_employee_role,
      u.full_name as reviewed_by_name
    FROM shift_swap_requests ssr
    JOIN shifts s ON ssr.shift_id = s.id
    JOIN employees e1 ON ssr.requesting_employee_id = e1.id
    LEFT JOIN employees e2 ON ssr.target_employee_id = e2.id
    LEFT JOIN users u ON ssr.reviewed_by = u.id
    ${whereClause}
    ORDER BY ssr.created_at DESC
  `;
  
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const request = {};
    columns.forEach((col, idx) => {
      request[col] = row[idx];
    });
    return request;
  });
};

// Get shift swap requests for a specific employee
const getEmployeeShiftSwapRequests = (employeeId) => {
  const db = getDb();
  
  const query = `
    SELECT 
      ssr.*,
      s.shift_date,
      s.start_time,
      s.end_time,
      s.role as shift_role,
      (e1.first_name || ' ' || e1.last_name) as requesting_employee_name,
      (e2.first_name || ' ' || e2.last_name) as target_employee_name,
      u.full_name as reviewed_by_name
    FROM shift_swap_requests ssr
    JOIN shifts s ON ssr.shift_id = s.id
    JOIN employees e1 ON ssr.requesting_employee_id = e1.id
    LEFT JOIN employees e2 ON ssr.target_employee_id = e2.id
    LEFT JOIN users u ON ssr.reviewed_by = u.id
    WHERE ssr.requesting_employee_id = ${employeeId} 
       OR ssr.target_employee_id = ${employeeId}
    ORDER BY ssr.created_at DESC
  `;
  
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const request = {};
    columns.forEach((col, idx) => {
      request[col] = row[idx];
    });
    return request;
  });
};

// Create new shift swap request
const createShiftSwapRequest = (requestData) => {
  const db = getDb();
  
  // Verify the shift belongs to the requesting employee
  const shiftCheck = db.exec(`
    SELECT employee_id FROM shifts WHERE id = ${requestData.shiftId}
  `);
  
  if (shiftCheck.length === 0 || shiftCheck[0].values.length === 0) {
    throw new Error('Shift not found');
  }
  
  const shiftEmployeeId = shiftCheck[0].values[0][0];
  
  if (shiftEmployeeId !== requestData.requestingEmployeeId) {
    throw new Error('You can only request swaps for your own shifts');
  }
  
  const query = `
    INSERT INTO shift_swap_requests (
      shift_id, requesting_employee_id, target_employee_id, reason, status
    ) VALUES (
      ${requestData.shiftId},
      ${requestData.requestingEmployeeId},
      ${requestData.targetEmployeeId || 'NULL'},
      ${escape(requestData.reason)},
      'pending'
    )
  `;
  
  db.run(query);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const requestId = lastIdResult[0].values[0][0];
  
  return getShiftSwapRequestById(requestId);
};

// Get shift swap request by ID
const getShiftSwapRequestById = (requestId) => {
  const db = getDb();
  
  const query = `
    SELECT 
      ssr.*,
      s.shift_date,
      s.start_time,
      s.end_time,
      s.role as shift_role,
      s.business_id,
      (e1.first_name || ' ' || e1.last_name) as requesting_employee_name,
      (e2.first_name || ' ' || e2.last_name) as target_employee_name,
      u.full_name as reviewed_by_name
    FROM shift_swap_requests ssr
    JOIN shifts s ON ssr.shift_id = s.id
    JOIN employees e1 ON ssr.requesting_employee_id = e1.id
    LEFT JOIN employees e2 ON ssr.target_employee_id = e2.id
    LEFT JOIN users u ON ssr.reviewed_by = u.id
    WHERE ssr.id = ${requestId}
  `;
  
  const result = db.exec(query);
  
  if (result.length === 0 || result[0].values.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  
  const request = {};
  columns.forEach((col, idx) => {
    request[col] = values[idx];
  });
  
  return request;
};

// Review shift swap request (approve/deny)
const reviewShiftSwapRequest = (requestId, reviewData) => {
  const db = getDb();
  
  // Get the request details
  const request = getShiftSwapRequestById(requestId);
  
  if (!request) {
    throw new Error('Shift swap request not found');
  }
  
  // If approved, swap the shift
  if (reviewData.status === 'approved' && request.target_employee_id) {
    db.run(`
      UPDATE shifts
      SET employee_id = ${request.target_employee_id},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${request.shift_id}
    `);
  }
  
  // Update the swap request
  const query = `
    UPDATE shift_swap_requests
    SET status = ${escape(reviewData.status)},
        reviewed_by = ${reviewData.reviewedBy},
        reviewed_at = CURRENT_TIMESTAMP,
        review_notes = ${escape(reviewData.reviewNotes)},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${requestId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getShiftSwapRequestById(requestId);
};

// Cancel shift swap request
const cancelShiftSwapRequest = (requestId, employeeId) => {
  const db = getDb();
  
  // Verify the employee is the one who requested the swap
  const checkQuery = `
    SELECT requesting_employee_id FROM shift_swap_requests WHERE id = ${requestId}
  `;
  
  const result = db.exec(checkQuery);
  
  if (result.length === 0 || result[0].values.length === 0) {
    throw new Error('Shift swap request not found');
  }
  
  const requestingEmployeeId = result[0].values[0][0];
  
  if (requestingEmployeeId !== employeeId) {
    throw new Error('You can only cancel your own swap requests');
  }
  
  db.run(`
    UPDATE shift_swap_requests
    SET status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${requestId}
  `);
  
  saveDatabase();
  
  return getShiftSwapRequestById(requestId);
};

// Delete shift swap request
const deleteShiftSwapRequest = (requestId) => {
  const db = getDb();
  
  db.run(`DELETE FROM shift_swap_requests WHERE id = ${requestId}`);
  saveDatabase();
  
  return { success: true };
};

module.exports = {
  getAllShiftSwapRequests,
  getEmployeeShiftSwapRequests,
  createShiftSwapRequest,
  getShiftSwapRequestById,
  reviewShiftSwapRequest,
  cancelShiftSwapRequest,
  deleteShiftSwapRequest
};
