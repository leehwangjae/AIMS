import { getCollection, upsertItem, removeItem } from './store.js';
import { createCard, createEmptyState } from './components.js';
import { validateRequired, validateNumber } from './form-utils.js';
import { showToast } from './ui.js';
import { getCurrentUser } from './auth.js';
import { ROLES } from './constants.js';

const TASK_FORM_ID = 'taskForm';
const TASK_BOARD_ID = 'taskKanbanBoard';
const TASK_SUMMARY_ID = 'taskSummaryContainer';
const TASK_FILTER_UNIT_ID = 'taskFilterUnit';
const TASK_FILTER_OWNER_ID = 'taskFilterOwner';
const TASK_COMMENT_TASK_ID = 'taskCommentTarget';
const TASK_COMMENT_TEXT_ID = 'taskCommentText';
const TASK_COMMENT_NOTICE_ID = 'taskCommentNotice';

const STATUSES = [
  { id: 'INBOX', label: '접수', icon: '📥' },
  { id: 'PLANNING', label: '계획수립', icon: '📝' },
  { id: 'DOING', label: '진행중', icon: '⚙️' },
  { id: 'REVIEW', label: '검토요청', icon: '👀' },
  { id: 'DONE', label: '완료', icon: '✅' },
  { id: 'HOLD', label: '보류', icon: '🚨' }
];

const LEGACY_STATUS_MAP = {
  TODO: 'INBOX',
  DOING: 'DOING',
  REVIEW: 'REVIEW',
  DONE: 'DONE'
};

const UNIT_OPTIONS = [
  { id: 'all', name: '전체' },
  { id: '1-1', name: '1-1 전략산업' },
  { id: '1-2', name: '1-2 스마트모빌리티' },
  { id: '1-3', name: '1-3 혁신창업' },
  { id: '2-1-ai', name: '2-1 AI' },
  { id: 'common', name: '공통' }
];

const PRIORITIES = [
  { id: 'URGENT', label: '긴급' },
  { id: 'HIGH', label: '높음' },
  { id: 'NORMAL', label: '보통' },
  { id: 'LOW', label: '낮음' }
];

const MANAGER_COMMENT_ROLES = [ROLES.MASTER, ROLES.TEAM_MANAGER];

