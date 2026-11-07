const { getDb, saveDatabase, getDbPath } = require('../database/database');
const { sql } = require('../database/sql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Signing secret for session tokens. Each installation gets its own random
// secret, created on first use and stored next to the database. Setting the
// JWT_SECRET environment variable overrides it.
let jwtSecret = null;
const getJwtSecret = () => {
  if (jwtSecret) return jwtSecret;
  if (process.env.JWT_SECRET) {
    jwtSecret = process.env.JWT_SECRET;
    return jwtSecret;
  }
  const secretPath = path.join(path.dirname(getDbPath()), 'jwt-secret');
  try {
    jwtSecret = fs.readFileSync(secretPath, 'utf8').trim();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (!jwtSecret) {
    jwtSecret = crypto.randomBytes(64).toString('hex');
    fs.writeFileSync(secretPath, jwtSecret, { mode: 0o600 });
  }
  return jwtSecret;
};

class AuthService {
  // Complete initial setup
  static completeSetup(setupData) {
    try {
      const db = getDb();
      
      // Hash password
      const passwordHash = bcrypt.hashSync(setupData.owner.password, 10);

      // Insert business using exec (sql.js doesn't support parameterized run)
      db.exec(sql`
        INSERT INTO businesses (name, type, address, phone, tax_rate, owner_code)
        VALUES (${setupData.business.name}, 
                ${setupData.business.type}, 
                ${setupData.business.address ? setupData.business.address : null}, 
                ${setupData.business.phone ? setupData.business.phone : null},
                ${setupData.business.taxRate || 7.5},
                ${setupData.owner.pin})
      `);

      // Get business ID
      const businessResult = db.exec('SELECT last_insert_rowid() as id');
      const businessId = businessResult[0].values[0][0];

      // Insert owner user
      db.exec(sql`
        INSERT INTO users (business_id, username, password_hash, full_name, email, role, pin)
        VALUES (${businessId}, 
                ${setupData.owner.username}, 
                ${passwordHash}, 
                ${setupData.owner.fullName}, 
                ${setupData.owner.email}, 
                'owner',
                ${setupData.owner.pin})
      `);

      const userResult = db.exec('SELECT last_insert_rowid() as id');
      const userId = userResult[0].values[0][0];

      saveDatabase();

      return {
        success: true,
        businessId,
        userId
      };
    } catch (error) {
      console.error('Setup error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Login user
  static login(username, password, remember = false) {
    try {
      const db = getDb();
      
      // Find user by username
      const result = db.exec(sql`
        SELECT u.*, b.name as business_name
        FROM users u
        JOIN businesses b ON u.business_id = b.id
        WHERE u.username = ${username} AND u.active = 1
      `);

      if (!result.length || !result[0].values.length) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      // Parse result
      const columns = result[0].columns;
      const values = result[0].values[0];
      const user = {};
      columns.forEach((col, idx) => {
        user[col] = values[idx];
      });

      // Verify password
      const isValidPassword = bcrypt.compareSync(password, user.password_hash);

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
          businessId: user.business_id
        },
        getJwtSecret(),
        { expiresIn: remember ? '30d' : '8h' }
      );

      // Store session - use SQLite datetime so comparisons with datetime('now') work reliably
      const expiresClause = remember ? sql`datetime('now', '+30 days')` : sql`datetime('now', '+8 hours')`;
      db.exec(sql`
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (${user.id}, ${token}, ${expiresClause})
      `);

      saveDatabase();

      // Return user data (without password hash)
      return {
        success: true,
        token,
        user: {
          id: user.id,
          userId: user.id,
          username: user.username,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          businessId: user.business_id,
          businessName: user.business_name
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An error occurred during login'
      };
    }
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      const db = getDb();
      
      // Check if session exists and is not expired
      const result = db.exec(sql`
        SELECT * FROM sessions
        WHERE token = ${token} AND expires_at > datetime('now')
      `);

      if (!result.length || !result[0].values.length) {
        return { valid: false, error: 'Session expired or invalid' };
      }

      return { valid: true, user: decoded };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  // Logout user
  static logout(token) {
    try {
      const db = getDb();
      db.exec(sql`DELETE FROM sessions WHERE token = ${token}`);
      saveDatabase();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  // Clean up expired sessions
  static cleanupExpiredSessions() {
    try {
      const db = getDb();
      db.exec(`DELETE FROM sessions WHERE expires_at < datetime('now')`);
      saveDatabase();
      console.log('Cleaned up expired sessions');
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }

  // Change PIN (requires current PIN)
  static changePin(businessId, userId, currentPin, newPin) {
    try {
      const db = getDb();
      
      // Verify current PIN
      const result = db.exec(sql`
        SELECT id FROM users 
        WHERE id = ${userId} 
          AND business_id = ${businessId} 
          AND pin = ${currentPin}
      `);

      if (!result.length || !result[0].values.length) {
        return {
          success: false,
          error: 'Current PIN is incorrect'
        };
      }

      // Update PIN
      db.exec(sql`
        UPDATE users 
        SET pin = ${newPin} 
        WHERE id = ${userId} AND business_id = ${businessId}
      `);
      
      saveDatabase();

      return { success: true };
    } catch (error) {
      console.error('Change PIN error:', error);
      return {
        success: false,
        error: 'An error occurred while changing PIN'
      };
    }
  }

  // Reset PIN (requires password verification)
  static resetPin(businessId, userId, password, newPin) {
    try {
      const db = getDb();
      
      // Get user and verify password
      const result = db.exec(sql`
        SELECT password_hash FROM users 
        WHERE id = ${userId} AND business_id = ${businessId}
      `);

      if (!result.length || !result[0].values.length) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const passwordHash = result[0].values[0][0];
      const isValidPassword = bcrypt.compareSync(password, passwordHash);

      if (!isValidPassword) {
        return {
          success: false,
          error: 'Password is incorrect'
        };
      }

      // Update PIN
      db.exec(sql`
        UPDATE users 
        SET pin = ${newPin} 
        WHERE id = ${userId} AND business_id = ${businessId}
      `);
      
      saveDatabase();

      return { success: true };
    } catch (error) {
      console.error('Reset PIN error:', error);
      return {
        success: false,
        error: 'An error occurred while resetting PIN'
      };
    }
  }

  // Verify identity for password reset (using username and email)
  static verifyIdentity(username, email) {
    try {
      const db = getDb();
      
      // Find user by username and email
      const result = db.exec(sql`
        SELECT id, business_id, full_name 
        FROM users 
        WHERE username = ${username} 
          AND email = ${email}
          AND active = 1
      `);

      if (!result.length || !result[0].values.length) {
        return {
          success: false,
          error: 'Username and email do not match any account'
        };
      }

      const userId = result[0].values[0][0];
      const businessId = result[0].values[0][1];

      return {
        success: true,
        userId,
        businessId
      };
    } catch (error) {
      console.error('Verify identity error:', error);
      return {
        success: false,
        error: 'An error occurred during verification'
      };
    }
  }

  // Reset password (after identity verification)
  static resetPassword(userId, businessId, newPassword) {
    try {
      const db = getDb();
      
      // Hash new password
      const newPasswordHash = bcrypt.hashSync(newPassword, 10);
      
      // Update password
      db.exec(sql`
        UPDATE users 
        SET password_hash = ${newPasswordHash} 
        WHERE id = ${userId} AND business_id = ${businessId}
      `);
      
      // Invalidate all existing sessions for this user
      db.exec(sql`
        DELETE FROM sessions WHERE user_id = ${userId}
      `);
      
      saveDatabase();

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: 'An error occurred while resetting password'
      };
    }
  }
}

module.exports = AuthService;
