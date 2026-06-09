import { getCollection, upsertItem, removeItem } from './store.js';
import { createCard, createEmptyState, createTable } from './components.js';
import { validateRequired, validateDateRange, validateNumber } from './form-utils.js';
import { showToast } from './ui.js';
import { UNIT_TASKS, KPI_DEFINITIONS } from '../data/kpi-data.js';

const FORM_ID = 'programForm';
const TABLE_ID = 'programTableContainer';
const FACULTY_SUMMARY_ID = 'facultySummaryContainer';
const EVIDENCE_SUMMARY_ID = 'evidenceSummaryContainer';

const BUSINESS_ROUTE_MAP = {
  'business-1-1': '1-1',
  'business-1-2': '1-2',
  'business-1-3': '1-3',
  'business-2-1-ai': '2-1-ai'
};

const GRADUATE_KPI_NAMES = ['인력양성 인원', 'AI 인재양성 인원 수'];

export function renderProgramView(targetSelector, routeId = 'business-1-1') {
  const target = document.querySelector(targetSelector);
  const unitTaskId = BUSINESS_ROUTE_MAP[routeId] || '1-1';
  const unit = UNIT_TASKS.find(item => item.id === unitTaskId);

  if (!target || !unit) return;

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">Business Management</div>
        <h2 class="page-title">${unit.name} 사업관리</h2>
        <p class="page-desc">졸업생, 프로그램, 참여교원, 참여기업, 증빙상태를 통합 관리합니다.</p>
      </div>
    </section>

    <section class="sc">
      <div class="scb">
        <div class="unit-tabs business-tabs">
          <button class="unit-tab on" data-business-tab="graduates">졸업생관리</button>
          <button class="unit-tab" data-business-tab="programs">프로그램관리</button>
          <button class="unit-tab" data-business-tab="faculty">참여교원</button>
          <button class="unit-tab" data-business-tab="evidence">증빙현황</button>
        </div>
      </div>
    </section>

    <div data-business-panel="graduates">${createCard({ title: '졸업생 명단 관리', content: renderGraduateGuide(unitTaskId) })}</div>
    <div data-business-panel="programs" class="hidden">${createCard({ title: '프로그램 등록', content: renderProgramForm(unitTaskId) })}${createCard({ title: '프로그램 목록 및 증빙상태', content: `<div id="${TABLE_ID}"></div>` })}</div>
    <div data-business-panel="faculty" class="hidden">${createCard({ title: '참여교원 실적 요약', content: `<div id="${FACULTY_SUMMARY_ID}"></div>` })}</div>
    <div data-business-panel="evidence" class="hidden">${createCard({ title: '증빙현황 요약', content: `<div id="${EVIDENCE_SUMMARY_ID}"></div>` })}</div>
  `;

  bindBusinessTabs();
  bindProgramForm(unitTaskId);
  renderProgramTable(unitTaskId);
  renderFacultySummary(unitTaskId);
  renderEvidenceSummary(unitTaskId);
}

function bindBusinessTabs() {
  document.querySelectorAll('[data-business-tab]').forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.businessTab;
      document.querySelectorAll('[data-business-tab]').forEach(item => item.classList.toggle('on', item.dataset.businessTab === tab));
      document.querySelectorAll('[data-business-panel]').forEach(panel => panel.classList.toggle('hidden', panel.dataset.businessPanel !== tab));
    });
  });
}

function renderGraduateGuide(unitTaskId) {
  const hasGraduateKpi = (KPI_DEFINITIONS[unitTaskId] || []).some(kpi => GRADUATE_KPI_NAMES.includes(kpi.name));

  if (!hasGraduateKpi) {
    return `<div class="evidence-panel"><div class="evidence-card"><strong>프로그램 기반 성과관리</strong><p>프로그램 운영실적과 증빙자료를 중심으로 성과를 집계합니다.</p></div></div>`;
  }

  return `
    <div class="evidence-panel">
      <div class="evidence-card"><strong>졸업생 명단 업로드</strong><p>인력양성 인원 KPI는 참여학과별 졸업생 엑셀 명단 기준으로 집계합니다.</p></div>
      <div class="evidence-card"><strong>권장 컬럼</strong><p>학번, 성명, 학과, 졸업연월, 취업여부, 지역취업 여부</p></div>
      <div class="evidence-card"><strong>향후 기능</strong><p>엑셀 업로드 후 졸업생 수와 취업률을 자동 계산합니다.</p></div>
    </div>
  `;
}

function renderProgramForm(unitTaskId) {
  const kpis = KPI_DEFINITIONS[unitTaskId] || [];
  return `
    <form id="${FORM_ID}" class="form-grid">
      <input type="hidden" name="id" />
      <input type="hidden" name="unitTaskId" value="${unitTaskId}" />
      <label class="form-field"><span>프로그램명</span><input name="name" type="text" placeholder="예: 융합기술 포럼, 단기전문교육과정" /></label>
      <label class="form-field"><span>구분</span><select name="type"><option value="교육프로그램">교육프로그램</option><option value="포럼/세미나">포럼/세미나</option><option value="성과교류회">성과교류회</option><option value="PBL">PBL</option><option value="창업프로그램">창업프로그램</option><option value="산학협력 프로젝트">산학협력 프로젝트</option><option value="초광역 협력">초광역 협력</option><option value="기타">기타</option></select></label>
      <label class="form-field"><span>연계 KPI</span><select name="linkedKpi">${kpis.map(kpi => `<option value="${kpi.name}">${kpi.name}</option>`).join('')}</select></label>
      <label class="form-field"><span>참여교원</span><input name="faculty" type="text" placeholder="예: 김OO(총괄), 이OO(강연)" /></label>
      <label class="form-field"><span>참여기업</span><input name="companyNames" type="text" placeholder="예: 유일로보틱스, 엘라인" /></label>
      <label class="form-field"><span>시작일</span><input name="startDate" type="date" /></label>
      <label class="form-field"><span>종료일</span><input name="endDate" type="date" /></label>
      <label class="form-field"><span>참여자/수료자 수</span><input name="participants" type="number" min="0" value="0" /></label>
      <label class="form-field"><span>예산</span><input name="budget" type="number" min="0" value="0" /></label>
      <label class="form-field"><span>사업계획서</span><select name="hasPlan"><option value="Y">첨부완료</option><option value="N">미첨부</option></select></label>
      <label class="form-field"><span>결과보고서</span><select name="hasResultReport"><option value="Y">첨부완료</option><option value="N">미첨부</option></select></label>
      <label class="form-field"><span>상태</span><select name="status"><option value="PLANNED">계획</option><option value="IN_PROGRESS">진행중</option><option value="COMPLETED">완료</option></select></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">저장</button><button class="btn btn-outline" type="reset">초기화</button></div>
    </form>
  `;
}

function bindProgramForm(unitTaskId) {
  const form = document.querySelector(`#${FORM_ID}`);
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const required = validateRequired(values, ['name', 'type', 'linkedKpi', 'startDate', 'endDate', 'status']);
    if (!required.valid) return showToast('필수 입력 항목을 확인해 주세요.');
    const dateCheck = validateDateRange(values.startDate, values.endDate);
    if (!dateCheck.valid) return showToast(dateCheck.message);
    if (!validateNumber(values.participants, { min: 0 }).valid || !validateNumber(values.budget, { min: 0 }).valid) return showToast('숫자 입력값을 확인해 주세요.');
    upsertItem('programs', { id: values.id || `program_${Date.now()}`, unitTaskId, name: values.name, type: values.type, linkedKpi: values.linkedKpi, faculty: values.faculty || '', companyNames: values.companyNames || '', startDate: values.startDate, endDate: values.endDate, participants: Number(values.participants), budget: Number(values.budget), hasPlan: values.hasPlan, hasResultReport: values.hasResultReport, status: values.status });
    showToast('프로그램이 저장되었습니다.');
    form.reset();
    renderProgramTable(unitTaskId);
    renderFacultySummary(unitTaskId);
    renderEvidenceSummary(unitTaskId);
  });
}

