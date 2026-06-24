import { renderDashboardSummary } from './dashboard.js';
import { renderProgramView } from './program-view.js';
import { renderKpiDetailView } from './kpi-view.js';
import { renderAnnualLeaveView } from './annual-leave-view.js';
import { renderFileView } from './file-view.js';
import { renderIncentiveView } from './incentive-view.js';
import { renderUserManagementView } from './user-management-view.js';
import { renderPlanDraftView } from './plan-draft-view.js';
import { renderBudgetView } from './budget-view.js';
import { renderTaskView } from './task-view.js';
import { renderCardnewsView } from './cardnews-view.js';
import { UNIT_TASKS } from '../data/kpi-data.js';

const KPI_ROUTE_MAP = {
  'kpi-1-1': '1-1',
  'kpi-1-2': '1-2',
  'kpi-1-3': '1-3',
  'kpi-2-1-ai': '2-1-ai'
};

const BUDGET_CONTEXT_KEY = 'aims_budget_unit_context';

export function renderRoute(routeId, targetSelector = '#contentContainer') {
  const target = document.querySelector(targetSelector);

  if (!target) return;

  if (routeId === 'dashboard') {
    target.innerHTML = '<div id="dashboardSummary"></div>';
    renderDashboardSummary('#dashboardSummary');
    return;
  }

  if (routeId === 'business') {
    renderBusinessHub(targetSelector);
    return;
  }

  if (routeId === 'kpi') {
    renderKpiHub(targetSelector);
    return;
  }

  if (KPI_ROUTE_MAP[routeId]) {
    renderKpiDetailView(targetSelector, KPI_ROUTE_MAP[routeId]);
    return;
  }

  if (routeId === 'tasks') {
    renderTaskView(targetSelector);
    return;
  }

  if (routeId === 'leave-management') {
    renderAnnualLeaveView(targetSelector);
    return;
  }

  if (routeId === 'files' || routeId === 'documents' || routeId === 'reports') {
    renderFileView(targetSelector);
    return;
  }

  if (routeId === 'incentives') {
    renderIncentiveView(targetSelector);
    return;
  }

  if (routeId === 'user-management') {
    renderUserManagementView(targetSelector);
    return;
  }

  if (routeId === 'plan-draft') {
    renderPlanDraftView(targetSelector);
    return;
  }

  if (routeId === 'cardnews') {
    renderCardnewsView(targetSelector);
    return;
  }

  if (routeId.startsWith('business-')) {
    renderProgramView(targetSelector, routeId);
    return;
  }

  if (routeId === 'budgets') {
    renderBudgetView(targetSelector);
    applyBudgetUnitContext();
    return;
  }

  if (routeId === 'ai-center') {
    target.innerHTML = `
      <section class="dashboard-hero sc">
        <div class="scb">
          <div class="eyebrow">AI Work Center</div>
          <h2 class="page-title">AI 업무센터</h2>
          <p class="page-desc">사업계획 기안, 카드뉴스, 회의자료, 심사 Q&A 생성을 위한 업무 자동화 영역입니다.</p>
        </div>
      </section>
      <section class="sc">
        <div class="scb ai-action-grid">
          <button class="btn btn-outline" data-ai-route="plan-draft">사업계획 기안 생성</button>
          <button class="btn btn-outline" data-ai-route="cardnews">AI 카드뉴스 생성</button>
          <button class="btn btn-outline">회의자료 생성</button>
          <button class="btn btn-outline">심사 Q&A 생성</button>
        </div>
      </section>
    `;

    target.querySelector('[data-ai-route="plan-draft"]')?.addEventListener('click', () => {
      renderPlanDraftView(targetSelector);
    });
    target.querySelector('[data-ai-route="cardnews"]')?.addEventListener('click', () => {
      renderCardnewsView(targetSelector);
    });
    return;
  }

  if (routeId === 'settings') {
    target.innerHTML = `
      <section class="sc">
        <div class="sch"><div class="sct">시스템관리</div></div>
        <div class="scb" style="font-size:13px;color:#6b7280;line-height:1.7;">
          시스템 설정 화면은 추후 DB, 권한, AI API, 파일 업로드 설정과 연결될 예정입니다.
        </div>
      </section>
    `;
    return;
  }

  target.innerHTML = `
    <section class="sc">
      <div class="scb">선택한 메뉴를 찾을 수 없습니다.</div>
    </section>
  `;
}

