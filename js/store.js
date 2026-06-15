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

export function initializeStore() {
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
  if (!isSupabaseEnabled()) return;
  const client = await getSupabaseClient();
  if (!client) return;

  const collections = ['users', 'programs', 'budgetAllocations', 'budgets', 'budgetAllocationHistory', 'files', 'tasks', 'taskComments', 'performanceIndicators'];
  await Promise.all(collections.map(async collectionName => {
    const tableName = getTableName(collectionName);
    const { data, error } = await client.from(tableName).select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn(`[Supabase] ${tableName} 로드 실패`, error.message);
      return;
    }
    if (!Array.isArray(data)) return;
    const normalized = data.map(fromDbRow);
    state = { ...state, [collectionName]: normalized };
    writeCollection(collectionName, normalized);
  }));
  notify();
}

async function syncUpsert(collectionName, item) {
  if (!isSupabaseEnabled()) return;
  const client = await getSupabaseClient();
  if (!client) return;
  const tableName = getTableName(collectionName);
  const payload = toDbRow(item);
  const { error } = await client.from(tableName).upsert(payload, { onConflict: 'id' });
  if (error) console.warn(`[Supabase] ${tableName} 저장 실패`, error.message);
}

async function syncDelete(collectionName, itemId) {
  if (!isSupabaseEnabled()) return;
  const client = await getSupabaseClient();
  if (!client) return;
  const tableName = getTableName(collectionName);
  const { error } = await client.from(tableName).delete().eq('id', itemId);
  if (error) console.warn(`[Supabase] ${tableName} 삭제 실패`, error.message);
}

function toDbRow(item) {
  const { createdAt, updatedAt, ...rest } = item;
  return {
    ...rest,
    created_at: createdAt || item.created_at || new Date().toISOString(),
    updated_at: updatedAt || item.updated_at || new Date().toISOString()
  };
}

function fromDbRow(row) {
  const { created_at, updated_at, ...rest } = row;
  return {
    ...rest,
    createdAt: created_at,
    updatedAt: updated_at
  };
}

function notify() {
  listeners.forEach(listener => listener(getState()));
}
