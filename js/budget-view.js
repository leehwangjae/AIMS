import { getCollection, upsertItem, removeItem } from './store.js';
import { createCard, createEmptyState, createTable } from './components.js';
import { validateRequired, validateNumber } from './form-utils.js';
import { showToast } from './ui.js';
import { BUDGET_SOURCE, BUDGET_UNITS, getBudgetItems } from '../data/budget-data.js';

const EXEC_FORM_ID = 'budgetExecutionForm';
const ALLOC_FORM_ID = 'budgetAllocationForm';
const SUMMARY_ID = 'budgetSummaryContainer';
const ALLOCATION_TABLE_ID = 'budgetAllocationTableContainer';
const EXECUTION_TABLE_ID = 'budgetExecutionTableContainer';
const HISTORY_TABLE_ID = 'budgetAllocationHistoryContainer';
const UNIT_SELECT_ID = 'budgetUnitSelect';
const ITEM_SELECT_ID = 'budgetItemSelect';
const BALANCE_ID = 'budgetItemBalance';
const ALLOC_TARGET_ID = 'budgetAllocationTarget';
const ALLOC_DETAILS_ID = 'budgetAllocationDetails';

export function renderBudgetView(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">Budget Management</div>
        <h2 class="page-title">예산관리</h2>
        <p class="page-desc">${BUDGET_SOURCE.name}의 2차년도 사업비 편성내역을 기준으로 편성액·집행액·잔액을 관리합니다.</p>
      </div>
    </section>
    ${createCard({ title: '예산 요약', content: `<div id="${SUMMARY_ID}"></div>` })}
    ${createCard({ title: '집행내역 입력', content: renderExecutionForm() })}
    ${createCard({ title: '편성항목 추가·수정', content: renderAllocationForm() })}
    ${createCard({ title: '편성 항목별 집행현황', content: `<div id="${ALLOCATION_TABLE_ID}"></div>` })}
    ${createCard({ title: '집행내역', content: `<div id="${EXECUTION_TABLE_ID}"></div>` })}
    ${createCard({ title: '편성 변경 이력', content: `<div id="${HISTORY_TABLE_ID}"></div>` })}
  `;

  bindBudgetForm();
  bindAllocationForm();
  updateBudgetItemOptions();
  updateBudgetBalance();
  updateAllocationTargetOptions();
  renderBudgetTables();
}

function renderExecutionForm() {
  return `
    <form id="${EXEC_FORM_ID}" class="form-grid">
      <label class="form-field"><span>단위과제</span><select name="unitTaskId" id="${UNIT_SELECT_ID}">${BUDGET_UNITS.map(unit => `<option value="${unit.id}">${unit.name}</option>`).join('')}</select></label>
      <label class="form-field"><span>예산항목</span><select name="budgetItemId" id="${ITEM_SELECT_ID}"></select></label>
      <label class="form-field full"><span>현재 예산현황</span><input id="${BALANCE_ID}" type="text" value="0원" readonly /></label>
      <label class="form-field"><span>프로그램명</span><input name="programName" type="text" placeholder="예: 바이오 재직자 교육" /></label>
      <label class="form-field"><span>집행일자</span><input name="executionDate" type="date" /></label>
      <label class="form-field"><span>집행액</span><input name="executed" type="number" min="0" value="0" /></label>
      <label class="form-field full"><span>집행 세부내역/비고</span><input name="memo" type="text" placeholder="예: 강사료, 회의비, 자료집 제작 등" /></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">집행 등록</button><button class="btn btn-outline" type="reset">초기화</button></div>
    </form>`;
}

function renderAllocationForm() {
  return `
    <details id="${ALLOC_DETAILS_ID}" class="budget-allocation-details">
      <summary class="btn btn-outline" style="display:inline-flex;cursor:pointer;">편성항목 추가·수정 열기</summary>
      <form id="${ALLOC_FORM_ID}" class="form-grid" style="margin-top:14px;">
        <label class="form-field"><span>수정 대상</span><select name="targetItemId" id="${ALLOC_TARGET_ID}"></select></label>
        <label class="form-field"><span>단위과제</span><select name="unitTaskId">${BUDGET_UNITS.map(unit => `<option value="${unit.id}">${unit.name}</option>`).join('')}</select></label>
        <label class="form-field"><span>RISE 사업비목</span><input name="riseCategory" type="text" placeholder="예: 교육·연구 프로그램 개발 운영비" /></label>
        <label class="form-field"><span>산단 ERP 비목</span><input name="erpItem" type="text" placeholder="예: 1-1>교육·연구 프로그램 개발 운영비(210-01일반수용비)" /></label>
        <label class="form-field"><span>편성액</span><input name="allocated" type="number" min="0" value="0" /></label>
        <label class="form-field"><span>구분</span><select name="allocationType"><option value="단위과제">단위과제</option><option value="사업단공통">사업단공통</option><option value="단위과제/공통">단위과제/공통</option></select></label>
        <label class="form-field full"><span>수정사유/비고</span><input name="detail" type="text" placeholder="예: 예산 조정, 신규 편성, 감액 등" /></label>
        <div class="form-actions">
          <button class="btn btn-outline" type="button" id="loadBudgetAllocation">불러오기</button>
          <button class="btn btn-primary" type="submit">편성항목 저장</button>
          <button class="btn btn-outline" type="button" id="newBudgetAllocation">신규 항목</button>
          <button class="btn btn-outline" type="button" id="disableBudgetAllocation">사용중지</button>
        </div>
      </form>
    </details>`;
}

function bindBudgetForm() {
  const form = document.querySelector(`#${EXEC_FORM_ID}`);
  if (!form) return;
  form.querySelector(`#${UNIT_SELECT_ID}`)?.addEventListener('change', () => {
    updateBudgetItemOptions();
    updateBudgetBalance();
    syncAllocationUnitWithBudgetUnit();
    renderBudgetTables();
  });
  form.querySelector(`#${ITEM_SELECT_ID}`)?.addEventListener('change', updateBudgetBalance);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['unitTaskId', 'budgetItemId', 'programName', 'executionDate']).valid) return showToast('필수 입력 항목을 확인해 주세요.');
    if (!validateNumber(values.executed, { min: 0 }).valid) return showToast('집행액을 확인해 주세요.');
    const item = getManagedBudgetItem(values.budgetItemId);
    const remaining = getManagedRemaining(item, getCollection('budgets'));
    if (item && Number(values.executed) > remaining) return showToast('집행액이 현재 잔액을 초과합니다.');

    upsertItem('budgets', {
      id: `budget_exec_${Date.now()}`,
      unitTaskId: values.unitTaskId,
      budgetItemId: values.budgetItemId,
      category: item?.riseCategory || '미분류',
      erpItem: item?.erpItem || '',
      programName: values.programName,
      allocated: 0,
      executed: Number(values.executed),
      executionDate: values.executionDate,
      executionRate: item?.allocated ? `${round1((Number(values.executed) / Number(item.allocated)) * 100)}%` : '0%',
      memo: values.memo || ''
    });

    showToast('집행내역이 등록되었습니다.');
    form.reset();
    updateBudgetItemOptions();
    updateBudgetBalance();
    renderBudgetTables();
  });
}

