import { getCollection, upsertItem, removeItem } from './store.js';
import { createCard, createEmptyState, createTable } from './components.js';
import { validateRequired, validateDateRange, validateNumber } from './form-utils.js';
import { showToast } from './ui.js';
import { UNIT_TASKS, KPI_DEFINITIONS } from '../data/kpi-data.js';

const FORM_ID = 'programForm';
const DEPT_FORM_ID = 'departmentForm';
const COMPANY_FORM_ID = 'companyForm';
const INDUSTRY_FORM_ID = 'industryIndexForm';
const DEPT_TABLE_ID = 'departmentTableContainer';
const COMPANY_TABLE_ID = 'companyTableContainer';
const INDUSTRY_TABLE_ID = 'industryIndexTableContainer';
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
        <p class="page-desc">참여학과, 참여기업, 프로그램, 참여교원, 증빙상태를 통합 관리합니다.</p>
      </div>
    </section>

    <section class="sc"><div class="scb"><div class="unit-tabs business-tabs">
      <button class="unit-tab on" data-business-tab="departments">참여학과</button>
      <button class="unit-tab" data-business-tab="companies">참여기업</button>
      <button class="unit-tab" data-business-tab="graduates">졸업생관리</button>
      <button class="unit-tab" data-business-tab="programs">프로그램관리</button>
      <button class="unit-tab" data-business-tab="faculty">참여교원</button>
      <button class="unit-tab" data-business-tab="evidence">증빙현황</button>
    </div></div></section>

    <div data-business-panel="departments">${createCard({ title: '참여학과 등록', content: renderDepartmentForm(unitTaskId) })}${createCard({ title: '참여학과 현황', content: `<div id="${DEPT_TABLE_ID}"></div>` })}</div>
    <div data-business-panel="companies" class="hidden">${createCard({ title: '참여기업 등록', content: renderCompanyForm(unitTaskId) })}${createCard({ title: '산학협력지수 기초데이터', content: renderIndustryIndexForm(unitTaskId) })}${createCard({ title: '참여기업 현황', content: `<div id="${COMPANY_TABLE_ID}"></div>` })}${createCard({ title: '산학협력지수 산출입력 현황', content: `<div id="${INDUSTRY_TABLE_ID}"></div>` })}</div>
    <div data-business-panel="graduates" class="hidden">${createCard({ title: '졸업생 명단 관리', content: renderGraduateGuide(unitTaskId) })}</div>
    <div data-business-panel="programs" class="hidden">${createCard({ title: '프로그램 등록', content: renderProgramForm(unitTaskId) })}${createCard({ title: '프로그램 목록 및 증빙상태', content: `<div id="${TABLE_ID}"></div>` })}</div>
    <div data-business-panel="faculty" class="hidden">${createCard({ title: '참여교원 실적 요약', content: `<div id="${FACULTY_SUMMARY_ID}"></div>` })}</div>
    <div data-business-panel="evidence" class="hidden">${createCard({ title: '증빙현황 요약', content: `<div id="${EVIDENCE_SUMMARY_ID}"></div>` })}</div>
  `;

  bindBusinessTabs();
  bindDepartmentForm(unitTaskId);
  bindCompanyForm(unitTaskId);
  bindIndustryIndexForm(unitTaskId);
  bindProgramForm(unitTaskId);
  renderDepartmentTable(unitTaskId);
  renderCompanyTable(unitTaskId);
  renderIndustryIndexTable(unitTaskId);
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

function renderDepartmentForm(unitTaskId) {
  return `
    <form id="${DEPT_FORM_ID}" class="form-grid">
      <input type="hidden" name="unitTaskId" value="${unitTaskId}" />
      <label class="form-field"><span>학과명</span><input name="department" type="text" placeholder="예: 전기공학과" /></label>
      <label class="form-field"><span>학부생 수</span><input name="bachelor" type="number" min="0" value="0" /></label>
      <label class="form-field"><span>석사 수</span><input name="master" type="number" min="0" value="0" /></label>
      <label class="form-field"><span>박사 수</span><input name="doctor" type="number" min="0" value="0" /></label>
      <label class="form-field"><span>나노디그리 수</span><input name="nano" type="number" min="0" value="0" /></label>
      <label class="form-field"><span>취업자 수</span><input name="employed" type="number" min="0" value="0" /></label>
      <label class="form-field"><span>지역내 취업자 수</span><input name="localEmployed" type="number" min="0" value="0" /></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">저장</button><button class="btn btn-outline" type="reset">초기화</button></div>
    </form>`;
}

function renderCompanyForm(unitTaskId) {
  return `
    <form id="${COMPANY_FORM_ID}" class="form-grid">
      <input type="hidden" name="unitTaskId" value="${unitTaskId}" />
      <label class="form-field"><span>기업명</span><input name="companyName" type="text" placeholder="예: 유일로보틱스" /></label>
      <label class="form-field"><span>산업분야</span><input name="industry" type="text" placeholder="예: 로봇, 바이오, 반도체" /></label>
      <label class="form-field"><span>MOU 체결 여부</span><select name="hasMou"><option value="N">미체결</option><option value="Y">체결</option></select></label>
      <label class="form-field"><span>MOU 체결일</span><input name="mouDate" type="date" /></label>
      <label class="form-field"><span>참여유형</span><select name="participationType"><option value="멘토링">멘토링</option><option value="캡스톤">캡스톤</option><option value="재직자교육">재직자교육</option><option value="PBL">PBL</option><option value="공동연구">공동연구</option><option value="기타">기타</option></select></label>
      <label class="form-field"><span>비고</span><input name="memo" type="text" placeholder="기업 참여 내용" /></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">저장</button><button class="btn btn-outline" type="reset">초기화</button></div>
    </form>`;
}

function renderIndustryIndexForm(unitTaskId) {
  const saved = getCollection('industryIndex').find(row => row.unitTaskId === unitTaskId) || {};
  return `
    <form id="${INDUSTRY_FORM_ID}" class="form-grid">
      <input type="hidden" name="unitTaskId" value="${unitTaskId}" />
      <label class="form-field"><span>A 교과목 개편 누적 수</span><input name="curriculumRevisionCount" type="number" min="0" value="${saved.curriculumRevisionCount || 0}" /></label>
      <label class="form-field"><span>B 기업참여형 캡스톤 과제 수</span><input name="companyCapstoneCount" type="number" min="0" value="${saved.companyCapstoneCount || 0}" /></label>
      <label class="form-field"><span>C 협력기업 MOU 체결 건수</span><input name="mouCount" type="number" min="0" value="${saved.mouCount || 0}" /></label>
      <label class="form-field"><span>D 재직자 교육과정 운영 횟수</span><input name="workerTrainingCount" type="number" min="0" value="${saved.workerTrainingCount || 0}" /></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">산학협력지수 저장</button></div>
    </form>`;
}

function bindDepartmentForm(unitTaskId) {
  const form = document.querySelector(`#${DEPT_FORM_ID}`);
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['department']).valid) return showToast('학과명을 입력해 주세요.');
    const numbers = ['bachelor', 'master', 'doctor', 'nano', 'employed', 'localEmployed'];
    if (numbers.some(key => !validateNumber(values[key], { min: 0 }).valid)) return showToast('인원 입력값을 확인해 주세요.');
    upsertItem('departments', { id: `dept_${Date.now()}`, unitTaskId, department: values.department, bachelor: Number(values.bachelor), master: Number(values.master), doctor: Number(values.doctor), nano: Number(values.nano), employed: Number(values.employed), localEmployed: Number(values.localEmployed) });
    showToast('참여학과가 저장되었습니다.');
    form.reset();
    renderDepartmentTable(unitTaskId);
  });
}

