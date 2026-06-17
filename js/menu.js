import { MENU_PERMISSIONS } from './constants.js';
import { hasPermission } from './auth.js';

export const menus = [
  { id: 'dashboard', label: '대시보드', group: 'main' },
  { id: 'ai-center', label: 'AI 업무센터', group: 'main' },

  { id: 'business-1-1', label: '1-1 전략산업', group: '사업관리' },
  { id: 'business-1-2', label: '1-2 스마트모빌리티', group: '사업관리' },
  { id: 'business-1-3', label: '1-3 혁신창업', group: '사업관리' },
  { id: 'business-2-1-ai', label: '2-1 AI', group: '사업관리' },

  { id: 'tasks', label: '칸반보드', group: '업무관리' },

  { id: 'kpi-1-1', label: '1-1 KPI', group: '성과관리' },
  { id: 'kpi-1-2', label: '1-2 KPI', group: '성과관리' },
  { id: 'kpi-1-3', label: '1-3 KPI', group: '성과관리' },
  { id: 'kpi-2-1-ai', label: '2-1 KPI', group: '성과관리' },

  { id: 'budgets', label: '예산관리', group: '운영관리' },
  { id: 'files', label: '문서관리', group: '운영관리' },
  { id: 'incentives', label: '교원 인센티브', group: '운영관리' },
  { id: 'leave-management', label: '연차관리', group: '운영관리' },

  { id: 'user-management', label: '사용자관리', group: '시스템' },
  { id: 'settings', label: '시스템관리', group: '시스템' }
];

const SIDEBAR_GROUPS = [
  {
    id: 'main',
    title: 'Main',
    items: [
      { id: 'dashboard', label: '대시보드', icon: 'ti-layout-dashboard' },
      { id: 'ai-center', label: 'AI 업무센터', icon: 'ti-sparkles' }
    ]
  },
  {
    id: 'unit-1-1',
    title: '1-1 전략산업',
    subtitle: '바이오 · 반도체 · 물류',
    icon: 'ti-building-factory-2',
    items: [
      { id: 'business-1-1', label: '사업관리', icon: 'ti-briefcase' },
      { id: 'kpi-1-1', label: 'KPI 현황', icon: 'ti-chart-dots' },
      { id: 'budgets', label: '예산관리', icon: 'ti-wallet' },
      { id: 'files', label: '실적자료', icon: 'ti-folder' }
    ]
  },
  {
    id: 'unit-1-2',
    title: '1-2 스마트모빌리티',
    subtitle: '미래차 · 로봇 · 피지컬AI',
    icon: 'ti-car',
    items: [
      { id: 'business-1-2', label: '사업관리', icon: 'ti-briefcase' },
      { id: 'kpi-1-2', label: 'KPI 현황', icon: 'ti-chart-dots' },
      { id: 'budgets', label: '예산관리', icon: 'ti-wallet' },
      { id: 'files', label: '실적자료', icon: 'ti-folder' }
    ]
  },
  {
    id: 'unit-1-3',
    title: '1-3 혁신창업',
    subtitle: '창업교육 · 창업성과',
    icon: 'ti-rocket',
    items: [
      { id: 'business-1-3', label: '사업관리', icon: 'ti-briefcase' },
      { id: 'kpi-1-3', label: 'KPI 현황', icon: 'ti-chart-dots' },
      { id: 'budgets', label: '예산관리', icon: 'ti-wallet' },
      { id: 'files', label: '실적자료', icon: 'ti-folder' }
    ]
  },
  {
    id: 'unit-2-1',
    title: '2-1 AI 인재양성',
    subtitle: 'AI 활용 · 디지털 전환',
    icon: 'ti-brain',
    items: [
      { id: 'business-2-1-ai', label: '사업관리', icon: 'ti-briefcase' },
      { id: 'kpi-2-1-ai', label: 'KPI 현황', icon: 'ti-chart-dots' },
      { id: 'budgets', label: '예산관리', icon: 'ti-wallet' },
      { id: 'files', label: '실적자료', icon: 'ti-folder' }
    ]
  },
  {
    id: 'operations',
    title: '통합업무',
    icon: 'ti-kanban',
    items: [
      { id: 'tasks', label: '칸반보드', icon: 'ti-layout-kanban' },
      { id: 'files', label: '문서관리', icon: 'ti-files' },
      { id: 'leave-management', label: '연차관리', icon: 'ti-calendar-time' },
      { id: 'incentives', label: '교원 인센티브', icon: 'ti-award' }
    ]
  },
  {
    id: 'system',
    title: '시스템',
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

  if (!target) {
    console.warn('메뉴 렌더링 대상 요소를 찾을 수 없음');
    return;
  }

  target.innerHTML = `
    <div class="sidebar-shell">
      <div class="sidebar-title-block">
        <span class="sidebar-mini-label">AIMS Navigation</span>
        <strong>사업 운영 메뉴</strong>
      </div>
      ${SIDEBAR_GROUPS.map(group => renderSidebarGroup(group, user, activeMenuId)).join('')}
    </div>
  `;
}

function renderSidebarGroup(group, user, activeMenuId) {
  const accessibleItems = group.items.filter(item => isMenuAccessible(user, item.id));
  if (!accessibleItems.length) return '';

  const isUnitGroup = group.id.startsWith('unit-');
  const hasActive = accessibleItems.some(item => item.id === activeMenuId);
  const defaultOpen = group.id === 'main' || hasActive || isUnitGroup;

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