function bindAllocationForm() {
  const form = document.querySelector(`#${ALLOC_FORM_ID}`);
  if (!form) return;
  form.querySelector('[name="unitTaskId"]')?.addEventListener('change', updateAllocationTargetOptions);
  document.querySelector('#loadBudgetAllocation')?.addEventListener('click', () => loadAllocationToForm());
  document.querySelector('#newBudgetAllocation')?.addEventListener('click', () => clearAllocationForm());
  document.querySelector('#disableBudgetAllocation')?.addEventListener('click', () => disableAllocation());

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['unitTaskId', 'riseCategory', 'erpItem']).valid) return showToast('편성항목 기본정보를 입력해 주세요.');
    if (!validateNumber(values.allocated, { min: 0 }).valid) return showToast('편성액을 확인해 주세요.');
    const targetId = values.targetItemId && values.targetItemId !== '__new__' ? values.targetItemId : '';
    const previous = targetId ? getManagedBudgetItem(targetId, { includeInactive: true }) : null;
    const id = targetId || `custom_budget_${Date.now()}`;

    upsertItem('budgetAllocations', {
      id,
      baseItemId: previous?.source === 'base' ? previous.id : previous?.baseItemId || '',
      unitTaskId: values.unitTaskId,
      riseCategory: values.riseCategory,
      erpItem: values.erpItem,
      allocated: Number(values.allocated),
      allocationType: values.allocationType,
      detail: values.detail || '',
      status: 'ACTIVE',
      source: 'custom'
    });

    addAllocationHistory({ previous, next: { id, ...values, allocated: Number(values.allocated) }, action: previous ? '수정' : '신규' });
    showToast(previous ? '편성항목이 수정되었습니다.' : '편성항목이 추가되었습니다.');
    updateBudgetItemOptions();
    updateBudgetBalance();
    updateAllocationTargetOptions();
    clearAllocationForm(false);
    renderBudgetTables();
  });
}

