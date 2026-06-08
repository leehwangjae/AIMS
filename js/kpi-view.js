import { UNIT_TASKS, KPI_DEFINITIONS, calculateAchievementRate } from '../data/kpi-data.js';

export function renderKpiDetailView(targetSelector, unitTaskId = '1-1') {
  const target = document.querySelector(targetSelector);
  const unit = UNIT_TASKS.find(item => item.id === unitTaskId);
  const kpis = KPI_DEFINITIONS[unitTaskId] || [];

  if (!target || !unit) return;

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">KPI Detail</div>
        <h2 class="page-title">${unit.name} KPI 상세관리</h2>
        <p class="page-desc">KPI별 목표, 실적, 달성률, 담당자, 증빙상태, 비고를 관리합니다.</p>
      </div>
    </section>

    <section class="sc">
      <div class="sch"><div class="sct">KPI 상세현황</div></div>
      <div class="scb">
        <table class="tbl kpi-detail-table">
          <thead>
            <tr>
              <th>KPI</th>
              <th>구분</th>
              <th>목표</th>
              <th>실적</th>
              <th>달성률</th>
              <th>담당자</th>
              <th>증빙상태</th>
              <th>최종수정일</th>
              <th>비고</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${kpis.map((kpi, index) => renderKpiDetailRow(kpi, unitTaskId, index)).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="sc">
      <div class="sch"><div class="sct">증빙자료 관리</div></div>
      <div class="scb evidence-panel">
        <div class="evidence-card">
          <strong>증빙자료 등록</strong>
          <p>KPI별 결과보고서, 출석부, 명단, 만족도 조사, 협약서 등을 연결하는 영역입니다.</p>
        </div>
        <div class="evidence-card">
          <strong>수정이력 관리</strong>
          <p>목표값, 실적값, 증빙자료 변경 이력을 기록하는 영역입니다.</p>
        </div>
        <div class="evidence-card">
          <strong>AI 보고서 연계</strong>
          <p>추후 KPI와 증빙자료를 기반으로 실적보고서 초안을 생성합니다.</p>
        </div>
      </div>
    </section>
  `;
}

function renderKpiDetailRow(kpi, unitTaskId, index) {
  const rate = calculateAchievementRate(kpi);
  const status = getStatus(rate);
  const displayRate = rate === null ? '입력대기' : `${rate}%`;

  return `
    <tr>
      <td>${kpi.name}</td>
      <td><span class="badge ${kpi.type === '필수' ? 'badge-required' : 'badge-optional'}">${kpi.type}</span></td>
      <td>${kpi.target}${kpi.unit}</td>
      <td>${kpi.actual}${kpi.unit}</td>
      <td>${displayRate}</td>
      <td>${getManager(unitTaskId)}</td>
      <td><span class="evidence-pill ${status.className}">${status.label}</span></td>
      <td>${getUpdatedAt(index)}</td>
      <td>${getMemo(rate)}</td>
      <td>
        <div class="kpi-actions">
          <button class="mini-btn">수정</button>
          <button class="mini-btn">증빙</button>
          <button class="mini-btn">이력</button>
        </div>
      </td>
    </tr>
  `;
}

function getManager(unitTaskId) {
  const managers = {
    '1-1': '미래인재양성팀',
    '1-2': '미래인재양성팀',
    '1-3': '창업지원 담당',
    '2-1-ai': 'AI사업 담당'
  };
  return managers[unitTaskId] || '담당자 미지정';
}

function getStatus(rate) {
  if (rate === null) return { label: '입력 필요', className: 'need' };
  if (rate < 80) return { label: '보완 필요', className: 'warn' };
  return { label: '정상', className: 'ok' };
}

function getUpdatedAt(index) {
  const dates = ['2026-06-08', '2026-06-05', '2026-06-03', '2026-06-01'];
  return dates[index % dates.length];
}

function getMemo(rate) {
  if (rate === null) return '목표 또는 실적 입력 필요';
  if (rate < 80) return '실적 보완 및 증빙 확인 필요';
  return '정상 관리';
}
