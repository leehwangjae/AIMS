import { renderDashboardSummary } from './dashboard.js';
import { renderReportList } from './report-view.js';
import { renderProgramView } from './program-view.js';
import { renderKpiDetailView } from './kpi-view.js';
import { renderAnnualLeaveView } from './annual-leave-view.js';
import { readCollection } from './storage.js';

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
    renderSimpleCollection(target, '예산관리', 'budgets', ['category', 'allocated', 'executed', 'executionRate']);
    return;
  }

  if (routeId === 'ai-center') {
    target.innerHTML = `
      <section class="dashboard-hero sc">
        <div class="scb">
          <div class="eyebrow">AI Work Center</div>
          <h2 class="page-title">AI 업무센터</h2>
          <p class="page-desc">성과보고서, 사업계획서, 회의자료, 심사 Q&A 생성을 위한 업무 자동화 영역입니다.</p>
        </div>
      </section>
      <section class="sc">
        <div class="scb ai-action-grid">
          <button class="btn btn-outline">성과보고서 생성</button>
          <button class="btn btn-outline">사업계획서 생성</button>
          <button class="btn btn-outline">회의자료 생성</button>
          <button class="btn btn-outline">심사 Q&A 생성</button>
        </div>
      </section>
    `;
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

function renderSimpleCollection(target, title, collectionName, columns) {
  const rows = readCollection(collectionName, []);

  target.innerHTML = `
    <section class="sc">
      <div class="sch">
        <div class="sct">${title}</div>
      </div>

      <div class="scb">
        ${rows.length ? renderTable(rows, columns) : renderEmpty(title)}
      </div>
    </section>
  `;
}

function renderTable(rows, columns) {
  return `
    <table class="tbl">
      <thead>
        <tr>${columns.map(column => `<th>${column}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            ${columns.map(column => `<td>${row[column] ?? '-'}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderEmpty(title) {
  return `
    <div style="font-size:13px;color:#6b7280;line-height:1.7;">
      등록된 ${title} 데이터가 없습니다.
    </div>
  `;
}
