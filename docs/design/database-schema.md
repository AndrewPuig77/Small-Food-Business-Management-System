# Database Schema

## Overview

The database uses **PostgreSQL** with the following core tables organized in an MVC architecture.

## Core Tables

### Authentication & Users

#### `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique user ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Login username |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| email | VARCHAR(100) | UNIQUE | User email |
| role_id | INTEGER | FOREIGN KEY → roles(id) | User role |
| active | BOOLEAN | DEFAULT true | Account status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### `roles`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Role ID |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Role name (Owner, Manager, Staff, Customer, IT) |
| description | TEXT | | Role description |

#### `permissions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Permission ID |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Permission name |
| description | TEXT | | Permission description |

#### `role_permissions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| role_id | INTEGER | FOREIGN KEY → roles(id) | Role ID |
| permission_id | INTEGER | FOREIGN KEY → permissions(id) | Permission ID |
| PRIMARY KEY (role_id, permission_id) | | | Composite key |

---

### Inventory Management

#### `inventory`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Item ID |
| name | VARCHAR(100) | NOT NULL | Item name |
| category | VARCHAR(50) | | Item category |
| quantity | DECIMAL(10,2) | NOT NULL, CHECK (quantity >= 0) | Current stock |
| unit | VARCHAR(20) | | Unit of measure (lbs, oz, units) |
| unit_cost | DECIMAL(10,2) | NOT NULL, CHECK (unit_cost >= 0) | Cost per unit |
| minimum_quantity | DECIMAL(10,2) | | Reorder threshold |
| supplier | VARCHAR(100) | | Supplier name |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

---

### Menu Management

#### `menu_items`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Menu item ID |
| name | VARCHAR(100) | NOT NULL | Item name |
| description | TEXT | | Item description |
| price | DECIMAL(10,2) | NOT NULL, CHECK (price > 0) | Selling price |
| category | VARCHAR(50) | | Menu category |
| image_url | VARCHAR(255) | | Image path |
| preparation_notes | TEXT | | Kitchen preparation instructions |
| available | BOOLEAN | DEFAULT true | Availability status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

---

### Point of Sale

#### `transactions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Transaction ID |
| cashier_id | INTEGER | FOREIGN KEY → employees(id) | Cashier who processed |
| customer_id | INTEGER | FOREIGN KEY → customers(id), NULL | Customer (if loyalty member) |
| subtotal | DECIMAL(10,2) | NOT NULL | Subtotal before tax |
| tax | DECIMAL(10,2) | NOT NULL | Tax amount |
| discount | DECIMAL(10,2) | DEFAULT 0 | Discount applied |
| total | DECIMAL(10,2) | NOT NULL | Final total |
| payment_method | VARCHAR(50) | NOT NULL | Payment type |
| transaction_date | TIMESTAMP | DEFAULT NOW() | Transaction timestamp |
| status | VARCHAR(20) | DEFAULT 'completed' | Transaction status |

#### `transaction_items`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Line item ID |
| transaction_id | INTEGER | FOREIGN KEY → transactions(id) | Transaction ID |
| menu_item_id | INTEGER | FOREIGN KEY → menu_items(id) | Menu item |
| quantity | INTEGER | NOT NULL, CHECK (quantity > 0) | Quantity ordered |
| price | DECIMAL(10,2) | NOT NULL | Price at time of sale |

---

### Employee Management

#### `employees`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Employee ID |
| user_id | INTEGER | FOREIGN KEY → users(id) | Linked user account |
| first_name | VARCHAR(50) | NOT NULL | First name |
| last_name | VARCHAR(50) | NOT NULL | Last name |
| phone | VARCHAR(15) | | Phone number |
| hourly_rate | DECIMAL(10,2) | NOT NULL, CHECK (hourly_rate >= 0) | Pay rate |
| hire_date | DATE | NOT NULL | Hire date |
| position | VARCHAR(50) | | Job position |
| active | BOOLEAN | DEFAULT true | Employment status |

