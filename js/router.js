import { renderDashboardSummary } from './dashboard.js';
import { renderReportList } from './report-view.js';
import { readCollection } from './storage.js';

export function renderRoute(routeId, targetSelector = '#contentContainer') {
  const target = document.querySelector(targetSelector);

  if (!target) return;

  if (routeId === 'dashboard') {
    target.innerHTML = '<div id="dashboardSummary"></div>';
    renderDashboardSummary('#dashboardSummary');
    return;
  }

  if (routeId === 'reports') {
    target.innerHTML = '<div id="reportContainer"></div>';
    renderReportList('#reportContainer');
    return;
  }

  if (routeId === 'projects') {
    renderSimpleCollection(target, '사업관리', 'projects', ['unitTask', 'name', 'status']);
    return;
  }

  if (routeId === 'performance') {
    renderSimpleCollection(target, '성과관리', 'performanceIndicators', ['name', 'target', 'actual', 'achievementRate']);
    return;
  }

  if (routeId === 'budgets') {
    renderSimpleCollection(target, '예산관리', 'budgets', ['category', 'allocated', 'executed', 'executionRate']);
    return;
  }

  if (routeId === 'users') {
    renderSimpleCollection(target, '사용자관리', 'users', ['name', 'email', 'role', 'department']);
    return;
  }

  if (routeId === 'settings') {
    target.innerHTML = `
      <section class="sc">
        <div class="sch"><div class="sct">시스템설정</div></div>
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
