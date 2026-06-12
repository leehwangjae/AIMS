import { getCollection, upsertItem, removeItem } from './store.js';
import { createCard, createEmptyState, createTable } from './components.js';
import { validateRequired, validateNumber } from './form-utils.js';
import { showToast } from './ui.js';
import { BUDGET_SOURCE, BUDGET_UNITS, getBudgetItems, getBudgetItem, getBudgetExecutedAmount, getBudgetRemaining, getBudgetRate, getUnitBudgetTotal } from '../data/budget-data.js';

const FORM_ID = 'budgetExecutionForm';
const SUMMARY_ID = 'budgetSummaryContainer';
const ALLOCATION_TABLE_ID = 'budgetAllocationTableContainer';
const EXECUTION_TABLE_ID = 'budgetExecutionTableContainer';
const UNIT_SELECT_ID = 'budgetUnitSelect';
const ITEM_SELECT_ID = 'budgetItemSelect';
const BALANCE_ID = 'budgetItemBalance';

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
    ${createCard({ title: '집행내역 입력', content: renderExecutionForm() })}
    ${createCard({ title: '예산 요약', content: `<div id="${SUMMARY_ID}"></div>` })}
    ${createCard({ title: '편성 항목별 집행현황', content: `<div id="${ALLOCATION_TABLE_ID}"></div>` })}
    ${createCard({ title: '집행내역', content: `<div id="${EXECUTION_TABLE_ID}"></div>` })}
  `;

  bindBudgetForm();
  updateBudgetItemOptions();
  updateBudgetBalance();
  renderBudgetTables();
}

function renderExecutionForm() {
  return `
    <form id="${FORM_ID}" class="form-grid">
      <label class="form-field"><span>단위과제</span><select name="unitTaskId" id="${UNIT_SELECT_ID}">${BUDGET_UNITS.map(unit => `<option value="${unit.id}">${unit.name}</option>`).join('')}</select></label>
      <label class="form-field"><span>예산항목</span><select name="budgetItemId" id="${ITEM_SELECT_ID}"></select></label>
      <label class="form-field"><span>현재 잔액</span><input id="${BALANCE_ID}" type="text" value="0원" readonly /></label>
      <label class="form-field"><span>프로그램명</span><input name="programName" type="text" placeholder="예: 바이오 재직자 교육" /></label>
      <label class="form-field"><span>집행일자</span><input name="executionDate" type="date" /></label>
      <label class="form-field"><span>집행액</span><input name="executed" type="number" min="0" value="0" /></label>
      <label class="form-field full"><span>집행 세부내역/비고</span><input name="memo" type="text" placeholder="예: 강사료, 회의비, 자료집 제작 등" /></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">집행 등록</button><button class="btn btn-outline" type="reset">초기화</button></div>
    </form>`;
}

function bindBudgetForm() {
  const form = document.querySelector(`#${FORM_ID}`);
  if (!form) return;

  form.querySelector(`#${UNIT_SELECT_ID}`)?.addEventListener('change', () => {
    updateBudgetItemOptions();
    updateBudgetBalance();
    renderBudgetTables();
  });
  form.querySelector(`#${ITEM_SELECT_ID}`)?.addEventListener('change', updateBudgetBalance);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['unitTaskId', 'budgetItemId', 'programName', 'executionDate']).valid) return showToast('필수 입력 항목을 확인해 주세요.');
    if (!validateNumber(values.executed, { min: 0 }).valid) return showToast('집행액을 확인해 주세요.');

    const item = getBudgetItem(values.budgetItemId);
    const remaining = getBudgetRemaining(item, getCollection('budgets'));
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

function updateBudgetItemOptions() {
  const unitTaskId = document.querySelector(`#${UNIT_SELECT_ID}`)?.value || BUDGET_UNITS[0].id;
  const select = document.querySelector(`#${ITEM_SELECT_ID}`);
  if (!select) return;
  const executions = getCollection('budgets');
  const items = getBudgetItems(unitTaskId);
  select.innerHTML = items.map(item => `<option value="${item.id}">${item.riseCategory} / ${shorten(item.erpItem)} / 잔액 ${formatWon(getBudgetRemaining(item, executions))}</option>`).join('');
}

function updateBudgetBalance() {
  const itemId = document.querySelector(`#${ITEM_SELECT_ID}`)?.value;
  const target = document.querySelector(`#${BALANCE_ID}`);
  if (!target) return;
  const item = getBudgetItem(itemId);
  target.value = item ? formatWon(getBudgetRemaining(item, getCollection('budgets'))) : '편성 예산 없음';
}

function renderBudgetTables() {
  const unitTaskId = document.querySelector(`#${UNIT_SELECT_ID}`)?.value || BUDGET_UNITS[0].id;
  const executions = getCollection('budgets').filter(row => row.unitTaskId === unitTaskId);
  const items = getBudgetItems(unitTaskId);

  renderSummary(unitTaskId, items, executions);
  renderAllocationTable(items, executions);
  renderExecutionTable(unitTaskId, executions);
}

function renderSummary(unitTaskId, items, executions) {
  const target = document.querySelector(`#${SUMMARY_ID}`);
  if (!target) return;
  const allocated = getUnitBudgetTotal(unitTaskId);
  const executed = items.reduce((sum, item) => sum + getBudgetExecutedAmount(item, executions), 0);
  const remaining = Math.max(allocated - executed, 0);
  const rate = allocated ? round1((executed / allocated) * 100) : 0;

  target.innerHTML = `
    <div class="kpi-card-grid">
      <div class="metric-card"><div class="metric-value">${formatWon(allocated)}</div><div class="metric-label">편성액</div></div>
      <div class="metric-card"><div class="metric-value">${formatWon(executed)}</div><div class="metric-label">집행액</div></div>
      <div class="metric-card"><div class="metric-value">${formatWon(remaining)}</div><div class="metric-label">잔액</div></div>
      <div class="metric-card"><div class="metric-value">${rate}%</div><div class="metric-label">집행률</div></div>
    </div>`;
}

function renderAllocationTable(items, executions) {
  const target = document.querySelector(`#${ALLOCATION_TABLE_ID}`);
  if (!target) return;
  if (!items.length) return target.innerHTML = createEmptyState({ title: '편성 항목 없음', description: '해당 단위과제 편성내역이 없습니다.' });

  const rows = items.map(item => {
    const executed = getBudgetExecutedAmount(item, executions);
    const remaining = getBudgetRemaining(item, executions);
    return {
      riseCategory: item.riseCategory,
      erpItem: item.erpItem,
      allocationType: item.allocationType,
      allocated: formatWon(item.allocated),
      executed: formatWon(executed),
      remaining: formatWon(remaining),
      rate: `${getBudgetRate(item, executions)}%`,
      detail: item.detail || '-'
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
    { key: 'detail', label: '비고' }
  ], rows });
}

function renderExecutionTable(unitTaskId, executions) {
  const target = document.querySelector(`#${EXECUTION_TABLE_ID}`);
  if (!target) return;
  if (!executions.length) return target.innerHTML = createEmptyState({ title: '집행내역 없음', description: '집행내역을 등록해 주세요.' });

  const rows = executions.map(row => ({
    executionDate: row.executionDate || '-',
    programName: row.programName || '-',
    category: row.category || '-',
    erpItem: row.erpItem || '-',
    executed: formatWon(row.executed),
    memo: row.memo || '-'
  }));

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

function shorten(value) {
  const text = String(value || '');
  return text.length > 48 ? `${text.slice(0, 48)}...` : text;
}

function formatWon(value) {
  return `${Number(value || 0).toLocaleString()}원`;
}

function round1(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}
