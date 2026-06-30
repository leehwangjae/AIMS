import { getCollection, removeItem, subscribe } from './store.js';
import { createEmptyState, createTable } from './components.js';
import { showToast } from './ui.js';

const DEPT_TABLE_ID = 'departmentTableContainer';
const DEPT_FORM_ID = 'departmentForm';
let lastDepartmentSignature = '';

function getCurrentUnitTaskId() {
  return document.querySelector(`#${DEPT_FORM_ID} input[name="unitTaskId"]`)?.value || '1-1';
}

function normalizeDepartment(row) {
  const memo = row.memo || row.note || '';
  const masterMatch = String(memo).match(/석사\s*(\d+)/);
  const doctorMatch = String(memo).match(/박사\s*(\d+)/);
  const nanoMatch = String(memo).match(/나노디그리\s*(\d+)/);
  return {
    ...row,
    unitTaskId: row.unitTaskId || row.unit_task_id,
    department: row.department || row.name || '',
    bachelor: Number(row.bachelor ?? row.studentCount ?? row.student_count ?? 0),
    master: Number(row.master ?? (masterMatch ? masterMatch[1] : row.graduateCount ?? row.graduate_count ?? 0) ?? 0),
    doctor: Number(row.doctor ?? (doctorMatch ? doctorMatch[1] : 0) ?? 0),
    nano: Number(row.nano ?? (nanoMatch ? nanoMatch[1] : 0) ?? 0),
    note: row.note || row.memo || 'KPI 산출 제외'
  };
}

function renderDepartmentsFromStore() {
  const target = document.querySelector(`#${DEPT_TABLE_ID}`);
  if (!target) return;

  const unitTaskId = getCurrentUnitTaskId();
  const rows = getCollection('departments')
    .map(normalizeDepartment)
    .filter(row => row.unitTaskId === unitTaskId && row.department);

  const signature = `${unitTaskId}:${rows.map(row => `${row.id}:${row.department}:${row.bachelor}:${row.master}:${row.doctor}:${row.nano}`).join('|')}`;
  if (signature === lastDepartmentSignature && !target.textContent.includes('참여학과 없음')) return;
  lastDepartmentSignature = signature;

  if (!rows.length) {
    target.innerHTML = createEmptyState({ title: '참여학과 없음', description: '참여학과를 등록해 주세요.' });
    return;
  }

  target.innerHTML = `${createTable({
    columns: [
      { key: 'department', label: '학과' },
      { key: 'bachelor', label: '학부 재학생' },
      { key: 'master', label: '석사 재학생' },
      { key: 'doctor', label: '박사 재학생' },
      { key: 'nano', label: '나노디그리 참여' },
      { key: 'note', label: '비고' }
    ],
    rows
  })}<div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestDepartment" type="button">최근 등록 학과 삭제</button></div>`;

  document.querySelector('#deleteLatestDepartment')?.addEventListener('click', () => {
    const latest = rows.at(-1);
    if (!latest) return;
    removeItem('departments', latest.id);
    showToast('최근 등록 학과가 삭제되었습니다.');
    lastDepartmentSignature = '';
    renderDepartmentsFromStore();
  });
}

function scheduleRender() {
  [0, 250, 800, 1600, 3000].forEach(delay => window.setTimeout(renderDepartmentsFromStore, delay));
}

subscribe(scheduleRender);

const observer = new MutationObserver(() => {
  if (document.querySelector(`#${DEPT_TABLE_ID}`)) scheduleRender();
});
observer.observe(document.body, { childList: true, subtree: true });

scheduleRender();