function updateBudgetItemOptions() {
  const unitTaskId = document.querySelector(`#${UNIT_SELECT_ID}`)?.value || BUDGET_UNITS[0].id;
  const select = document.querySelector(`#${ITEM_SELECT_ID}`);
  if (!select) return;
  const items = getManagedBudgetItems(unitTaskId);
  select.innerHTML = items.map(item => `<option value="${item.id}">${item.riseCategory} / ${shorten(item.erpItem, 68)}</option>`).join('');
}

function updateBudgetBalance() {
  const itemId = document.querySelector(`#${ITEM_SELECT_ID}`)?.value;
  const target = document.querySelector(`#${BALANCE_ID}`);
  if (!target) return;
  const item = getManagedBudgetItem(itemId);
  if (!item) {
    target.value = '편성 예산 없음';
    return;
  }
  const executions = getCollection('budgets');
  target.value = `편성 ${formatWon(item.allocated)} / 집행 ${formatWon(getManagedExecuted(item, executions))} / 잔액 ${formatWon(getManagedRemaining(item, executions))} / 집행률 ${getManagedRate(item, executions)}%`;
}

function syncAllocationUnitWithBudgetUnit() {
  const unitTaskId = document.querySelector(`#${UNIT_SELECT_ID}`)?.value;
  const form = document.querySelector(`#${ALLOC_FORM_ID}`);
  if (!unitTaskId || !form) return;
  form.querySelector('[name="unitTaskId"]').value = unitTaskId;
  updateAllocationTargetOptions();
}

function updateAllocationTargetOptions() {
  const form = document.querySelector(`#${ALLOC_FORM_ID}`);
  const unitTaskId = form?.querySelector('[name="unitTaskId"]')?.value || BUDGET_UNITS[0].id;
  const select = document.querySelector(`#${ALLOC_TARGET_ID}`);
  if (!select) return;
  const items = getManagedBudgetItems(unitTaskId, { includeInactive: true });
  select.innerHTML = `<option value="__new__">신규 항목 추가</option>${items.map(item => `<option value="${item.id}">${item.status === 'INACTIVE' ? '[사용중지] ' : ''}${item.riseCategory} / ${shorten(item.erpItem, 68)} / ${formatWon(item.allocated)}</option>`).join('')}`;
}

function loadAllocationToForm(itemId) {
  const form = document.querySelector(`#${ALLOC_FORM_ID}`);
  if (!form) return;
  const targetId = itemId || form.querySelector('[name="targetItemId"]')?.value;
  if (!targetId || targetId === '__new__') return clearAllocationForm();
  const item = getManagedBudgetItem(targetId, { includeInactive: true });
  if (!item) return showToast('편성항목을 찾을 수 없습니다.');
  form.querySelector('[name="targetItemId"]').value = item.id;
  form.querySelector('[name="unitTaskId"]').value = item.unitTaskId;
  form.querySelector('[name="riseCategory"]').value = item.riseCategory;
  form.querySelector('[name="erpItem"]').value = item.erpItem;
  form.querySelector('[name="allocated"]').value = item.allocated;
  form.querySelector('[name="allocationType"]').value = item.allocationType || '단위과제';
  form.querySelector('[name="detail"]').value = item.detail || '';
  document.querySelector(`#${ALLOC_DETAILS_ID}`)?.setAttribute('open', 'open');
}

function clearAllocationForm(resetUnit = true) {
  const form = document.querySelector(`#${ALLOC_FORM_ID}`);
  if (!form) return;
  const unitTaskId = form.querySelector('[name="unitTaskId"]')?.value;
  form.reset();
  if (!resetUnit && unitTaskId) form.querySelector('[name="unitTaskId"]').value = unitTaskId;
  updateAllocationTargetOptions();
  document.querySelector(`#${ALLOC_DETAILS_ID}`)?.setAttribute('open', 'open');
}

function disableAllocation() {
  const form = document.querySelector(`#${ALLOC_FORM_ID}`);
  const targetId = form?.querySelector('[name="targetItemId"]')?.value;
  if (!targetId || targetId === '__new__') return showToast('사용중지할 편성항목을 선택해 주세요.');
  const item = getManagedBudgetItem(targetId, { includeInactive: true });
  if (!item) return;
  upsertItem('budgetAllocations', { ...item, baseItemId: item.source === 'base' ? item.id : item.baseItemId || '', status: 'INACTIVE', source: 'custom' });
  addAllocationHistory({ previous: item, next: { ...item, status: 'INACTIVE' }, action: '사용중지' });
  showToast('편성항목이 사용중지 처리되었습니다.');
  updateBudgetItemOptions();
  updateBudgetBalance();
  updateAllocationTargetOptions();
  renderBudgetTables();
}

