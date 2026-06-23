import {
  UNIT_TASKS,
  KPI_DEFINITIONS,
  calculateAchievementRate
} from '../data/kpi-data.js';
import { BUDGET_UNITS, getBudgetItems } from '../data/budget-data.js';
import { getCurrentUser } from './auth.js';
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
  if (!target) return;

  const user = getCurrentUser() || { name: '사용자', role: 'VIEWER' };
  const taskSummary = getTaskSummary();
  const budgetSummary = getBudgetSummary();
  const kpiSummary = getKpiSummary();
  const todayTasks = getTodayTasks(user);
  const teamSummary = getTeamSummary(user);
  const orgHealth = getOrganizationHealth();
  const budgetRows = getBudgetDashboardRows();
  const recentTasks = getRecentTasks();

  target.innerHTML = `
    <header class="dash-hero">
      <div class="dash-hero-top">
        <div class="dash-hero-intro">
          <div class="dash-hero-eyebrow">RISE 통합관리 · ${formatKoreanDate()}</div>
          <h2>안녕하세요, ${escapeHtml(getDisplayName(user))}님</h2>
          <p>${escapeHtml(teamSummary.label)} · 오늘 처리할 핵심 업무 ${todayTasks.length}건을 확인하세요.</p>
          <div class="dash-hero-actions">
            <button class="btn btn-hero-primary" data-dashboard-route="tasks">오늘 업무 열기</button>
            <button class="btn btn-hero-ghost" data-dashboard-route="ai-center">AI Assistant 열기</button>
          </div>
        </div>
        <div class="dash-hero-pulse">
          ${renderHeroGauge('사업단 평균 KPI', kpiSummary.averageRate)}
        </div>
      </div>
      <div class="dash-hero-stats">
        ${renderHeroStat('미처리 업무', taskSummary.open, '건', taskSummary.open ? 'amber' : 'green', '진행 필요')}
        ${renderHeroStat('지연 업무', taskSummary.delayed, '건', taskSummary.delayed ? 'danger' : 'green', '기한 초과')}
        ${renderHeroStat('점검 필요 KPI', kpiSummary.riskCount, '개', kpiSummary.riskCount ? 'amber' : 'green', '80% 미만')}
        ${renderHeroStat('예산 집행률', budgetSummary.rate, '%', 'primary', `잔액 ${formatWonShort(budgetSummary.remaining)}`)}
      </div>
    </header>

    <section class="aims2-dashboard-shell">
      <section class="aims2-today-panel sc">
        <div class="sch dashboard-panel-head">
          <div>
            <div class="sct">오늘의 업무</div>
            <p>역할·담당 업무·마감일 기준 우선순위</p>
          </div>
          <span class="aims2-priority-badge">${todayTasks.length}건</span>
        </div>
        <div class="scb aims2-today-list">
          ${todayTasks.length ? todayTasks.map(renderTodayTask).join('') : renderEmptyMini('오늘 처리할 업무 없음', '현재 긴급 또는 마감 임박 업무가 없습니다.')}
        </div>
      </section>

      <aside class="aims2-recent-panel sc">
        <div class="sch dashboard-panel-head">
          <div>
            <div class="sct">최근 활동</div>
            <p>최근 등록·수정된 업무</p>
          </div>
          <button class="btn btn-outline btn-sm" data-dashboard-route="tasks">칸반 보기</button>
        </div>
        <div class="scb">
          ${recentTasks.length ? renderRecentTaskList(recentTasks) : renderEmptyMini('등록된 업무 없음', '업무관리에서 업무를 등록해 주세요.')}
        </div>
      </aside>
    </section>

    <section class="aims2-ai-band sc">
      <div class="sch dashboard-panel-head">
        <div>
          <div class="sct">AI Assistant</div>
          <p>성과 데이터를 보고서·보도자료·카드뉴스로 빠르게 변환합니다.</p>
        </div>
        <span class="aims2-section-tag tone-ai">AI</span>
      </div>
      <div class="scb aims2-ai-band-body">
        ${renderAiRecommendation(kpiSummary, budgetSummary, taskSummary)}
        <div class="aims2-ai-grid">
          ${renderAiAction('ti-file-text', '보고서 작성', '성과보고서 초안을 생성합니다.', 'ai-center')}
          ${renderAiAction('ti-news', '보도자료 생성', '성과를 대외 메시지로 변환합니다.', 'ai-center')}
          ${renderAiAction('ti-layout-grid', '카드뉴스 제작', 'SNS용 카드뉴스를 만듭니다.', 'cardnews')}
          ${renderAiAction('ti-presentation', '회의자료 준비', '점검·보고용 자료를 구성합니다.', 'ai-center')}
        </div>
      </div>
    </section>

    <section class="aims2-status-grid">
      <section class="sc dashboard-panel">
        <div class="sch dashboard-panel-head">
          <div>
            <div class="sct">우리 팀 현황</div>
            <p>${escapeHtml(teamSummary.label)} · 담당 단위과제 기준</p>
          </div>
          <span class="aims2-section-tag">Team</span>
        </div>
        <div class="scb">
          <div class="aims2-team-grid">
            ${renderTeamMetric('KPI 평균 달성률', teamSummary.kpiAverage, '%', '담당 단위 기준', teamSummary.kpiAverage, toneByRate(teamSummary.kpiAverage))}
            ${renderTeamMetric('예산 집행률', teamSummary.budgetRate, '%', '담당 단위 집행', teamSummary.budgetRate, toneByRate(teamSummary.budgetRate))}
            ${renderTeamMetric('진행 중 업무', teamSummary.activeTasks, '건', '진행·검토 중', null, 'primary')}
          </div>
          ${renderTeamUnitCards(teamSummary.units)}
        </div>
      </section>

      <section class="sc dashboard-panel">
        <div class="sch dashboard-panel-head">
          <div>
            <div class="sct">사업단 전체 현황</div>
            <p>RISE 단위과제별 운영 상태</p>
          </div>
          <span class="aims2-section-tag">Organization</span>
        </div>
        <div class="scb aims2-org-list">
          ${orgHealth.map(renderOrgHealthRow).join('')}
        </div>
      </section>
    </section>

    <section class="sc dashboard-panel">
      <div class="sch dashboard-panel-head">
        <div>
          <div class="sct">단위과제 KPI 달성현황</div>
          <p>단위과제별 핵심성과지표 진척을 시각적으로 확인합니다.</p>
        </div>
        <span class="aims2-section-tag">KPI</span>
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

    <section class="aims2-workflow sc">
      <div class="sch dashboard-panel-head">
        <div>
          <div class="sct">성과 → 보고·확산 Workflow</div>
          <p>성과 데이터를 보고서·보도자료·카드뉴스로 연결합니다.</p>
        </div>
        <span class="aims2-section-tag">Workflow</span>
      </div>
      <div class="scb aims2-workflow-grid">
        ${renderWorkflowCard('성과 입력', '실적과 증빙을 정리합니다.', 'kpi', 'ti-chart-dots', 1)}
        ${renderWorkflowCard('보도자료 작성', '성과를 대외 메시지로 변환합니다.', 'ai-center', 'ti-news', 2)}
        ${renderWorkflowCard('카드뉴스 제작', '보도자료를 SNS 카드뉴스로 압축합니다.', 'cardnews', 'ti-layout-grid', 3)}
        ${renderWorkflowCard('성과보고서 반영', '월간·연차 보고 자료로 연결합니다.', 'reports', 'ti-file-analytics', 4)}
      </div>
    </section>

    <section class="aims2-budget sc">
      <div class="sch dashboard-panel-head">
        <div>
          <div class="sct">예산 집행 현황</div>
          <p>RISE 사업비 편성·집행 · 단위과제별 집행률</p>
        </div>
        <span class="aims2-section-tag">Budget</span>
      </div>
      <div class="scb">
        <div class="aims2-budget-totals">
          ${renderBudgetTotal('편성액', formatWonShort(budgetSummary.allocated))}
          ${renderBudgetTotal('집행액', formatWonShort(budgetSummary.executed))}
          ${renderBudgetTotal('잔액', formatWonShort(budgetSummary.remaining))}
          ${renderBudgetTotal('집행률', `${budgetSummary.rate}%`, true)}
        </div>
        <div class="aims2-budget-list">
          ${budgetRows.map(renderBudgetRow).join('')}
        </div>
      </div>
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

  const ratedKpis = kpis.map(kpi => ({ ...kpi, rate: calculateAchievementRate(kpi) }));
  const riskCount = ratedKpis.filter(kpi => kpi.rate === null || kpi.rate < 80).length;
  const goodCount = ratedKpis.filter(kpi => kpi.rate !== null && kpi.rate >= 80).length;
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
    <div class="kpi-viz-summary">
      <span class="kpi-viz-chip tone-green">달성 ${goodCount}</span>
      <span class="kpi-viz-chip tone-amber">점검 ${riskCount}</span>
      <span class="kpi-viz-chip tone-muted">전체 ${ratedKpis.length}</span>
    </div>
    <div class="kpi-progress-list">
      ${ratedKpis.length ? ratedKpis.map(renderKpiProgressItem).join('') : '<div class="risk-empty">등록된 KPI가 없습니다.</div>'}
    </div>
  `;
}

