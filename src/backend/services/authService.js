const { getDb, saveDatabase } = require('../database/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-in-production'; // TODO: Move to environment variable

class AuthService {
  // Complete initial setup
  static completeSetup(setupData) {
    try {
      const db = getDb();
      
      // Hash password
      const passwordHash = bcrypt.hashSync(setupData.owner.password, 10);

      // Insert business using exec (sql.js doesn't support parameterized run)
      db.exec(`
        INSERT INTO businesses (name, type, address, phone)
        VALUES ('${setupData.business.name.replace(/'/g, "''")}', 
                '${setupData.business.type}', 
                ${setupData.business.address ? `'${setupData.business.address.replace(/'/g, "''")}'` : 'NULL'}, 
                ${setupData.business.phone ? `'${setupData.business.phone.replace(/'/g, "''")}'` : 'NULL'})
      `);

      // Get business ID
      const businessResult = db.exec('SELECT last_insert_rowid() as id');
      const businessId = businessResult[0].values[0][0];

      // Insert owner user
      db.exec(`
        INSERT INTO users (business_id, username, password_hash, full_name, email, role, pin)
        VALUES (${businessId}, 
                '${setupData.owner.username.replace(/'/g, "''")}', 
                '${passwordHash}', 
                '${setupData.owner.fullName.replace(/'/g, "''")}', 
                '${setupData.owner.email.replace(/'/g, "''")}', 
                'owner',
                '${setupData.owner.pin.replace(/'/g, "''")}')
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
  static login(username, password) {
    try {
      const db = getDb();
      
      // Find user by username (escape single quotes)
      const escapedUsername = username.replace(/'/g, "''");
      const result = db.exec(`
        SELECT u.*, b.name as business_name
        FROM users u
        JOIN businesses b ON u.business_id = b.id
        WHERE u.username = '${escapedUsername}' AND u.active = 1
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
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Store session
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
      db.exec(`
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (${user.id}, '${token}', '${expiresAt.toISOString()}')
      `);

      saveDatabase();

      // Return user data (without password hash)
      return {
        success: true,
        token,
        user: {
          id: user.id,
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
      const decoded = jwt.verify(token, JWT_SECRET);
      const db = getDb();
      
      // Check if session exists and is not expired (escape token)
      const escapedToken = token.replace(/'/g, "''");
      const result = db.exec(`
        SELECT * FROM sessions
        WHERE token = '${escapedToken}' AND expires_at > datetime('now')
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
      const escapedToken = token.replace(/'/g, "''");
      db.exec(`DELETE FROM sessions WHERE token = '${escapedToken}'`);
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
      const result = db.exec(`
        SELECT id FROM users 
        WHERE id = ${userId} 
          AND business_id = ${businessId} 
          AND pin = '${currentPin.replace(/'/g, "''")}'
      `);

      if (!result.length || !result[0].values.length) {
        return {
          success: false,
          error: 'Current PIN is incorrect'
        };
      }

      // Update PIN
      db.exec(`
        UPDATE users 
        SET pin = '${newPin.replace(/'/g, "''")}' 
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
      const result = db.exec(`
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
      db.exec(`
        UPDATE users 
        SET pin = '${newPin.replace(/'/g, "''")}' 
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
      const escapedUsername = username.replace(/'/g, "''");
      const escapedEmail = email.replace(/'/g, "''");
      
      const result = db.exec(`
        SELECT id, business_id, full_name 
        FROM users 
        WHERE username = '${escapedUsername}' 
          AND email = '${escapedEmail}'
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
      db.exec(`
        UPDATE users 
        SET password_hash = '${newPasswordHash}' 
        WHERE id = ${userId} AND business_id = ${businessId}
      `);
      
      // Invalidate all existing sessions for this user
      db.exec(`
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