function bindCompanyForm(unitTaskId) {
  const form = document.querySelector(`#${COMPANY_FORM_ID}`);
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['companyName']).valid) return showToast('기업명을 입력해 주세요.');
    upsertItem('companies', { id: `company_${Date.now()}`, unitTaskId, companyName: values.companyName, industry: values.industry || '', hasMou: values.hasMou, mouDate: values.mouDate || '', participationType: values.participationType, memo: values.memo || '' });
    showToast('참여기업이 저장되었습니다.');
    form.reset();
    renderCompanyTable(unitTaskId);
  });
}

function bindIndustryIndexForm(unitTaskId) {
  const form = document.querySelector(`#${INDUSTRY_FORM_ID}`);
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const fields = ['curriculumRevisionCount', 'companyCapstoneCount', 'mouCount', 'workerTrainingCount'];
    if (fields.some(key => !validateNumber(values[key], { min: 0 }).valid)) return showToast('산학협력지수 입력값을 확인해 주세요.');
    upsertItem('industryIndex', { id: `industry_${unitTaskId}`, unitTaskId, curriculumRevisionCount: Number(values.curriculumRevisionCount), companyCapstoneCount: Number(values.companyCapstoneCount), mouCount: Number(values.mouCount), workerTrainingCount: Number(values.workerTrainingCount) });
    showToast('산학협력지수 기초데이터가 저장되었습니다.');
    renderIndustryIndexTable(unitTaskId);
  });
}