function renderKpiProgressItem(kpi) {
  const isPending = kpi.rate === null;
  const tone = isPending ? 'pending' : kpi.rate >= 80 ? 'green' : kpi.rate >= 50 ? 'amber' : 'danger';
  const width = isPending ? 0 : Math.min(kpi.rate, 100);
  const rateText = isPending ? '입력대기' : `${kpi.rate}%`;
  return `
    <article class="kpi-progress-item">
      <div class="kpi-progress-head">
        <div class="kpi-progress-name">
          <span class="badge ${kpi.type === '필수' ? 'badge-required' : 'badge-optional'}">${kpi.type}</span>
          <strong>${kpi.name}</strong>
        </div>
        <span class="kpi-progress-rate tone-${tone}">${rateText}</span>
      </div>
      <div class="kpi-progress-track"><span class="tone-${tone}" style="width:${width}%"></span></div>
      <div class="kpi-progress-meta">목표 ${kpi.target}${kpi.unit} · 실적 ${kpi.actual}${kpi.unit}</div>
    </article>
  `;
}

function renderTodayTask(task) {
  return `
    <article class="aims2-today-task priority-${task.priority}">
      <div class="aims2-task-priority">${task.icon}</div>
      <div>
        <strong>${escapeHtml(task.title)}</strong>
        <span>${escapeHtml(task.meta)}</span>
      </div>
      <button type="button" class="btn btn-outline btn-sm" data-dashboard-route="${task.route}">${task.action}</button>
    </article>
  `;
}

