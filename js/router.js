import { renderDashboardSummary } from './dashboard.js';
import { renderReportList } from './report-view.js';
import { renderProgramView } from './program-view.js';
import { renderKpiDetailView } from './kpi-view.js';
import { renderAnnualLeaveView } from './annual-leave-view.js';
import { renderFileView } from './file-view.js';
import { renderIncentiveView } from './incentive-view.js';
import { renderUserManagementView } from './user-management-view.js';
import { renderPlanDraftView } from './plan-draft-view.js';
import { renderBudgetView } from './budget-view.js';

const KPI_ROUTE_MAP = {
  'kpi-1-1': '1-1',
  'kpi-1-2': '1-2',
  'kpi-1-3': '1-3',
  'kpi-2-1-ai': '2-1-ai'
};

export function renderRoute(routeId, targetSelector = '#contentContainer') {
  const target = document.querySelector(targetSelector);

  if (!target) return;

  if (routeId === 'dashboard') {
    target.innerHTML = '<div id="dashboardSummary"></div>';
    renderDashboardSummary('#dashboardSummary');
    return;
  }

  if (KPI_ROUTE_MAP[routeId]) {
    renderKpiDetailView(targetSelector, KPI_ROUTE_MAP[routeId]);
    return;
  }

  if (routeId === 'leave-management') {
    renderAnnualLeaveView(targetSelector);
    return;
  }

  if (routeId === 'files') {
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

  if (routeId === 'reports') {
    target.innerHTML = '<div id="reportContainer"></div>';
    renderReportList('#reportContainer');
    return;
  }

  if (routeId.startsWith('business-')) {
    renderProgramView(targetSelector, routeId);
    return;
  }

  if (routeId === 'budgets') {
    renderBudgetView(targetSelector);
    return;
  }

  if (routeId === 'ai-center') {
    target.innerHTML = `
      <section class="dashboard-hero sc">
        <div class="scb">
          <div class="eyebrow">AI Work Center</div>
          <h2 class="page-title">AI 업무센터</h2>
          <p class="page-desc">사업계획 기안, 회의자료, 심사 Q&A 생성을 위한 업무 자동화 영역입니다.</p>
        </div>
      </section>
      <section class="sc">
        <div class="scb ai-action-grid">
          <button class="btn btn-outline" data-ai-route="plan-draft">사업계획 기안 생성</button>
          <button class="btn btn-outline">회의자료 생성</button>
          <button class="btn btn-outline">심사 Q&A 생성</button>
        </div>
      </section>
    `;

    target.querySelector('[data-ai-route="plan-draft"]')?.addEventListener('click', () => {
      renderPlanDraftView(targetSelector);
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

export function bindMenuRouting(menuSelector = '#menuContainer', contentSelector = '#contentContainer') {
  const menuContainer = document.querySelector(menuSelector);

  if (!menuContainer) return;

  menuContainer.addEventListener('click', event => {
    const button = event.target.closest('[data-menu-id]');

    if (!button) return;

    const routeId = button.dataset.menuId;

    menuContainer.querySelectorAll('[data-menu-id]').forEach(item => {
      item.classList.toggle('on', item.dataset.menuId === routeId);
    });

    renderRoute(routeId, contentSelector);
  });
}
