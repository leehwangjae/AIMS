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

const FUND_TYPES = [
  { id: 'CURRENT', label: '당해연도 사업비', shortLabel: '당해', color: '#1e40af', bg: '#dbeafe' },
  { id: 'CARRYOVER', label: '이월사업비', shortLabel: '이월', color: '#0f6e56', bg: '#d1fae5' }
];

const CATEGORY_COLORS = ['#185fa5', '#534ab7', '#0f6e56', '#854f0b', '#993c1d', '#64748b'];
let activeFundFilter = 'ALL';

export function renderBudgetView(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">Budget Management</div>
        <h2 class="page-title">예산관리</h2>
        <p class="page-desc">${BUDGET_SOURCE.name} 기준 편성액을 이월사업비와 당해연도 사업비로 구분하여 집행·잔액을 직관적으로 확인합니다.</p>
      </div>
    </section>
    ${createCard({ title: '예산 집행현황', content: `<div id="${SUMMARY_ID}"></div>` })}
    ${createCard({ title: '집행내역 입력', content: renderExecutionForm() })}
    ${createCard({ title: '편성항목 추가·수정', content: renderAllocationForm() })}
    ${createCard({ title: '편성 항목별 상세현황', content: `<div id="${ALLOCATION_TABLE_ID}"></div>` })}
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
        <label class="form-field"><span>재원구분</span><select name="fundType">${FUND_TYPES.map(type => `<option value="${type.id}">${type.label}</option>`).join('')}</select></label>
        <label class="form-field"><span>RISE 사업비목</span><input name="riseCategory" type="text" placeholder="예: 교육·연구 프로그램 개발 운영비" /></label>
        <label class="form-field"><span>산단 ERP 비목</span><input name="erpItem" type="text" placeholder="예: 1-1>교육·연구 프로그램 개발 운영비(210-01일반수용비)" /></label>
        <label class="form-field"><span>편성액</span><input name="allocated" type="number" min="0" value="0" /></label>
        <label class="form-field"><span>구분</span><select name="allocationType"><option value="단위과제">단위과제</option><option value="사업단공통">사업단공통</option><option value="단위과제/공통">단위과제/공통</option></select></label>
        <label class="form-field full"><span>수정사유/비고</span><input name="detail" type="text" placeholder="예: 이월사업비 편성, 당해연도 예산 조정, 감액 등" /></label>
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
    if (item && Number(values.executed) > remaining) return showToast('집행액이 해당 재원의 현재 잔액을 초과합니다.');
    upsertItem('budgets', { id: `budget_exec_${Date.now()}`, unitTaskId: values.unitTaskId, budgetItemId: values.budgetItemId, fundType: getFundType(item), category: item?.riseCategory || '미분류', erpItem: item?.erpItem || '', programName: values.programName, allocated: 0, executed: Number(values.executed), executionDate: values.executionDate, executionRate: item?.allocated ? `${round1((Number(values.executed) / Number(item.allocated)) * 100)}%` : '0%', memo: values.memo || '' });
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
  form.querySelector('[name="fundType"]')?.addEventListener('change', updateAllocationTargetOptions);
  document.querySelector('#loadBudgetAllocation')?.addEventListener('click', () => loadAllocationToForm());
  document.querySelector('#newBudgetAllocation')?.addEventListener('click', () => clearAllocationForm());
  document.querySelector('#disableBudgetAllocation')?.addEventListener('click', () => disableAllocation());
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['unitTaskId', 'fundType', 'riseCategory', 'erpItem']).valid) return showToast('편성항목 기본정보를 입력해 주세요.');
    if (!validateNumber(values.allocated, { min: 0 }).valid) return showToast('편성액을 확인해 주세요.');
    const targetId = values.targetItemId && values.targetItemId !== '__new__' ? values.targetItemId : '';
    const previous = targetId ? getManagedBudgetItem(targetId, { includeInactive: true }) : null;
    const id = targetId || `custom_budget_${Date.now()}`;
    upsertItem('budgetAllocations', { id, baseItemId: previous?.source === 'base' ? previous.id : previous?.baseItemId || '', unitTaskId: values.unitTaskId, fundType: values.fundType, riseCategory: values.riseCategory, erpItem: values.erpItem, allocated: Number(values.allocated), allocationType: values.allocationType, detail: values.detail || '', status: 'ACTIVE', source: 'custom' });
    addAllocationHistory({ previous, next: { id, ...values, allocated: Number(values.allocated) }, action: previous ? '수정' : '신규' });
    showToast(previous ? '편성항목이 수정되었습니다.' : '편성항목이 추가되었습니다.');
    updateBudgetItemOptions();
    updateBudgetBalance();
    updateAllocationTargetOptions();
    clearAllocationForm(false);
    renderBudgetTables();
  });
}

