import { ROLES } from './constants.js';

const SESSION_KEY = 'aims_current_user';

export function login(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.reload();
}

export function getCurrentUser() {
  const raw = localStorage.getItem(SESSION_KEY);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('세션 데이터 파싱 오류', error);
    return null;
  }
}

export function hasPermission(user, allowedRoles = []) {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function isMaster(user) {
  return user?.role === ROLES.MASTER;
}
