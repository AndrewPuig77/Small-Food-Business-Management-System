// Feature 7: backend permission checks and the audit log.
const { backend, setupBusiness, silenceLogs } = require('../helpers/setup');
const { createAccessControl, levelFor } = require('../../src/backend/security/accessControl');

const owner = { userId: 1, role: 'owner', businessId: 1, username: 'owner' };
const manager = { userId: 2, role: 'manager', businessId: 1, username: 'mgr' };
const server = { userId: 3, role: 'server', businessId: 1, username: 'sam' };

describe('channel levels', () => {
  test('channels are classified', () => {
    expect(levelFor('login')).toBe('public');
    expect(levelFor('menu:get-all-items')).toBe('signedIn');
    expect(levelFor('pos:void-transaction')).toBe('approval');
    expect(levelFor('backup:restore')).toBe('manager');
    expect(levelFor('business:update-owner-code')).toBe('owner');
  });
});

describe('authorize', () => {
  let clock, ac;
  beforeEach(() => {
    clock = 1_000_000;
    ac = createAccessControl({ now: () => clock, permissionsFor: (u) => (u.userId === 4 ? { canManageEmployees: true } : {}) });
  });

  test('public channels need no session', () => {
    expect(() => ac.authorize('login', 7, [])).not.toThrow();
    expect(() => ac.authorize('check-setup', 7, [])).not.toThrow();
  });

  test('everything else needs a signed-in window', () => {
    expect(() => ac.authorize('menu:get-all-items', 7, [1])).toThrow(/sign in/);
    ac.bind(7, server);
    expect(ac.authorize('menu:get-all-items', 7, [1])).toBe(server);
    ac.unbind(7);
    expect(() => ac.authorize('menu:get-all-items', 7, [1])).toThrow(/sign in/);
  });

  test('requests for another business are refused', () => {
    ac.bind(7, owner);
    expect(() => ac.authorize('pos:get-transaction', 7, [{ businessId: 2, transactionId: 1 }])).toThrow(/this business/);
    expect(() => ac.authorize('pos:get-transaction', 7, [{ businessId: 1, transactionId: 1 }])).not.toThrow();
  });

  test('manager channels: managers yes, servers no', () => {
    ac.bind(1, manager);
    ac.bind(2, server);
    expect(() => ac.authorize('backup:create', 1, [])).not.toThrow();
    expect(() => ac.authorize('backup:create', 2, [])).toThrow(/manager or owner/);
  });

  test('staff with the "manage employees" permission can use staff channels only', () => {
    ac.bind(3, { userId: 4, role: 'staff', businessId: 1 });
    expect(() => ac.authorize('employee:update', 3, [{ businessId: 1 }])).not.toThrow();
    expect(() => ac.authorize('schedule:create-shift', 3, [1, {}])).not.toThrow();
    expect(() => ac.authorize('backup:create', 3, [])).toThrow(/manager or owner/);
  });

  test('owner channel: owner only', () => {
    ac.bind(1, manager);
    ac.bind(2, owner);
    expect(() => ac.authorize('business:update-owner-code', 1, [{ businessId: 1 }])).toThrow(/Only the owner/);
    expect(() => ac.authorize('business:update-owner-code', 2, [{ businessId: 1 }])).not.toThrow();
  });

  test('approval channels: managers always; servers only right after the owner code', () => {
    ac.bind(1, manager);
    ac.bind(2, server);
    expect(() => ac.authorize('pos:void-transaction', 1, [{ businessId: 1 }])).not.toThrow();
    expect(() => ac.authorize('pos:void-transaction', 2, [{ businessId: 1 }])).toThrow(/Owner code approval/);

    ac.grantApproval(2);
    expect(() => ac.authorize('menu:update-item', 2, [{ itemId: 1 }])).not.toThrow();
    expect(() => ac.authorize('modifiers:set-item-groups', 2, [{ businessId: 1 }])).not.toThrow(); // same save

    clock += 31 * 1000; // window expires
    expect(() => ac.authorize('pos:void-transaction', 2, [{ businessId: 1 }])).toThrow(/Owner code approval/);
  });

  test('approval on one till does not unlock another', () => {
    ac.bind(1, server);
    ac.bind(2, server);
    ac.grantApproval(1);
    expect(() => ac.authorize('refunds:create', 2, [{ businessId: 1 }])).toThrow(/Owner code approval/);
  });

  test('password reset needs a ticket from a successful identity check for that user', () => {
    expect(() => ac.authorize('auth:reset-password', 5, [{ userId: 1, newPassword: 'x' }])).toThrow(/Verify your identity/);
    ac.grantResetTicket(5, 3);
    expect(() => ac.authorize('auth:reset-password', 5, [{ userId: 1, newPassword: 'x' }])).toThrow(/Verify your identity/); // other user
    ac.grantResetTicket(5, 3);
    expect(() => ac.authorize('auth:reset-password', 5, [{ userId: 3, newPassword: 'x' }])).not.toThrow();
    expect(() => ac.authorize('auth:reset-password', 5, [{ userId: 3, newPassword: 'x' }])).toThrow(/Verify your identity/); // used up
    ac.grantResetTicket(5, 3);
    clock += 11 * 60 * 1000;
    expect(() => ac.authorize('auth:reset-password', 5, [{ userId: 3, newPassword: 'x' }])).toThrow(/Verify your identity/); // expired
  });
});