#### `timesheets`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Timesheet entry ID |
| employee_id | INTEGER | FOREIGN KEY → employees(id) | Employee ID |
| clock_in | TIMESTAMP | NOT NULL | Clock in time |
| clock_out | TIMESTAMP | | Clock out time |
| date | DATE | NOT NULL | Work date |
| approved | BOOLEAN | DEFAULT false | Manager approval |

#### `schedules`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Schedule ID |
| employee_id | INTEGER | FOREIGN KEY → employees(id) | Employee ID |
| date | DATE | NOT NULL | Scheduled date |
| start_time | TIME | NOT NULL | Shift start |
| end_time | TIME | NOT NULL | Shift end |
| position | VARCHAR(50) | | Position for shift |

---

### Customer Loyalty

#### `customers`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Customer ID |
| user_id | INTEGER | FOREIGN KEY → users(id), NULL | Linked user account (optional) |
| first_name | VARCHAR(50) | | First name |
| last_name | VARCHAR(50) | | Last name |
| phone | VARCHAR(15) | UNIQUE, NOT NULL | Phone number |
| email | VARCHAR(100) | UNIQUE | Email |
| loyalty_points | INTEGER | DEFAULT 0, CHECK (loyalty_points >= 0) | Current points |
| member_since | DATE | DEFAULT CURRENT_DATE | Membership date |

#### `loyalty_transactions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Loyalty transaction ID |
| customer_id | INTEGER | FOREIGN KEY → customers(id) | Customer ID |
| transaction_id | INTEGER | FOREIGN KEY → transactions(id), NULL | Related sale transaction |
| points_change | INTEGER | NOT NULL | Points earned/redeemed |
| balance_after | INTEGER | NOT NULL | Points balance after |
| description | VARCHAR(255) | | Transaction description |
| created_at | TIMESTAMP | DEFAULT NOW() | Transaction timestamp |

---

### Reservations (Optional)

#### `reservations`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Reservation ID |
| customer_id | INTEGER | FOREIGN KEY → customers(id), NULL | Customer (if registered) |
| guest_name | VARCHAR(100) | NOT NULL | Guest name |
| guest_phone | VARCHAR(15) | NOT NULL | Contact phone |
| party_size | INTEGER | NOT NULL, CHECK (party_size > 0) | Number of guests |
| reservation_date | DATE | NOT NULL | Reservation date |
| reservation_time | TIME | NOT NULL | Reservation time |
| status | VARCHAR(20) | DEFAULT 'pending' | Reservation status |
| notes | TEXT | | Special requests |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

---

### Reporting & System

#### `expenses`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Expense ID |
| category | VARCHAR(50) | NOT NULL | Expense category |
| amount | DECIMAL(10,2) | NOT NULL, CHECK (amount >= 0) | Expense amount |
| description | VARCHAR(255) | | Expense description |
| vendor | VARCHAR(100) | | Vendor name |
| expense_date | DATE | NOT NULL | Date of expense |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

#### `alerts`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Alert ID |
| type | VARCHAR(50) | NOT NULL | Alert type (low_stock, etc.) |
| item_id | INTEGER | | Related item ID |
| message | TEXT | NOT NULL | Alert message |
| acknowledged | BOOLEAN | DEFAULT false | Acknowledgment status |
| created_at | TIMESTAMP | DEFAULT NOW() | Alert timestamp |

#### `audit_log`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Log entry ID |
| user_id | INTEGER | FOREIGN KEY → users(id) | User who performed action |
| action | VARCHAR(100) | NOT NULL | Action performed |
| table_name | VARCHAR(50) | | Affected table |
| record_id | INTEGER | | Affected record ID |
| old_value | TEXT | | Old value (JSON) |
| new_value | TEXT | | New value (JSON) |
| ip_address | VARCHAR(45) | | User IP address |
| created_at | TIMESTAMP | DEFAULT NOW() | Action timestamp |



## Relationships Diagram

```
users ──┬── employees ── timesheets
        │            └── schedules
        │
        ├── customers ── loyalty_transactions
        │           └── reservations
        │
        └── audit_log

transactions ── transaction_items ── menu_items
         │
         └── customers

inventory ── alerts

roles ── role_permissions ── permissions
```

---

**Last Updated:** November 13, 2025
