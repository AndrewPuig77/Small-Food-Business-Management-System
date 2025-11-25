# Backend Source Code

This folder contains all Node.js backend code for the application.

## Structure

```
backend/
├── controllers/        # Route handlers
│   ├── authController.js
│   ├── inventoryController.js
│   ├── posController.js
│   ├── employeeController.js
│   ├── menuController.js
│   └── reportController.js
├── models/            # Sequelize database models
│   ├── User.js
│   ├── Role.js
│   ├── Inventory.js
│   ├── MenuItem.js
│   ├── Transaction.js
│   ├── Employee.js
│   └── Customer.js
├── services/          # Business logic
│   ├── authService.js
│   ├── inventoryService.js
│   ├── transactionService.js
│   └── reportService.js
├── middleware/        # Express middleware
│   ├── auth.js       # JWT authentication
│   ├── roleCheck.js  # Role-based access control
│   └── errorHandler.js
├── routes/            # API routes
│   ├── auth.js
│   ├── inventory.js
│   ├── pos.js
│   ├── employee.js
│   └── reports.js
├── utils/             # Helper functions
│   ├── validation.js
│   ├── calculations.js
│   └── logger.js
└── config/            # Configuration
    └── database.js

```

## API Structure

### Example Controller
```javascript
// inventoryController.js
const inventoryService = require('../services/inventoryService');

exports.getInventory = async (req, res, next) => {
  try {
    const items = await inventoryService.getAllItems();
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

exports.updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const updated = await inventoryService.updateStock(id, quantity);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
```

### Example Service
```javascript
// inventoryService.js
const { Inventory } = require('../models');

exports.getAllItems = async () => {
  return await Inventory.findAll({ where: { active: true } });
};

exports.updateStock = async (itemId, quantity) => {
  const item = await Inventory.findByPk(itemId);
  if (!item) throw new Error('Item not found');
  
  item.quantity = quantity;
  await item.save();
  
  return item;
};
```

## Database Models (Sequelize)

### Example Model
```javascript
// models/Inventory.js
module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define('Inventory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    unit_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 }
    },
    minimum_quantity: {
      type: DataTypes.DECIMAL(10, 2)
    }
  }, {
    tableName: 'inventory',
    timestamps: true,
    underscored: true
  });

  return Inventory;
};
```

## Authentication Flow

1. User submits credentials
2. Controller validates input
3. Service verifies credentials with database
4. Generate JWT token
5. Return token to client
6. Client includes token in subsequent requests
7. Middleware validates token and extracts user info

## Team Responsibilities

- **Joseph Contreras**: Architecture and services
- **Steven Palacios**: Database models and migrations
- **Jorge Carmenate**: Controllers and routes