export function renderTaskView(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  ensureTaskBoardStyles();

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">Task Management</div>
        <h2 class="page-title">업무관리</h2>
        <p class="page-desc">팀원별 업무를 Trello형 칸반보드로 관리하고, 담당자별 업무량·지연·검토요청 현황을 한눈에 확인합니다.</p>
      </div>
    </section>
    ${createCard({ title: '팀 업무 현황', content: `<div id="${TASK_SUMMARY_ID}"></div>` })}
    ${createCard({ title: '업무 등록', content: renderTaskForm() })}
    ${createCard({ title: '칸반보드', content: renderFilters() + `<div id="${TASK_BOARD_ID}"></div>` })}
    ${createCard({ title: '업무 코멘트', content: renderCommentForm() })}
  `;

  seedTasksIfEmpty();
  migrateLegacyTaskStatuses();
  bindTaskForm();
  bindFilters();
  bindCommentForm();
  renderTaskSummary();
  renderTaskBoard();
  updateCommentTargetOptions();
}

function renderTaskForm() {
  return `
    <form id="${TASK_FORM_ID}" class="form-grid">
      <label class="form-field"><span>업무명</span><input name="title" type="text" placeholder="예: 바이오 재직자 교육 운영" /></label>
      <label class="form-field"><span>단위과제</span><select name="unitTaskId">${UNIT_OPTIONS.filter(unit => unit.id !== 'all').map(unit => `<option value="${unit.id}">${unit.name}</option>`).join('')}</select></label>
      <label class="form-field"><span>담당자</span><input name="owner" type="text" placeholder="예: 이창재" /></label>
      <label class="form-field"><span>마감일</span><input name="dueDate" type="date" /></label>
      <label class="form-field"><span>상태</span><select name="status">${STATUSES.map(status => `<option value="${status.id}">${status.icon} ${status.label}</option>`).join('')}</select></label>
      <label class="form-field"><span>진행률(%)</span><input name="progress" type="number" min="0" max="100" value="0" /></label>
      <label class="form-field"><span>우선순위</span><select name="priority">${PRIORITIES.map(priority => `<option value="${priority.id}">${priority.label}</option>`).join('')}</select></label>
      <label class="form-field"><span>업무구분</span><input name="type" type="text" placeholder="예: 행사운영, 보고서, 예산, 협의" /></label>
      <label class="form-field full"><span>업무내용</span><textarea name="description" rows="3" placeholder="현재 진행 중인 업무내용을 입력하세요."></textarea></label>
      <label class="form-field full"><span>요청사항/애로사항</span><textarea name="issue" rows="2" placeholder="협조 요청, 애로사항, 팀장 확인 필요사항 등"></textarea></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">업무 등록</button><button class="btn btn-outline" type="reset">초기화</button></div>
    </form>`;
}

function renderFilters() {
  return `
    <div class="form-grid" style="margin-bottom:14px;">
      <label class="form-field"><span>단위과제</span><select id="${TASK_FILTER_UNIT_ID}">${UNIT_OPTIONS.map(unit => `<option value="${unit.id}">${unit.name}</option>`).join('')}</select></label>
      <label class="form-field"><span>담당자</span><select id="${TASK_FILTER_OWNER_ID}"><option value="all">전체</option></select></label>
    </div>`;
}

function renderCommentForm() {
  return `
    <form id="taskCommentForm" class="form-grid">
      <div id="${TASK_COMMENT_NOTICE_ID}" class="form-field full"></div>
      <label class="form-field"><span>업무 선택</span><select id="${TASK_COMMENT_TASK_ID}" name="taskId"></select></label>
      <label class="form-field full"><span>코멘트</span><textarea id="${TASK_COMMENT_TEXT_ID}" name="comment" rows="3" placeholder="사업단장·팀장은 전체 업무, 분야별 책임교수는 담당 분야 업무에 코멘트할 수 있습니다."></textarea></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit" id="taskCommentSubmit">코멘트 등록</button></div>
    </form>`;
}

function bindTaskForm() {
  const form = document.querySelector(`#${TASK_FORM_ID}`);
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['title', 'unitTaskId', 'owner', 'dueDate']).valid) return showToast('업무명, 단위과제, 담당자, 마감일을 입력해 주세요.');
    if (!validateNumber(values.progress, { min: 0, max: 100 }).valid) return showToast('진행률은 0~100 사이로 입력해 주세요.');
    upsertItem('tasks', {
      id: `task_${Date.now()}`,
      title: values.title,
      unitTaskId: values.unitTaskId,
      owner: values.owner,
      dueDate: values.dueDate,
      status: values.status,
      progress: Number(values.progress),
      priority: values.priority,
      type: values.type || '일반업무',
      description: values.description || '',
      issue: values.issue || '',
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10)
    });
    showToast('업무가 등록되었습니다.');
    form.reset();
    renderTaskSummary();
    updateOwnerFilterOptions();
    renderTaskBoard();
    updateCommentTargetOptions();
  });
}

function bindFilters() {
  document.querySelector(`#${TASK_FILTER_UNIT_ID}`)?.addEventListener('change', () => {
    renderTaskSummary();
    renderTaskBoard();
  });
  document.querySelector(`#${TASK_FILTER_OWNER_ID}`)?.addEventListener('change', () => {
    renderTaskSummary();
    renderTaskBoard();
  });
  updateOwnerFilterOptions();
}

function bindCommentForm() {
  const form = document.querySelector('#taskCommentForm');
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const task = getCollection('tasks').find(item => item.id === values.taskId);
    if (!values.taskId || !values.comment?.trim()) return showToast('업무와 코멘트를 입력해 주세요.');
    if (!canCommentTask(task)) return showToast('해당 업무에 코멘트를 작성할 권한이 없습니다.');
    upsertItem('taskComments', { id: `task_comment_${Date.now()}`, taskId: values.taskId, author: getCurrentUserName(), authorRole: getCurrentUser()?.role || '', comment: values.comment.trim(), createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ') });
    form.reset();
    showToast('코멘트가 등록되었습니다.');
    renderTaskBoard();
    updateCommentTargetOptions();
  });
}