function renderAiRecommendation(kpiSummary, budgetSummary, taskSummary) {
  const mainRisk = kpiSummary.riskCount
    ? `KPI ${kpiSummary.riskCount}개가 점검 필요 상태입니다.`
    : taskSummary.delayed
      ? `지연 업무 ${taskSummary.delayed}건을 먼저 정리하는 것이 좋습니다.`
      : `현재 주요 위험지표는 안정적입니다.`;

  const action = kpiSummary.riskCount
    ? '성과보고서 초안 생성과 KPI 증빙 점검을 추천합니다.'
    : budgetSummary.rate < 60
      ? '예산 집행률이 낮은 단위과제의 집행계획 점검을 추천합니다.'
      : '최근 성과를 보도자료·카드뉴스로 확산할 수 있습니다.';

  return `
    <div class="aims2-ai-card">
      <span>🤖 AI 추천</span>
      <strong>${mainRisk}</strong>
      <p>${action}</p>
    </div>
  `;
}

function renderAiAction(icon, title, description, route) {
  return `
    <button type="button" class="aims2-ai-action" data-dashboard-route="${route}">
      <span class="aims2-ai-action-icon"><i class="ti ${icon}"></i></span>
      <span class="aims2-ai-action-body">
        <strong>${title}</strong>
        <span>${description}</span>
      </span>
      <i class="ti ti-arrow-right aims2-ai-action-go"></i>
    </button>
  `;
}

