const { getDb, saveDatabase } = require('../database/database');

// Helper function to escape SQL strings
const escape = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
};

// ==================== RESERVATIONS ====================

// Check if reservations are enabled for a business
const isReservationEnabled = (businessId) => {
  const db = getDb();
  const query = `
    SELECT reservation_enabled FROM businesses WHERE id = ${businessId}
  `;
  
  const result = db.exec(query);
  if (result.length === 0 || result[0].values.length === 0) return false;
  
  return result[0].values[0][0] === 1;
};

// Enable/disable reservations for a business
const setReservationEnabled = (businessId, enabled) => {
  const db = getDb();
  const query = `
    UPDATE businesses 
    SET reservation_enabled = ${enabled ? 1 : 0}
    WHERE id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return { success: true, enabled };
};

// Get reservation settings for a business
const getReservationSettings = (businessId) => {
  const db = getDb();
  const query = `
    SELECT 
      reservation_enabled,
      reservation_capacity,
      reservation_interval_minutes,
      reservation_opening_hour,
      reservation_closing_hour
    FROM businesses 
    WHERE id = ${businessId}
  `;
  
  const result = db.exec(query);
  if (result.length === 0 || result[0].values.length === 0) {
    return {
      enabled: false,
      capacity: 10,
      intervalMinutes: 30,
      openingHour: 11,
      closingHour: 22
    };
  }
  
  const values = result[0].values[0];
  return {
    enabled: values[0] === 1,
    capacity: values[1] || 10,
    intervalMinutes: values[2] || 30,
    openingHour: values[3] || 11,
    closingHour: values[4] || 22
  };
};

// Update reservation settings
const updateReservationSettings = (businessId, settings) => {
  try {
    console.log('updateReservationSettings called with:', { businessId, settings });
    
    if (!settings) {
      console.error('Settings is undefined or null');
      throw new Error('Settings parameter is required');
    }
    
    const db = getDb();
    const query = `
      UPDATE businesses 
      SET 
        reservation_enabled = ${settings.enabled ? 1 : 0},
        reservation_capacity = ${settings.capacity || 10},
        reservation_interval_minutes = ${settings.intervalMinutes || 30},
        reservation_opening_hour = ${settings.openingHour || 11},
        reservation_closing_hour = ${settings.closingHour || 22}
      WHERE id = ${businessId}
    `;
    
    console.log('Executing query:', query);
    db.run(query);
    console.log('Query executed successfully');
    saveDatabase();
    console.log('Database saved');
    
    const result = getReservationSettings(businessId);
    console.log('Returning settings:', result);
    return { success: true, settings: result };
  } catch (error) {
    console.error('Error in updateReservationSettings:', error);
    return { success: false, message: error.message };
  }
};

// Get all reservations for a business
const getAllReservations = (businessId, startDate = null, endDate = null) => {
  // Check if reservations are enabled
  if (!isReservationEnabled(businessId)) {
    return [];
  }
  const db = getDb();
  
  let dateFilter = '';
  if (startDate && endDate) {
    dateFilter = `AND DATE(reservation_date) BETWEEN DATE(${escape(startDate)}) AND DATE(${escape(endDate)})`;
  }
  
  const query = `
    SELECT r.*, c.name as customer_name, c.phone as customer_phone
    FROM reservations r
    LEFT JOIN customers c ON r.customer_id = c.id
    WHERE r.business_id = ${businessId}
    ${dateFilter}
    ORDER BY r.reservation_date, r.reservation_time
  `;
  
  const result = db.exec(query);
  if (result.length === 0) return [];
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  return values.map(row => {
    const reservation = {};
    columns.forEach((col, idx) => {
      reservation[col] = row[idx];
    });
    return reservation;
  });
};

// Get reservation by ID
const getReservationById = (businessId, reservationId) => {
  const db = getDb();
  const query = `
    SELECT r.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
    FROM reservations r
    LEFT JOIN customers c ON r.customer_id = c.id
    WHERE r.id = ${reservationId} AND r.business_id = ${businessId}
  `;
  
  const result = db.exec(query);
  if (result.length === 0 || result[0].values.length === 0) return null;
  
  const columns = result[0].columns;
  const values = result[0].values[0];
  
  const reservation = {};
  columns.forEach((col, idx) => {
    reservation[col] = values[idx];
  });
  
  return reservation;
};

// Create new reservation
const createReservation = (businessId, reservationData) => {
  console.log('createReservation called with:', { businessId, reservationData });
  const db = getDb();
  
  const {
    customerId,
    guestName,
    guestPhone,
    guestEmail,
    reservationDate,
    reservationTime,
    partySize,
    tableNumber,
    specialRequests,
    status
  } = reservationData;
  
  console.log('Extracted values:', {
    customerId,
    guestName,
    guestPhone,
    guestEmail,
    reservationDate,
    reservationTime,
    partySize,
    tableNumber,
    specialRequests,
    status
  });
  
  const query = `
    INSERT INTO reservations (
      business_id, customer_id, guest_name, guest_phone, guest_email,
      reservation_date, reservation_time, party_size, table_number,
      special_requests, status
    ) VALUES (
      ${businessId},
      ${customerId || 'NULL'},
      ${escape(guestName || '')},
      ${escape(guestPhone || '')},
      ${escape(guestEmail || '')},
      ${escape(reservationDate || '')},
      ${escape(reservationTime || '')},
      ${partySize || 0},
      ${escape(tableNumber || '')},
      ${escape(specialRequests || '')},
      ${escape(status || 'pending')}
    )
  `;
  
  console.log('SQL Query:', query);
  try {
    // First verify the table exists
    const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='reservations'");
    console.log('Table check:', JSON.stringify(tableCheck, null, 2));
    
    db.run(query);
    console.log('INSERT successful');
    
    // Check if anything was actually inserted
    const countResult = db.exec('SELECT COUNT(*) as count FROM reservations');
    console.log('Total reservations in DB:', JSON.stringify(countResult, null, 2));
  } catch (error) {
    console.error('SQL Error:', error);
    console.error('Failed query:', query);
    throw error;
  }
  saveDatabase();
  console.log('Database saved after INSERT');
  
  // Get the ID of the inserted reservation - sql.js doesn't update last_insert_rowid with db.run()
  // so we need to get the max ID from the table
  const result = db.exec('SELECT MAX(id) as id FROM reservations WHERE business_id = ' + businessId);
  console.log('Max ID result:', JSON.stringify(result, null, 2));
  
  if (!result || result.length === 0 || !result[0].values || result[0].values.length === 0) {
    console.error('Failed to get reservation ID');
    return null;
  }
  
  const reservationId = result[0].values[0][0];
  console.log('New reservation ID:', reservationId);
  
  const reservation = getReservationById(businessId, reservationId);
  console.log('Retrieved reservation:', reservation);
  return reservation;
};

// Update reservation
const updateReservation = (businessId, reservationId, reservationData) => {
  const db = getDb();
  
  const {
    guestName,
    guestPhone,
    guestEmail,
    reservationDate,
    reservationTime,
    partySize,
    tableNumber,
    specialRequests,
    status
  } = reservationData;
  
  const query = `
    UPDATE reservations SET
      guest_name = ${escape(guestName)},
      guest_phone = ${escape(guestPhone)},
      guest_email = ${escape(guestEmail)},
      reservation_date = ${escape(reservationDate)},
      reservation_time = ${escape(reservationTime)},
      party_size = ${partySize},
      table_number = ${escape(tableNumber)},
      special_requests = ${escape(specialRequests)},
      status = ${escape(status)}
    WHERE id = ${reservationId} AND business_id = ${businessId}
  `;
  
  db.run(query);
  saveDatabase();
  
  return getReservationById(businessId, reservationId);
};

// Update reservation status
const updateReservationStatus = (businessId, reservationId, status) => {
  const db = getDb();
  
  console.log('updateReservationStatus called:', { businessId, reservationId, status });
  console.log('Escaped status:', escape(status));
  
  const query = `
    UPDATE reservations SET
      status = ${escape(status)}
    WHERE id = ${reservationId} AND business_id = ${businessId}
  `;
  
  console.log('Update status query:', query);
  
  db.run(query);
  saveDatabase();
  
  const reservation = getReservationById(businessId, reservationId);
  return { success: true, reservation };
};

// Delete reservation
const deleteReservation = (businessId, reservationId) => {
  const db = getDb();
  
  console.log('deleteReservation called:', { businessId, reservationId });
  
  // Check if reservation exists before delete
  const checkQuery = `SELECT COUNT(*) as count FROM reservations WHERE id = ${reservationId} AND business_id = ${businessId}`;
  const beforeCheck = db.exec(checkQuery);
  console.log('Reservation exists before delete:', beforeCheck);
  
  const query = `
    DELETE FROM reservations 
    WHERE id = ${reservationId} AND business_id = ${businessId}
  `;
  
  console.log('Delete query:', query);
  
  try {
    db.run(query);
    
    // Verify deletion
    const afterCheck = db.exec(checkQuery);
    console.log('Reservation exists after delete:', afterCheck);
    
    // Count total reservations
    const totalQuery = `SELECT COUNT(*) as count FROM reservations WHERE business_id = ${businessId}`;
    const totalResult = db.exec(totalQuery);
    console.log('Total reservations after delete:', totalResult);
    
    // Force save to disk
    saveDatabase();
    console.log('Database saved to disk');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return { success: false, message: error.message };
  }
};

// Get reservations for a specific date
const getReservationsByDate = (businessId, date) => {
  // Get fresh database reference
  const db = getDb();
  
  console.log('getReservationsByDate called with businessId:', businessId, 'date:', date);
  
  const query = `
    SELECT r.*, c.name as customer_name, c.phone as customer_phone
    FROM reservations r
    LEFT JOIN customers c ON r.customer_id = c.id
    WHERE r.business_id = ${businessId}
    AND DATE(r.reservation_date) = DATE(${escape(date)})
    ORDER BY r.reservation_time
  `;
  
  console.log('Executing query:', query);
  
  const result = db.exec(query);
  console.log('Query result raw:', JSON.stringify(result));
  
  if (result.length === 0) {
    console.log('No results found - empty array');
    return [];
  }
  
  const columns = result[0].columns;
  const values = result[0].values;
  
  console.log('Found', values.length, 'reservations');
  
  const reservations = values.map(row => {
    const reservation = {};
    columns.forEach((col, idx) => {
      reservation[col] = row[idx];
    });
    return reservation;
  });
  
  console.log('Returning reservations count:', reservations.length);
  return reservations;
};

// Get available time slots for a date
const getAvailableTimeSlots = (businessId, date, partySize) => {
  const db = getDb();
  
  // Get reservation settings
  const settings = getReservationSettings(businessId);
  
  if (!settings.enabled) {
    return [];
  }
  
  // Get all reservations for the date
  const reservations = getReservationsByDate(businessId, date);
  
  const timeSlots = [];
  
  for (let hour = settings.openingHour; hour < settings.closingHour; hour++) {
    for (let minutes = 0; minutes < 60; minutes += settings.intervalMinutes) {
      const time = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      // Count existing reservations at this time
      const reservedCount = reservations.filter(r => 
        r.reservation_time === time && r.status !== 'cancelled'
      ).length;
      
      timeSlots.push({
        time,
        available: reservedCount < settings.capacity,
        reservedCount,
        capacity: settings.capacity
      });
    }
  }
  
  return timeSlots;
};

module.exports = {
  isReservationEnabled,
  setReservationEnabled,
  getReservationSettings,
  updateReservationSettings,
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  updateReservationStatus,
  deleteReservation,
  getReservationsByDate,
  getAvailableTimeSlots
};