function renderTaskSummary() {
  const target = document.querySelector(`#${TASK_SUMMARY_ID}`);
  if (!target) return;

  const tasks = getFilteredTasks(false);
  const delayed = tasks.filter(isDelayed).length;
  const dueSoon = tasks.filter(isDueSoon).length;
  const review = tasks.filter(task => normalizeStatus(task.status) === 'REVIEW').length;
  const doing = tasks.filter(task => normalizeStatus(task.status) === 'DOING').length;
  const owners = getOwnerStats(tasks);

  target.innerHTML = `
    <div class="task-summary-grid">
      <div class="task-summary-card"><div class="task-summary-value">${tasks.length}</div><div class="task-summary-label">전체 업무</div></div>
      <div class="task-summary-card"><div class="task-summary-value">${doing}</div><div class="task-summary-label">진행중</div></div>
      <div class="task-summary-card"><div class="task-summary-value">${review}</div><div class="task-summary-label">검토요청</div></div>
      <div class="task-summary-card danger"><div class="task-summary-value">${delayed}</div><div class="task-summary-label">지연 업무</div></div>
      <div class="task-summary-card warn"><div class="task-summary-value">${dueSoon}</div><div class="task-summary-label">7일 이내 마감</div></div>
    </div>
    <div class="task-workload-section">
      <div class="task-workload-head"><strong>담당자별 업무량</strong><span>카드를 클릭하면 해당 담당자 업무만 필터링됩니다.</span></div>
      <div class="task-workload-grid">
        ${owners.length ? owners.map(renderOwnerWorkloadCard).join('') : '<div class="task-empty-inline">담당자별 업무가 없습니다.</div>'}
      </div>
    </div>`;

  target.querySelectorAll('[data-owner-filter]').forEach(button => {
    button.addEventListener('click', () => {
      const select = document.querySelector(`#${TASK_FILTER_OWNER_ID}`);
      if (!select) return;
      select.value = button.dataset.ownerFilter;
      renderTaskSummary();
      renderTaskBoard();
    });
  });
}

function renderOwnerWorkloadCard(stat) {
  const workloadRate = Math.min(100, Math.round((stat.active / Math.max(stat.maxActive, 1)) * 100));
  return `<button class="task-owner-card" type="button" data-owner-filter="${escapeAttr(stat.owner)}">
    <div class="task-owner-top"><strong>${stat.owner}</strong><span>${stat.total}건</span></div>
    <div class="task-owner-meta">진행 ${stat.doing} · 검토 ${stat.review} · 지연 ${stat.delayed}</div>
    <div class="task-owner-bar"><i style="width:${workloadRate}%"></i></div>
  </button>`;
}

function renderTaskBoard() {
  const target = document.querySelector(`#${TASK_BOARD_ID}`);
  if (!target) return;
  const tasks = getFilteredTasks(true);
  if (!tasks.length) return target.innerHTML = createEmptyState({ title: '등록된 업무 없음', description: '업무를 등록하면 칸반보드에 표시됩니다.' });
  target.innerHTML = `<div class="kanban-board task-kanban-v2">${STATUSES.map(status => renderKanbanColumn(status, tasks.filter(task => normalizeStatus(task.status) === status.id))).join('')}</div>`;
  target.querySelectorAll('[data-task-status]').forEach(button => button.addEventListener('click', () => changeTaskStatus(button.dataset.taskStatus, button.dataset.nextStatus)));
  target.querySelectorAll('[data-delete-task]').forEach(button => button.addEventListener('click', () => deleteTask(button.dataset.deleteTask)));
}

function renderKanbanColumn(status, tasks) {
  return `<div class="kanban-column task-column-${status.id.toLowerCase()}"><div class="kanban-column-head"><strong>${status.icon} ${status.label}</strong><span>${tasks.length}</span></div><div class="kanban-card-list">${tasks.length ? tasks.map(renderTaskCard).join('') : '<div class="kanban-empty">해당 업무 없음</div>'}</div></div>`;
}

function renderTaskCard(task) {
  const comments = getCollection('taskComments').filter(comment => comment.taskId === task.id);
  const commentScope = canCommentTask(task) ? '코멘트 가능' : '코멘트 조회만 가능';
  const health = getDueHealth(task);
  const nextActions = getNextStatusActions(task);
  const status = normalizeStatus(task.status);
  return `<article class="kanban-card priority-${task.priority} task-health-${health.id}">
    <div class="kanban-card-top"><span class="priority-badge">${getPriorityLabel(task.priority)}</span><span class="due-badge ${health.id}">${health.label}</span></div>
    <h4>${task.title}</h4>
    <div class="task-card-meta-grid"><span>담당</span><strong>${task.owner}</strong><span>단위</span><strong>${getUnitName(task.unitTaskId)}</strong><span>구분</span><strong>${task.type || '일반업무'}</strong><span>권한</span><strong>${commentScope}</strong></div>
    <div class="progress task-progress"><div class="progress-bar" style="width:${Math.min(Number(task.progress || 0), 100)}%"></div></div>
    <div class="kanban-meta task-progress-text">진행률 ${task.progress || 0}% · 현재 ${getStatusLabel(status)}</div>
    ${task.description ? `<p class="kanban-desc">${task.description}</p>` : ''}
    ${task.issue ? `<p class="kanban-issue">요청/애로: ${task.issue}</p>` : ''}
    ${comments.length ? `<div class="kanban-comments">${comments.slice(-2).map(comment => `<div><strong>${comment.author}</strong> <span class="kanban-meta">${comment.authorRole || ''}</span> ${comment.comment}</div>`).join('')}</div>` : ''}
    <div class="kanban-actions">${nextActions.map(action => `<button class="btn btn-outline" type="button" data-task-status="${task.id}" data-next-status="${action.id}">${action.label}</button>`).join('')}<button class="btn btn-outline" type="button" data-delete-task="${task.id}">삭제</button></div>
  </article>`;
}

