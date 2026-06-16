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

const TASK_STATUS_LABELS = {
  TODO: '예정',
  DOING: '진행중',
  REVIEW: '검토중',
  DONE: '완료'
};

export function renderDashboardSummary(targetSelector) {
  const target = document.querySelector(targetSelector);

  if (!target) {
    console.warn('대시보드 대상 요소를 찾을 수 없음');
    return;
  }

  const taskSummary = getTaskSummary();
  const budgetSummary = getBudgetSummary();
  const kpiSummary = getKpiSummary();
  const upcomingTasks = getUpcomingTasks();
  const delayedTasks = getDelayedTasks();
  const recentTasks = getRecentTasks();

  target.innerHTML = `
    <section class="dashboard-hero sc dashboard-redesign-hero">
      <div class="scb dashboard-hero-inner">
        <div>
          <div class="eyebrow">AIMS Admin Workspace</div>
          <h2 class="page-title">RISE 통합 운영 대시보드</h2>
          <p class="page-desc">업무·성과·예산·위험지표를 한 화면에서 확인하고 우선순위를 점검합니다.</p>
        </div>
        <div class="dashboard-hero-actions">
          <button class="btn btn-outline" data-dashboard-route="task">업무관리</button>
          <button class="btn btn-primary" data-dashboard-route="budget">예산관리</button>
        </div>
      </div>
    </section>

    <section class="dashboard-command-grid">
      ${renderCommandCard({ icon: '📌', label: '전체 업무', value: taskSummary.total, hint: '등록된 업무', tone: 'primary' })}
      ${renderCommandCard({ icon: '🚀', label: '진행중', value: taskSummary.doing, hint: '현재 수행 중', tone: 'blue' })}
      ${renderCommandCard({ icon: '⏰', label: '이번주 마감', value: taskSummary.thisWeek, hint: '7일 이내 마감', tone: 'amber' })}
      ${renderCommandCard({ icon: '⚠️', label: '지연 업무', value: taskSummary.delayed, hint: '기한 초과', tone: taskSummary.delayed ? 'danger' : 'green' })}
      ${renderCommandCard({ icon: '📊', label: 'KPI 평균', value: `${kpiSummary.averageRate}%`, hint: `${kpiSummary.riskCount}개 점검 필요`, tone: kpiSummary.riskCount ? 'amber' : 'green' })}
      ${renderCommandCard({ icon: '💰', label: '예산 집행률', value: `${budgetSummary.rate}%`, hint: `잔액 ${formatWonShort(budgetSummary.remaining)}`, tone: 'purple' })}
    </section>

    <section class="dashboard-layout-v4">
      <div class="dashboard-main-stack">
        <section class="sc dashboard-panel">
          <div class="sch dashboard-panel-head">
            <div>
              <div class="sct">단위과제 KPI 달성현황</div>
              <p>단위과제별 핵심성과지표와 위험지표를 확인합니다.</p>
            </div>
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

        <section class="sc dashboard-panel">
          <div class="sch dashboard-panel-head">
            <div>
              <div class="sct">예산 집행현황</div>
              <p>예산관리 데이터 기준 편성·집행·잔액을 요약합니다.</p>
            </div>
            <button class="btn btn-outline btn-sm" data-dashboard-route="budget">상세 보기</button>
          </div>
          <div class="scb">
            ${renderBudgetOverview()}
          </div>
        </section>
      </div>

      <aside class="dashboard-side-stack">
        <section class="sc dashboard-panel">
          <div class="sch dashboard-panel-head">
            <div>
              <div class="sct">업무 우선순위</div>
              <p>지연 및 마감 임박 업무</p>
            </div>
          </div>
          <div class="scb dashboard-list-stack">
            ${delayedTasks.length ? renderMiniTaskList('지연 업무', delayedTasks, 'danger') : renderEmptyMini('지연 업무 없음', '현재 기한을 넘긴 업무가 없습니다.')}
            ${upcomingTasks.length ? renderMiniTaskList('이번주 마감', upcomingTasks, 'amber') : renderEmptyMini('이번주 마감 없음', '7일 이내 마감 업무가 없습니다.')}
          </div>
        </section>

        <section class="sc dashboard-panel">
          <div class="sch dashboard-panel-head">
            <div>
              <div class="sct">최근 업무</div>
              <p>최근 등록·수정된 업무</p>
            </div>
            <button class="btn btn-outline btn-sm" data-dashboard-route="task">칸반 보기</button>
          </div>
          <div class="scb">
            ${recentTasks.length ? renderRecentTaskList(recentTasks) : renderEmptyMini('등록된 업무 없음', '업무관리에서 업무를 등록해 주세요.')}
          </div>
        </section>
      </aside>
    </section>
  `;

  bindUnitTabs();
  bindDashboardKpiDetail();
  bindDashboardRouteButtons();
  renderSelectedUnitKpi('1-1');
}

