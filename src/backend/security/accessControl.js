// Who may call which backend channel.
//
// Each app window (renderer) is bound to the user whose session token it
// last verified (login / verify-token). Every channel then falls into one of:
//
//   public     - no sign-in needed (setup, login, forgot password)
//   signedIn   - any signed-in user (the default)
//   approval   - manager role, OR an owner-code approval issued by the
//                backend when the owner code was entered on that till. It
//                unlocks approval-level actions for a short window (30 s),
//                e.g. saving a menu item and then its modifier groups.
//   manager    - owner / manager / admin only
//   owner      - owner only
//
// Password resets additionally need a short-lived ticket that is issued only
// after a successful identity check, for that same user.

const MANAGER_ROLES = ['owner', 'manager', 'admin'];
const APPROVAL_TTL_MS = 30 * 1000;
const RESET_TTL_MS = 10 * 60 * 1000;

const PUBLIC = new Set([
  'check-setup', 'complete-setup', 'login', 'verify-token', 'logout',
  'auth:verify-identity', 'auth:reset-password'
]);

const OWNER = new Set(['business:update-owner-code']);

const MANAGER = new Set([
  // business settings and data safety
  'business:update-tax-rate',
  'backup:list', 'backup:create', 'backup:export', 'backup:restore', 'backup:choose-file', 'backup:restore-chosen',
  // destructive / maintenance
  'pos:delete-transaction', 'pos:purge-transactions', 'pos:reset-order-sequence',
  'admin:fix-payroll-employees', 'timelog:debug-all', 'debug:get-raw-transactions',
  // staff management
  'employee:create', 'employee:update', 'employee:delete', 'employee:update-status', 'employee:create-account',
  'employee:upload-document', 'employee:delete-document',
  'timeoff:review', 'shiftswap:review',
  'schedule:create-shift', 'schedule:update-shift', 'schedule:delete-shift',
  'tasks:create', 'tasks:update', 'tasks:delete',
  'announcements:create', 'announcements:update', 'announcements:delete',
  // money out
  'expense:create', 'expense:update', 'expense:delete',
  'expense:create-recurring', 'expense:update-recurring', 'expense:delete-recurring', 'expense:process-recurring',
  'reservation:update-settings', 'reservation:set-enabled',
  // audit log
  'audit:list'
]);

const APPROVAL = new Set([
  'pos:void-transaction', 'refunds:create', 'tabs:cancel',
  'menu:create-item', 'menu:update-item', 'menu:delete-item',
  'menu:create-category', 'menu:update-category', 'menu:delete-category',
  'modifiers:create-group', 'modifiers:update-group', 'modifiers:delete-group', 'modifiers:set-item-groups',
  'recipes:set',
  'pos:delete-customer', 'pos:update-customer-points'
]);

// Staff without a manager role may still use these if their employee record
// has the matching permission (set on the Employees screen).
const PERMISSION_CHANNELS = {
  canManageEmployees: new Set([
    'employee:create', 'employee:update', 'employee:delete', 'employee:update-status', 'employee:create-account',
    'employee:upload-document', 'employee:delete-document', 'timeoff:review', 'shiftswap:review',
    'schedule:create-shift', 'schedule:update-shift', 'schedule:delete-shift',
    'tasks:create', 'tasks:update', 'tasks:delete',
    'announcements:create', 'announcements:update', 'announcements:delete'
  ])
};

const levelFor = (channel) => {
  if (PUBLIC.has(channel)) return 'public';
  if (OWNER.has(channel)) return 'owner';
  if (MANAGER.has(channel)) return 'manager';
  if (APPROVAL.has(channel)) return 'approval';
  return 'signedIn';
};

class AccessDenied extends Error {
  constructor(message) {
    super(message);
    this.name = 'AccessDenied';
  }
}

// permissionsFor(user) -> the user's employee permission flags (or {})
const createAccessControl = ({ now = () => Date.now(), permissionsFor = () => ({}) } = {}) => {
  const sessions = new Map(); // senderId -> { userId, role, businessId, username }
  const approvals = new Map(); // senderId -> expiry time
  const resetTickets = new Map(); // senderId -> { userId, expires }

  const isManager = (user) => !!user && MANAGER_ROLES.includes(String(user.role || '').toLowerCase());

  return {
    levelFor,
    isManager,

    bind(senderId, user) {
      if (user) sessions.set(senderId, user);
    },
    unbind(senderId) {
      sessions.delete(senderId);
      approvals.delete(senderId);
    },
    userFor(senderId) {
      return sessions.get(senderId) || null;
    },

    // Owner code entered correctly: one sensitive action may follow
    grantApproval(senderId) {
      approvals.set(senderId, now() + APPROVAL_TTL_MS);
    },
    grantResetTicket(senderId, userId) {
      resetTickets.set(senderId, { userId: Number(userId), expires: now() + RESET_TTL_MS });
    },

    // Throws AccessDenied if the call isn't allowed. Returns the user (or null
    // for public channels).
    authorize(channel, senderId, args = []) {
      const level = levelFor(channel);
      const user = sessions.get(senderId) || null;

      if (channel === 'auth:reset-password') {
        const ticket = resetTickets.get(senderId);
        const userId = Number((args[0] || {}).userId);
        if (!ticket || ticket.expires < now() || ticket.userId !== userId) {
          throw new AccessDenied('Verify your identity before resetting the password');
        }
        resetTickets.delete(senderId);
        return null;
      }
      if (level === 'public') return user;

      if (!user) throw new AccessDenied('Please sign in again');

      // Requests that name a business must be for the signed-in user's business
      const first = args[0];
      if (first && typeof first === 'object' && first.businessId !== undefined && Number(first.businessId) !== Number(user.businessId)) {
        throw new AccessDenied('Not allowed for this business');
      }

      if (level === 'owner' && String(user.role).toLowerCase() !== 'owner') {
        throw new AccessDenied('Only the owner can do this');
      }
      if (level === 'manager' && !isManager(user)) {
        const perms = permissionsFor(user) || {};
        const granted = Object.entries(PERMISSION_CHANNELS).some(([flag, channels]) => perms[flag] && channels.has(channel));
        if (!granted) throw new AccessDenied('A manager or owner is required for this');
      }
      if (level === 'approval' && !isManager(user)) {
        const expiry = approvals.get(senderId);
        if (!expiry || expiry < now()) {
          approvals.delete(senderId);
          throw new AccessDenied('Owner code approval is required for this');
        }
      }
      return user;
    }
  };
};

module.exports = { createAccessControl, levelFor, AccessDenied, MANAGER_ROLES, PERMISSION_CHANNELS, APPROVAL_TTL_MS };