function getNextStatusActions(task) {
  const current = normalizeStatus(task.status);
  const flow = {
    INBOX: ['PLANNING', 'DOING', 'HOLD'],
    PLANNING: ['DOING', 'REVIEW', 'HOLD'],
    DOING: ['REVIEW', 'DONE', 'HOLD'],
    REVIEW: ['DONE', 'DOING', 'HOLD'],
    DONE: ['DOING'],
    HOLD: ['INBOX', 'DOING']
  };
  return (flow[current] || []).map(statusId => ({ id: statusId, label: getStatusLabel(statusId) }));
}

function changeTaskStatus(taskId, nextStatus) {
  const task = getCollection('tasks').find(item => item.id === taskId);
  if (!task) return;
  const progress = nextStatus === 'DONE' ? 100 : nextStatus === 'INBOX' ? Math.min(Number(task.progress || 0), 10) : task.progress;
  upsertItem('tasks', { ...task, status: nextStatus, updatedAt: new Date().toISOString().slice(0, 10), progress });
  showToast('업무 상태가 변경되었습니다.');
  renderTaskSummary();
  renderTaskBoard();
  updateCommentTargetOptions();
}

function deleteTask(taskId) {
  removeItem('tasks', taskId);
  showToast('업무가 삭제되었습니다.');
  renderTaskSummary();
  updateOwnerFilterOptions();
  renderTaskBoard();
  updateCommentTargetOptions();
}

function updateOwnerFilterOptions() {
  const select = document.querySelector(`#${TASK_FILTER_OWNER_ID}`);
  if (!select) return;
  const owners = [...new Set(getCollection('tasks').map(task => task.owner).filter(Boolean))];
  const current = select.value || 'all';
  select.innerHTML = `<option value="all">전체</option>${owners.map(owner => `<option value="${owner}">${owner}</option>`).join('')}`;
  select.value = owners.includes(current) ? current : 'all';
}

function updateCommentTargetOptions() {
  const select = document.querySelector(`#${TASK_COMMENT_TASK_ID}`);
  const notice = document.querySelector(`#${TASK_COMMENT_NOTICE_ID}`);
  const submit = document.querySelector('#taskCommentSubmit');
  const textarea = document.querySelector(`#${TASK_COMMENT_TEXT_ID}`);
  if (!select) return;
  const tasks = getCollection('tasks').filter(canCommentTask);
  const user = getCurrentUser();
  select.innerHTML = tasks.length ? tasks.map(task => `<option value="${task.id}">${task.title} / ${getUnitName(task.unitTaskId)} / ${task.owner}</option>`).join('') : '<option value="">코멘트 작성 가능 업무 없음</option>';
  if (notice) notice.innerHTML = `<div class="kanban-issue">${getCommentPermissionText(user)}</div>`;
  if (submit) submit.disabled = !tasks.length;
  if (textarea) textarea.disabled = !tasks.length;
}

function getFilteredTasks(applySort = true) {
  const unitId = document.querySelector(`#${TASK_FILTER_UNIT_ID}`)?.value || 'all';
  const owner = document.querySelector(`#${TASK_FILTER_OWNER_ID}`)?.value || 'all';
  const tasks = getCollection('tasks')
    .map(task => ({ ...task, status: normalizeStatus(task.status) }))
    .filter(task => unitId === 'all' || task.unitTaskId === unitId)
    .filter(task => owner === 'all' || task.owner === owner);
  return applySort ? tasks.sort(compareTasks) : tasks;
}