function renderBudgetTables() {
  const unitTaskId = getSelectedUnitId();
  const executions = getCollection('budgets').filter(row => row.unitTaskId === unitTaskId);
  const allItems = getManagedBudgetItems(unitTaskId);
  const displayItems = filterByFund(allItems);
  const displayExecutions = filterExecutionsByFund(executions);
  renderSummary(unitTaskId, allItems, executions);
  renderAllocationTable(displayItems, executions);
  renderExecutionTable(unitTaskId, displayExecutions);
  renderHistoryTable(unitTaskId);
}

function renderSummary(unitTaskId, items, executions) {
  const target = document.querySelector(`#${SUMMARY_ID}`);
  if (!target) return;
  const displayItems = filterByFund(items);
  const total = getFundSummary(displayItems, executions);
  const current = getFundSummary(items.filter(item => getFundType(item) === 'CURRENT'), executions);
  const carryover = getFundSummary(items.filter(item => getFundType(item) === 'CARRYOVER'), executions);
  const categorySummary = getCategorySummary(displayItems, executions);
  const typeLabel = activeFundFilter === 'CARRYOVER' ? '이월사업비' : activeFundFilter === 'CURRENT' ? '당해연도 사업비' : '전체';
  const rateColorValue = rateColor(total.rate);

  target.innerHTML = `
    <div class="budget-dashboard-v2">
      <div class="budget-toolbar-v2">
        <div class="budget-filter-group">
          ${BUDGET_UNITS.map(unit => `<button type="button" class="budget-filter-btn ${unit.id === unitTaskId ? 'active' : ''}" data-budget-unit="${unit.id}">${unit.name.replace(' ', '<br>')}</button>`).join('')}
        </div>
        <div class="budget-fund-tabs">
          <button type="button" class="budget-fund-tab ${activeFundFilter === 'ALL' ? 'active all' : ''}" data-budget-fund="ALL">전체</button>
          <button type="button" class="budget-fund-tab ${activeFundFilter === 'CARRYOVER' ? 'active carryover' : ''}" data-budget-fund="CARRYOVER">이월사업비</button>
          <button type="button" class="budget-fund-tab ${activeFundFilter === 'CURRENT' ? 'active current' : ''}" data-budget-fund="CURRENT">당해연도 사업비</button>
        </div>
      </div>

      <div class="budget-kpi-grid-v2">
        ${renderBudgetKpiCard(`${typeLabel} 편성`, formatWon(total.allocated), '#3b82f6')}
        ${renderBudgetKpiCard(`${typeLabel} 집행`, formatWon(total.executed), '#10b981')}
        ${renderBudgetKpiCard('잔액', formatWon(total.remaining), '#f59e0b')}
        ${renderBudgetKpiCard('집행률', `${total.rate}%`, rateColorValue)}
      </div>

      ${activeFundFilter === 'ALL' ? renderFundSplit(carryover, current) : ''}
      ${renderTotalProgress(typeLabel, total)}
      ${renderCategoryCards(categorySummary)}
      ${renderCrossTable(unitTaskId)}
    </div>`;

  bindBudgetDashboardControls();
}

function renderBudgetKpiCard(label, value, color) {
  return `<div class="budget-kpi-card-v2"><div class="budget-kpi-value-v2" style="color:${color};">${value}</div><div class="budget-kpi-label-v2">${label}</div></div>`;
}

function renderFundSplit(carryover, current) {
  return `
    <div class="budget-split-row-v2">
      ${renderFundSplitCard('이월사업비', carryover, '#0f6e56', '#d1fae5')}
      ${renderFundSplitCard('당해연도 사업비', current, '#1e40af', '#dbeafe')}
    </div>`;
}

