import { MENU_PERMISSIONS } from './constants.js';
import { hasPermission } from './auth.js';

export const menus = [
  { id: 'dashboard', label: 'Dashboard', group: 'main' },
  { id: 'ai-center', label: 'AI Assistant', group: 'main' },

  { id: 'business-1-1', label: '1-1 전략산업', group: '사업운영' },
  { id: 'business-1-2', label: '1-2 스마트모빌리티', group: '사업운영' },
  { id: 'business-1-3', label: '1-3 혁신창업', group: '사업운영' },
  { id: 'business-2-1-ai', label: '2-1 AI', group: '사업운영' },
  { id: 'budgets', label: '예산관리', group: '사업운영' },
  { id: 'tasks', label: '업무관리', group: '사업운영' },

  { id: 'kpi-1-1', label: '1-1 KPI', group: '성과관리' },
  { id: 'kpi-1-2', label: '1-2 KPI', group: '성과관리' },
  { id: 'kpi-1-3', label: '1-3 KPI', group: '성과관리' },
  { id: 'kpi-2-1-ai', label: '2-1 KPI', group: '성과관리' },
  { id: 'files', label: '증빙·문서', group: '성과관리' },

  { id: 'reports', label: '성과보고서', group: '보고·확산' },
  { id: 'cardnews', label: '카드뉴스', group: '보고·확산' },
  { id: 'ai-center', label: '보도자료·AI 작성', group: '보고·확산' },

  { id: 'user-management', label: '사용자관리', group: 'Admin' },
  { id: 'settings', label: '시스템관리', group: 'Admin' }
];

const SIDEBAR_GROUPS = [
  {
    id: 'main',
    title: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard' },
      { id: 'ai-center', label: 'AI Assistant', icon: 'ti-sparkles' }
    ]
  },
  {
    id: 'business-ops',
    title: '사업운영',
    subtitle: '계획 · 예산 · 업무',
    icon: 'ti-briefcase',
    items: [
      { id: 'business-1-1', label: '1-1 전략산업', icon: 'ti-building-factory-2' },
      { id: 'business-1-2', label: '1-2 스마트모빌리티', icon: 'ti-car' },
      { id: 'business-1-3', label: '1-3 혁신창업', icon: 'ti-rocket' },
      { id: 'business-2-1-ai', label: '2-1 AI 인재양성', icon: 'ti-brain' },
      { id: 'budgets', label: '예산관리', icon: 'ti-wallet' },
      { id: 'tasks', label: '업무관리', icon: 'ti-layout-kanban' }
    ]
  },
  {
    id: 'performance',
    title: '성과관리',
    subtitle: 'KPI · 실적 · 증빙',
    icon: 'ti-chart-dots',
    items: [
      { id: 'kpi-1-1', label: '1-1 KPI', icon: 'ti-chart-bar' },
      { id: 'kpi-1-2', label: '1-2 KPI', icon: 'ti-chart-bar' },
      { id: 'kpi-1-3', label: '1-3 KPI', icon: 'ti-chart-bar' },
      { id: 'kpi-2-1-ai', label: '2-1 KPI', icon: 'ti-chart-bar' },
      { id: 'files', label: '증빙·문서관리', icon: 'ti-folder' }
    ]
  },
  {
    id: 'reporting',
    title: '보고·확산',
    subtitle: '보고서 · 보도자료 · 카드뉴스',
    icon: 'ti-speakerphone',
    items: [
      { id: 'reports', label: '성과보고서', icon: 'ti-file-analytics' },
      { id: 'cardnews', label: '카드뉴스 제작', icon: 'ti-layout-grid' },
      { id: 'ai-center', label: '보도자료·AI 작성', icon: 'ti-news' }
    ]
  },
  {
    id: 'admin',
    title: 'Admin',
    subtitle: '사용자 · 권한 · 설정',
    icon: 'ti-settings',
    items: [
      { id: 'user-management', label: '사용자관리', icon: 'ti-users' },
      { id: 'settings', label: '시스템관리', icon: 'ti-adjustments' }
    ]
  }
];

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

  target.innerHTML = `
    <div class="sidebar-shell aims2-sidebar">
      <div class="sidebar-title-block">
        <span class="sidebar-mini-label">AIMS 2.0 Navigation</span>
        <strong>업무 흐름 메뉴</strong>
      </div>
      ${SIDEBAR_GROUPS.map(group => renderSidebarGroup(group, user, activeMenuId)).join('')}
    </div>
  `;
}

function renderSidebarGroup(group, user, activeMenuId) {
  const accessibleItems = group.items.filter(item => isMenuAccessible(user, item.id));
  if (!accessibleItems.length) return '';

  const hasActive = accessibleItems.some(item => item.id === activeMenuId);
  const defaultOpen = group.id === 'main' || hasActive || ['business-ops', 'performance', 'reporting'].includes(group.id);

  if (group.id === 'main') {
    return `
      <div class="sidebar-primary-list">
        ${accessibleItems.map(item => renderSidebarItem(item, activeMenuId, true)).join('')}
      </div>
    `;
  }

  return `
    <details class="sidebar-accordion ${hasActive ? 'active' : ''}" ${defaultOpen ? 'open' : ''}>
      <summary>
        <span class="sidebar-group-icon"><i class="ti ${group.icon || 'ti-folder'}"></i></span>
        <span class="sidebar-group-text">
          <strong>${group.title}</strong>
          ${group.subtitle ? `<em>${group.subtitle}</em>` : ''}
        </span>
      </summary>
      <div class="sidebar-submenu">
        ${accessibleItems.map(item => renderSidebarItem(item, activeMenuId)).join('')}
      </div>
    </details>
  `;
}

function renderSidebarItem(item, activeMenuId, primary = false) {
  return `
    <button class="nb sidebar-nav-item ${primary ? 'primary' : ''} ${item.id === activeMenuId ? 'on' : ''}" data-menu-id="${item.id}" type="button">
      <i class="ti ${item.icon || 'ti-circle'}"></i>
      <span>${item.label}</span>
    </button>
  `;
}
