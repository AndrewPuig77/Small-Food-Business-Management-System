const { getDb, saveDatabase } = require('../database/database');
const { sql } = require('../database/sql');


// Get all tasks for a business
const getAllTasks = (businessId, filters = {}) => {
  const db = getDb();
  
  let whereClause = sql`WHERE et.business_id = ${businessId}`;
  
  if (filters.assignedTo) {
    whereClause = sql`${whereClause} AND et.assigned_to = ${filters.assignedTo}`;
  }
  
  if (filters.status) {
    whereClause = sql`${whereClause} AND et.status = ${filters.status}`;
  }
  
  if (filters.taskType) {
    whereClause = sql`${whereClause} AND et.task_type = ${filters.taskType}`;
  }
  
  if (filters.dueDate) {
    whereClause = sql`${whereClause} AND et.due_date = ${filters.dueDate}`;
  }
  
  const query = sql`
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
  
  let whereClause = sql`WHERE et.assigned_to = ${employeeId}`;
  
  if (status) {
    whereClause = sql`${whereClause} AND et.status = ${status}`;
  }
  
  const query = sql`
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
  
  const query = sql`
    INSERT INTO employee_tasks (
      business_id, assigned_to, assigned_by, title, description,
      task_type, priority, due_date, status
    ) VALUES (
      ${taskData.businessId},
      ${taskData.assignedTo || null},
      ${taskData.assignedBy},
      ${taskData.title},
      ${taskData.description},
      ${taskData.taskType},
      ${taskData.priority || 'normal'},
      ${taskData.dueDate},
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
  
  const query = sql`
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
    updates.push(sql`title = ${taskData.title}`);
  }
  if (taskData.description !== undefined) {
    updates.push(sql`description = ${taskData.description}`);
  }
  if (taskData.assignedTo !== undefined) {
    updates.push(sql`assigned_to = ${taskData.assignedTo || null}`);
  }
  if (taskData.taskType !== undefined) {
    updates.push(sql`task_type = ${taskData.taskType}`);
  }
  if (taskData.priority !== undefined) {
    updates.push(sql`priority = ${taskData.priority}`);
  }
  if (taskData.dueDate !== undefined) {
    updates.push(sql`due_date = ${taskData.dueDate}`);
  }
  if (taskData.status !== undefined) {
    updates.push(sql`status = ${taskData.status}`);
  }
  
  updates.push(sql`updated_at = CURRENT_TIMESTAMP`);
  
  const query = sql`
    UPDATE employee_tasks
    SET ${sql.join(updates)}
    WHERE id = ${taskId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getTaskById(taskId);
};

// Complete task
const completeTask = (taskId, completedBy) => {
  const db = getDb();
  
  const query = sql`
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
  
  db.run(sql`DELETE FROM employee_tasks WHERE id = ${taskId}`);
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