function renderFundSplitCard(label, summary, color, bg) {
  return `
    <div class="budget-split-card-v2">
      <div class="budget-split-head-v2" style="background:${bg};color:${color};"><strong>${label}</strong><span>${summary.rate}% 집행</span></div>
      <div class="budget-split-body-v2">
        <div class="budget-mini-track-v2"><div class="budget-mini-fill-v2" style="width:${Math.min(summary.rate, 100)}%;background:${color};"></div></div>
        <div class="budget-split-numbers-v2">
          <span>편성 <b>${formatManwon(summary.allocated)}</b></span>
          <span>집행 <b>${formatManwon(summary.executed)}</b></span>
          <span>잔액 <b>${formatManwon(summary.remaining)}</b></span>
        </div>
      </div>
    </div>`;
}

function renderTotalProgress(label, summary) {
  const color = rateColor(summary.rate);
  return `
    <div class="budget-total-bar-v2">
      <div class="budget-total-head-v2"><strong>${label} 집행 현황</strong><span style="color:${color};">${summary.rate}%</span></div>
      <div class="budget-total-track-v2"><div class="budget-total-fill-v2" style="width:${Math.min(summary.rate, 100)}%;background:${color};"></div></div>
      <div class="budget-total-legend-v2"><span><i style="background:${color};"></i>집행 ${formatWon(summary.executed)}</span><span><i style="background:#e5e7eb;"></i>잔액 ${formatWon(summary.remaining)}</span></div>
    </div>`;
}

function renderCategoryCards(summaryRows) {
  return `
    <section class="budget-panel-v2">
      <div class="budget-panel-head-v2"><strong>비목별 집행 현황</strong><span>${summaryRows.length}개 비목</span></div>
      <div class="budget-category-grid-v2">
        ${summaryRows.length ? summaryRows.map((row, index) => renderCategoryCard(row, index)).join('') : '<div class="budget-empty-v2">해당 재원구분의 비목이 없습니다.</div>'}
      </div>
    </section>`;
}

function renderCategoryCard(row, index) {
  const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  const rColor = rateColor(row.rate);
  return `
    <div class="budget-category-card-v2">
      <div class="budget-category-name-v2"><i style="background:${color};"></i>${shorten(row.category, 28)}</div>
      <div class="budget-category-rate-v2" style="color:${rColor};">${row.rate}%</div>
      <div class="budget-category-track-v2"><div style="width:${Math.min(row.rate, 100)}%;background:${rColor};"></div></div>
      <div class="budget-category-numbers-v2">
        <div><span>편성</span><strong>${formatManwon(row.allocated)}</strong></div>
        <div><span>집행</span><strong>${formatManwon(row.executed)}</strong></div>
        <div class="wide"><span>잔액</span><strong>${formatManwon(row.remaining)}</strong></div>
      </div>
    </div>`;
}

function renderCrossTable(selectedUnitId) {
  const categories = getAllCategories();
  const units = BUDGET_UNITS;
  return `
    <section class="budget-panel-v2">
      <div class="budget-panel-head-v2"><strong>단위과제 × 재원구분 × 비목 교차 현황</strong><span><em class="budget-chip carryover">이월</em> / <em class="budget-chip current">당해</em> 집행액(만원)</span></div>
      <div class="table-wrap">
        <table class="budget-cross-table-v2">
          <thead>
            <tr><th>비목</th>${units.map(unit => `<th colspan="2" class="unit-head ${unit.id === selectedUnitId ? 'selected' : ''}">${unit.id}</th>`).join('')}<th>합계</th></tr>
            <tr><th></th>${units.map(() => `<th><em class="budget-chip carryover">이월</em></th><th><em class="budget-chip current">당해</em></th>`).join('')}<th></th></tr>
          </thead>
          <tbody>${categories.map((category, index) => renderCrossRow(category, units, index)).join('')}</tbody>
        </table>
      </div>
    </section>`;
}

function renderCrossRow(category, units, index) {
  let rowTotal = 0;
  const cells = units.map(unit => {
    const carry = getCrossCell(unit.id, category, 'CARRYOVER');
    const current = getCrossCell(unit.id, category, 'CURRENT');
    rowTotal += carry.executed + current.executed;
    return `${renderCrossCell(carry)}${renderCrossCell(current)}`;
  }).join('');
  const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  return `<tr><td><span class="budget-category-badge-v2" style="border-left-color:${color};">${shorten(category, 20)}</span></td>${cells}<td class="amount strong">${formatManwonNumber(rowTotal)}</td></tr>`;
}