function renderDepartmentTable(unitTaskId) {
  const target = document.querySelector(`#${DEPT_TABLE_ID}`);
  if (!target) return;
  const rows = getCollection('departments').filter(row => row.unitTaskId === unitTaskId);
  if (!rows.length) return target.innerHTML = createEmptyState({ title: '참여학과 없음', description: '참여학과를 등록해 주세요.' });
  const displayRows = rows.map(row => ({ ...row, weightedGraduates: calculateWeightedGraduates(row), weightedEmployment: calculateWeightedEmployment(row), employmentRate: calculateWeightedGraduates(row) ? `${Math.round((calculateWeightedEmployment(row) / calculateWeightedGraduates(row)) * 1000) / 10}%` : '0%' }));
  target.innerHTML = `${createTable({ columns: [{ key: 'department', label: '학과' }, { key: 'bachelor', label: '학부' }, { key: 'master', label: '석사' }, { key: 'doctor', label: '박사' }, { key: 'nano', label: '나노디그리' }, { key: 'weightedGraduates', label: '가중 인력양성' }, { key: 'employed', label: '취업자' }, { key: 'localEmployed', label: '지역내' }, { key: 'weightedEmployment', label: '가중 취업' }, { key: 'employmentRate', label: '가중 취업률' }], rows: displayRows })}<div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestDepartment" type="button">최근 등록 학과 삭제</button></div>`;
  document.querySelector('#deleteLatestDepartment')?.addEventListener('click', () => { const latest = rows.at(-1); if (!latest) return; removeItem('departments', latest.id); showToast('최근 등록 학과가 삭제되었습니다.'); renderDepartmentTable(unitTaskId); });
}

function renderCompanyTable(unitTaskId) {
  const target = document.querySelector(`#${COMPANY_TABLE_ID}`);
  if (!target) return;
  const rows = getCollection('companies').filter(row => row.unitTaskId === unitTaskId);
  if (!rows.length) return target.innerHTML = createEmptyState({ title: '참여기업 없음', description: '참여기업을 등록해 주세요.' });
  const displayRows = rows.map(row => ({ ...row, hasMou: row.hasMou === 'Y' ? '체결' : '미체결' }));
  target.innerHTML = `${createTable({ columns: [{ key: 'companyName', label: '기업명' }, { key: 'industry', label: '산업분야' }, { key: 'hasMou', label: 'MOU' }, { key: 'mouDate', label: '체결일' }, { key: 'participationType', label: '참여유형' }, { key: 'memo', label: '비고' }], rows: displayRows })}<div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestCompany" type="button">최근 등록 기업 삭제</button></div>`;
  document.querySelector('#deleteLatestCompany')?.addEventListener('click', () => { const latest = rows.at(-1); if (!latest) return; removeItem('companies', latest.id); showToast('최근 등록 기업이 삭제되었습니다.'); renderCompanyTable(unitTaskId); });
}

function renderIndustryIndexTable(unitTaskId) {
  const target = document.querySelector(`#${INDUSTRY_TABLE_ID}`);
  if (!target) return;
  const row = getCollection('industryIndex').find(item => item.unitTaskId === unitTaskId);
  if (!row) return target.innerHTML = createEmptyState({ title: '산학협력지수 입력 없음', description: 'A~D 기초데이터를 입력해 주세요.' });
  target.innerHTML = createTable({ columns: [{ key: 'name', label: '항목' }, { key: 'count', label: '입력값' }, { key: 'target', label: '목표' }], rows: [{ name: 'A 교과목 개편', count: row.curriculumRevisionCount, target: 40 }, { name: 'B 기업참여형 캡스톤', count: row.companyCapstoneCount, target: 23 }, { name: 'C 협력기업 MOU', count: row.mouCount, target: 30 }, { name: 'D 재직자 교육과정', count: row.workerTrainingCount, target: 30 }] });
}

