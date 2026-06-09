import {
  UNIT_TASKS,
  KPI_DEFINITIONS,
  BUDGET_EXECUTION,
  calculateAchievementRate
} from '../data/kpi-data.js';
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
        <p class="page-desc">단위과제별 KPI 달성현황과 예산 집행률을 한 화면에서 점검합니다.</p>
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
        <div class="budget-list">
          ${BUDGET_EXECUTION.map(item => renderBudgetRow(item)).join('')}
        </div>
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

function renderBudgetRow(item) {
  const rate = item.allocated ? Math.round((item.executed / item.allocated) * 100) : 0;

  return `
    <div class="budget-row">
      <div class="budget-label">${item.label}</div>
      <div class="progress"><div class="progress-bar" style="width:${rate}%"></div></div>
      <div class="budget-rate">${rate}%</div>
    </div>
  `;
}