function renderCrossCell(cell) {
  if (!cell.allocated) return '<td class="amount muted">-</td>';
  const color = rateColor(cell.rate);
  return `<td class="amount"><strong style="color:${color};">${formatManwonNumber(cell.executed)}</strong><span style="color:${color};"> (${cell.rate}%)</span></td>`;
}

function bindBudgetDashboardControls() {
  document.querySelectorAll('[data-budget-unit]').forEach(button => {
    button.addEventListener('click', () => {
      const unitId = button.dataset.budgetUnit;
      const select = document.querySelector(`#${UNIT_SELECT_ID}`);
      if (select) select.value = unitId;
      syncAllocationUnitWithBudgetUnit();
      updateBudgetItemOptions();
      updateBudgetBalance();
      renderBudgetTables();
    });
  });
  document.querySelectorAll('[data-budget-fund]').forEach(button => {
    button.addEventListener('click', () => {
      activeFundFilter = button.dataset.budgetFund || 'ALL';
      renderBudgetTables();
    });
  });
}

function updateBudgetItemOptions() {
  const unitTaskId = getSelectedUnitId();
  const select = document.querySelector(`#${ITEM_SELECT_ID}`);
  if (!select) return;
  const items = getManagedBudgetItems(unitTaskId);
  select.innerHTML = items.length ? items.map(item => `<option value="${item.id}">[${getFundLabel(item)}] ${item.riseCategory} / ${shorten(item.erpItem, 64)}</option>`).join('') : '<option value="">편성된 예산항목 없음</option>';
}

function updateBudgetBalance() {
  const itemId = document.querySelector(`#${ITEM_SELECT_ID}`)?.value;
  const target = document.querySelector(`#${BALANCE_ID}`);
  if (!target) return;
  const item = getManagedBudgetItem(itemId);
  if (!item) return target.value = '편성 예산 없음';
  const executions = getCollection('budgets');
  target.value = `${getFundLabel(item)} / 편성 ${formatWon(item.allocated)} / 집행 ${formatWon(getManagedExecuted(item, executions))} / 잔액 ${formatWon(getManagedRemaining(item, executions))} / 집행률 ${getManagedRate(item, executions)}%`;
}

function syncAllocationUnitWithBudgetUnit() {
  const unitTaskId = getSelectedUnitId();
  const form = document.querySelector(`#${ALLOC_FORM_ID}`);
  if (!unitTaskId || !form) return;
  form.querySelector('[name="unitTaskId"]').value = unitTaskId;
  updateAllocationTargetOptions();
}

function updateAllocationTargetOptions() {
  const form = document.querySelector(`#${ALLOC_FORM_ID}`);
  const unitTaskId = form?.querySelector('[name="unitTaskId"]')?.value || getSelectedUnitId();
  const select = document.querySelector(`#${ALLOC_TARGET_ID}`);
  if (!select) return;
  const items = getManagedBudgetItems(unitTaskId, { includeInactive: true });
  select.innerHTML = `<option value="__new__">신규 항목 추가</option>${items.map(item => `<option value="${item.id}">${item.status === 'INACTIVE' ? '[사용중지] ' : ''}[${getFundLabel(item)}] ${item.riseCategory} / ${shorten(item.erpItem, 58)} / ${formatWon(item.allocated)}</option>`).join('')}`;
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
  form.querySelector('[name="fundType"]').value = getFundType(item);
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
  upsertItem('budgetAllocations', { ...item, baseItemId: item.source === 'base' ? item.id : item.baseItemId || '', fundType: getFundType(item), status: 'INACTIVE', source: 'custom' });
  addAllocationHistory({ previous: item, next: { ...item, fundType: getFundType(item), status: 'INACTIVE' }, action: '사용중지' });
  showToast('편성항목이 사용중지 처리되었습니다.');
  updateBudgetItemOptions();
  updateBudgetBalance();
  updateAllocationTargetOptions();
  renderBudgetTables();
}

