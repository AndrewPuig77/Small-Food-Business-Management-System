<div align="center">

# Food Business Manager

**An all-in-one desktop app for cafes, food trucks, and small restaurants.**

Run your POS, staff, inventory, and finances from one place, with role-based access and live analytics.

[![Electron](https://img.shields.io/badge/Electron-28-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-sql.js-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sql.js.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
![Version](https://img.shields.io/badge/version-0.1.0-blue?style=flat-square)
![Platforms](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square)
![Course](https://img.shields.io/badge/COP%204331-Fall%202025-orange?style=flat-square)

[Features](#features) •
[Quick Start](#quick-start) •
[Tech Stack](#tech-stack) •
[Roles](#roles--permissions) •
[Project Structure](#project-structure) •
[Team](#team)

</div>

---

## Overview

Food Business Manager is a cross-platform **Electron + Vue 3** desktop application built as a class project for **COP 4331: Software Engineering**. It gives small food-service operators the tools a larger restaurant would have, without the enterprise price tag or complexity.

> [!NOTE]
> Owners and managers get a full analytics dashboard. Operational staff (chefs, servers, cashiers, drivers) are routed to a focused **Employee Portal** with only the tools they need.

---

## Features

<table>
<tr>
<td width="50%" valign="top">

### Point of Sale
- Fast checkout with keyboard shortcuts
- Cash, card, and digital payments
- Split bills and custom discounts
- Receipt generation and transaction history

</td>
<td width="50%" valign="top">

### Dashboard & Analytics
- Live KPIs, sales trends (week / month / year)
- **Profit Pulse** business-health indicator
- Live order feed and top performers
- Goal tracking, alerts, and activity feed

</td>
</tr>
<tr>
<td valign="top">

### Employee Management
- Profiles, accounts, and granular permissions
- Time clock with regular and overtime hours
- Payroll and weekly schedule calendar
- Shift swaps, time-off requests, and tasks

</td>
<td valign="top">

### Employee Portal
- Clock in/out with elapsed-time tracking
- Personal daily and weekly schedule
- Task checklist and announcements
- Time history and hours summary

</td>
</tr>
<tr>
<td valign="top">

### Inventory Control
- Stock levels with minimum thresholds
- Low-stock and reorder alerts
- Quick adjustments and out-of-stock marking
- Supplier management

</td>
<td valign="top">

### Menu Management
- Items, categories, and descriptions
- Pricing and availability controls
- One-click out-of-stock toggles

</td>
</tr>
<tr>
<td valign="top">

### Customers & Loyalty
- Customer profiles and purchase history
- Loyalty points, rewards, and promotions
- Reservations

</td>
<td valign="top">

### Reports
- Sales, expenses, and profit and loss
- Employee performance and inventory reports
- Date-range filtering
- Export to **PDF** and **Excel**

</td>
</tr>
</table>

### Security
- bcrypt password hashing and signed session tokens (JWT), with a random signing secret generated per installation
- Role-based access, checked against the verified session rather than client-side state
- All database queries use bound parameters, never string-built SQL
- The UI runs with Node.js disabled and context isolation on, and reaches the backend only through a minimal preload bridge
- Owner-code verification for sensitive actions

---

## Quick Start

> [!IMPORTANT]
> Requires **Node.js 20.19+** (needed by Vite 7) and **npm**.

```bash
# 1. Clone
git clone https://github.com/AndrewPuig77/Small-Food-Business-Management-System.git
cd Small-Food-Business-Management-System

# 2. Install
npm install

# 3. Run
npm run dev
```

For detailed setup and troubleshooting, see **[INSTALLATION.md](INSTALLATION.md)**.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the app in development mode |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint the codebase |
| `npm test` | Run the test suite (Jest) |
| `npm run dist` | Build and package installers for the current OS |
| `npm run dist:win` / `dist:mac` / `dist:linux` | Package for a specific platform |

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Desktop shell** | Electron (context-isolated renderer + preload bridge) |
| **UI** | Vue 3 (Composition API), Vue Router, Vuex |
| **Styling** | Tailwind CSS |
| **Build** | Vite + `vite-plugin-electron` |
| **Database** | SQLite via sql.js |
| **Charts** | Chart.js |
| **Auth** | bcryptjs, JSON Web Tokens |
| **Exports** | jsPDF, SheetJS (xlsx) |
| **Packaging** | electron-builder (NSIS, portable, DMG, AppImage, deb) |

### Architecture

```mermaid
flowchart LR
    UI["Vue 3 Frontend<br/>views · components · router"]
    IPC["Electron IPC<br/>preload bridge"]
    SVC["Service Layer<br/>auth · pos · inventory · analytics …"]
    DB[("SQLite<br/>sql.js")]
    UI <--> IPC <--> SVC <--> DB
```

---

## Roles & Permissions

| Role | Lands on | Access |
| --- | --- | --- |
| **Owner / Manager** | Main dashboard | Full system access, employee and account management, financials, configuration, bypasses owner-code checks |
| **Chef** | Employee portal | Menu management, kitchen view, order tracking, inventory viewing |
| **Server / Cashier** | Employee portal | POS, order management, customer interaction, limited inventory view |
| **Driver** | Employee portal | Order tracking, delivery management, customer info |
| **Staff** | Employee portal | Time tracking, tasks, announcements, plus any assigned permissions |

<details>
<summary><b>How it works under the hood</b></summary>

<br/>

- **Role-based routing:** admins go to the analytics dashboard, operational staff go to the Employee Portal.
- **Granular permissions:** stored per employee as JSON, so access can be customized beyond the default role.
- **Owner code:** sensitive operations require owner verification.
- **Linked accounts:** user logins are tied to employee records, with active/inactive status and password resets that never reveal the current password.
- **Real-time sync:** dashboard widgets, clock status, schedules, and tasks auto-refresh every 5–30 seconds.

</details>

---

## Project Structure

<details>
<summary><b>Click to expand</b></summary>

```
src/
├── backend/
│   ├── database/
│   │   ├── database.js            # SQLite init, migrations, batched saves
│   │   └── sql.js                 # sql`` tag for parameterized queries
│   ├── database/
│   ├── services/                  # Business logic layer
│   │   ├── analyticsService.js
│   │   ├── announcementService.js
│   │   ├── authService.js
│   │   ├── dashboardService.js
│   │   ├── employeeService.js
│   │   ├── expenseService.js
│   │   ├── inventoryService.js
│   │   ├── menuService.js
│   │   ├── posService.js
│   │   ├── reservationService.js
│   │   ├── scheduleService.js
│   │   ├── shiftSwapService.js
│   │   ├── taskService.js
│   │   ├── timeLogService.js
│   │   └── timeOffService.js
│   └── ipc.js                     # IPC handlers
├── frontend/
│   ├── components/
│   │   ├── dashboard/             # Dashboard widgets (SalesChart, ProfitPulse, LiveOrderFeed, …)
│   │   ├── AlertModal.vue
│   │   ├── ConfirmModal.vue
│   │   ├── LoadingSpinner.vue
│   │   └── Sidebar.vue
│   ├── composables/               # useModals, useOwnerVerification
│   ├── router/
│   ├── views/                     # Dashboard, POS, Menu, Inventory, Employees, Reports, …
│   └── App.vue
└── main/
    ├── main.js                    # Electron main process
    └── preload.js                 # Exposes the IPC bridge to the UI

config/                            # Vite and build config
docs/                              # Requirements, design, and specifications
tests/                             # Test suite
database/                          # Local SQLite files (gitignored)
```

</details>

<details>
<summary><b>Database tables</b></summary>

<br/>

| Table | Purpose |
| --- | --- |
| `businesses` | Business information |
| `users` | Authentication |
| `employees` | Employee profiles |
| `schedules` | Work schedules |
| `time_logs` | Clock in/out records |
| `tasks` | Task assignments |
| `announcements` | Staff communications |
| `menu_items` | Menu catalog |
| `inventory` | Stock tracking |
| `transactions` | Sales records |
| `customers` | Customer database |
| `expenses` | Expense tracking |
| `time_off_requests` | Leave requests |
| `shift_swaps` | Schedule exchanges |

Full schema: [docs/design/database-schema.md](docs/design/database-schema.md)

</details>

---

## Recent Updates

- [x] Employee portal with clock in/out, schedule, tasks, and announcements
- [x] Modern dashboard with analytics widgets
- [x] Role-based routing and permissions
- [x] Owner verification system
- [x] Account management in the employee edit form
- [x] Database migrations for schema updates
- [x] Real-time data synchronization
- [x] POS keyboard shortcuts

---

## Team

<table>
<tr>
<td align="center"><b>Andrew Puig</b></td>
<td align="center"><b>Treasure Brown</b></td>
<td align="center"><b>Jorge Carmenate</b></td>
</tr>
<tr>
<td align="center"><b>Joseph Contreras</b></td>
<td align="center"><b>Steven Palacios</b></td>
<td align="center"><b>Andreani Pineda</b></td>
</tr>
</table>

---

## License

Released under the [MIT License](LICENSE). Built for educational purposes as part of **COP 4331 Software Engineering** (Fall 2025).

<div align="center">

**Questions or found a bug?** [Open an issue](https://github.com/AndrewPuig77/Small-Food-Business-Management-System/issues)


</div>
