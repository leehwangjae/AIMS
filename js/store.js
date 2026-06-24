import { initializeCollection, readCollection, writeCollection } from './storage.js';
import { sampleUsers, sampleProjects, samplePrograms } from '../data/sample-data.js';
import { getSupabaseClient, getTableName, isSupabaseEnabled } from './supabase-client.js';

const listeners = new Set();

const initialState = {
  users: [],
  projects: [],
  programs: [],
  performanceIndicators: [],
  budgets: [],
  budgetAllocations: [],
  budgetAllocationHistory: [],
  reports: [],
  files: [],
  tasks: [],
  taskComments: [],
  activeRoute: 'dashboard'
};

let state = { ...initialState };
let syncMode = isSupabaseEnabled() ? 'supabase' : 'local';

const DB_FIELD_MAP = {
  common: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    createdBy: 'created_by',
    updatedBy: 'updated_by'
  },
  budgets: {
    unitTaskId: 'unit_task_id',
    budgetItemId: 'budget_item_id',
    trackId: 'track_id',
    fundType: 'fund_type',
    erpLineNo: 'erp_line_no',
    executed: 'executed_amount',
    executedAmount: 'executed_amount',
    executionDate: 'execution_date',
    vendorName: 'vendor_name',
    evidenceFileId: 'evidence_file_id',
    memo: 'memo'
  },
  budgetAllocations: {
    unitTaskId: 'unit_task_id',
    baseItemId: 'base_item_id',
    trackId: 'track_id',
    fundType: 'fund_type',
    riseCategory: 'rise_category',
    allocated: 'allocated_amount',
    allocatedAmount: 'allocated_amount'
  },
  budgetAllocationHistory: {
    unitTaskId: 'unit_task_id',
    budgetItemId: 'budget_item_id',
    previousAmount: 'previous_amount',
    nextAmount: 'next_amount',
    changedBy: 'changed_by',
    changedAt: 'changed_at'
  },
  tasks: {
    unitTaskId: 'unit_task_id',
    dueDate: 'due_date',
    startDate: 'start_date',
    completedAt: 'completed_at',
    parentTaskId: 'parent_task_id'
  },
  taskComments: {
    taskId: 'task_id',
    authorId: 'author_id'
  },
  files: {
    unitTaskId: 'unit_task_id',
    fileUrl: 'file_url',
    fileType: 'file_type',
    fileSize: 'file_size',
    uploadedBy: 'uploaded_by',
    uploadedAt: 'uploaded_at'
  },
  reports: {
    unitTaskId: 'unit_task_id',
    fileUrl: 'file_url',
    fileType: 'file_type',
    fileSize: 'file_size',
    uploadedBy: 'uploaded_by',
    uploadedAt: 'uploaded_at'
  },
  performanceIndicators: {
    unitTaskId: 'unit_task_id',
    indicatorId: 'indicator_id',
    targetValue: 'target_value',
    actualValue: 'actual_value',
    achievementRate: 'achievement_rate',
    evidenceFileId: 'evidence_file_id'
  }
};

export function initializeStore() {
  syncMode = isSupabaseEnabled() ? 'supabase' : 'local';

  state = {
    ...state,
    users: initializeCollection('users', sampleUsers),
    projects: initializeCollection('projects', sampleProjects),
    programs: initializeCollection('programs', samplePrograms),
    performanceIndicators: initializeCollection('performanceIndicators', []),
    budgets: initializeCollection('budgets', []),
    budgetAllocations: initializeCollection('budgetAllocations', []),
    budgetAllocationHistory: initializeCollection('budgetAllocationHistory', []),
    reports: initializeCollection('reports', []),
    files: initializeCollection('files', []),
    tasks: initializeCollection('tasks', []),
    taskComments: initializeCollection('taskComments', [])
  };

  notify();
  hydrateSupabaseCollections();

  return getState();
}

export function getState() {
  return structuredClone(state);
}

export function getCollection(collectionName) {
  return state[collectionName] || readCollection(collectionName, []);
}

export function getSyncMode() {
  return syncMode;
}

export function setActiveRoute(routeId) {
  state = { ...state, activeRoute: routeId };
  notify();
}

