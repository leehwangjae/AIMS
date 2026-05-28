import { initializeCollection, readCollection, writeCollection } from './storage.js';
import { sampleUsers, sampleProjects, samplePrograms } from '../data/sample-data.js';

const listeners = new Set();

const initialState = {
  users: [],
  projects: [],
  programs: [],
  performanceIndicators: [],
  budgets: [],
  reports: [],
  activeRoute: 'dashboard'
};

let state = { ...initialState };

export function initializeStore() {
  state = {
    ...state,
    users: initializeCollection('users', sampleUsers),
    projects: initializeCollection('projects', sampleProjects),
    programs: initializeCollection('programs', samplePrograms),
    performanceIndicators: initializeCollection('performanceIndicators', []),
    budgets: initializeCollection('budgets', []),
    reports: initializeCollection('reports', [])
  };

  notify();

  return getState();
}

export function getState() {
  return structuredClone(state);
}

export function getCollection(collectionName) {
  return state[collectionName] || readCollection(collectionName, []);
}

export function setActiveRoute(routeId) {
  state = {
    ...state,
    activeRoute: routeId
  };

  notify();
}

export function upsertItem(collectionName, item) {
  const collection = getCollection(collectionName);
  const exists = collection.some(row => row.id === item.id);

  const nextCollection = exists
    ? collection.map(row => row.id === item.id ? { ...row, ...item, updatedAt: new Date().toISOString() } : row)
    : [...collection, { ...item, createdAt: item.createdAt || new Date().toISOString() }];

  state = {
    ...state,
    [collectionName]: nextCollection
  };

  writeCollection(collectionName, nextCollection);
  notify();

  return item;
}

export function removeItem(collectionName, itemId) {
  const nextCollection = getCollection(collectionName).filter(row => row.id !== itemId);

  state = {
    ...state,
    [collectionName]: nextCollection
  };

  writeCollection(collectionName, nextCollection);
  notify();

  return nextCollection;
}

export function subscribe(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach(listener => listener(getState()));
}
