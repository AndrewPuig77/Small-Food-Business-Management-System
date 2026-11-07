const { getDb, saveDatabase } = require('../database/database');
const { sql } = require('../database/sql');


// Get all announcements for a business
const getAllAnnouncements = (businessId, filters = {}) => {
  const db = getDb();
  
  let whereClause = sql`WHERE a.business_id = ${businessId}`;
  
  if (filters.isActive !== undefined) {
    whereClause = sql`${whereClause} AND a.is_active = ${filters.isActive ? 1 : 0}`;
  }
  
  if (filters.targetRole) {
    whereClause = sql`${whereClause} AND (a.target_roles IS NULL OR a.target_roles LIKE ${'%' + filters.targetRole + '%'})`;
  }
  
  // Only show non-expired announcements by default
  if (filters.includeExpired !== true) {
    whereClause = sql`${whereClause} AND (a.expires_at IS NULL OR a.expires_at > datetime('now'))`;
  }
  
  const query = sql`
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
  
  const query = sql`
    INSERT INTO announcements (
      business_id, created_by, title, message, priority,
      target_roles, is_active, expires_at
    ) VALUES (
      ${announcementData.businessId},
      ${announcementData.createdBy},
      ${announcementData.title},
      ${announcementData.message},
      ${announcementData.priority || 'normal'},
      ${announcementData.targetRoles},
      ${announcementData.isActive !== undefined ? (announcementData.isActive ? 1 : 0) : 1},
      ${announcementData.expiresAt}
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
  
  const query = sql`
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
    updates.push(sql`title = ${announcementData.title}`);
  }
  if (announcementData.message !== undefined) {
    updates.push(sql`message = ${announcementData.message}`);
  }
  if (announcementData.priority !== undefined) {
    updates.push(sql`priority = ${announcementData.priority}`);
  }
  if (announcementData.targetRoles !== undefined) {
    updates.push(sql`target_roles = ${announcementData.targetRoles}`);
  }
  if (announcementData.isActive !== undefined) {
    updates.push(sql`is_active = ${announcementData.isActive ? 1 : 0}`);
  }
  if (announcementData.expiresAt !== undefined) {
    updates.push(sql`expires_at = ${announcementData.expiresAt}`);
  }
  
  updates.push(sql`updated_at = CURRENT_TIMESTAMP`);
  
  const query = sql`
    UPDATE announcements
    SET ${sql.join(updates)}
    WHERE id = ${announcementId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getAnnouncementById(announcementId);
};

// Delete announcement
const deleteAnnouncement = (announcementId) => {
  const db = getDb();
  
  db.run(sql`DELETE FROM announcements WHERE id = ${announcementId}`);
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