function calculateWeightedGraduates(row) {
  return Math.round((Number(row.bachelor || 0) + Number(row.master || 0) * 1.5 + Number(row.doctor || 0) * 2 + Number(row.nano || 0) * 0.3) * 10) / 10;
}

function calculateWeightedEmployment(row) {
  const local = Number(row.localEmployed || 0);
  const outside = Math.max(Number(row.employed || 0) - local, 0);
  return Math.round((local + outside * 0.5) * 10) / 10;
}

function renderGraduateGuide(unitTaskId) {
  const hasGraduateKpi = (KPI_DEFINITIONS[unitTaskId] || []).some(kpi => GRADUATE_KPI_NAMES.includes(kpi.name));
  if (!hasGraduateKpi) return `<div class="evidence-panel"><div class="evidence-card"><strong>프로그램 기반 성과관리</strong><p>프로그램 운영실적과 증빙자료를 중심으로 성과를 집계합니다.</p></div></div>`;
  return `<div class="evidence-panel"><div class="evidence-card"><strong>졸업생 명단 업로드</strong><p>인력양성 인원 KPI는 참여학과별 졸업생 엑셀 명단 기준으로 집계합니다.</p></div><div class="evidence-card"><strong>권장 컬럼</strong><p>학번, 성명, 학과, 학위구분, 졸업연월, 취업여부, 지역취업 여부</p></div><div class="evidence-card"><strong>현재 반영</strong><p>참여학과 탭의 학부·석사·박사·나노디그리 인원 기준으로 가중치를 계산합니다.</p></div></div>`;
}

function renderProgramForm(unitTaskId) {
  const kpis = KPI_DEFINITIONS[unitTaskId] || [];
  return `<form id="${FORM_ID}" class="form-grid"><input type="hidden" name="id" /><input type="hidden" name="unitTaskId" value="${unitTaskId}" /><label class="form-field"><span>프로그램명</span><input name="name" type="text" placeholder="예: 융합기술 포럼, 단기전문교육과정" /></label><label class="form-field"><span>구분</span><select name="type"><option value="교육프로그램">교육프로그램</option><option value="포럼/세미나">포럼/세미나</option><option value="성과교류회">성과교류회</option><option value="PBL">PBL</option><option value="창업프로그램">창업프로그램</option><option value="산학협력 프로젝트">산학협력 프로젝트</option><option value="초광역 협력">초광역 협력</option><option value="기타">기타</option></select></label><label class="form-field"><span>연계 KPI</span><select name="linkedKpi">${kpis.map(kpi => `<option value="${kpi.name}">${kpi.name}</option>`).join('')}</select></label><label class="form-field"><span>참여교원</span><input name="faculty" type="text" placeholder="예: 김OO(총괄), 이OO(강연)" /></label><label class="form-field"><span>참여기업</span><input name="companyNames" type="text" placeholder="예: 유일로보틱스, 엘라인" /></label><label class="form-field"><span>시작일</span><input name="startDate" type="date" /></label><label class="form-field"><span>종료일</span><input name="endDate" type="date" /></label><label class="form-field"><span>참여자/수료자 수</span><input name="participants" type="number" min="0" value="0" /></label><label class="form-field"><span>예산</span><input name="budget" type="number" min="0" value="0" /></label><label class="form-field"><span>사업계획서</span><select name="hasPlan"><option value="Y">첨부완료</option><option value="N">미첨부</option></select></label><label class="form-field"><span>결과보고서</span><select name="hasResultReport"><option value="Y">첨부완료</option><option value="N">미첨부</option></select></label><label class="form-field"><span>상태</span><select name="status"><option value="PLANNED">계획</option><option value="IN_PROGRESS">진행중</option><option value="COMPLETED">완료</option></select></label><div class="form-actions"><button class="btn btn-primary" type="submit">저장</button><button class="btn btn-outline" type="reset">초기화</button></div></form>`;
}

function bindProgramForm(unitTaskId) {
  const form = document.querySelector(`#${FORM_ID}`);
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['name', 'type', 'linkedKpi', 'startDate', 'endDate', 'status']).valid) return showToast('필수 입력 항목을 확인해 주세요.');
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