function bindDashboardRouteButtons() {
  document.querySelectorAll('[data-dashboard-route]').forEach(button => {
    button.addEventListener('click', () => {
      const routeId = button.dataset.dashboardRoute;
      document.querySelectorAll('[data-menu-id]').forEach(item => {
        item.classList.toggle('on', item.dataset.menuId === routeId);
      });
      renderRoute(routeId, '#contentContainer');
    });
  });
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

  const averageRate = getAverageRate(kpis);

  target.innerHTML = `
    <div class="unit-kpi-header dashboard-kpi-header-v4">
      <div>
        <h3>${unit.name}</h3>
        <p>${unit.description}</p>
      </div>
      <div class="dashboard-kpi-summary-pill">
        <span>평균 달성률</span>
        <strong>${averageRate}%</strong>
      </div>
      <button class="btn btn-primary" data-kpi-detail-unit="${unitTaskId}">상세관리</button>
    </div>

    <div class="dashboard-kpi-table-wrap">
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
    </div>

    <div class="risk-box dashboard-risk-box">
      <div class="risk-title">위험·점검 KPI</div>
      ${riskItems.length ? riskItems.map(renderRiskItem).join('') : '<div class="risk-empty">현재 점검 대상 KPI가 없습니다.</div>'}
    </div>
  `;
}