function renderAllocationTable(items, executions) {
  const target = document.querySelector(`#${ALLOCATION_TABLE_ID}`);
  if (!target) return;
  if (!items.length) return target.innerHTML = createEmptyState({ title: '편성 항목 없음', description: '해당 조건의 편성내역이 없습니다.' });
  const rows = items.map(item => ({ fundType: getFundLabel(item), riseCategory: item.riseCategory, erpItem: item.erpItem, allocationType: item.allocationType, allocated: formatWon(item.allocated), executed: formatWon(getManagedExecuted(item, executions)), remaining: formatWon(getManagedRemaining(item, executions)), rate: `${getManagedRate(item, executions)}%`, detail: item.detail || '-', action: `<button class="btn btn-outline" type="button" data-edit-budget-item="${item.id}">수정</button>` }));
  target.innerHTML = createTable({ columns: [
    { key: 'fundType', label: '재원구분' }, { key: 'riseCategory', label: 'RISE 사업비목' }, { key: 'erpItem', label: '산단 ERP 비목' }, { key: 'allocationType', label: '구분' }, { key: 'allocated', label: '편성액' }, { key: 'executed', label: '집행액' }, { key: 'remaining', label: '잔액' }, { key: 'rate', label: '집행률' }, { key: 'detail', label: '비고' }, { key: 'action', label: '관리' }
  ], rows });
  target.querySelectorAll('[data-edit-budget-item]').forEach(button => button.addEventListener('click', () => loadAllocationToForm(button.dataset.editBudgetItem)));
}

