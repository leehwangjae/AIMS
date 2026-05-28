import { MENU_PERMISSIONS } from './constants.js';
import { hasPermission } from './auth.js';

export const menus = [
  { id: 'dashboard', label: '대시보드', icon: 'ti-dashboard' },
  { id: 'projects', label: '사업관리', icon: 'ti-briefcase' },
  { id: 'performance', label: '성과관리', icon: 'ti-chart-bar' },
  { id: 'budgets', label: '예산관리', icon: 'ti-wallet' },
  { id: 'reports', label: '보고서관리', icon: 'ti-file-text' },
  { id: 'users', label: '사용자관리', icon: 'ti-users' },
  { id: 'settings', label: '시스템설정', icon: 'ti-settings' }
];

export function getAccessibleMenus(user) {
  return menus.filter(menu => {
    const allowedRoles = MENU_PERMISSIONS[menu.id] || [];
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

  target.innerHTML = accessibleMenus.map(menu => `
    <button class="nb ${menu.id === activeMenuId ? 'on' : ''}" data-menu-id="${menu.id}">
      <i class="ti ${menu.icon}"></i>
      ${menu.label}
    </button>
  `).join('');
}