export function upsertItem(collectionName, item) {
  const collection = getCollection(collectionName);
  const exists = collection.some(row => row.id === item.id);
  const nextItem = exists ? { ...item, updatedAt: new Date().toISOString() } : { ...item, createdAt: item.createdAt || new Date().toISOString() };

  const nextCollection = exists
    ? collection.map(row => row.id === item.id ? { ...row, ...nextItem } : row)
    : [...collection, nextItem];

  state = { ...state, [collectionName]: nextCollection };
  writeCollection(collectionName, nextCollection);
  notify();
  syncUpsert(collectionName, nextItem);

  return item;
}

export function removeItem(collectionName, itemId) {
  const nextCollection = getCollection(collectionName).filter(row => row.id !== itemId);
  state = { ...state, [collectionName]: nextCollection };
  writeCollection(collectionName, nextCollection);
  notify();
  syncDelete(collectionName, itemId);
  return nextCollection;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function hydrateSupabaseCollections() {
  if (!isSupabaseEnabled()) {
    syncMode = 'local';
    console.info('[AIMS] Supabase disabled. Using localStorage mode.');
    return;
  }

  const client = await getSupabaseClient();
  if (!client) {
    syncMode = 'local';
    return;
  }

  syncMode = 'supabase';
  const collections = ['users', 'programs', 'budgetAllocations', 'budgets', 'budgetAllocationHistory', 'files', 'tasks', 'taskComments', 'performanceIndicators'];

  await Promise.all(collections.map(async collectionName => {
    const tableName = getTableName(collectionName);
    const { data, error } = await client.from(tableName).select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn(`[Supabase] ${tableName} 로드 실패`, error.message);
      return;
    }
    if (!Array.isArray(data)) return;
    const normalized = data.map(row => fromDbRow(collectionName, row));
    state = { ...state, [collectionName]: normalized };
    writeCollection(collectionName, normalized);
  }));
  notify();
  console.info('[AIMS] Supabase collections hydrated.');
}

async function syncUpsert(collectionName, item) {
  if (!isSupabaseEnabled()) {
    syncMode = 'local';
    console.warn(`[AIMS] ${collectionName} 저장은 localStorage에만 반영됨: Supabase config missing.`);
    return;
  }
  const client = await getSupabaseClient();
  if (!client) return;
  const tableName = getTableName(collectionName);
  const payload = toDbRow(collectionName, item);
  const { error } = await client.from(tableName).upsert(payload, { onConflict: 'id' });
  if (error) {
    console.warn(`[Supabase] ${tableName} 저장 실패`, error.message, payload);
    return;
  }
  syncMode = 'supabase';
  console.info(`[Supabase] ${tableName} 저장 완료`, item.id);
}

async function syncDelete(collectionName, itemId) {
  if (!isSupabaseEnabled()) return;
  const client = await getSupabaseClient();
  if (!client) return;
  const tableName = getTableName(collectionName);
  const { error } = await client.from(tableName).delete().eq('id', itemId);
  if (error) console.warn(`[Supabase] ${tableName} 삭제 실패`, error.message);
}

function toDbRow(collectionName, item) {
  const fieldMap = { ...DB_FIELD_MAP.common, ...(DB_FIELD_MAP[collectionName] || {}) };
  const dbRow = {};

  Object.entries(item || {}).forEach(([key, value]) => {
    if (value === undefined) return;
    const dbKey = fieldMap[key] || camelToSnake(key);
    dbRow[dbKey] = normalizeDbValue(value);
  });

  dbRow.created_at = item.createdAt || item.created_at || new Date().toISOString();
  dbRow.updated_at = item.updatedAt || item.updated_at || new Date().toISOString();
  return dbRow;
}

function fromDbRow(collectionName, row) {
  const fieldMap = { ...DB_FIELD_MAP.common, ...(DB_FIELD_MAP[collectionName] || {}) };
  const inverseMap = Object.fromEntries(Object.entries(fieldMap).map(([appKey, dbKey]) => [dbKey, appKey]));
  const appRow = {};

  Object.entries(row || {}).forEach(([key, value]) => {
    const appKey = inverseMap[key] || snakeToCamel(key);
    appRow[appKey] = value;
  });

  appRow.createdAt = row.created_at;
  appRow.updatedAt = row.updated_at;
  return appRow;
}

function normalizeDbValue(value) {
  if (value === '') return null;
  if (Array.isArray(value) || (value && typeof value === 'object')) return value;
  return value;
}

function camelToSnake(value) {
  return String(value).replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(value) {
  return String(value).replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function notify() {
  listeners.forEach(listener => listener(getState()));
}