function renderBudgetTables() {
  const unitTaskId = document.querySelector(`#${UNIT_SELECT_ID}`)?.value || BUDGET_UNITS[0].id;
  const executions = getCollection('budgets').filter(row => row.unitTaskId === unitTaskId);
  const items = getManagedBudgetItems(unitTaskId);
  renderSummary(unitTaskId, items, executions);
  renderAllocationTable(items, executions);
  renderExecutionTable(unitTaskId, executions);
  renderHistoryTable(unitTaskId);
}

function renderSummary(unitTaskId, items, executions) {
  const target = document.querySelector(`#${SUMMARY_ID}`);
  if (!target) return;
  const allocated = items.reduce((sum, item) => sum + Number(item.allocated || 0), 0);
  const executed = items.reduce((sum, item) => sum + getManagedExecuted(item, executions), 0);
  const remaining = Math.max(allocated - executed, 0);
  const rate = allocated ? round1((executed / allocated) * 100) : 0;
  const safeRate = Math.min(rate, 100);
  target.innerHTML = `
    <div class="budget-summary-visual">
      <div class="budget-summary-head">
        <div><div class="budget-summary-sub">현재 단위과제</div><div class="budget-summary-title">${getUnitName(unitTaskId)}</div></div>
        <div class="budget-summary-rate">집행률 ${rate}%</div>
      </div>
      <div class="budget-summary-bar"><div class="budget-summary-fill" style="width:${safeRate}%;"></div></div>
      <div class="kpi-card-grid">
        <div class="metric-card"><div class="metric-value">${formatWon(allocated)}</div><div class="metric-label">편성액</div></div>
        <div class="metric-card"><div class="metric-value">${formatWon(executed)}</div><div class="metric-label">집행액</div></div>
        <div class="metric-card"><div class="metric-value">${formatWon(remaining)}</div><div class="metric-label">잔액</div></div>
        <div class="metric-card"><div class="metric-value">${items.length}</div><div class="metric-label">사용중 편성항목</div></div>
      </div>
    </div>`;
}

function renderAllocationTable(items, executions) {
  const target = document.querySelector(`#${ALLOCATION_TABLE_ID}`);
  if (!target) return;
  if (!items.length) return target.innerHTML = createEmptyState({ title: '편성 항목 없음', description: '해당 단위과제 편성내역이 없습니다.' });
  const rows = items.map(item => {
    const executed = getManagedExecuted(item, executions);
    const remaining = getManagedRemaining(item, executions);
    return {
      riseCategory: item.riseCategory,
      erpItem: item.erpItem,
      allocationType: item.allocationType,
      allocated: formatWon(item.allocated),
      executed: formatWon(executed),
      remaining: formatWon(remaining),
      rate: `${getManagedRate(item, executions)}%`,
      detail: item.detail || '-',
      action: `<button class="btn btn-outline" type="button" data-edit-budget-item="${item.id}">수정</button>`
    };
  });
  target.innerHTML = createTable({ columns: [
    { key: 'riseCategory', label: 'RISE 사업비목' },
    { key: 'erpItem', label: '산단 ERP 비목' },
    { key: 'allocationType', label: '구분' },
    { key: 'allocated', label: '편성액' },
    { key: 'executed', label: '집행액' },
    { key: 'remaining', label: '잔액' },
    { key: 'rate', label: '집행률' },
    { key: 'detail', label: '비고' },
    { key: 'action', label: '관리' }
  ], rows });
  target.querySelectorAll('[data-edit-budget-item]').forEach(button => {
    button.addEventListener('click', () => loadAllocationToForm(button.dataset.editBudgetItem));
  });
}

function renderExecutionTable(unitTaskId, executions) {
  const target = document.querySelector(`#${EXECUTION_TABLE_ID}`);
  if (!target) return;
  if (!executions.length) return target.innerHTML = createEmptyState({ title: '집행내역 없음', description: '집행내역을 등록해 주세요.' });
  const rows = executions.map(row => ({ executionDate: row.executionDate || '-', programName: row.programName || '-', category: row.category || '-', erpItem: row.erpItem || '-', executed: formatWon(row.executed), memo: row.memo || '-' }));
  target.innerHTML = `${createTable({ columns: [
    { key: 'executionDate', label: '집행일자' },
    { key: 'programName', label: '프로그램명' },
    { key: 'category', label: 'RISE 사업비목' },
    { key: 'erpItem', label: '산단 ERP 비목' },
    { key: 'executed', label: '집행액' },
    { key: 'memo', label: '비고' }
  ], rows })}<div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestBudgetExecution" type="button">최근 집행내역 삭제</button></div>`;
  document.querySelector('#deleteLatestBudgetExecution')?.addEventListener('click', () => {
    const latest = getCollection('budgets').filter(row => row.unitTaskId === unitTaskId).at(-1);
    if (!latest) return;
    removeItem('budgets', latest.id);
    showToast('최근 집행내역이 삭제되었습니다.');
    updateBudgetItemOptions();
    updateBudgetBalance();
    renderBudgetTables();
  });
}