function getUnitPrograms(unitTaskId) {
  return getCollection('programs').filter(program => program.unitTaskId === unitTaskId);
}

function renderProgramTable(unitTaskId) {
  const target = document.querySelector(`#${TABLE_ID}`);
  if (!target) return;
  const programs = getUnitPrograms(unitTaskId);
  if (!programs.length) return target.innerHTML = createEmptyState({ title: '프로그램 없음', description: '등록된 프로그램이 없습니다.' });
  target.innerHTML = `${createTable({ columns: [{ key: 'name', label: '프로그램명' }, { key: 'type', label: '구분' }, { key: 'linkedKpi', label: '연계 KPI' }, { key: 'participants', label: '참여/수료' }, { key: 'faculty', label: '참여교원' }, { key: 'companyNames', label: '참여기업' }, { key: 'hasPlan', label: '계획서' }, { key: 'hasResultReport', label: '결과보고서' }, { key: 'status', label: '상태' }], rows: programs.map(program => ({ ...program, hasPlan: program.hasPlan === 'Y' ? '첨부완료' : '미첨부', hasResultReport: program.hasResultReport === 'Y' ? '첨부완료' : '미첨부' })) })}<div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestProgram" type="button">최근 등록 프로그램 삭제</button></div>`;
  document.querySelector('#deleteLatestProgram')?.addEventListener('click', () => { const latest = getUnitPrograms(unitTaskId).at(-1); if (!latest) return; removeItem('programs', latest.id); showToast('최근 등록 프로그램이 삭제되었습니다.'); renderProgramTable(unitTaskId); renderFacultySummary(unitTaskId); renderEvidenceSummary(unitTaskId); });
}

