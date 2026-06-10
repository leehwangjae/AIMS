import { UNIT_TASKS } from '../data/kpi-data.js';
import { getAutoKpis } from './kpi-calc.js';

export function renderKpiDetailView(targetSelector, unitTaskId = '1-1') {
  const target = document.querySelector(targetSelector);
  const unit = UNIT_TASKS.find(item => item.id === unitTaskId);
  const kpis = getAutoKpis(unitTaskId);

  if (!target || !unit) return;

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">KPI Detail</div>
        <h2 class="page-title">${unit.name} KPI 상세관리</h2>
        <p class="page-desc">사업관리 데이터와 연계하여 KPI 실적, 달성률, 산출근거를 자동 계산합니다.</p>
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
              <th>자동산출 실적</th>
              <th>달성률</th>
              <th>산출방식</th>
              <th>증빙상태</th>
              <th>비고</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${kpis.map(kpi => renderKpiDetailRow(kpi, unitTaskId)).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="sc">
      <div class="sch"><div class="sct">KPI 산출근거</div></div>
      <div class="scb">
        ${renderKpiSources(kpis)}
      </div>
    </section>
  `;
}

function renderKpiDetailRow(kpi, unitTaskId) {
  const rate = kpi.rate;
  const status = getStatus(kpi);
  const displayRate = rate === null ? '입력대기' : `${rate}%`;
  const displayActual = kpi.actual === null || kpi.actual === undefined ? '입력대기' : `${kpi.actual}${kpi.unit}`;

  return `
    <tr>
      <td>${kpi.name}</td>
      <td><span class="badge ${kpi.type === '필수' ? 'badge-required' : 'badge-optional'}">${kpi.type}</span></td>
      <td>${kpi.target}${kpi.unit}</td>
      <td>${displayActual}</td>
      <td>${displayRate}</td>
      <td>${kpi.sourceType || '기본값'}</td>
      <td><span class="evidence-pill ${status.className}">${status.label}</span></td>
      <td>${getMemo(kpi)}</td>
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

function renderKpiSources(kpis) {
  const rows = kpis.flatMap(kpi => {
    if (!kpi.sources?.length) {
      return [{ kpi: kpi.name, source: '-', value: '-', evidence: '산출근거 없음' }];
    }

    return kpi.sources.map(source => ({
      kpi: kpi.name,
      source: source.name || source.studentName || source.programName || source.department || '산출항목',
      value: source.value ?? source.participants ?? 1,
      evidence: getEvidenceText(source)
    }));
  });

  return `
    <table class="tbl">
      <thead>
        <tr>
          <th>KPI</th>
          <th>산출항목</th>
          <th>반영값</th>
          <th>증빙</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            <td>${row.kpi}</td>
            <td>${row.source}</td>
            <td>${row.value}</td>
            <td>${row.evidence}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function getEvidenceText(source) {
  if (source.hasPlan || source.hasResultReport) {
    const plan = source.hasPlan === 'Y' ? '계획서 O' : '계획서 X';
    const result = source.hasResultReport === 'Y' ? '결과보고서 O' : '결과보고서 X';
    return `${plan} / ${result}`;
  }

  if (source.target) return `목표 ${source.target}`;
  return '명단/원자료 기준';
}

function getStatus(kpi) {
  if (!kpi.sources?.length && (kpi.actual === null || kpi.actual === undefined || kpi.actual === 0)) {
    return { label: '입력 필요', className: 'need' };
  }

  if (kpi.rate === null) return { label: '확인 필요', className: 'need' };
  if (kpi.rate < 80) return { label: '보완 필요', className: 'warn' };
  return { label: '정상', className: 'ok' };
}

function getMemo(kpi) {
  if (!kpi.sources?.length) return '사업관리 데이터 또는 원자료 입력 필요';
  if (kpi.rate === null) return '목표 또는 산출값 확인 필요';
  if (kpi.rate < 80) return '실적 보완 및 증빙 확인 필요';
  return '자동산출 정상 반영';
}
