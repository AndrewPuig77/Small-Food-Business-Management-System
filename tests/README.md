# Tests

This folder contains all test files for the application.

## Structure

```
tests/
├── unit/              # Unit tests for individual functions
│   ├── services/
│   ├── utils/
│   └── models/
├── integration/       # Integration tests for API endpoints
│   ├── auth.test.js
│   ├── inventory.test.js
│   └── pos.test.js
└── fixtures/          # Test data

```

## Running Tests

```powershell
# Run all tests
npm test

# Run specific test file
npm test -- inventory.test.js

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

We'll use **Jest** as our testing framework.

### Example Unit Test

```javascript
// tests/unit/services/inventoryService.test.js
const inventoryService = require('../../../src/backend/services/inventoryService');

describe('InventoryService', () => {
  describe('calculateTotalValue', () => {
    it('should calculate correct total value', () => {
      const items = [
        { quantity: 10, unit_cost: 5.00 },
        { quantity: 20, unit_cost: 3.50 }
      ];
      
      const total = inventoryService.calculateTotalValue(items);
      
      expect(total).toBe(120.00); // (10 * 5) + (20 * 3.5)
    });

    it('should return 0 for empty array', () => {
      const total = inventoryService.calculateTotalValue([]);
      expect(total).toBe(0);
    });
  });
});
```

### Example Integration Test

```javascript
// tests/integration/inventory.test.js
const request = require('supertest');
const app = require('../../src/backend/app');

describe('Inventory API', () => {
  let authToken;

  beforeAll(async () => {
    // Login and get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'testpass' });
    
    authToken = response.body.token;
  });

  describe('GET /api/inventory', () => {
    it('should return all inventory items', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/inventory', () => {
    it('should create new inventory item', async () => {
      const newItem = {
        name: 'Test Item',
        quantity: 100,
        unit_cost: 5.99,
        minimum_quantity: 20
      };

      const response = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newItem)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Item');
    });

    it('should reject invalid data', async () => {
      const invalidItem = {
        name: '', // Empty name
        quantity: -5 // Negative quantity
      };

      await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidItem)
        .expect(400);
    });
  });
});
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Cover all API endpoints
- **Critical Paths**: 100% coverage for payment processing, inventory updates, authentication

## Team Responsibilities

- **Andreani Pineda**: Lead testing efforts, set up test framework
- **All team members**: Write tests for features they develop
