import { login, logout, getCurrentUser } from './auth.js';
import { showToast } from './ui.js';

export function renderLoginView(targetSelector, onLogin) {
  const target = document.querySelector(targetSelector);

  if (!target) {
    console.warn('로그인 화면 대상 요소를 찾을 수 없음');
    return;
  }

  target.innerHTML = `
    <section class="sc" style="max-width:420px;margin:32px auto;">
      <div class="sch">
        <div class="sct">AIMS 로그인</div>
      </div>

      <div class="scb">
        <div style="display:grid;gap:10px;">
          <label style="font-size:12px;color:#6b7280;">사용자 권한</label>
          <select id="loginRole" style="padding:10px;border:1px solid #d1d5db;border-radius:8px;font-family:inherit;">
            <option value="MASTER">MASTER · 총괄관리자</option>
            <option value="PROFESSOR">PROFESSOR · 책임교수</option>
            <option value="STAFF">STAFF · 실무담당자</option>
            <option value="VIEWER">VIEWER · 조회전용</option>
          </select>

          <button class="btn btn-primary" id="loginButton" type="button">
            로그인 테스트
          </button>
        </div>
      </div>
    </section>
  `;

  document.querySelector('#loginButton').addEventListener('click', () => {
    const role = document.querySelector('#loginRole').value;

    const user = {
      id: `preview_${role.toLowerCase()}`,
      name: getRoleDisplayName(role),
      role
    };

    login(user);
    showToast(`${user.name} 권한으로 로그인되었습니다.`);

    if (typeof onLogin === 'function') {
      onLogin(user);
    }
  });
}

export function renderUserStatus(targetSelector, onLogout) {
  const target = document.querySelector(targetSelector);
  const user = getCurrentUser();

  if (!target) return;

  if (!user) {
    target.innerHTML = '<span style="font-size:12px;color:#9ca3af;">로그인 전</span>';
    return;
  }

  target.innerHTML = `
    <div class="user-chip">
      <span class="user-avatar" style="background:#185fa5;">${user.name.slice(0, 1)}</span>
      <span>${user.name}</span>
      <span class="role-badge rb-${user.role.toLowerCase()}">${user.role}</span>
      <button class="btn btn-outline btn-sm" id="logoutButton" type="button">로그아웃</button>
    </div>
  `;

  document.querySelector('#logoutButton').addEventListener('click', () => {
    logout();

    if (typeof onLogout === 'function') {
      onLogout();
    }
  });
}

function getRoleDisplayName(role) {
  const labels = {
    MASTER: '총괄관리자',
    PROFESSOR: '책임교수',
    STAFF: '실무담당자',
    VIEWER: '조회전용 사용자'
  };

  return labels[role] || '사용자';
}