function renderKpiRow(kpi) {
  const rate = calculateAchievementRate(kpi);
  const displayRate = rate === null ? '입력대기' : `${rate}%`;
  const rateClass = rate === null ? 'pending' : rate < 80 ? 'risk' : 'good';

  return `
    <tr>
      <td><strong>${kpi.name}</strong></td>
      <td><span class="badge ${kpi.type === '필수' ? 'badge-required' : 'badge-optional'}">${kpi.type}</span></td>
      <td>${kpi.target}${kpi.unit}</td>
      <td>${kpi.actual}${kpi.unit}</td>
      <td><span class="dashboard-rate-chip ${rateClass}">${displayRate}</span></td>
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
  const summary = getBudgetSummary(rows);

  return `
    <div class="dashboard-budget-summary-v4">
      <div class="dashboard-budget-main-card">
        <div>
          <div class="dashboard-muted-label">전체 예산 집행률</div>
          <strong>${summary.rate}%</strong>
          <p>편성 ${formatWon(summary.allocated)} · 집행 ${formatWon(summary.executed)}</p>
        </div>
        <div class="dashboard-budget-ring" style="--rate:${Math.min(summary.rate, 100)}%;">${summary.rate}%</div>
      </div>
      <div class="dashboard-budget-mini-grid">
        <div><span>전체 편성액</span><strong>${formatWonShort(summary.allocated)}</strong></div>
        <div><span>전체 집행액</span><strong>${formatWonShort(summary.executed)}</strong></div>
        <div><span>전체 잔액</span><strong>${formatWonShort(summary.remaining)}</strong></div>
        <div><span>관리 단위과제</span><strong>${rows.length}</strong></div>
      </div>
    </div>
    <div class="budget-list dashboard-budget-list-v4">
      ${rows.map(renderBudgetRow).join('')}
    </div>
  `;
}

function renderBudgetRow(item) {
  const rate = item.allocated ? round1((item.executed / item.allocated) * 100) : 0;

  return `
    <div class="budget-row dashboard-budget-row-v4">
      <div class="budget-label">
        <strong>${item.label}</strong>
        <span>편성 ${formatWon(item.allocated)} / 집행 ${formatWon(item.executed)} / 잔액 ${formatWon(item.remaining)}</span>
      </div>
      <div class="progress"><div class="progress-bar" style="width:${Math.min(rate, 100)}%"></div></div>
      <div class="budget-rate">${rate}%</div>
    </div>
  `;
}

function renderCommandCard({ icon, label, value, hint, tone }) {
  return `
    <article class="dashboard-command-card tone-${tone}">
      <div class="dashboard-command-icon">${icon}</div>
      <div>
        <div class="dashboard-command-label">${label}</div>
        <div class="dashboard-command-value">${value}</div>
        <div class="dashboard-command-hint">${hint}</div>
      </div>
    </article>
  `;
}

function renderMiniTaskList(title, tasks, tone = 'primary') {
  return `
    <div class="dashboard-mini-section tone-${tone}">
      <div class="dashboard-mini-title">${title}</div>
      <div class="dashboard-mini-list">
        ${tasks.slice(0, 5).map(task => `
          <article class="dashboard-mini-task">
            <div>
              <strong>${task.title}</strong>
              <span>${getUnitName(task.unitTaskId)} · ${task.owner || '담당자 미지정'}</span>
            </div>
            <em>${getDueText(task)}</em>
          </article>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRecentTaskList(tasks) {
  return `
    <div class="dashboard-recent-list">
      ${tasks.slice(0, 6).map(task => `
        <article class="dashboard-recent-task">
          <div class="dashboard-recent-dot status-${task.status || 'TODO'}"></div>
          <div>
            <strong>${task.title}</strong>
            <span>${TASK_STATUS_LABELS[task.status] || '예정'} · ${getUnitName(task.unitTaskId)} · ${task.owner || '담당자 미지정'}</span>
          </div>
          <em>${Number(task.progress || 0)}%</em>
        </article>
      `).join('')}
    </div>
  `;
}

function renderEmptyMini(title, description) {
  return `
    <div class="dashboard-empty-mini">
      <strong>${title}</strong>
      <span>${description}</span>
    </div>
  `;
}

function getTaskSummary() {
  const tasks = getCollection('tasks');
  return {
    total: tasks.length,
    doing: tasks.filter(task => task.status === 'DOING').length,
    review: tasks.filter(task => task.status === 'REVIEW').length,
    done: tasks.filter(task => task.status === 'DONE').length,
    delayed: tasks.filter(isDelayedTask).length,
    thisWeek: getUpcomingTasks().length
  };
}

function getUpcomingTasks() {
  const today = startOfToday();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  return getCollection('tasks')
    .filter(task => task.status !== 'DONE')
    .filter(task => task.dueDate)
    .filter(task => {
      const due = new Date(task.dueDate);
      return due >= today && due <= nextWeek;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function getDelayedTasks() {
  return getCollection('tasks')
    .filter(isDelayedTask)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

function getRecentTasks() {
  return getCollection('tasks')
    .slice()
    .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
}

function isDelayedTask(task) {
  if (!task?.dueDate || task.status === 'DONE') return false;
  return new Date(task.dueDate) < startOfToday();
}

function getDueText(task) {
  if (!task?.dueDate) return '마감일 없음';
  const today = startOfToday();
  const due = new Date(task.dueDate);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `D+${Math.abs(diff)}`;
  if (diff === 0) return 'D-day';
  return `D-${diff}`;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getKpiSummary() {
  const allKpis = Object.values(KPI_DEFINITIONS).flat();
  const rates = allKpis.map(calculateAchievementRate).filter(rate => rate !== null);
  const riskCount = allKpis.map(kpi => ({ ...kpi, rate: calculateAchievementRate(kpi) })).filter(kpi => kpi.rate === null || kpi.rate < 80).length;
  return {
    averageRate: rates.length ? round1(rates.reduce((sum, rate) => sum + rate, 0) / rates.length) : 0,
    riskCount
  };
}

function getAverageRate(kpis) {
  const rates = kpis.map(calculateAchievementRate).filter(rate => rate !== null);
  return rates.length ? round1(rates.reduce((sum, rate) => sum + rate, 0) / rates.length) : 0;
}

function getBudgetSummary(rows = getBudgetDashboardRows()) {
  const allocated = rows.reduce((sum, row) => sum + row.allocated, 0);
  const executed = rows.reduce((sum, row) => sum + row.executed, 0);
  const remaining = Math.max(allocated - executed, 0);
  const rate = allocated ? round1((executed / allocated) * 100) : 0;
  return { allocated, executed, remaining, rate };
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

function getUnitName(unitTaskId) {
  const unit = UNIT_TASKS.find(item => item.id === unitTaskId);
  if (unit) return unit.name;
  if (unitTaskId === 'common') return '공통';
  return unitTaskId || '단위과제 미지정';
}

function formatWon(value) {
  return `${Number(value || 0).toLocaleString()}원`;
}

function formatWonShort(value) {
  const number = Number(value || 0);
  if (number >= 100000000) return `${round1(number / 100000000)}억`;
  if (number >= 10000) return `${round1(number / 10000)}만`;
  return number.toLocaleString();
}

function round1(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}
