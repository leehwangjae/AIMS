import { getCurrentUser } from './auth.js';
import { showToast } from './ui.js';
import { bindPlanAiEnhancer } from './plan-ai-enhancer.js';
import { initializeStore } from './store.js';
import { sampleUsers, sampleProjects, samplePrograms } from '../data/sample-data.js';
import './business-hydration-fix.js';

function initializeStorage() {
  if (!localStorage.getItem('aims_users')) {
    localStorage.setItem('aims_users', JSON.stringify(sampleUsers));
  }

  if (!localStorage.getItem('aims_projects')) {
    localStorage.setItem('aims_projects', JSON.stringify(sampleProjects));
  }

  if (!localStorage.getItem('aims_programs')) {
    localStorage.setItem('aims_programs', JSON.stringify(samplePrograms));
  }
}

function initializeSession() {
  const user = getCurrentUser();

  if (!user) {
    console.info('로그인 세션 없음');
    return;
  }

  console.info(`${user.name} 사용자 세션 확인 완료`);
}

function initializeApplication() {
  initializeStorage();
  initializeStore();
  initializeSession();
  bindPlanAiEnhancer();

  console.info('AIMS 시스템 초기화 완료');
}

window.AIMS = {
  initializeApplication,
  showToast
};

window.addEventListener('DOMContentLoaded', initializeApplication);
