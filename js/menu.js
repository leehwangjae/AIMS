import { MENU_PERMISSIONS } from './constants.js';
import { hasPermission } from './auth.js';

export const menus = [
  { id: 'dashboard', label: '대시보드', group: 'main' },

  { id: 'business-1-1', label: '1-1 전략산업', group: '사업관리' },
  { id: 'business-1-2', label: '1-2 스마트모빌리티', group: '사업관리' },
  { id: 'business-1-3', label: '1-3 혁신창업', group: '사업관리' },
  { id: 'business-2-1-ai', label: '2-1 AI', group: '사업관리' },

  { id: 'kpi-1-1', label: '1-1 KPI', group: '성과관리' },
  { id: 'kpi-1-2', label: '1-2 KPI', group: '성과관리' },
  { id: 'kpi-1-3', label: '1-3 KPI', group: '성과관리' },
  { id: 'kpi-2-1-ai', label: '2-1 KPI', group: '성과관리' },

  { id: 'budgets', label: '예산관리', group: 'main' },
  { id: 'reports', label: '보고서센터', group: 'main' },
  { id: 'ai-center', label: 'AI 업무센터', group: 'main' },
  { id: 'settings', label: '시스템관리', group: 'main' }
];

export function getAccessibleMenus(user) {
  return menus.filter(menu => {
    const allowedRoles = MENU_PERMISSIONS[menu.id] || MENU_PERMISSIONS.default || [];
    return hasPermission(user, allowedRoles);
  });
}

export function renderMenu(targetSelector, user, activeMenuId = 'dashboard') {
  const target = document.querySelector(targetSelector);

  if (!target) {
    console.warn('메뉴 렌더링 대상 요소를 찾을 수 없음');
    return;
  }

  const accessibleMenus = getAccessibleMenus(user);
  const groups = ['main', '사업관리', '성과관리'];

  target.innerHTML = groups.map(group => {
    const groupMenus = accessibleMenus.filter(menu => menu.group === group);

    if (!groupMenus.length) return '';

    return `
      <div class="menu-group">
        ${group !== 'main' ? `<div class="menu-group-title">${group}</div>` : ''}
        ${groupMenus.map(menu => `
          <button class="nb ${menu.id === activeMenuId ? 'on' : ''}" data-menu-id="${menu.id}">
            ${menu.label}
          </button>
        `).join('')}
      </div>
    `;
  }).join('');
}
