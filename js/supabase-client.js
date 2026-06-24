function readRuntimeConfig() {
  return {
    url: normalizeSupabaseUrl(window.AIMS_SUPABASE_URL || ''),
    anonKey: window.AIMS_SUPABASE_ANON_KEY || ''
  };
}

function normalizeSupabaseUrl(url) {
  return String(url || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/i, '');
}

let clientPromise = null;

export function isSupabaseEnabled() {
  const { url, anonKey } = readRuntimeConfig();
  return Boolean(url && anonKey);
}

export async function getSupabaseClient() {
  const { url, anonKey } = readRuntimeConfig();
  if (!url || !anonKey) {
    console.warn('[Supabase] public config is missing. AIMS will use localStorage only.');
    return null;
  }
  if (!clientPromise) {
    clientPromise = import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) => createClient(url, anonKey));
  }
  return clientPromise;
}

export const TABLE_MAP = {
  users: 'profiles',
  programs: 'programs',
  budgets: 'budget_executions',
  budgetAllocations: 'budget_allocations',
  budgetAllocationHistory: 'budget_allocation_history',
  files: 'documents',
  reports: 'documents',
  tasks: 'tasks',
  taskComments: 'task_comments',
  companies: 'companies',
  departments: 'departments',
  participants: 'participants',
  performanceIndicators: 'kpi_records'
};

export function getTableName(collectionName) {
  return TABLE_MAP[collectionName] || collectionName;
}
