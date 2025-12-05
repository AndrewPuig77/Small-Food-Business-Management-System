const { getDb, saveDatabase } = require('../database/database');

// Helper function to escape SQL strings
const escape = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

// Get all tasks for a business
const getAllTasks = (businessId, filters = {}) => {
  const db = getDb();
  
  let whereClause = `WHERE et.business_id = ${businessId}`;
  
  if (filters.assignedTo) {
    whereClause += ` AND et.assigned_to = ${filters.assignedTo}`;
  }
  
  if (filters.status) {
    whereClause += ` AND et.status = ${escape(filters.status)}`;
  }
  
  if (filters.taskType) {
    whereClause += ` AND et.task_type = ${escape(filters.taskType)}`;
  }
  
  if (filters.dueDate) {
    whereClause += ` AND et.due_date = ${escape(filters.dueDate)}`;
  }
  
  const query = `
    SELECT 
      et.*,
      (e.first_name || ' ' || e.last_name) as assigned_to_name,
      e.role as assigned_to_role,
      u1.full_name as assigned_by_name,
      u2.full_name as completed_by_name
    FROM employee_tasks et
    LEFT JOIN employees e ON et.assigned_to = e.id
    JOIN users u1 ON et.assigned_by = u1.id
    LEFT JOIN users u2 ON et.completed_by = u2.id
    ${whereClause}
    ORDER BY 
      CASE et.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      et.due_date ASC,
      et.created_at DESC
  `;
  
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const task = {};
    columns.forEach((col, idx) => {
      task[col] = row[idx];
    });
    return task;
  });
};

// Get tasks assigned to a specific employee
const getEmployeeTasks = (employeeId, status = null) => {
  const db = getDb();
  
  let whereClause = `WHERE et.assigned_to = ${employeeId}`;
  
  if (status) {
    whereClause += ` AND et.status = ${escape(status)}`;
  }
  
  const query = `
    SELECT 
      et.*,
      u1.full_name as assigned_by_name,
      u2.full_name as completed_by_name
    FROM employee_tasks et
    JOIN users u1 ON et.assigned_by = u1.id
    LEFT JOIN users u2 ON et.completed_by = u2.id
    ${whereClause}
    ORDER BY 
      CASE et.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      et.due_date ASC,
      et.created_at DESC
  `;
  
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const task = {};
    columns.forEach((col, idx) => {
      task[col] = row[idx];
    });
    return task;
  });
};

// Create new task
const createTask = (taskData) => {
  const db = getDb();
  
  const query = `
    INSERT INTO employee_tasks (
      business_id, assigned_to, assigned_by, title, description,
      task_type, priority, due_date, status
    ) VALUES (
      ${taskData.businessId},
      ${taskData.assignedTo || 'NULL'},
      ${taskData.assignedBy},
      ${escape(taskData.title)},
      ${escape(taskData.description)},
      ${escape(taskData.taskType)},
      ${escape(taskData.priority || 'normal')},
      ${escape(taskData.dueDate)},
      'pending'
    )
  `;
  
  db.run(query);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const taskId = lastIdResult[0].values[0][0];
  
  return getTaskById(taskId);
};

// Get task by ID
const getTaskById = (taskId) => {
  const db = getDb();
  
  const query = `
    SELECT 
      et.*,
      (e.first_name || ' ' || e.last_name) as assigned_to_name,
      u1.full_name as assigned_by_name,
      u2.full_name as completed_by_name
    FROM employee_tasks et
    LEFT JOIN employees e ON et.assigned_to = e.id
    JOIN users u1 ON et.assigned_by = u1.id
    LEFT JOIN users u2 ON et.completed_by = u2.id
    WHERE et.id = ${taskId}
  `;
  
  const result = db.exec(query);
  
  if (result.length === 0 || result[0].values.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  
  const task = {};
  columns.forEach((col, idx) => {
    task[col] = values[idx];
  });
  
  return task;
};

// Update task
const updateTask = (taskId, taskData) => {
  const db = getDb();
  
  const updates = [];
  
  if (taskData.title !== undefined) {
    updates.push(`title = ${escape(taskData.title)}`);
  }
  if (taskData.description !== undefined) {
    updates.push(`description = ${escape(taskData.description)}`);
  }
  if (taskData.assignedTo !== undefined) {
    updates.push(`assigned_to = ${taskData.assignedTo || 'NULL'}`);
  }
  if (taskData.taskType !== undefined) {
    updates.push(`task_type = ${escape(taskData.taskType)}`);
  }
  if (taskData.priority !== undefined) {
    updates.push(`priority = ${escape(taskData.priority)}`);
  }
  if (taskData.dueDate !== undefined) {
    updates.push(`due_date = ${escape(taskData.dueDate)}`);
  }
  if (taskData.status !== undefined) {
    updates.push(`status = ${escape(taskData.status)}`);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  
  const query = `
    UPDATE employee_tasks
    SET ${updates.join(', ')}
    WHERE id = ${taskId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getTaskById(taskId);
};

// Complete task
const completeTask = (taskId, completedBy) => {
  const db = getDb();
  
  const query = `
    UPDATE employee_tasks
    SET status = 'completed',
        completed_at = CURRENT_TIMESTAMP,
        completed_by = ${completedBy},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${taskId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getTaskById(taskId);
};

// Delete task
const deleteTask = (taskId) => {
  const db = getDb();
  
  db.run(`DELETE FROM employee_tasks WHERE id = ${taskId}`);
  saveDatabase();
  
  return { success: true };
};

module.exports = {
  getAllTasks,
  getEmployeeTasks,
  createTask,
  getTaskById,
  updateTask,
  completeTask,
  deleteTask
};
