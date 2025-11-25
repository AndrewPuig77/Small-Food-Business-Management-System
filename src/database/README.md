# Database Folder

This folder contains database-related files including migrations, seeders, and schemas.

## Structure

```
database/
├── migrations/         # Database migration files
│   └── YYYYMMDDHHMMSS-create-users.js
├── seeders/           # Seed data for testing
│   └── 20251113-demo-data.js
└── config/            # Database configuration
    └── config.json

```

## Migrations

Migrations are used to create and modify database schema. They allow version control of your database structure.

### Creating a Migration

```powershell
# Create a new migration
npx sequelize-cli migration:generate --name create-inventory-table
```

### Example Migration

```javascript
// migrations/20251113120000-create-inventory.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inventory', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      unit_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      minimum_quantity: {
        type: Sequelize.DECIMAL(10, 2)
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inventory');
  }
};
```

### Running Migrations

```powershell
# Run all pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

## Seeders

Seeders populate the database with initial or test data.

### Creating a Seeder

```powershell
# Create a new seeder
npx sequelize-cli seed:generate --name demo-users
```

### Example Seeder

```javascript
// seeders/20251113-demo-users.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        password_hash: '$2b$10$...', // bcrypt hash of 'password123'
        email: 'admin@example.com',
        role_id: 1,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'manager1',
        password_hash: '$2b$10$...',
        email: 'manager@example.com',
        role_id: 2,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
```

### Running Seeders

```powershell
# Run all seeders
npx sequelize-cli db:seed:all

# Run specific seeder
npx sequelize-cli db:seed --seed 20251113-demo-users.js

# Undo all seeders
npx sequelize-cli db:seed:undo:all
```

## Database Configuration

```json
// config/config.json
{
  "development": {
    "username": "postgres",
    "password": "your_password",
    "database": "foodbusiness_dev",
    "host": "127.0.0.1",
    "dialect": "postgres"
  },
  "test": {
    "username": "postgres",
    "password": "your_password",
    "database": "foodbusiness_test",
    "host": "127.0.0.1",
    "dialect": "postgres"
  },
  "production": {
    "username": "postgres",
    "password": "your_password",
    "database": "foodbusiness_prod",
    "host": "127.0.0.1",
    "dialect": "postgres"
  }
}
```

## Migration Order

Create migrations in this order to handle foreign key dependencies:

1. roles
2. permissions
3. role_permissions
4. users
5. employees
6. customers
7. inventory
8. menu_items
9. transactions
10. transaction_items
11. timesheets
12. schedules
13. loyalty_transactions
14. reservations
15. expenses
16. alerts
17. audit_log

## Team Responsibilities

- **Steven Palacios**: Database schema design and migrations
- **All team members**: Help create seeders for testing their features
