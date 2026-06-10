export const ROLES = {
  MASTER: 'MASTER',
  TEAM_MANAGER: 'TEAM_MANAGER',
  STAFF: 'STAFF',
  VIEWER: 'VIEWER'
};

const MANAGER_ROLES = [ROLES.MASTER, ROLES.TEAM_MANAGER];
const ALL_ROLES = [ROLES.MASTER, ROLES.TEAM_MANAGER, ROLES.STAFF, ROLES.VIEWER];
const EDIT_ROLES = [ROLES.MASTER, ROLES.TEAM_MANAGER, ROLES.STAFF];
const MANAGER_ONLY = MANAGER_ROLES;

export const MENU_PERMISSIONS = {
  default: ALL_ROLES,
  dashboard: ALL_ROLES,

  'business-1-1': ALL_ROLES,
  'business-1-2': ALL_ROLES,
  'business-1-3': ALL_ROLES,
  'business-2-1-ai': ALL_ROLES,

  'kpi-1-1': ALL_ROLES,
  'kpi-1-2': ALL_ROLES,
  'kpi-1-3': ALL_ROLES,
  'kpi-2-1-ai': ALL_ROLES,

  budgets: ALL_ROLES,
  files: ALL_ROLES,
  incentives: ALL_ROLES,
  'leave-management': EDIT_ROLES,
  reports: EDIT_ROLES,
  'ai-center': EDIT_ROLES,
  'user-management': MANAGER_ONLY,
  settings: MANAGER_ONLY
};

export const ACTION_PERMISSIONS = {
  edit: EDIT_ROLES,
  upload: EDIT_ROLES,
  delete: EDIT_ROLES,
  download: EDIT_ROLES,
  budgetEdit: EDIT_ROLES,
  manageUsers: MANAGER_ONLY
};

export const REPORT_STATUS = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  COMPLETED: 'COMPLETED'
};

export const PROGRAM_STATUS = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
};