function renderFacultySummary(unitTaskId) {
  const target = document.querySelector(`#${FACULTY_SUMMARY_ID}`);
  if (!target) return;
  const programs = getUnitPrograms(unitTaskId).filter(program => program.faculty);
  if (!programs.length) return target.innerHTML = createEmptyState({ title: '참여교원 없음', description: '참여교원이 입력된 프로그램이 없습니다.' });
  const rows = programs.map(program => ({ programName: program.name, faculty: program.faculty, role: program.type, evidence: program.hasResultReport === 'Y' ? '결과보고서 첨부' : '결과보고서 미첨부' }));
  target.innerHTML = createTable({ columns: [{ key: 'programName', label: '프로그램' }, { key: 'faculty', label: '참여교원' }, { key: 'role', label: '참여유형' }, { key: 'evidence', label: '근거자료' }], rows });
}

function renderEvidenceSummary(unitTaskId) {
  const target = document.querySelector(`#${EVIDENCE_SUMMARY_ID}`);
  if (!target) return;
  const programs = getUnitPrograms(unitTaskId);
  if (!programs.length) return target.innerHTML = createEmptyState({ title: '증빙현황 없음', description: '등록된 프로그램이 없습니다.' });
  const rows = programs.map(program => ({ name: program.name, linkedKpi: program.linkedKpi, plan: program.hasPlan === 'Y' ? '첨부완료' : '미첨부', result: program.hasResultReport === 'Y' ? '첨부완료' : '미첨부', status: program.hasPlan === 'Y' && program.hasResultReport === 'Y' ? '완비' : '보완필요' }));
  target.innerHTML = createTable({ columns: [{ key: 'name', label: '프로그램' }, { key: 'linkedKpi', label: '연계 KPI' }, { key: 'plan', label: '사업계획서' }, { key: 'result', label: '결과보고서' }, { key: 'status', label: '증빙상태' }], rows });
}
