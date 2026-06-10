import { getCollection, upsertItem, removeItem } from './store.js';
import { createCard, createEmptyState, createTable } from './components.js';
import { validateRequired } from './form-utils.js';
import { showToast } from './ui.js';
import { ROLES } from './constants.js';

const USER_FORM_ID = 'userManagementForm';
const USER_TABLE_ID = 'userManagementTable';

export function renderUserManagementView(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">User Management</div>
        <h2 class="page-title">사용자관리</h2>
        <p class="page-desc">미래인재양성팀 내부 운영자를 등록하고 권한을 관리합니다.</p>
      </div>
    </section>

    ${createCard({ title: '사용자 등록', content: renderUserForm() })}
    ${createCard({ title: '사용자 현황', content: `<div id="${USER_TABLE_ID}"></div>` })}
  `;

  bindUserForm();
  renderUserTable();
}

function renderUserForm() {
  return `
    <form id="${USER_FORM_ID}" class="form-grid">
      <label class="form-field"><span>이름</span><input name="name" type="text" placeholder="예: 홍길동" /></label>
      <label class="form-field"><span>이메일</span><input name="email" type="email" placeholder="example@inu.ac.kr" /></label>
      <label class="form-field"><span>권한</span><select name="role"><option value="${ROLES.TEAM_MANAGER}">TEAM_MANAGER</option><option value="${ROLES.STAFF}">STAFF</option><option value="${ROLES.VIEWER}">VIEWER</option></select></label>
      <label class="form-field"><span>소속/담당</span><input name="department" type="text" placeholder="예: 미래인재양성팀 / 1-1 담당" /></label>
      <label class="form-field"><span>사용여부</span><select name="active"><option value="Y">사용</option><option value="N">중지</option></select></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">저장</button><button class="btn btn-outline" type="reset">초기화</button></div>
    </form>
  `;
}

function bindUserForm() {
  const form = document.querySelector(`#${USER_FORM_ID}`);
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['name', 'email', 'role', 'department']).valid) return showToast('필수 입력 항목을 확인해 주세요.');

    upsertItem('users', {
      id: `user_${Date.now()}`,
      name: values.name,
      email: values.email,
      role: values.role,
      department: values.department,
      active: values.active,
      createdAt: new Date().toISOString().slice(0, 10)
    });

    showToast('사용자가 저장되었습니다.');
    form.reset();
    renderUserTable();
  });
}

function renderUserTable() {
  const target = document.querySelector(`#${USER_TABLE_ID}`);
  if (!target) return;
  const rows = getCollection('users');
  if (!rows.length) return target.innerHTML = createEmptyState({ title: '등록된 사용자 없음', description: '사용자를 먼저 등록해 주세요.' });

  target.innerHTML = `
    ${createTable({ columns: [
      { key: 'name', label: '이름' },
      { key: 'email', label: '이메일' },
      { key: 'role', label: '권한' },
      { key: 'department', label: '소속/담당' },
      { key: 'active', label: '사용여부' },
      { key: 'createdAt', label: '등록일' }
    ], rows: rows.map(row => ({ ...row, active: row.active === 'Y' ? '사용' : '중지' })) })}
    <div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestUser" type="button">최근 등록 사용자 삭제</button></div>
  `;

  document.querySelector('#deleteLatestUser')?.addEventListener('click', () => {
    const latest = getCollection('users').at(-1);
    if (!latest) return;
    removeItem('users', latest.id);
    showToast('최근 등록 사용자가 삭제되었습니다.');
    renderUserTable();
  });
}
