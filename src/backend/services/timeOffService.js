const { getDb, saveDatabase } = require('../database/database');

// Helper function to escape SQL strings
const escape = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

// Get all time off requests for a business
const getAllTimeOffRequests = (businessId, filters = {}) => {
  const db = getDb();
  
  let whereClause = `WHERE e.business_id = ${businessId}`;
  
  if (filters.employeeId) {
    whereClause += ` AND tor.employee_id = ${filters.employeeId}`;
  }
  
  if (filters.status) {
    whereClause += ` AND tor.status = ${escape(filters.status)}`;
  }
  
  if (filters.startDate) {
    whereClause += ` AND tor.end_date >= ${escape(filters.startDate)}`;
  }
  
  if (filters.endDate) {
    whereClause += ` AND tor.start_date <= ${escape(filters.endDate)}`;
  }
  
  const query = `
    SELECT 
      tor.*,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.role as employee_role,
      u.full_name as reviewed_by_name
    FROM time_off_requests tor
    JOIN employees e ON tor.employee_id = e.id
    LEFT JOIN users u ON tor.reviewed_by = u.id
    ${whereClause}
    ORDER BY tor.created_at DESC
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

// Get time off requests for a specific employee
const getEmployeeTimeOffRequests = (employeeId) => {
  const db = getDb();
  
  const query = `
    SELECT 
      tor.*,
      u.full_name as reviewed_by_name
    FROM time_off_requests tor
    LEFT JOIN users u ON tor.reviewed_by = u.id
    WHERE tor.employee_id = ${employeeId}
    ORDER BY tor.created_at DESC
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

// Create new time off request
const createTimeOffRequest = (requestData) => {
  const db = getDb();
  
  const query = `
    INSERT INTO time_off_requests (
      employee_id, start_date, end_date, request_type, reason, status
    ) VALUES (
      ${requestData.employeeId},
      ${escape(requestData.startDate)},
      ${escape(requestData.endDate)},
      ${escape(requestData.requestType)},
      ${escape(requestData.reason)},
      'pending'
    )
  `;
  
  db.run(query);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const requestId = lastIdResult[0].values[0][0];
  
  return getTimeOffRequestById(requestId);
};

// Get time off request by ID
const getTimeOffRequestById = (requestId) => {
  const db = getDb();
  
  const query = `
    SELECT 
      tor.*,
      (e.first_name || ' ' || e.last_name) as employee_name,
      u.full_name as reviewed_by_name
    FROM time_off_requests tor
    JOIN employees e ON tor.employee_id = e.id
    LEFT JOIN users u ON tor.reviewed_by = u.id
    WHERE tor.id = ${requestId}
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

// Review time off request (approve/deny)
const reviewTimeOffRequest = (requestId, reviewData) => {
  const db = getDb();
  
  const query = `
    UPDATE time_off_requests
    SET status = ${escape(reviewData.status)},
        reviewed_by = ${reviewData.reviewedBy},
        reviewed_at = CURRENT_TIMESTAMP,
        review_notes = ${escape(reviewData.reviewNotes)},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${requestId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getTimeOffRequestById(requestId);
};

// Delete time off request
const deleteTimeOffRequest = (requestId) => {
  const db = getDb();
  
  db.run(`DELETE FROM time_off_requests WHERE id = ${requestId}`);
  saveDatabase();
  
  return { success: true };
};

// Get employee availability
const getEmployeeAvailability = (employeeId) => {
  const db = getDb();
  
  const query = `
    SELECT * FROM employee_availability
    WHERE employee_id = ${employeeId}
    ORDER BY day_of_week
  `;
  
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const availability = {};
    columns.forEach((col, idx) => {
      availability[col] = row[idx];
    });
    return availability;
  });
};

// Update employee availability
const updateEmployeeAvailability = (employeeId, availabilityData) => {
  const db = getDb();
  
  // Delete existing availability for this employee
  db.run(`DELETE FROM employee_availability WHERE employee_id = ${employeeId}`);
  
  // Insert new availability records
  availabilityData.forEach(day => {
    const query = `
      INSERT INTO employee_availability (
        employee_id, day_of_week, is_available, start_time, end_time, notes
      ) VALUES (
        ${employeeId},
        ${day.dayOfWeek},
        ${day.isAvailable ? 1 : 0},
        ${escape(day.startTime)},
        ${escape(day.endTime)},
        ${escape(day.notes)}
      )
    `;
    db.run(query);
  });
  
  saveDatabase();
  
  return getEmployeeAvailability(employeeId);
};

module.exports = {
  getAllTimeOffRequests,
  getEmployeeTimeOffRequests,
  createTimeOffRequest,
  getTimeOffRequestById,
  reviewTimeOffRequest,
  deleteTimeOffRequest,
  getEmployeeAvailability,
  updateEmployeeAvailability
};