describe('audit log', () => {
  let ctx, Audit, Hooks;
  beforeAll(async () => {
    silenceLogs();
    ctx = await setupBusiness();
    Audit = backend('services/auditService');
    Hooks = require('../../src/backend/security/auditHooks');
  });
  afterAll(() => ctx.database.flushDatabase());

  const user = () => ({ userId: ctx.ownerId, role: 'owner', businessId: 1 });

  test('records entries with the user, newest first', () => {
    Audit.record(1, ctx.ownerId, 'drawer.opened', { openingFloat: 100 });
    Audit.record(1, ctx.ownerId, 'sale.void', { transactionId: 9, reason: "customer's request" });
    const rows = Audit.list(1);
    expect(rows.map((r) => r.action)).toEqual(['sale.void', 'drawer.opened']);
    expect(rows[0]).toMatchObject({ label: 'Sale voided', userName: 'Pat Lee', details: { transactionId: 9 } });
  });

  test('can be filtered by action', () => {
    expect(Audit.list(1, { action: 'drawer.opened' })).toHaveLength(1);
  });

  test('a price change is recorded with old and new price', () => {
    const Menu = backend('services/menuService');
    const { itemId } = Menu.createItem(1, { name: 'Burger', price: 10, available: 1 });
    const args = [{ itemId, itemData: { name: 'Burger', price: 12.5, available: 1 } }];
    const before = Hooks.before('menu:update-item', args);
    const result = Menu.updateItem(itemId, args[0].itemData);
    Hooks.after('menu:update-item', args, result, before, user());
    const [entry] = Audit.list(1, { action: 'menu.price_changed' });
    expect(entry.details).toMatchObject({ name: 'Burger', from: 10, to: 12.5 });
  });

  test('a discounted sale is recorded', () => {
    const args = [{ businessId: 1, transactionData: { discountType: 'percentage', discount: 4, total: 36, discountReason: 'Regular' } }];
    Hooks.after('pos:create-transaction', args, { id: 77 }, null, user());
    const [entry] = Audit.list(1, { action: 'sale.discount' });
    expect(entry.details).toMatchObject({ transactionId: 77, discount: 4, discountType: 'percentage' });
  });

  test('failed actions are not recorded', () => {
    const count = Audit.list(1).length;
    Hooks.after('refunds:create', [{ transactionId: 1, refund: {} }], { success: false, error: 'x' }, null, user());
    Hooks.after('pos:void-transaction', [{ transactionId: 1 }], { success: false }, null, user());
    expect(Audit.list(1).length).toBe(count);
  });
});

describe('audit noise', () => {
  let ctx2, Audit2, Hooks2, Mod, Menu2;
  beforeAll(() => {
    ctx2 = { userId: 1, role: 'owner', businessId: 1 };
    Audit2 = backend('services/auditService');
    Hooks2 = require('../../src/backend/security/auditHooks');
    Mod = backend('services/modifierService');
    Menu2 = backend('services/menuService');
  });

  test('re-saving the same modifier groups is not logged; changing them is', () => {
    const { itemId } = Menu2.createItem(1, { name: 'Wrap', price: 9, available: 1 });
    const g = Mod.createGroup(1, { name: 'Sauce', minSelect: 0, maxSelect: 1, options: [{ name: 'Mayo' }] });
    const save = (ids) => {
      const args = [{ businessId: 1, menuItemId: itemId, groupIds: ids }];
      const before = Hooks2.before('modifiers:set-item-groups', args);
      const result = Mod.setItemGroups(1, itemId, ids);
      Hooks2.after('modifiers:set-item-groups', args, { success: true, data: result }, before, ctx2);
    };
    const count = () => Audit2.list(1, { action: 'modifiers.changed' }).length;
    const start = count();
    save([]);
    expect(count()).toBe(start);
    save([g.id]);
    expect(count()).toBe(start + 1);
    expect(Audit2.list(1, { action: 'modifiers.changed' })[0].details).toMatchObject({ item: 'Wrap', from: 'none', to: 'Sauce' });
    save([g.id]);
    expect(count()).toBe(start + 1);
  });
});
