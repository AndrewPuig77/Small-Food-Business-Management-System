const { getDb, saveDatabase } = require('../database/database');

// Helper function to escape SQL strings
const escape = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

// Get all announcements for a business
const getAllAnnouncements = (businessId, filters = {}) => {
  const db = getDb();
  
  let whereClause = `WHERE a.business_id = ${businessId}`;
  
  if (filters.isActive !== undefined) {
    whereClause += ` AND a.is_active = ${filters.isActive ? 1 : 0}`;
  }
  
  if (filters.targetRole) {
    whereClause += ` AND (a.target_roles IS NULL OR a.target_roles LIKE ${escape('%' + filters.targetRole + '%')})`;
  }
  
  // Only show non-expired announcements by default
  if (filters.includeExpired !== true) {
    whereClause += ` AND (a.expires_at IS NULL OR a.expires_at > datetime('now'))`;
  }
  
  const query = `
    SELECT 
      a.*,
      u.full_name as created_by_name
    FROM announcements a
    JOIN users u ON a.created_by = u.id
    ${whereClause}
    ORDER BY 
      CASE a.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
      END,
      a.created_at DESC
  `;
  
  console.log('[AnnouncementService] SQL Query:', query);
  
  const result = db.exec(query);
  
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const announcement = {};
    columns.forEach((col, idx) => {
      announcement[col] = row[idx];
    });
    return announcement;
  });
};

// Get announcements for a specific role
const getAnnouncementsForRole = (businessId, role) => {
  console.log('[AnnouncementService] Getting announcements for:', { businessId, role });
  const results = getAllAnnouncements(businessId, { 
    isActive: true, 
    targetRole: role 
  });
  console.log('[AnnouncementService] Found', results.length, 'announcements');
  results.forEach(a => {
    console.log(`  - "${a.title}" (target_roles: "${a.target_roles}", is_active: ${a.is_active})`);
  });
  return results;
};

// Create new announcement
const createAnnouncement = (announcementData) => {
  const db = getDb();
  
  const query = `
    INSERT INTO announcements (
      business_id, created_by, title, message, priority,
      target_roles, is_active, expires_at
    ) VALUES (
      ${announcementData.businessId},
      ${announcementData.createdBy},
      ${escape(announcementData.title)},
      ${escape(announcementData.message)},
      ${escape(announcementData.priority || 'normal')},
      ${escape(announcementData.targetRoles)},
      ${announcementData.isActive !== undefined ? (announcementData.isActive ? 1 : 0) : 1},
      ${escape(announcementData.expiresAt)}
    )
  `;
  
  db.run(query);
  saveDatabase();
  
  const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
  const announcementId = lastIdResult[0].values[0][0];
  
  return getAnnouncementById(announcementId);
};

// Get announcement by ID
const getAnnouncementById = (announcementId) => {
  const db = getDb();
  
  const query = `
    SELECT 
      a.*,
      u.full_name as created_by_name
    FROM announcements a
    JOIN users u ON a.created_by = u.id
    WHERE a.id = ${announcementId}
  `;
  
  const result = db.exec(query);
  
  if (result.length === 0 || result[0].values.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  
  const announcement = {};
  columns.forEach((col, idx) => {
    announcement[col] = values[idx];
  });
  
  return announcement;
};

// Update announcement
const updateAnnouncement = (announcementId, announcementData) => {
  const db = getDb();
  
  const updates = [];
  
  if (announcementData.title !== undefined) {
    updates.push(`title = ${escape(announcementData.title)}`);
  }
  if (announcementData.message !== undefined) {
    updates.push(`message = ${escape(announcementData.message)}`);
  }
  if (announcementData.priority !== undefined) {
    updates.push(`priority = ${escape(announcementData.priority)}`);
  }
  if (announcementData.targetRoles !== undefined) {
    updates.push(`target_roles = ${escape(announcementData.targetRoles)}`);
  }
  if (announcementData.isActive !== undefined) {
    updates.push(`is_active = ${announcementData.isActive ? 1 : 0}`);
  }
  if (announcementData.expiresAt !== undefined) {
    updates.push(`expires_at = ${escape(announcementData.expiresAt)}`);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  
  const query = `
    UPDATE announcements
    SET ${updates.join(', ')}
    WHERE id = ${announcementId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getAnnouncementById(announcementId);
};

// Delete announcement
const deleteAnnouncement = (announcementId) => {
  const db = getDb();
  
  db.run(`DELETE FROM announcements WHERE id = ${announcementId}`);
  saveDatabase();
  
  return { success: true };
};

module.exports = {
  getAllAnnouncements,
  getAnnouncementsForRole,
  createAnnouncement,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
};
