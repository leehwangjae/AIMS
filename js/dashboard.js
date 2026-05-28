import { readCollection } from './storage.js';

export function getDashboardMetrics() {
  const projects = readCollection('projects', []);
  const programs = readCollection('programs', []);
  const reports = readCollection('reports', []);

  return {
    totalProjects: projects.length,
    totalPrograms: programs.length,
    totalReports: reports.length,
    completedPrograms: programs.filter(program => program.status === 'COMPLETED').length
  };
}

export function renderDashboardSummary(targetSelector) {
  const target = document.querySelector(targetSelector);

  if (!target) {
    console.warn('대시보드 대상 요소를 찾을 수 없음');
    return;
  }

  const metrics = getDashboardMetrics();

  target.innerHTML = `
    <div class="kpi-row">
      <div class="kpi">
        <div class="kv">${metrics.totalProjects}</div>
        <div class="kl">운영 과제 수</div>
      </div>

      <div class="kpi">
        <div class="kv">${metrics.totalPrograms}</div>
        <div class="kl">등록 프로그램 수</div>
      </div>

      <div class="kpi">
        <div class="kv">${metrics.totalReports}</div>
        <div class="kl">보고서 수</div>
      </div>

      <div class="kpi">
        <div class="kv">${metrics.completedPrograms}</div>
        <div class="kl">완료 프로그램 수</div>
      </div>
    </div>
  `;
}
