export const schemas = {
  users: {
    id: 'string',
    name: 'string',
    email: 'string',
    role: 'string',
    department: 'string',
    status: 'string',
    createdAt: 'datetime'
  },

  projects: {
    id: 'string',
    year: 'number',
    unitTask: 'string',
    name: 'string',
    managerId: 'string',
    status: 'string'
  },

  programs: {
    id: 'string',
    projectId: 'string',
    name: 'string',
    type: 'string',
    startDate: 'date',
    endDate: 'date',
    participants: 'number',
    companies: 'number',
    budget: 'number',
    status: 'string'
  },

  performanceIndicators: {
    id: 'string',
    projectId: 'string',
    name: 'string',
    target: 'number',
    actual: 'number',
    unit: 'string',
    achievementRate: 'number'
  },

  budgets: {
    id: 'string',
    projectId: 'string',
    category: 'string',
    allocated: 'number',
    executed: 'number',
    balance: 'number',
    executionRate: 'number'
  },

  reports: {
    id: 'string',
    projectId: 'string',
    type: 'string',
    title: 'string',
    content: 'string',
    status: 'string',
    createdBy: 'string',
    createdAt: 'datetime'
  }
};
