const { getDb, saveDatabase } = require('../database/database');

// Helper function to escape SQL strings
const escape = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

// Get local datetime string in format: YYYY-MM-DD HH:MM:SS
const getLocalDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Calculate hours worked between two timestamps
const calculateHours = (clockIn, clockOut) => {
  const startTime = new Date(clockIn);
  const endTime = new Date(clockOut);
  const diffMs = endTime - startTime;
  return (diffMs / (1000 * 60 * 60)).toFixed(2);
};

// ==================== TIME LOGS ====================

// Clock in employee
const clockIn = (employeeId, notes = null) => {
  const db = getDb();
  
  // Check if employee already has an active clock-in (no clock-out)
  const activeQuery = `
    SELECT id FROM time_logs 
    WHERE employee_id = ${employeeId} 
    AND clock_out IS NULL
    ORDER BY clock_in DESC
    LIMIT 1
  `;
  
  const activeResult = db.exec(activeQuery);
  if (activeResult.length > 0 && activeResult[0].values.length > 0) {
    throw new Error('Employee is already clocked in');
  }
  
  const clockInTime = getLocalDateTime();
  
  const query = `
    INSERT INTO time_logs (employee_id, clock_in, notes)
    VALUES (${employeeId}, ${escape(clockInTime)}, ${escape(notes)})
  `;
  
  db.run(query);
  saveDatabase();
  
  const result = db.exec('SELECT last_insert_rowid() as id');
  const logId = result[0].values[0][0];
  
  return getTimeLogById(logId);
};