function renderExecutionTable(unitTaskId, executions) {
  const target = document.querySelector(`#${EXECUTION_TABLE_ID}`);
  if (!target) return;
  if (!executions.length) return target.innerHTML = createEmptyState({ title: '집행내역 없음', description: '해당 조건의 집행내역이 없습니다.' });
  const rows = executions.map(row => ({ executionDate: row.executionDate || '-', fundType: getFundLabel(row), programName: row.programName || '-', category: row.category || '-', erpItem: row.erpItem || '-', executed: formatWon(row.executed), memo: row.memo || '-' }));
  target.innerHTML = `${createTable({ columns: [
    { key: 'executionDate', label: '집행일자' }, { key: 'fundType', label: '재원구분' }, { key: 'programName', label: '프로그램명' }, { key: 'category', label: 'RISE 사업비목' }, { key: 'erpItem', label: '산단 ERP 비목' }, { key: 'executed', label: '집행액' }, { key: 'memo', label: '비고' }
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
  const rows = getCollection('budgetAllocationHistory').filter(row => row.unitTaskId === unitTaskId).slice().reverse().map(row => ({ ...row, fundType: getFundLabel(row), previousAllocated: formatWon(row.previousAllocated), nextAllocated: formatWon(row.nextAllocated), diff: formatWon(row.diff) }));
  if (!rows.length) return target.innerHTML = createEmptyState({ title: '변경 이력 없음', description: '편성항목 추가·수정·사용중지 시 이력이 자동 기록됩니다.' });
  target.innerHTML = createTable({ columns: [
    { key: 'changedAt', label: '변경일시' }, { key: 'action', label: '구분' }, { key: 'fundType', label: '재원구분' }, { key: 'riseCategory', label: 'RISE 사업비목' }, { key: 'previousAllocated', label: '기존 편성액' }, { key: 'nextAllocated', label: '변경 편성액' }, { key: 'diff', label: '증감' }, { key: 'reason', label: '사유' }
  ], rows });
}

function getManagedBudgetItems(unitTaskId, options = {}) {
  const customRows = getCollection('budgetAllocations');
  const customByBase = new Map(customRows.filter(row => row.baseItemId).map(row => [row.baseItemId, row]));
  const customOnly = customRows.filter(row => !row.baseItemId && row.unitTaskId === unitTaskId);
  const baseItems = getBudgetItems(unitTaskId).map(item => {
    const override = customByBase.get(item.id);
    return override ? { ...item, ...override, fundType: getFundType(override), source: 'custom' } : { ...item, fundType: 'CURRENT', source: 'base', status: 'ACTIVE' };
  });
  return [...baseItems, ...customOnly.map(item => ({ ...item, fundType: getFundType(item) }))].filter(item => item.unitTaskId === unitTaskId).filter(item => options.includeInactive || item.status !== 'INACTIVE');
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
  const fundType = getFundType(item);
  return executions.filter(row => row.unitTaskId === item.unitTaskId).filter(row => getFundType(row) === fundType).filter(row => linkedIds.includes(row.budgetItemId) || (!row.budgetItemId && row.category === item.riseCategory)).reduce((sum, row) => sum + Number(row.executed || 0), 0);
}

function getManagedRemaining(item, executions = []) { return item ? Math.max(Number(item.allocated || 0) - getManagedExecuted(item, executions), 0) : 0; }
function getManagedRate(item, executions = []) { const allocated = Number(item?.allocated || 0); return allocated ? round1((getManagedExecuted(item, executions) / allocated) * 100) : 0; }
function getFundSummary(items, executions) { const allocated = items.reduce((sum, item) => sum + Number(item.allocated || 0), 0); const executed = items.reduce((sum, item) => sum + getManagedExecuted(item, executions), 0); const remaining = Math.max(allocated - executed, 0); const rate = allocated ? round1((executed / allocated) * 100) : 0; return { allocated, executed, remaining, rate }; }
function getCategorySummary(items, executions) { const map = new Map(); items.forEach(item => { const key = item.riseCategory || '기타'; const row = map.get(key) || { category: key, allocated: 0, executed: 0, remaining: 0, rate: 0 }; row.allocated += Number(item.allocated || 0); row.executed += getManagedExecuted(item, executions); map.set(key, row); }); return [...map.values()].map(row => ({ ...row, remaining: Math.max(row.allocated - row.executed, 0), rate: row.allocated ? round1((row.executed / row.allocated) * 100) : 0 })); }
function getCrossCell(unitTaskId, category, fundType) { const items = getManagedBudgetItems(unitTaskId).filter(item => item.riseCategory === category && getFundType(item) === fundType); const executions = getCollection('budgets').filter(row => row.unitTaskId === unitTaskId); return getFundSummary(items, executions); }
function getAllCategories() { return [...new Set(BUDGET_UNITS.flatMap(unit => getManagedBudgetItems(unit.id).map(item => item.riseCategory || '기타')))]; }
function filterByFund(items) { return activeFundFilter === 'ALL' ? items : items.filter(item => getFundType(item) === activeFundFilter); }
function filterExecutionsByFund(executions) { return activeFundFilter === 'ALL' ? executions : executions.filter(row => getFundType(row) === activeFundFilter); }
function addAllocationHistory({ previous, next, action }) { const prevAmount = Number(previous?.allocated || 0); const nextAmount = Number(next?.allocated || 0); upsertItem('budgetAllocationHistory', { id: `budget_history_${Date.now()}`, unitTaskId: next.unitTaskId || previous?.unitTaskId || '', budgetItemId: next.id || previous?.id || '', fundType: getFundType(next || previous), changedAt: new Date().toISOString().slice(0, 19).replace('T', ' '), action, riseCategory: next.riseCategory || previous?.riseCategory || '', previousAllocated: prevAmount, nextAllocated: nextAmount, diff: nextAmount - prevAmount, reason: next.detail || previous?.detail || '-' }); }
function getSelectedUnitId() { return document.querySelector(`#${UNIT_SELECT_ID}`)?.value || BUDGET_UNITS[0].id; }
function getFundType(item) { return item?.fundType === 'CARRYOVER' ? 'CARRYOVER' : 'CURRENT'; }
function getFundLabel(item) { const fundType = getFundType(item); return FUND_TYPES.find(type => type.id === fundType)?.label || '당해연도 사업비'; }
function getUnitName(unitTaskId) { return BUDGET_UNITS.find(unit => unit.id === unitTaskId)?.name || unitTaskId; }
function rateColor(rate) { return rate >= 80 ? '#ef4444' : rate >= 50 ? '#f59e0b' : '#3b82f6'; }
function shorten(value, max = 48) { const text = String(value || ''); return text.length > max ? `${text.slice(0, max)}...` : text; }
function formatWon(value) { return `${Number(value || 0).toLocaleString()}원`; }
function formatManwon(value) { return `${formatManwonNumber(value)}만원`; }
function formatManwonNumber(value) { return Number(Math.round(Number(value || 0) / 10000)).toLocaleString(); }
function round1(value) { return Math.round(Number(value || 0) * 10) / 10; }
