// Regression suite for the services that existed before the new POS features.
// Exercises each service against a real (temporary) SQLite database.
const { backend, setupBusiness, silenceLogs } = require('../helpers/setup');

let ctx;
const today = new Date().toISOString().slice(0, 10);
const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);

beforeAll(async () => {
  silenceLogs();
  ctx = await setupBusiness();
});

afterAll(() => ctx.database.flushDatabase());

describe('auth', () => {
  const Auth = () => backend('services/authService');

  test('valid login returns a token that verifies', () => {
    expect(Auth().verifyToken(ctx.token).valid).toBe(true);
  });

  test('wrong password and SQL-injection username are rejected', () => {
    expect(Auth().login('owner', 'wrong', false).success).toBe(false);
    expect(Auth().login("owner' --", 'x', false).success).toBe(false);
    expect(Auth().login("' OR '1'='1", "' OR '1'='1", false).success).toBe(false);
  });

  test('logout invalidates the session', () => {
    const login = Auth().login('owner', 'pw123456', false);
    expect(Auth().verifyToken(login.token).valid).toBe(true);
    Auth().logout(login.token);
    expect(Auth().verifyToken(login.token).valid).toBe(false);
  });
});

describe('menu, inventory, employees', () => {
  test('menu items and categories with apostrophes', () => {
    const Menu = backend('services/menuService');
    expect(Menu.createCategory(1, { name: "Chef's Picks", displayOrder: 1 }).success).toBe(true);
    const item = Menu.createItem(1, { name: "Grandma's Pie", description: 'tasty', categoryId: 1, price: 5.5, cost: 2, available: 1 });
    expect(item.success).toBe(true);
    const items = Menu.getAllItems(1).items;
    expect(items.map((i) => i.name)).toContain("Grandma's Pie");
  });

  test('inventory create, adjust and low stock', () => {
    const Inv = backend('services/inventoryService');
    Inv.createCategory(1, { name: 'Dry' });
    Inv.createSupplier(1, { name: "Bob's Supply" });
    const item = Inv.createItem(1, { name: 'Flour', categoryId: 1, supplierId: 1, quantity: 10, unit: 'kg', minQuantity: 2, unitCost: 1.5 });
    Inv.adjustStock(1, item.id, -9, ctx.ownerId, "used it", 'usage');
    const low = Inv.getLowStockItems(1);
    expect(low.map((i) => i.name)).toContain('Flour');
  });

  test('employee with account and permissions', async () => {
    const Emp = backend('services/employeeService');
    await Emp.createEmployee(1, {
      firstName: "D'Arcy", lastName: 'Smith', email: 'd@x.com', phone: '1', role: 'server', hourlyRate: 15,
      hireDate: today, status: 'active', permissions: { pos: true }, createAccount: true, username: 'darcy', password: 'pw123456'
    });
    const all = Emp.getAllEmployees(1);
    expect(all.find((e) => e.first_name === "D'Arcy")).toBeTruthy();
    expect(backend('services/authService').login('darcy', 'pw123456').success).toBe(true);
  });
});

describe('pos', () => {
  const POS = () => backend('services/posService');

  test('transaction with customer, kitchen flow and void', () => {
    POS().createCustomer(1, { name: "Amy O'Dell", email: 'a@x', phone: '9', loyaltyPoints: 0 });
    expect(POS().searchCustomers(1, "O'D").length).toBe(1);

    const tx = POS().createTransaction(1, {
      cashierId: ctx.ownerId, customerId: 1, subtotal: 11, tax: 0.77, discount: 0, tipAmount: 1, total: 12.77,
      items: [{ menuItemId: 1, quantity: 2, unitPrice: 5.5, totalPrice: 11 }],
      payments: [{ methodType: 'cash', amount: 12.77 }]
    });
    expect(tx.total).toBeCloseTo(12.77);
    expect(POS().getTransactionById(1, tx.id).items).toHaveLength(1);

    expect(POS().updateOrderKitchenStatus(1, tx.id, 'preparing').success).toBe(true);
    expect(POS().updateOrderKitchenStatus(1, tx.id, 'ready').success).toBe(true);

    const voided = POS().voidTransaction(1, tx.id, "customer's request", ctx.ownerId);
    expect(voided.status).toBe('voided');
  });
});

describe('other services run without errors', () => {
  test('time logs, schedules, reservations, tasks, announcements, analytics, dashboard', async () => {
    const TL = backend('services/timeLogService');
    TL.clockIn(1, 'start');
    TL.clockOut(1, "done, it's late");
    expect(TL.getTimeLogs(1, weekAgo, today).length).toBeGreaterThan(0);

    backend('services/scheduleService').createShift(1, { employeeId: 1, shiftDate: today, startTime: '09:00', endTime: '17:00', role: 'server' });
    expect(backend('services/scheduleService').getShifts(1, weekAgo, today)).toHaveLength(1);

    const Res = backend('services/reservationService');
    Res.updateReservationSettings(1, { enabled: true, capacity: 20, intervalMinutes: 30, openingHour: 10, closingHour: 22 });
    Res.createReservation(1, { guestName: "Liam O'Brien", reservationDate: today, reservationTime: '18:00', partySize: 2, status: 'pending' });
    expect(Res.getAllReservations(1, weekAgo, today)).toHaveLength(1);

    const Task = backend('services/taskService');
    Task.createTask({ businessId: 1, title: "Clean's", assignedTo: 1, assignedBy: ctx.ownerId, taskType: 'daily', priority: 'high', dueDate: today });
    Task.updateTask(1, { title: 'Clean2', assignedTo: null, status: 'in_progress' });
    expect(Task.getAllTasks(1, { status: 'in_progress' })).toHaveLength(1);

    const Ann = backend('services/announcementService');
    Ann.createAnnouncement({ businessId: 1, title: "Today's news", message: 'hi', priority: 'high', targetRoles: 'server', createdBy: ctx.ownerId });
    expect(Ann.getAllAnnouncements(1, { isActive: true, targetRole: 'server' })).toHaveLength(1);

    const An = backend('services/analyticsService');
    expect(() => An.getSalesAnalytics(1, weekAgo, today, 'day')).not.toThrow();
    expect(() => An.getFinancialSummary(1, weekAgo, today)).not.toThrow();

    const dash = await backend('services/dashboardService').getCompleteDashboard(1, 'owner');
    expect(dash.salesTrend).toBeDefined();
  });
});