// Clock out employee
const clockOut = (employeeId, notes = null) => {
  const db = getDb();
  
  // Find active clock-in
  const activeQuery = `
    SELECT id, clock_in FROM time_logs 
    WHERE employee_id = ${employeeId} 
    AND clock_out IS NULL
    ORDER BY clock_in DESC
    LIMIT 1
  `;
  
  const activeResult = db.exec(activeQuery);
  if (activeResult.length === 0 || activeResult[0].values.length === 0) {
    throw new Error('No active clock-in found for this employee');
  }
  
  const logId = activeResult[0].values[0][0];
  const clockInTime = activeResult[0].values[0][1];
  const clockOutTime = getLocalDateTime();
  const hoursWorked = calculateHours(clockInTime, clockOutTime);
  
  const updateNotes = notes ? `, notes = ${escape(notes)}` : '';
  
  const query = `
    UPDATE time_logs 
    SET clock_out = ${escape(clockOutTime)}, 
        hours_worked = ${hoursWorked}
        ${updateNotes}
    WHERE id = ${logId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getTimeLogById(logId);
};

// Get time log by ID
const getTimeLogById = (logId) => {
  const db = getDb();
  const query = `
    SELECT 
      tl.*,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.role as position,
      e.hourly_rate
    FROM time_logs tl
    JOIN employees e ON tl.employee_id = e.id
    WHERE tl.id = ${logId}
  `;
  
  const result = db.exec(query);
  if (result.length === 0 || result[0].values.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  
  const log = {};
  columns.forEach((col, idx) => {
    log[col] = values[idx];
  });
  
  return log;
};

// Get all time logs for a business (with date filtering)
const getTimeLogs = (businessId, startDate = null, endDate = null) => {
  const db = getDb();
  
  let dateFilter = '';
  if (startDate && endDate) {
    dateFilter = `AND DATE(tl.clock_in) BETWEEN DATE(${escape(startDate)}) AND DATE(${escape(endDate)})`;
  }
  
  const query = `
    SELECT 
      tl.*,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.role as position,
      e.hourly_rate,
      e.business_id
    FROM time_logs tl
    JOIN employees e ON tl.employee_id = e.id
    WHERE e.business_id = ${businessId}
    ${dateFilter}
    ORDER BY tl.clock_in DESC
  `;
  
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

// Get time logs for specific employee
const getEmployeeTimeLogs = (employeeId, startDate = null, endDate = null) => {
  const db = getDb();
  
  let dateFilter = '';
  if (startDate && endDate) {
    dateFilter = `AND DATE(clock_in) BETWEEN DATE(${escape(startDate)}) AND DATE(${escape(endDate)})`;
  }
  
  const query = `
    SELECT * FROM time_logs 
    WHERE employee_id = ${employeeId}
    ${dateFilter}
    ORDER BY clock_in DESC
  `;
  
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

// Check if employee is currently clocked in
const isEmployeeClockedIn = (employeeId) => {
  const db = getDb();
  const query = `
    SELECT id FROM time_logs 
    WHERE employee_id = ${employeeId} 
    AND clock_out IS NULL
    LIMIT 1
  `;
  
  const result = db.exec(query);
  return result.length > 0 && result[0].values.length > 0;
};

// Get currently clocked in employees for a business
const getClockedInEmployees = (businessId) => {
  const db = getDb();
  const query = `
    SELECT 
      tl.id as log_id,
      tl.clock_in,
      tl.notes,
      e.id as employee_id,
      (e.first_name || ' ' || e.last_name) as full_name,
      e.role as position,
      e.hourly_rate
    FROM time_logs tl
    JOIN employees e ON tl.employee_id = e.id
    WHERE e.business_id = ${businessId}
    AND tl.clock_out IS NULL
    ORDER BY tl.clock_in ASC
  `;
  
  const result = db.exec(query);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const emp = {};
    columns.forEach((col, idx) => {
      emp[col] = row[idx];
    });
    return emp;
  });
};

// Update time log (for manual adjustments)
const updateTimeLog = (logId, updates) => {
  const db = getDb();
  
  const setStatements = [];
  if (updates.clockIn) setStatements.push(`clock_in = ${escape(updates.clockIn)}`);
  if (updates.clockOut) setStatements.push(`clock_out = ${escape(updates.clockOut)}`);
  if (updates.notes !== undefined) setStatements.push(`notes = ${escape(updates.notes)}`);
  
  // Recalculate hours if both times are provided
  if (updates.clockIn || updates.clockOut) {
    const logData = getTimeLogById(logId);
    const clockIn = updates.clockIn || logData.clock_in;
    const clockOut = updates.clockOut || logData.clock_out;
    if (clockIn && clockOut) {
      const hours = calculateHours(clockIn, clockOut);
      setStatements.push(`hours_worked = ${hours}`);
    }
  }
  
  if (setStatements.length === 0) return getTimeLogById(logId);
  
  const query = `
    UPDATE time_logs 
    SET ${setStatements.join(', ')}
    WHERE id = ${logId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getTimeLogById(logId);
};

// Delete time log
const deleteTimeLog = (logId) => {
  const db = getDb();
  const query = `DELETE FROM time_logs WHERE id = ${logId}`;
  
  db.run(query);
  saveDatabase();
  
  return { success: true };
};

// ==================== PAYROLL CALCULATIONS ====================

// Get payroll data for date range
const getPayrollData = (businessId, startDate, endDate) => {
  const db = getDb();
  
  console.log('getPayrollData called with:', { businessId, startDate, endDate });
  
  // First, check if there are any time logs at all
  const checkQuery = `SELECT COUNT(*) as count FROM time_logs WHERE clock_out IS NOT NULL`;
  const checkResult = db.exec(checkQuery);
  console.log('Total completed time logs in database:', checkResult[0]?.values[0]?.[0] || 0);
  
  // Check time logs for this business with details
  const businessCheckQuery = `
    SELECT 
      tl.id,
      tl.employee_id,
      tl.clock_in,
      tl.clock_out,
      tl.hours_worked,
      (e.first_name || ' ' || e.last_name) as employee_name,
      e.hourly_rate,
      e.business_id
    FROM time_logs tl
    JOIN employees e ON tl.employee_id = e.id
    WHERE e.business_id = ${businessId} AND tl.clock_out IS NOT NULL
  `;
  const businessCheck = db.exec(businessCheckQuery);
  if (businessCheck.length > 0) {
    console.log('Time logs for this business (columns):', businessCheck[0].columns);
    console.log('Time logs for this business (values):', businessCheck[0].values);
  } else {
    console.log('No completed time logs found for this business');
  }
  
  const query = `
    SELECT 
      e.id as employee_id,
      (e.first_name || ' ' || e.last_name) as full_name,
      e.role as position,
      e.hourly_rate,
      COUNT(tl.id) as shift_count,
      COALESCE(SUM(tl.hours_worked), 0) as total_hours,
      COALESCE(SUM(tl.hours_worked * e.hourly_rate), 0) as gross_pay
    FROM employees e
    LEFT JOIN time_logs tl ON e.id = tl.employee_id 
      AND DATE(tl.clock_in) BETWEEN DATE(${escape(startDate)}) AND DATE(${escape(endDate)})
      AND tl.clock_out IS NOT NULL
    WHERE e.business_id = ${businessId}
    GROUP BY e.id, e.first_name, e.last_name, e.role, e.hourly_rate
    ORDER BY total_hours DESC
  `;
  
  console.log('Executing payroll query:', query);
  
  const result = db.exec(query);
  console.log('Raw query result:', result);
  
  if (result.length === 0) {
    console.log('No payroll data found');
    return [];
  }
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const payroll = {};
    columns.forEach((col, idx) => {
      payroll[col] = row[idx];
    });
    
    // Calculate overtime (over 40 hours per week)
    const regularHours = Math.min(payroll.total_hours, 40);
    const overtimeHours = Math.max(0, payroll.total_hours - 40);
    const overtimePay = overtimeHours * payroll.hourly_rate * 1.5;
    const regularPay = regularHours * payroll.hourly_rate;
    
    payroll.regular_hours = regularHours;
    payroll.overtime_hours = overtimeHours;
    payroll.regular_pay = regularPay;
    payroll.overtime_pay = overtimePay;
    payroll.gross_pay = regularPay + overtimePay;
    
    return payroll;
  });
};

// Get payroll summary
const getPayrollSummary = (businessId, startDate, endDate) => {
  const payrollData = getPayrollData(businessId, startDate, endDate);
  
  const summary = {
    total_employees: payrollData.length,
    total_hours: 0,
    total_regular_hours: 0,
    total_overtime_hours: 0,
    total_gross_pay: 0,
    total_regular_pay: 0,
    total_overtime_pay: 0
  };
  
  payrollData.forEach(emp => {
    summary.total_hours += emp.total_hours;
    summary.total_regular_hours += emp.regular_hours;
    summary.total_overtime_hours += emp.overtime_hours;
    summary.total_gross_pay += emp.gross_pay;
    summary.total_regular_pay += emp.regular_pay;
    summary.total_overtime_pay += emp.overtime_pay;
  });
  
  return summary;
};

module.exports = {
  clockIn,
  clockOut,
  getTimeLogById,
  getTimeLogs,
  getEmployeeTimeLogs,
  isEmployeeClockedIn,
  getClockedInEmployees,
  updateTimeLog,
  deleteTimeLog,
  getPayrollData,
  getPayrollSummary
};
