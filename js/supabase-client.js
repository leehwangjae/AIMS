const SUPABASE_URL = window.AIMS_SUPABASE_URL || import.meta?.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.AIMS_SUPABASE_ANON_KEY || import.meta?.env?.VITE_SUPABASE_ANON_KEY || '';

let clientPromise = null;

export function isSupabaseEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function getSupabaseClient() {
  if (!isSupabaseEnabled()) return null;
  if (!clientPromise) {
    clientPromise = import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
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
