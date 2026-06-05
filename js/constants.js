export const ROLES = {
  MASTER: 'MASTER',
  PROFESSOR: 'PROFESSOR',
  STAFF: 'STAFF',
  VIEWER: 'VIEWER'
};

const ALL_ROLES = [ROLES.MASTER, ROLES.PROFESSOR, ROLES.STAFF, ROLES.VIEWER];
const EDIT_ROLES = [ROLES.MASTER, ROLES.PROFESSOR, ROLES.STAFF];

export const MENU_PERMISSIONS = {
  default: ALL_ROLES,
  dashboard: ALL_ROLES,

  'business-1-1': EDIT_ROLES,
  'business-1-2': EDIT_ROLES,
  'business-1-3': EDIT_ROLES,
  'business-2-1-ai': EDIT_ROLES,

  'kpi-1-1': ALL_ROLES,
  'kpi-1-2': ALL_ROLES,
  'kpi-1-3': ALL_ROLES,
  'kpi-2-1-ai': ALL_ROLES,

  budgets: [ROLES.MASTER, ROLES.PROFESSOR],
  reports: EDIT_ROLES,
  'ai-center': EDIT_ROLES,
  settings: [ROLES.MASTER]
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
