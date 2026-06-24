import { MENU_PERMISSIONS } from './constants.js';
import { hasPermission } from './auth.js';

/* Flat menu definition used for permission lookups.
   Unit-level pages (business / kpi) are now single entries with internal tabs. */
export const menus = [
  { id: 'dashboard', label: '대시보드', group: 'main' },

  { id: 'business', label: '단위과제', group: '사업' },
  { id: 'budgets', label: '예산', group: '사업' },
  { id: 'tasks', label: '업무', group: '사업' },

  { id: 'kpi', label: 'KPI', group: '성과' },
  { id: 'files', label: '증빙·문서', group: '성과' },

  { id: 'reports', label: '보고서', group: '확산' },
  { id: 'cardnews', label: '카드뉴스', group: '확산' },

  { id: 'ai-center', label: 'AI Assistant', group: 'main' },

  { id: 'user-management', label: '사용자', group: '관리' },
  { id: 'settings', label: '시스템', group: '관리' }
];

const PRIMARY_ITEM = { id: 'dashboard', label: '대시보드', icon: 'ti-layout-dashboard' };

const NAV_SECTIONS = [
  {
    title: '사업',
    items: [
      { id: 'business', label: '단위과제', icon: 'ti-briefcase' },
      { id: 'budgets', label: '예산', icon: 'ti-wallet' },
      { id: 'tasks', label: '업무', icon: 'ti-layout-kanban' }
    ]
  },
  {
    title: '성과',
    items: [
      { id: 'kpi', label: 'KPI', icon: 'ti-chart-bar' },
      { id: 'files', label: '증빙·문서', icon: 'ti-folder' }
    ]
  },
  {
    title: '확산',
    items: [
      { id: 'reports', label: '보고서', icon: 'ti-file-analytics' },
      { id: 'cardnews', label: '카드뉴스', icon: 'ti-layout-grid' }
    ]
  }
];

const AI_ITEM = { id: 'ai-center', label: 'AI Assistant', icon: 'ti-sparkles' };

const ADMIN_SECTION = {
  title: '관리',
  items: [
    { id: 'user-management', label: '사용자', icon: 'ti-users' },
    { id: 'settings', label: '시스템', icon: 'ti-adjustments' }
  ]
};

export function getAccessibleMenus(user) {
  return menus.filter(menu => isMenuAccessible(user, menu.id));
}

function isMenuAccessible(user, menuId) {
  const allowedRoles = MENU_PERMISSIONS[menuId] || MENU_PERMISSIONS.default || [];
  return hasPermission(user, allowedRoles);
}

export function renderMenu(targetSelector, user, activeMenuId = 'dashboard') {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  const adminItems = ADMIN_SECTION.items.filter(item => isMenuAccessible(user, item.id));
  const aiAccessible = isMenuAccessible(user, AI_ITEM.id);

  target.innerHTML = `
    <div class="sidebar-shell">
      <div class="snav-brand">
        <span class="snav-logo">A</span>
        <div>
          <strong>AIMS</strong>
          <em>2.0 Workspace</em>
        </div>
      </div>

      <nav class="snav">
        ${renderNavItem(PRIMARY_ITEM, activeMenuId)}
        ${NAV_SECTIONS.map(section => renderNavSection(section, user, activeMenuId)).join('')}
      </nav>

      <div class="snav-foot">
        ${aiAccessible ? renderAiItem(activeMenuId) : ''}
        ${adminItems.length ? `
          <div class="snav-admin">
            <span class="snav-label">${ADMIN_SECTION.title}</span>
            ${adminItems.map(item => renderNavItem(item, activeMenuId)).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderNavSection(section, user, activeMenuId) {
  const items = section.items.filter(item => isMenuAccessible(user, item.id));
  if (!items.length) return '';

  return `
    <div class="snav-section">
      <span class="snav-label">${section.title}</span>
      ${items.map(item => renderNavItem(item, activeMenuId)).join('')}
    </div>
  `;
}

function renderNavItem(item, activeMenuId) {
  return `
    <button class="snav-item ${item.id === activeMenuId ? 'on' : ''}" data-menu-id="${item.id}" type="button">
      <i class="ti ${item.icon || 'ti-circle'}"></i>
      <span>${item.label}</span>
    </button>
  `;
}

function renderAiItem(activeMenuId) {
  return `
    <button class="snav-ai ${AI_ITEM.id === activeMenuId ? 'on' : ''}" data-menu-id="${AI_ITEM.id}" type="button">
      <i class="ti ${AI_ITEM.icon}"></i>
      <span>${AI_ITEM.label}</span>
    </button>
  `;
}