function compareTasks(a, b) {
  const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
  const healthOrder = { overdue: 0, today: 1, soon: 2, normal: 3, done: 4 };
  return (healthOrder[getDueHealth(a).id] ?? 9) - (healthOrder[getDueHealth(b).id] ?? 9)
    || (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
    || String(a.dueDate || '').localeCompare(String(b.dueDate || ''));
}

function seedTasksIfEmpty() {
  if (getCollection('tasks').length) return;
  [
    { title: '바이오 재직자 교육 운영 준비', unitTaskId: '1-1', owner: '이창재', dueDate: '2026-06-30', status: 'DOING', progress: 65, priority: 'HIGH', type: '교육운영', description: '강사 섭외 및 교육장 확정 진행', issue: '참여기업 확정 필요' },
    { title: '스마트모빌리티 실습 프로그램 기획', unitTaskId: '1-2', owner: '담당자', dueDate: '2026-07-05', status: 'PLANNING', progress: 10, priority: 'NORMAL', type: '프로그램기획', description: '실습장비 및 기업 연계 프로그램 구성', issue: '' },
    { title: '문서관리 증빙체계 점검', unitTaskId: 'common', owner: '팀장', dueDate: '2026-06-28', status: 'REVIEW', progress: 90, priority: 'NORMAL', type: '시스템관리', description: '사업계획서·결과보고서·증빙자료 통합 확인', issue: '다운로드 권한 검토' }
  ].forEach((task, index) => upsertItem('tasks', { id: `seed_task_${index}`, createdAt: '2026-06-15', updatedAt: '2026-06-15', ...task }));
}

function migrateLegacyTaskStatuses() {
  getCollection('tasks').forEach(task => {
    const nextStatus = normalizeStatus(task.status);
    if (nextStatus !== task.status) upsertItem('tasks', { ...task, status: nextStatus, updatedAt: new Date().toISOString().slice(0, 10) });
  });
}

function getOwnerStats(tasks) {
  const owners = [...new Set(tasks.map(task => task.owner).filter(Boolean))];
  const stats = owners.map(owner => {
    const ownerTasks = tasks.filter(task => task.owner === owner);
    return {
      owner,
      total: ownerTasks.length,
      active: ownerTasks.filter(task => !['DONE', 'HOLD'].includes(normalizeStatus(task.status))).length,
      doing: ownerTasks.filter(task => normalizeStatus(task.status) === 'DOING').length,
      review: ownerTasks.filter(task => normalizeStatus(task.status) === 'REVIEW').length,
      delayed: ownerTasks.filter(isDelayed).length
    };
  }).sort((a, b) => b.active - a.active || b.total - a.total);
  const maxActive = Math.max(...stats.map(stat => stat.active), 1);
  return stats.map(stat => ({ ...stat, maxActive }));
}

function canCommentTask(task) {
  const user = getCurrentUser();
  if (!task || !user) return false;
  if (MANAGER_COMMENT_ROLES.includes(user.role)) return true;
  if (user.role !== ROLES.PROFESSOR) return false;
  return getProfessorUnitIds(user).includes(task.unitTaskId);
}

function getProfessorUnitIds(user) {
  const raw = [user.unitTaskId, user.responsibleUnit, ...(Array.isArray(user.unitTaskIds) ? user.unitTaskIds : [])].filter(Boolean);
  const fromDepartment = UNIT_OPTIONS.map(unit => unit.id).filter(unitId => String(user.department || '').includes(unitId));
  const units = [...new Set([...raw, ...fromDepartment])].filter(unitId => unitId !== 'all' && unitId !== 'common');
  return units.length ? units : ['1-1'];
}

function getCommentPermissionText(user) {
  if (!user) return '로그인 정보가 없어 코멘트 작성이 제한됩니다.';
  if (MANAGER_COMMENT_ROLES.includes(user.role)) return '사업단장/팀장 권한: 전체 업무보드에 코멘트 작성 가능';
  if (user.role === ROLES.PROFESSOR) return `분야별 책임교수 권한: ${getProfessorUnitIds(user).map(getUnitName).join(', ')} 업무에만 코멘트 작성 가능`;
  return '실무자/조회자는 코멘트 조회만 가능';
}

function normalizeStatus(status) { return LEGACY_STATUS_MAP[status] || (STATUSES.some(item => item.id === status) ? status : 'INBOX'); }
function getStatusLabel(status) { return STATUSES.find(item => item.id === status)?.label || status || '접수'; }
function getUnitName(unitTaskId) { return UNIT_OPTIONS.find(unit => unit.id === unitTaskId)?.name || unitTaskId; }
function getPriorityLabel(priority) { return PRIORITIES.find(item => item.id === priority)?.label || priority || '보통'; }
function isDelayed(task) { return getDueHealth(task).id === 'overdue'; }
function isDueSoon(task) { return ['today', 'soon'].includes(getDueHealth(task).id); }
function getDueText(task) { return getDueHealth(task).label; }
function getDueHealth(task) {
  if (!task.dueDate) return { id: 'normal', label: '마감 미정' };
  if (normalizeStatus(task.status) === 'DONE') return { id: 'done', label: '완료' };
  const today = new Date(new Date().toISOString().slice(0, 10));
  const due = new Date(task.dueDate);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { id: 'overdue', label: `🔴 D+${Math.abs(diff)}` };
  if (diff === 0) return { id: 'today', label: '🔴 D-Day' };
  if (diff <= 7) return { id: 'soon', label: `🟡 D-${diff}` };
  return { id: 'normal', label: `🟢 D-${diff}` };
}
function getCurrentUserName() { return getCurrentUser()?.name || document.querySelector('#userNameTop')?.textContent || '사용자'; }
function escapeAttr(value) { return String(value || '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }

function ensureTaskBoardStyles() {
  if (document.querySelector('#taskBoardV2Styles')) return;
  const style = document.createElement('style');
  style.id = 'taskBoardV2Styles';
  style.textContent = `
    .task-summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:12px;margin-bottom:16px}
    .task-summary-card{border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:14px 16px;box-shadow:0 1px 3px rgba(15,23,42,.05)}
    .task-summary-card.danger{background:#fff7f7;border-color:#fecaca}.task-summary-card.warn{background:#fffbeb;border-color:#fde68a}
    .task-summary-value{font-size:26px;font-weight:950;letter-spacing:-.04em;color:#1d4ed8;line-height:1}.task-summary-card.danger .task-summary-value{color:#dc2626}.task-summary-card.warn .task-summary-value{color:#b45309}
    .task-summary-label{font-size:12px;color:#64748b;font-weight:800;margin-top:7px}
    .task-workload-section{border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;padding:14px}.task-workload-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-bottom:12px}.task-workload-head strong{font-size:14px}.task-workload-head span{font-size:12px;color:#64748b}
    .task-workload-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.task-owner-card{border:1px solid #e2e8f0;background:#fff;border-radius:14px;padding:12px;text-align:left;cursor:pointer}.task-owner-card:hover{border-color:#93c5fd;box-shadow:0 6px 18px rgba(37,99,235,.10)}
    .task-owner-top{display:flex;justify-content:space-between;gap:8px;align-items:center}.task-owner-top strong{font-size:14px}.task-owner-top span{font-size:12px;font-weight:900;color:#1d4ed8;background:#eff6ff;border-radius:999px;padding:3px 8px}.task-owner-meta{font-size:12px;color:#64748b;margin-top:7px}.task-owner-bar{height:7px;border-radius:99px;background:#e2e8f0;overflow:hidden;margin-top:9px}.task-owner-bar i{display:block;height:100%;background:linear-gradient(90deg,#4f46e5,#0ea5e9);border-radius:99px}
    .task-empty-inline{grid-column:1/-1;color:#94a3b8;text-align:center;padding:12px}.task-kanban-v2{display:grid;grid-template-columns:repeat(6,minmax(235px,1fr));gap:12px;overflow-x:auto;padding-bottom:8px;align-items:start}.task-kanban-v2 .kanban-column{min-width:235px}.task-kanban-v2 .kanban-column-head strong{font-size:13px}.task-card-meta-grid{display:grid;grid-template-columns:42px 1fr;gap:3px 8px;margin-top:8px;font-size:12px;color:#64748b}.task-card-meta-grid strong{color:#1e293b;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.task-progress{height:8px;margin:10px 0 6px}.task-progress-text{display:flex;justify-content:space-between}.due-badge.overdue,.due-badge.today{background:#fee2e2;color:#b91c1c}.due-badge.soon{background:#fef3c7;color:#92400e}.due-badge.normal{background:#dcfce7;color:#166534}.due-badge.done{background:#e0e7ff;color:#3730a3}.task-health-overdue{box-shadow:inset 0 0 0 1px rgba(220,38,38,.12)}
    @media(max-width:1280px){.task-kanban-v2{grid-template-columns:repeat(6,260px)}}
  `;
  document.head.appendChild(style);
}
