import { login, logout, getCurrentUser, loginWithEmail } from './auth.js';
import { showToast } from './ui.js';

export function renderLoginView(targetSelector, onLogin) {
  const target = document.querySelector(targetSelector);

  if (!target) {
    console.warn('로그인 화면 대상 요소를 찾을 수 없음');
    return;
  }

  target.innerHTML = `
    <section class="sc" style="max-width:460px;margin:48px auto;">
      <div class="sch">
        <div class="sct">AIMS 로그인</div>
      </div>

      <div class="scb">
        <form id="loginForm" class="form-grid" style="grid-template-columns:1fr;">
          <label class="form-field">
            <span>이메일</span>
            <input id="loginEmail" name="email" type="email" placeholder="예: user@inu.ac.kr" autocomplete="email" required />
          </label>
          <label class="form-field">
            <span>비밀번호</span>
            <input id="loginPassword" name="password" type="password" placeholder="비밀번호" autocomplete="current-password" required />
          </label>
          <div id="loginError" style="font-size:12px;color:#a32d2d;min-height:18px;"></div>
          <button class="btn btn-primary" id="loginButton" type="submit">로그인</button>
        </form>

        <details style="margin-top:18px;border-top:1px solid #e5e7eb;padding-top:14px;">
          <summary style="cursor:pointer;font-size:12px;color:#6b7280;font-weight:700;">관리자 테스트 로그인</summary>
          <div style="display:grid;gap:10px;margin-top:12px;">
            <label class="form-field">
              <span>테스트 권한</span>
              <select id="loginRole">
                <option value="MASTER">MASTER · 총괄관리자</option>
                <option value="TEAM_MANAGER">TEAM_MANAGER · 팀장</option>
                <option value="PROFESSOR">PROFESSOR · 책임교수</option>
                <option value="STAFF">STAFF · 실무담당자</option>
                <option value="VIEWER">VIEWER · 조회전용</option>
              </select>
            </label>
            <button class="btn btn-outline" id="testLoginButton" type="button">테스트 권한으로 입장</button>
          </div>
        </details>
      </div>
    </section>
  `;

  document.querySelector('#loginForm')?.addEventListener('submit', async event => {
    event.preventDefault();
    const errorBox = document.querySelector('#loginError');
    const email = document.querySelector('#loginEmail')?.value?.trim();
    const password = document.querySelector('#loginPassword')?.value || '';

    if (errorBox) errorBox.textContent = '';
    const result = await loginWithEmail(email, password);

    if (result.error) {
      if (errorBox) errorBox.textContent = `로그인 실패: ${result.error}`;
      return;
    }

    showToast(`${result.user.name}님, 로그인되었습니다.`);
    if (typeof onLogin === 'function') onLogin(result.user);
  });

  document.querySelector('#testLoginButton')?.addEventListener('click', () => {
    const role = document.querySelector('#loginRole').value;
    const user = {
      id: `preview_${role.toLowerCase()}`,
      name: getRoleDisplayName(role),
      role,
      unitTaskId: role === 'PROFESSOR' ? '1-1' : '',
      unitTaskIds: role === 'PROFESSOR' ? ['1-1'] : []
    };

    login(user);
    showToast(`${user.name} 권한으로 테스트 입장했습니다.`);
    if (typeof onLogin === 'function') onLogin(user);
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
    if (typeof onLogout === 'function') onLogout();
  });
}

function getRoleDisplayName(role) {
  const labels = {
    MASTER: '총괄관리자',
    TEAM_MANAGER: '팀장',
    PROFESSOR: '책임교수',
    STAFF: '실무담당자',
    VIEWER: '조회전용 사용자'
  };

  return labels[role] || '사용자';
}
