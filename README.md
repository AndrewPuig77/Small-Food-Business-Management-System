# Small Food Business Management System

**Class Project** - COP 4331 (Software Engineering)  
**Fall 2025**

A comprehensive desktop application for managing small food service establishments (cafes, food trucks, small restaurants) with role-based access control and real-time business analytics.

##  Team Members

- **Andrew Puig**
- **Treasure Brown**
- **Jorge Carmenate**
- **Joseph Contreras**
- **Steven Palacios**
- **Andreani Pineda**

##  Features

### 👥 Employee Management
- Complete employee profiles with contact information and roles
- User account creation with customizable permissions
- Role-based access control (Owner, Manager, Chef, Server, Cashier, Driver, Staff)
- Time clock system with clock in/out tracking
- Hours tracking with regular and overtime calculations
- Comprehensive payroll management
- Schedule management with weekly calendar view
- Shift swap requests and time-off management
- Task assignment and tracking
- Performance analytics

### 📊 Dashboard & Analytics
- Real-time business metrics and KPIs
- Sales trend charts with period selection (week/month/year)
- Profit pulse indicator with business health status
- Live order feed with status tracking
- Top-selling items and performers
- Financial summary widgets
- Activity feed and alerts panel
- Upcoming shifts and time-off notifications
- Low stock alerts and reorder notifications
- Goal tracking and progress monitoring

### 💼 Employee Portal
- Dedicated employee dashboard for non-admin users
- Clock in/out with elapsed time tracking
- Personal schedule view (daily and weekly)
- Task management with completion tracking
- Announcements and communications
- Time history and hours summary
- Real-time data synchronization

### 📦 Inventory Control
- Stock tracking with quantity management
- Low-stock alerts and minimum quantity thresholds
- Quick inventory adjustment tools
- Out-of-stock marking system
- Supplier management
- Reorder notifications

### 💰 Point of Sale (POS)
- Fast transaction processing
- Multiple payment types (cash, card, digital)
- Order management with status tracking
- Split bills and custom discounts
- Receipt generation
- Transaction history

### 🍽️ Menu Management
- Add, edit, and organize menu items
- Category management
- Pricing and availability controls
- Item descriptions and specifications
- Quick out-of-stock toggles

### 👥 Customer Management
- Customer profiles and contact information
- Loyalty points system
- Purchase history tracking
- Rewards and promotions

### 📈 Reports & Analytics
- Sales reports with date range filtering
- Expense tracking and categorization
- Profit and loss analysis
- Employee performance reports
- Inventory reports
- Custom report generation
- Export to PDF and Excel

### 🔒 Security & Access Control
- Multi-user authentication system
- Role-based permissions
- Owner code verification for sensitive operations
- Secure password hashing
- Session management

##  Tech Stack

**Frontend:** Electron + Vue 3 (Composition API) + Tailwind CSS  
**Backend:** Node.js + SQLite  
**IPC:** Electron IPC for frontend-backend communication  
**Charts:** Canvas-based custom charts  
**Security:** bcrypt for password hashing

##  Project Structure

