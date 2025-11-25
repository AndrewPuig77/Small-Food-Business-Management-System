// Quick database viewer script
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function viewDatabase() {
  const SQL = await initSqlJs();
  const dbPath = path.join(
    process.env.APPDATA || process.env.HOME,
    'food-business-management-system',
    'foodbusiness.db'
  );

  if (!fs.existsSync(dbPath)) {
    console.log('Database not found at:', dbPath);
    return;
  }

  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  console.log('\n=== BUSINESSES ===');
  let result = db.exec('SELECT * FROM businesses');
  if (result.length > 0) {
    console.table(formatResult(result[0]));
  } else {
    console.log('No businesses found');
  }

  console.log('\n=== USERS ===');
  result = db.exec('SELECT id, business_id, username, full_name, email, role, active FROM users');
  if (result.length > 0) {
    console.table(formatResult(result[0]));
  } else {
    console.log('No users found');
  }

  console.log('\n=== SESSIONS ===');
  result = db.exec('SELECT id, user_id, expires_at FROM sessions');
  if (result.length > 0) {
    console.table(formatResult(result[0]));
  } else {
    console.log('No sessions found');
  }

  db.close();
}

function formatResult(result) {
  const rows = [];
  result.values.forEach(row => {
    const obj = {};
    result.columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    rows.push(obj);
  });
  return rows;
}

viewDatabase().catch(console.error);