function renderHeroStat(label, value, suffix, tone, hint) {
  return `
    <div class="dash-hero-stat tone-${tone}">
      <span class="dash-hero-stat-label">${label}</span>
      <strong>${value}<i>${suffix}</i></strong>
      <em>${hint}</em>
    </div>
  `;
}

function renderHeroGauge(label, rate) {
  const value = Math.max(0, Math.min(Number(rate) || 0, 100));
  const tone = toneByRate(value);
  return `
    <div class="dash-hero-gauge tone-${tone}" style="--val:${value}">
      <div class="dash-hero-gauge-ring"><span>${value}<i>%</i></span></div>
      <div class="dash-hero-gauge-meta">
        <strong>${label}</strong>
        <em>전체 단위과제 평균 달성률</em>
      </div>
    </div>
  `;
}

function formatKoreanDate(date = new Date()) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
}

function renderTeamMetric(label, value, suffix, hint, pct, tone) {
  const bar = pct === null ? '' : `
    <div class="aims2-team-bar"><span class="tone-${tone}" style="width:${Math.min(Number(pct) || 0, 100)}%"></span></div>`;
  return `
    <div class="aims2-team-metric tone-${tone}">
      <span class="aims2-team-metric-label">${label}</span>
      <strong>${value}<i>${suffix}</i></strong>
      ${bar}
      <em>${hint}</em>
    </div>
  `;
}

function toneByRate(rate) {
  const value = Number(rate) || 0;
  return value >= 85 ? 'green' : value >= 70 ? 'amber' : 'danger';
}

function renderTeamUnitCards(units) {
  return `
    <div class="aims2-unit-card-list">
      ${units.map(unit => `
        <article>
          <strong>${unit.name}</strong>
          <span>KPI ${unit.kpiAverage}% · 예산 ${unit.budgetRate}% · 업무 ${unit.activeTasks}건</span>
        </article>
      `).join('')}
    </div>
  `;
}

function renderOrgHealthRow(item) {
  return `
    <article class="aims2-org-row tone-${item.tone}">
      <div>
        <strong>${item.name}</strong>
        <span>KPI ${item.kpiAverage}% · 예산 ${item.budgetRate}% · 미완료 업무 ${item.openTasks}건</span>
      </div>
      <em>${item.status}</em>
    </article>
  `;
}