```
src/
├── backend/
│   ├── database/
│   │   └── database.js          # SQLite database initialization and migrations
│   ├── services/                # Business logic layer
│   │   ├── analyticsService.js  # Business metrics and analytics
│   │   ├── announcementService.js # Employee announcements
│   │   ├── authService.js       # Authentication and authorization
│   │   ├── dashboardService.js  # Dashboard data aggregation
│   │   ├── employeeService.js   # Employee management
│   │   ├── expenseService.js    # Expense tracking
│   │   ├── inventoryService.js  # Inventory control
│   │   ├── menuService.js       # Menu management
│   │   ├── posService.js        # Point of sale operations
│   │   ├── reservationService.js # Reservations
│   │   ├── scheduleService.js   # Employee scheduling
│   │   ├── shiftSwapService.js  # Shift exchange requests
│   │   ├── taskService.js       # Task management
│   │   ├── timeLogService.js    # Time tracking
│   │   └── timeOffService.js    # Time-off requests
│   └── ipc.js                   # IPC handlers
├── frontend/
│   ├── components/
│   │   ├── dashboard/           # Dashboard widgets
│   │   │   ├── ActivityFeed.vue
│   │   │   ├── AlertsPanel.vue
│   │   │   ├── ClockInOutModal.vue
│   │   │   ├── FinancialSummaryWidget.vue
│   │   │   ├── GoalTracker.vue
│   │   │   ├── LiveOrderFeed.vue
│   │   │   ├── OutOfStockModal.vue
│   │   │   ├── ProfitPulse.vue
│   │   │   ├── QuickActions.vue
│   │   │   ├── QuickInventoryModal.vue
│   │   │   ├── SalesChart.vue
│   │   │   ├── SalesMetricCard.vue
│   │   │   ├── TopPerformers.vue
│   │   │   └── UpcomingItemsWidget.vue
│   │   ├── AlertModal.vue
│   │   ├── ConfirmModal.vue
│   │   ├── LoadingSpinner.vue
│   │   └── Sidebar.vue
│   ├── composables/
│   │   ├── useModals.js
│   │   └── useOwnerVerification.js
│   ├── router/
│   │   └── index.js
│   ├── views/
│   │   ├── CustomersView.vue
│   │   ├── DashboardView.vue
│   │   ├── EmployeeAccountView.vue  # Employee portal
│   │   ├── EmployeeDetailView.vue
│   │   ├── EmployeesView.vue
│   │   ├── ExpensesView.vue
│   │   ├── InventoryView.vue
│   │   ├── LoginView.vue
│   │   ├── MenuView.vue
│   │   ├── POSView.vue
│   │   ├── ProfileView.vue
│   │   ├── ReportsView.vue
│   │   ├── ReservationsView.vue
│   │   ├── ScheduleView.vue
│   │   └── SetupView.vue
│   └── App.vue
└── main/
    └── main.js                  # Electron main process

database/                        # SQLite database files (gitignored)
docs/                           # Documentation
scripts/                        # Development utility scripts (gitignored)
```

##  Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AndrewPuig77/Small-Food-Business-Management-System.git
cd Small-Food-Business-Management-System
```

2. Install dependencies:
```bash
npm install
```

3. Run the application:
```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

##  User Roles & Permissions

### Owner/Manager
- Full system access
- Employee management and account creation
- Financial reports and analytics
- System configuration
- Owner code verification bypass

### Chef
- Menu management
- Kitchen view
- Order tracking
- Inventory viewing

### Server/Cashier
- POS operations
- Order management
- Customer interaction
- Limited inventory viewing

### Driver
- Order tracking
- Delivery management
- Customer information

### Staff
- Basic operations based on assigned permissions
- Time tracking
- Task management
- Announcements viewing

##  Key Features Explained

### Role-Based Dashboard Routing
- Admins (Owner/Manager/Admin) → Main dashboard with full analytics
- Operational staff (Chef/Server/Cashier/Driver) → Employee portal with personal tools

### Real-Time Data Sync
- Dashboard widgets refresh every 5-30 seconds
- Live clock status updates
- Automatic schedule and task synchronization

### Permission System
- Granular permission controls per employee
- JSON-based permission storage
- Owner code protection for sensitive operations

### Employee Account Management
- Linked user accounts to employee records
- Password updates without revealing current password
- Account status tracking (active/inactive)

##  Database Schema

The system uses SQLite with the following main tables:
- `businesses` - Business information
- `users` - User authentication
- `employees` - Employee profiles
- `schedules` - Work schedules
- `time_logs` - Clock in/out records
- `tasks` - Task assignments
- `announcements` - Employee communications
- `menu_items` - Menu catalog
- `inventory` - Stock tracking
- `transactions` - Sales records
- `customers` - Customer database
- `expenses` - Expense tracking
- `time_off_requests` - Leave requests
- `shift_swaps` - Schedule exchanges

##  Development

### Project Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linter
```

### Recent Updates

- ✅ Employee portal with clock in/out, schedule, tasks, and announcements
- ✅ Modern dashboard with analytics widgets
- ✅ Role-based routing and permissions
- ✅ Owner verification system
- ✅ Comprehensive account management in employee edit form
- ✅ Database migrations for schema updates
- ✅ Real-time data synchronization

##  License

This project is for educational purposes as part of COP 4331 Software Engineering course.

##  Contact

For questions or issues, please contact the team members or create an issue in the repository.