function renderHistoryTable(unitTaskId) {
  const target = document.querySelector(`#${HISTORY_TABLE_ID}`);
  if (!target) return;
  const rows = getCollection('budgetAllocationHistory')
    .filter(row => row.unitTaskId === unitTaskId)
    .slice()
    .reverse()
    .map(row => ({ ...row, previousAllocated: formatWon(row.previousAllocated), nextAllocated: formatWon(row.nextAllocated), diff: formatWon(row.diff) }));
  if (!rows.length) return target.innerHTML = createEmptyState({ title: '변경 이력 없음', description: '편성항목 추가·수정·사용중지 시 이력이 자동 기록됩니다.' });
  target.innerHTML = createTable({ columns: [
    { key: 'changedAt', label: '변경일시' },
    { key: 'action', label: '구분' },
    { key: 'riseCategory', label: 'RISE 사업비목' },
    { key: 'previousAllocated', label: '기존 편성액' },
    { key: 'nextAllocated', label: '변경 편성액' },
    { key: 'diff', label: '증감' },
    { key: 'reason', label: '사유' }
  ], rows });
}

function getManagedBudgetItems(unitTaskId, options = {}) {
  const customRows = getCollection('budgetAllocations');
  const customByBase = new Map(customRows.filter(row => row.baseItemId).map(row => [row.baseItemId, row]));
  const customOnly = customRows.filter(row => !row.baseItemId && row.unitTaskId === unitTaskId);
  const baseItems = getBudgetItems(unitTaskId).map(item => {
    const override = customByBase.get(item.id);
    return override ? { ...item, ...override, source: 'custom' } : { ...item, source: 'base', status: 'ACTIVE' };
  });
  return [...baseItems, ...customOnly]
    .filter(item => item.unitTaskId === unitTaskId)
    .filter(item => options.includeInactive || item.status !== 'INACTIVE');
}

function getManagedBudgetItem(itemId, options = {}) {
  const allUnits = BUDGET_UNITS.flatMap(unit => getManagedBudgetItems(unit.id, { includeInactive: true }));
  const item = allUnits.find(row => row.id === itemId || row.baseItemId === itemId);
  if (!item) return null;
  if (!options.includeInactive && item.status === 'INACTIVE') return null;
  return item;
}

function getManagedExecuted(item, executions = []) {
  if (!item) return 0;
  const linkedIds = [item.id, item.baseItemId].filter(Boolean);
  return executions
    .filter(row => row.unitTaskId === item.unitTaskId)
    .filter(row => linkedIds.includes(row.budgetItemId) || (!row.budgetItemId && row.category === item.riseCategory))
    .reduce((sum, row) => sum + Number(row.executed || 0), 0);
}

function getManagedRemaining(item, executions = []) {
  if (!item) return 0;
  return Math.max(Number(item.allocated || 0) - getManagedExecuted(item, executions), 0);
}

function getManagedRate(item, executions = []) {
  const allocated = Number(item?.allocated || 0);
  if (!allocated) return 0;
  return round1((getManagedExecuted(item, executions) / allocated) * 100);
}

function addAllocationHistory({ previous, next, action }) {
  const prevAmount = Number(previous?.allocated || 0);
  const nextAmount = Number(next?.allocated || 0);
  upsertItem('budgetAllocationHistory', {
    id: `budget_history_${Date.now()}`,
    unitTaskId: next.unitTaskId || previous?.unitTaskId || '',
    budgetItemId: next.id || previous?.id || '',
    changedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    action,
    riseCategory: next.riseCategory || previous?.riseCategory || '',
    previousAllocated: prevAmount,
    nextAllocated: nextAmount,
    diff: nextAmount - prevAmount,
    reason: next.detail || previous?.detail || '-'
  });
}

function getUnitName(unitTaskId) {
  return BUDGET_UNITS.find(unit => unit.id === unitTaskId)?.name || unitTaskId;
}

function shorten(value, max = 48) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function formatWon(value) {
  return `${Number(value || 0).toLocaleString()}원`;
}

function round1(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}