function renderBudgetTotal(label, value, emphasis = false) {
  return `<div class="aims2-budget-total ${emphasis ? 'is-rate' : ''}"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderBudgetRow(row) {
  const rate = row.allocated ? Math.round((row.executed / row.allocated) * 1000) / 10 : 0;
  const tone = rate >= 80 ? 'green' : rate >= 50 ? 'amber' : 'danger';
  const width = Math.min(rate, 100);
  return `
    <article class="aims2-budget-row">
      <div class="aims2-budget-row-head">
        <strong>${row.label}</strong>
        <span class="aims2-budget-rate tone-${tone}">${rate}%</span>
      </div>
      <div class="aims2-budget-bar"><span class="tone-${tone}" style="width:${width}%"></span></div>
      <div class="aims2-budget-figures">
        <span>집행 ${formatWonShort(row.executed)}</span>
        <span>편성 ${formatWonShort(row.allocated)}</span>
        <span>잔액 ${formatWonShort(row.remaining)}</span>
      </div>
    </article>
  `;
}

function renderWorkflowCard(title, description, route, icon, step) {
  return `
    <button type="button" class="aims2-workflow-card" data-dashboard-route="${route}">
      <div class="aims2-workflow-top">
        <i class="ti ${icon}"></i>
        <span class="aims2-workflow-step">STEP ${step}</span>
      </div>
      <strong>${title}</strong>
      <span>${description}</span>
    </button>
  `;
}

function renderRecentTaskList(tasks) {
  return `
    <div class="dashboard-recent-list">
      ${tasks.slice(0, 6).map(task => `
        <article class="dashboard-recent-task">
          <div class="dashboard-recent-dot status-${task.status || 'TODO'}"></div>
          <div>
            <strong>${escapeHtml(task.title)}</strong>
            <span>${TASK_STATUS_LABELS[task.status] || '예정'} · ${getUnitName(task.unitTaskId)} · ${task.owner || '담당자 미지정'}</span>
          </div>
          <em>${Number(task.progress || 0)}%</em>
        </article>
      `).join('')}
    </div>
  `;
}

function renderEmptyMini(title, description) {
  return `<div class="dashboard-empty-mini"><strong>${title}</strong><span>${description}</span></div>`;
}

function getTodayTasks(user) {
  const tasks = getCollection('tasks');
  const userName = user?.name || '';
  const userUnitIds = getUserUnitIds(user);
  const relevantTasks = tasks
    .filter(task => task.status !== 'DONE')
    .filter(task => isTaskRelevantToUser(task, userName, userUnitIds));

  const taskItems = relevantTasks
    .map(task => ({
      title: task.title,
      meta: `${getUnitName(task.unitTaskId)} · ${task.owner || '담당자 미지정'} · ${getDueText(task)}`,
      priority: getTaskPriority(task),
      icon: getTaskPriorityIcon(task),
      route: 'tasks',
      action: '열기',
      sort: getTaskSortScore(task)
    }));

  const systemItems = getSystemGeneratedTasks(userUnitIds);
  return [...taskItems, ...systemItems]
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 7);
}

function getSystemGeneratedTasks(userUnitIds) {
  const kpiRisks = getUnitRiskItems(userUnitIds).slice(0, 2).map((item, index) => ({
    title: `${item.unitName} KPI 증빙·실적 점검 필요`,
    meta: `${item.kpiName} · 달성률 ${item.rateText}`,
    priority: 'important',
    icon: '⚠',
    route: KPI_ROUTE_MAP[item.unitTaskId] || 'dashboard',
    action: '점검',
    sort: 20 + index
  }));

  return [
    ...kpiRisks,
    {
      title: '성과 확산 콘텐츠 후보 점검',
      meta: '최근 성과를 보도자료·카드뉴스로 전환 가능',
      priority: 'normal',
      icon: '✨',
      route: 'cardnews',
      action: '제작',
      sort: 70
    }
  ];
}

function isTaskRelevantToUser(task, userName, userUnitIds) {
  if (!userUnitIds.length) return true;
  if (task.owner && userName && String(task.owner).includes(userName)) return true;
  return userUnitIds.includes(task.unitTaskId);
}

function getTaskPriority(task) {
  if (isDelayedTask(task)) return 'urgent';
  const due = getDueDiff(task);
  if (due !== null && due <= 2) return 'important';
  return 'normal';
}
function getTaskPriorityIcon(task) { return getTaskPriority(task) === 'urgent' ? '🔥' : getTaskPriority(task) === 'important' ? '⚠' : '📝'; }
function getTaskSortScore(task) {
  if (isDelayedTask(task)) return 0;
  const due = getDueDiff(task);
  if (due !== null) return 10 + due;
  return 80;
}

function getTaskSummary() {
  const tasks = getCollection('tasks');
  return {
    total: tasks.length,
    doing: tasks.filter(task => task.status === 'DOING').length,
    review: tasks.filter(task => task.status === 'REVIEW').length,
    done: tasks.filter(task => task.status === 'DONE').length,
    open: tasks.filter(task => task.status !== 'DONE').length,
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

function getRecentTasks() {
  return getCollection('tasks')
    .slice()
    .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
}

function isDelayedTask(task) {
  if (!task?.dueDate || task.status === 'DONE') return false;
  return new Date(task.dueDate) < startOfToday();
}

function getDueDiff(task) {
  if (!task?.dueDate) return null;
  const today = startOfToday();
  const due = new Date(task.dueDate);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function getDueText(task) {
  const diff = getDueDiff(task);
  if (diff === null) return '마감일 없음';
  if (diff < 0) return `D+${Math.abs(diff)}`;
  if (diff === 0) return 'D-day';
  return `D-${diff}`;
}

function getTeamSummary(user) {
  const unitIds = getUserUnitIds(user);
  const selectedUnitIds = unitIds.length ? unitIds : UNIT_TASKS.map(unit => unit.id);
  const units = selectedUnitIds.map(unitTaskId => getUnitDashboardState(unitTaskId));
  const kpiAverage = round1(getAverageOf(units.map(unit => unit.kpiAverage)));
  const budgetRate = round1(getAverageOf(units.map(unit => unit.budgetRate)));
  const activeTasks = units.reduce((sum, unit) => sum + unit.activeTasks, 0);
  return {
    label: getTeamLabel(user, selectedUnitIds),
    units,
    kpiAverage,
    budgetRate,
    activeTasks
  };
}

function getOrganizationHealth() {
  return UNIT_TASKS.map(unit => {
    const state = getUnitDashboardState(unit.id);
    const status = state.kpiAverage < 70 || state.openTasks > 5 ? '중점관리' : state.kpiAverage < 85 ? '점검필요' : '안정';
    const tone = status === '중점관리' ? 'danger' : status === '점검필요' ? 'amber' : 'green';
    return { ...state, status, tone };
  });
}

function getUnitDashboardState(unitTaskId) {
  const kpis = KPI_DEFINITIONS[unitTaskId] || [];
  const budget = getBudgetDashboardRows().find(row => row.unitTaskId === unitTaskId) || { allocated: 0, executed: 0 };
  const tasks = getCollection('tasks').filter(task => task.unitTaskId === unitTaskId);
  return {
    id: unitTaskId,
    name: getUnitName(unitTaskId),
    kpiAverage: getAverageRate(kpis),
    budgetRate: budget.allocated ? round1((budget.executed / budget.allocated) * 100) : 0,
    activeTasks: tasks.filter(task => ['DOING', 'REVIEW'].includes(task.status)).length,
    openTasks: tasks.filter(task => task.status !== 'DONE').length
  };
}

function getUnitRiskItems(unitIds = []) {
  const targetUnitIds = unitIds.length ? unitIds : UNIT_TASKS.map(unit => unit.id);
  return targetUnitIds.flatMap(unitTaskId => {
    const unitName = getUnitName(unitTaskId);
    return (KPI_DEFINITIONS[unitTaskId] || [])
      .map(kpi => ({ ...kpi, rate: calculateAchievementRate(kpi), unitTaskId, unitName }))
      .filter(kpi => kpi.rate === null || kpi.rate < 80)
      .map(kpi => ({
        unitTaskId,
        unitName,
        kpiName: kpi.name,
        rateText: kpi.rate === null ? '입력대기' : `${kpi.rate}%`
      }));
  });
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
    return { unitTaskId: unit.id, label: unit.name, allocated, executed, remaining: Math.max(allocated - executed, 0) };
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

function getUserUnitIds(user) {
  const ids = [user?.unitTaskId, ...(Array.isArray(user?.unitTaskIds) ? user.unitTaskIds : [])].filter(Boolean);
  return [...new Set(ids)];
}

function getTeamLabel(user, unitIds) {
  if (user?.department) return user.department;
  if (unitIds.length === 1) return getUnitName(unitIds[0]);
  return '미래인재양성팀';
}

function getDisplayName(user) {
  const name = user?.name || user?.email || '사용자';
  return String(name).includes('@') ? String(name).split('@')[0] : name;
}

function getUnitName(unitTaskId) {
  const unit = UNIT_TASKS.find(item => item.id === unitTaskId);
  if (unit) return unit.name;
  if (unitTaskId === 'common') return '공통';
  return unitTaskId || '단위과제 미지정';
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function formatWonShort(value) {
  const number = Number(value || 0);
  if (number >= 100000000) return `${round1(number / 100000000)}억`;
  if (number >= 10000) return `${round1(number / 10000)}만`;
  return number.toLocaleString();
}

function getAverageOf(values) {
  const valid = values.filter(value => Number.isFinite(Number(value)));
  return valid.length ? valid.reduce((sum, value) => sum + Number(value), 0) / valid.length : 0;
}

function round1(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