function renderUnitHub(targetSelector, { activeUnit, bodyId, render }) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  const unitId = activeUnit || UNIT_TASKS[0]?.id || '1-1';

  target.innerHTML = `
    <section class="sc hub-tabbar">
      <div class="scb">
        <div class="unit-tabs" data-hub-tabs>
          ${UNIT_TASKS.map(unit => `
            <button class="unit-tab ${unit.id === unitId ? 'on' : ''}" data-hub-unit="${unit.id}" type="button">${unit.name}</button>
          `).join('')}
        </div>
      </div>
    </section>
    <div id="${bodyId}"></div>
  `;

  render(`#${bodyId}`, unitId);

  target.querySelector('[data-hub-tabs]')?.addEventListener('click', event => {
    const button = event.target.closest('[data-hub-unit]');
    if (!button) return;
    renderUnitHub(targetSelector, { activeUnit: button.dataset.hubUnit, bodyId, render });
  });
}

function renderBusinessHub(targetSelector, activeUnit) {
  renderUnitHub(targetSelector, {
    activeUnit,
    bodyId: 'businessHubBody',
    render: (bodySelector, unitId) => renderProgramView(bodySelector, `business-${unitId}`)
  });
}

function renderKpiHub(targetSelector, activeUnit) {
  renderUnitHub(targetSelector, {
    activeUnit,
    bodyId: 'kpiHubBody',
    render: (bodySelector, unitId) => renderKpiDetailView(bodySelector, unitId)
  });
}

export function bindMenuRouting(menuSelector = '#menuContainer', contentSelector = '#contentContainer') {
  const menuContainer = document.querySelector(menuSelector);

  if (!menuContainer) return;

  menuContainer.addEventListener('click', event => {
    const button = event.target.closest('[data-menu-id]');

    if (!button) return;

    const routeId = button.dataset.menuId;
    syncBudgetContextFromSidebar(button, routeId);

    menuContainer.querySelectorAll('[data-menu-id]').forEach(item => {
      item.classList.toggle('on', item.dataset.menuId === routeId && item === button);
    });

    renderRoute(routeId, contentSelector);
  });
}

function syncBudgetContextFromSidebar(button, routeId) {
  if (routeId !== 'budgets') {
    sessionStorage.removeItem(BUDGET_CONTEXT_KEY);
    return;
  }

  const groupTitle = button.closest('.sidebar-accordion')?.querySelector('.sidebar-group-text strong')?.textContent || '';
  const unitId = getUnitIdFromTitle(groupTitle);

  if (unitId) {
    sessionStorage.setItem(BUDGET_CONTEXT_KEY, unitId);
  } else {
    sessionStorage.removeItem(BUDGET_CONTEXT_KEY);
  }
}

function applyBudgetUnitContext() {
  const unitId = sessionStorage.getItem(BUDGET_CONTEXT_KEY);
  if (!unitId) return;

  const select = document.querySelector('#budgetUnitSelect');
  if (select) {
    select.value = unitId;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    select.disabled = true;
    select.closest('.form-field')?.classList.add('budget-context-locked');
  }

  document.querySelectorAll('[data-budget-unit]').forEach(button => {
    const isActiveUnit = button.dataset.budgetUnit === unitId;
    button.style.display = isActiveUnit ? '' : 'none';
    button.disabled = !isActiveUnit;
  });

  const unitName = document.querySelector('[data-budget-unit]')?.parentElement?.querySelector(`[data-budget-unit="${unitId}"]`)?.textContent?.replace(/\s+/g, ' ') || unitId;
  const summary = document.querySelector('#budgetSummaryContainer');
  if (summary && !summary.querySelector('.budget-context-notice')) {
    summary.insertAdjacentHTML('afterbegin', `<div class="budget-context-notice">현재 화면은 <strong>${unitName}</strong> 예산만 표시합니다. 통합 예산은 좌측 통합업무의 통합 예산관리에서 확인할 수 있습니다.</div>`);
  }
}

function getUnitIdFromTitle(title) {
  if (title.includes('1-1')) return '1-1';
  if (title.includes('1-2')) return '1-2';
  if (title.includes('1-3')) return '1-3';
  if (title.includes('2-1')) return '2-1-ai';
  return '';
}
