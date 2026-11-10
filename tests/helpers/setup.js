// Shared helpers for backend integration tests.
const path = require('path');

const backend = (p) => require(path.join(__dirname, '../../src/backend', p));

// Initialize a fresh database and create a business with an owner account.
// Returns the services most tests need plus the owner's login.
async function setupBusiness() {
  const database = backend('database/database');
  await database.init();

  const Auth = backend('services/authService');
  const setup = Auth.completeSetup({
    business: { name: "Joe's Pizza", type: 'restaurant', address: '1 Main St', phone: '555', taxRate: 7 },
    owner: { username: 'owner', password: 'pw123456', fullName: 'Pat Lee', email: 'pat@joes.com', pin: '1234' }
  });
  if (!setup.success) throw new Error('setup failed: ' + setup.error);
  const login = Auth.login('owner', 'pw123456', false);
  if (!login.success) throw new Error('login failed: ' + login.error);

  return { database, businessId: 1, ownerId: login.user.userId, token: login.token };
}

// Quiet the services' console logging during tests (errors still show).
function silenceLogs() {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
}

module.exports = { backend, setupBusiness, silenceLogs };
