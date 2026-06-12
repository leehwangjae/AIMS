import {
  UNIT_TASKS,
  KPI_DEFINITIONS,
  calculateAchievementRate
} from '../data/kpi-data.js';
import { BUDGET_UNITS, getBudgetItems } from '../data/budget-data.js';
import { getCollection } from './store.js';
import { renderRoute } from './router.js';

const KPI_ROUTE_MAP = {
  '1-1': 'kpi-1-1',
  '1-2': 'kpi-1-2',
  '1-3': 'kpi-1-3',
  '2-1-ai': 'kpi-2-1-ai'
};

export function renderDashboardSummary(targetSelector) {
  const target = document.querySelector(targetSelector);

  if (!target) {
    console.warn('대시보드 대상 요소를 찾을 수 없음');
    return;
  }

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">AIMS Dashboard V3</div>
        <h2 class="page-title">RISE 단위과제 KPI 및 예산 집행현황</h2>
        <p class="page-desc">단위과제별 KPI 달성현황과 예산관리 기준 예산 집행률을 한 화면에서 점검합니다.</p>
      </div>
    </section>

    <section class="sc">
      <div class="sch">
        <div class="sct">단위과제 KPI 달성현황</div>
      </div>
      <div class="scb">
        <div class="unit-tabs" id="unitTabs">
          ${UNIT_TASKS.map((unit, index) => `
            <button class="unit-tab ${index === 0 ? 'on' : ''}" data-unit-id="${unit.id}">
              ${unit.name}
            </button>
          `).join('')}
        </div>
        <div id="selectedUnitKpi"></div>
      </div>
    </section>

    <section class="sc">
      <div class="sch">
        <div class="sct">예산 집행현황</div>
      </div>
      <div class="scb">
        ${renderBudgetOverview()}
      </div>
    </section>
  `;

  bindUnitTabs();
  bindDashboardKpiDetail();
  renderSelectedUnitKpi('1-1');
}

function bindUnitTabs() {
  const tabs = document.querySelector('#unitTabs');

  if (!tabs) return;

  tabs.addEventListener('click', event => {
    const button = event.target.closest('[data-unit-id]');

    if (!button) return;

    tabs.querySelectorAll('[data-unit-id]').forEach(tab => {
      tab.classList.toggle('on', tab.dataset.unitId === button.dataset.unitId);
    });

    renderSelectedUnitKpi(button.dataset.unitId);
  });
}

function bindDashboardKpiDetail() {
  const target = document.querySelector('#selectedUnitKpi');

  if (!target) return;

  target.addEventListener('click', event => {
    const button = event.target.closest('[data-kpi-detail-unit]');

    if (!button) return;

    const routeId = KPI_ROUTE_MAP[button.dataset.kpiDetailUnit];

    if (!routeId) return;

    document.querySelectorAll('[data-menu-id]').forEach(item => {
      item.classList.toggle('on', item.dataset.menuId === routeId);
    });

    renderRoute(routeId, '#contentContainer');
  });
}

function renderSelectedUnitKpi(unitTaskId) {
  const target = document.querySelector('#selectedUnitKpi');
  const unit = UNIT_TASKS.find(item => item.id === unitTaskId);
  const kpis = KPI_DEFINITIONS[unitTaskId] || [];

  if (!target || !unit) return;

  const riskItems = kpis
    .map(kpi => ({ ...kpi, rate: calculateAchievementRate(kpi) }))
    .filter(kpi => kpi.rate === null || kpi.rate < 80);

  target.innerHTML = `
    <div class="unit-kpi-header">
      <div>
        <h3>${unit.name}</h3>
        <p>${unit.description}</p>
      </div>
      <button class="btn btn-primary" data-kpi-detail-unit="${unitTaskId}">상세관리</button>
    </div>

    <table class="tbl kpi-table">
      <thead>
        <tr>
          <th>KPI</th>
          <th>구분</th>
          <th>목표</th>
          <th>실적</th>
          <th>달성률</th>
        </tr>
      </thead>
      <tbody>
        ${kpis.map(kpi => renderKpiRow(kpi)).join('')}
      </tbody>
    </table>

    <div class="risk-box">
      <div class="risk-title">위험·점검 KPI</div>
      ${riskItems.length ? riskItems.map(renderRiskItem).join('') : '<div class="risk-empty">현재 점검 대상 KPI가 없습니다.</div>'}
    </div>
  `;
}

function renderKpiRow(kpi) {
  const rate = calculateAchievementRate(kpi);
  const displayRate = rate === null ? '입력대기' : `${rate}%`;

  return `
    <tr>
      <td>${kpi.name}</td>
      <td><span class="badge ${kpi.type === '필수' ? 'badge-required' : 'badge-optional'}">${kpi.type}</span></td>
      <td>${kpi.target}${kpi.unit}</td>
      <td>${kpi.actual}${kpi.unit}</td>
      <td>${displayRate}</td>
    </tr>
  `;
}

function renderRiskItem(kpi) {
  const rate = kpi.rate === null ? '입력대기' : `${kpi.rate}%`;
  const message = kpi.rate === null ? '목표 또는 실적 입력 필요' : '목표 대비 달성률 80% 미만';

  return `
    <div class="risk-item">
      <span>⚠ ${kpi.name}</span>
      <strong>${rate}</strong>
      <em>${message}</em>
    </div>
  `;
}

function renderBudgetOverview() {
  const rows = getBudgetDashboardRows();
  const totalAllocated = rows.reduce((sum, row) => sum + row.allocated, 0);
  const totalExecuted = rows.reduce((sum, row) => sum + row.executed, 0);
  const totalRemaining = Math.max(totalAllocated - totalExecuted, 0);
  const totalRate = totalAllocated ? round1((totalExecuted / totalAllocated) * 100) : 0;

  return `
    <div class="budget-summary-visual" style="display:grid;gap:14px;margin-bottom:18px;">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-end;flex-wrap:wrap;">
        <div>
          <div style="font-size:13px;color:#6b7280;">전체 예산 집행률</div>
          <div style="font-size:18px;font-weight:700;">예산관리 데이터 연동</div>
        </div>
        <div style="font-size:24px;font-weight:800;">${totalRate}%</div>
      </div>
      <div style="height:16px;background:#e5e7eb;border-radius:999px;overflow:hidden;">
        <div style="width:${Math.min(totalRate, 100)}%;height:100%;background:linear-gradient(90deg,#2563eb,#22c55e);border-radius:999px;"></div>
      </div>
      <div class="kpi-card-grid">
        <div class="metric-card"><div class="metric-value">${formatWon(totalAllocated)}</div><div class="metric-label">전체 편성액</div></div>
        <div class="metric-card"><div class="metric-value">${formatWon(totalExecuted)}</div><div class="metric-label">전체 집행액</div></div>
        <div class="metric-card"><div class="metric-value">${formatWon(totalRemaining)}</div><div class="metric-label">전체 잔액</div></div>
        <div class="metric-card"><div class="metric-value">${rows.length}</div><div class="metric-label">관리 단위과제</div></div>
      </div>
    </div>
    <div class="budget-list">
      ${rows.map(renderBudgetRow).join('')}
    </div>
  `;
}

function renderBudgetRow(item) {
  const rate = item.allocated ? round1((item.executed / item.allocated) * 100) : 0;

  return `
    <div class="budget-row">
      <div class="budget-label">
        <strong>${item.label}</strong>
        <span style="display:block;font-size:12px;color:#6b7280;">편성 ${formatWon(item.allocated)} / 집행 ${formatWon(item.executed)} / 잔액 ${formatWon(item.remaining)}</span>
      </div>
      <div class="progress"><div class="progress-bar" style="width:${Math.min(rate, 100)}%"></div></div>
      <div class="budget-rate">${rate}%</div>
    </div>
  `;
}

function getBudgetDashboardRows() {
  return BUDGET_UNITS.map(unit => {
    const items = getManagedBudgetItems(unit.id);
    const executions = getCollection('budgets').filter(row => row.unitTaskId === unit.id);
    const allocated = items.reduce((sum, item) => sum + Number(item.allocated || 0), 0);
    const executed = items.reduce((sum, item) => sum + getManagedExecuted(item, executions), 0);
    return {
      unitTaskId: unit.id,
      label: unit.name,
      allocated,
      executed,
      remaining: Math.max(allocated - executed, 0)
    };
  });
}

function getManagedBudgetItems(unitTaskId) {
  const customRows = getCollection('budgetAllocations');
  const customByBase = new Map(customRows.filter(row => row.baseItemId).map(row => [row.baseItemId, row]));
  const customOnly = customRows.filter(row => !row.baseItemId && row.unitTaskId === unitTaskId);

  const baseItems = getBudgetItems(unitTaskId).map(item => {
    const override = customByBase.get(item.id);
    return override ? { ...item, ...override, source: 'custom' } : { ...item, source: 'base', status: 'ACTIVE' };
  });

  return [...baseItems, ...customOnly]
    .filter(item => item.unitTaskId === unitTaskId)
    .filter(item => item.status !== 'INACTIVE');
}

function getManagedExecuted(item, executions = []) {
  if (!item) return 0;
  const linkedIds = [item.id, item.baseItemId].filter(Boolean);
  return executions
    .filter(row => row.unitTaskId === item.unitTaskId)
    .filter(row => linkedIds.includes(row.budgetItemId) || (!row.budgetItemId && row.category === item.riseCategory))
    .reduce((sum, row) => sum + Number(row.executed || 0), 0);
}

function formatWon(value) {
  return `${Number(value || 0).toLocaleString()}원`;
}

function round1(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}
