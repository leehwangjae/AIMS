import { ROLES } from './constants.js';
import { getSupabaseClient, isSupabaseEnabled } from './supabase-client.js';

const SESSION_KEY = 'aims_current_user';

export function login(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function loginWithEmail(email, password) {
  if (!isSupabaseEnabled()) {
    return { user: null, error: 'Supabase 환경변수가 설정되지 않았습니다.' };
  }

  const client = await getSupabaseClient();
  if (!client) return { user: null, error: 'Supabase 클라이언트를 초기화할 수 없습니다.' };

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };

  const authUser = data?.user;
  if (!authUser) return { user: null, error: '사용자 정보를 불러오지 못했습니다.' };

  const profile = await loadProfile(authUser.id, authUser.email);
  const user = {
    id: authUser.id,
    email: authUser.email,
    name: profile?.name || authUser.email || '사용자',
    role: profile?.role || ROLES.VIEWER,
    department: profile?.department || '',
    unitTaskId: profile?.unit_task_id || profile?.unitTaskId || '',
    unitTaskIds: profile?.unit_task_ids || profile?.unitTaskIds || []
  };

  login(user);
  return { user, error: null };
}

export async function loadProfile(userId, email = '') {
  const client = await getSupabaseClient();
  if (!client) return null;

  const { data } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (data) return data;

  const fallbackName = email ? email.split('@')[0] : '사용자';
  const profile = { id: userId, email, name: fallbackName, role: ROLES.VIEWER };
  await client.from('profiles').upsert(profile, { onConflict: 'id' });
  return profile;
}

export async function logout() {
  localStorage.removeItem(SESSION_KEY);
  if (isSupabaseEnabled()) {
    const client = await getSupabaseClient();
    await client?.auth?.signOut?.();
  }
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
