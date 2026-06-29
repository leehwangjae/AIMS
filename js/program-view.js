import { getCollection, upsertItem, removeItem } from './store.js';
import { createCard, createEmptyState, createTable } from './components.js';
import { validateRequired, validateDateRange, validateNumber } from './form-utils.js';
import { showToast } from './ui.js';
import { UNIT_TASKS, KPI_DEFINITIONS } from '../data/kpi-data.js';

const FORM_ID = 'programForm';
const DEPT_FORM_ID = 'departmentForm';
const GRADUATE_FORM_ID = 'graduateForm';
const COMPANY_FORM_ID = 'companyForm';
const INDUSTRY_FORM_ID = 'industryIndexForm';
const DEPT_TABLE_ID = 'departmentTableContainer';
const GRADUATE_TABLE_ID = 'graduateTableContainer';
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
const REQUIRED_EVIDENCE = ['사업계획서', '결과보고서', '참석자명단'];

export function renderProgramView(targetSelector, routeId = 'business-1-1') {
  const target = document.querySelector(targetSelector);
  const unitTaskId = BUSINESS_ROUTE_MAP[routeId] || '1-1';
  const unit = UNIT_TASKS.find(item => item.id === unitTaskId);
  if (!target || !unit) return;

  const hasIndustryIndex = hasIndustryIndexKpi(unitTaskId);
  const companiesPanel = `
    <div data-business-panel="companies" class="hidden">
      ${createCard({ title: '참여기업 등록', content: renderCompanyForm(unitTaskId) })}
      ${hasIndustryIndex ? createCard({ title: '산학협력지수 기초데이터', content: renderIndustryIndexForm(unitTaskId) }) : ''}
      ${createCard({ title: '참여기업 현황', content: `<div id="${COMPANY_TABLE_ID}"></div>` })}
      ${hasIndustryIndex ? createCard({ title: '산학협력지수 산출입력 현황', content: `<div id="${INDUSTRY_TABLE_ID}"></div>` }) : ''}
    </div>
  `;

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">Business Management</div>
        <h2 class="page-title">${unit.name} 사업관리</h2>
        <p class="page-desc">참여학과, 졸업생 원자료, 참여기업, 프로그램, 참여교원, 증빙상태를 통합 관리합니다.</p>
      </div>
    </section>

    <section class="sc"><div class="scb"><div class="unit-tabs business-tabs">
      <button class="unit-tab on" data-business-tab="departments">참여학과</button>
      <button class="unit-tab" data-business-tab="graduates">졸업생관리</button>
      <button class="unit-tab" data-business-tab="companies">참여기업</button>
      <button class="unit-tab" data-business-tab="programs">프로그램관리</button>
      <button class="unit-tab" data-business-tab="faculty">참여교원</button>
      <button class="unit-tab" data-business-tab="evidence">증빙현황</button>
    </div></div></section>

    <div data-business-panel="departments">${createCard({ title: '참여학과 등록', content: renderDepartmentForm(unitTaskId) })}${createCard({ title: '참여학과 현황', content: `<div id="${DEPT_TABLE_ID}"></div>` })}</div>
    <div data-business-panel="graduates" class="hidden">${createCard({ title: '졸업생 원자료 등록', content: renderGraduateForm(unitTaskId) })}${createCard({ title: '졸업생 원자료 현황', content: `<div id="${GRADUATE_TABLE_ID}"></div>` })}</div>
    ${companiesPanel}
    <div data-business-panel="programs" class="hidden">${createCard({ title: '프로그램 등록', content: renderProgramForm(unitTaskId) })}${createCard({ title: '프로그램 목록 및 증빙상태', content: `<div id="${TABLE_ID}"></div>` })}</div>
    <div data-business-panel="faculty" class="hidden">${createCard({ title: '참여교원 실적 요약', content: `<div id="${FACULTY_SUMMARY_ID}"></div>` })}</div>
    <div data-business-panel="evidence" class="hidden">${createCard({ title: '증빙현황 요약', content: `<div id="${EVIDENCE_SUMMARY_ID}"></div>` })}</div>
  `;

  bindBusinessTabs();
  bindDepartmentForm(unitTaskId);
  bindGraduateForm(unitTaskId);
  bindCompanyForm(unitTaskId);
  if (hasIndustryIndex) bindIndustryIndexForm(unitTaskId);
  bindProgramForm(unitTaskId);
  refreshBusinessTables(unitTaskId, hasIndustryIndex);
  scheduleHydrationRefresh(unitTaskId, hasIndustryIndex);
}

function refreshBusinessTables(unitTaskId, hasIndustryIndex = hasIndustryIndexKpi(unitTaskId)) {
  renderDepartmentTable(unitTaskId);
  renderGraduateTable(unitTaskId);
  renderCompanyTable(unitTaskId);
  if (hasIndustryIndex) renderIndustryIndexTable(unitTaskId);
  renderProgramTable(unitTaskId);
  renderFacultySummary(unitTaskId);
  renderEvidenceSummary(unitTaskId);
}

function scheduleHydrationRefresh(unitTaskId, hasIndustryIndex) {
  [250, 800, 1600].forEach(delay => {
    window.setTimeout(() => {
      if (document.querySelector(`#${DEPT_TABLE_ID}`) || document.querySelector(`#${TABLE_ID}`)) {
        refreshBusinessTables(unitTaskId, hasIndustryIndex);
      }
    }, delay);
  });
}

function hasIndustryIndexKpi(unitTaskId) {
  return (KPI_DEFINITIONS[unitTaskId] || []).some(kpi => kpi.name === '산학협력지수');
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
    <div class="evidence-panel" style="margin-bottom:12px;">
      <div class="evidence-card"><strong>주의</strong><p>참여학과의 학부·석사·박사 수는 학과 규모 및 참여 기반 정보입니다. 인력양성 KPI는 매년 배출되는 졸업생 원자료 기준으로 별도 산출합니다.</p></div>
    </div>
    <form id="${DEPT_FORM_ID}" class="form-grid">
      <input type="hidden" name="unitTaskId" value="${unitTaskId}" />
      <label class="form-field"><span>학과명</span><input name="department" type="text" placeholder="예: 전기공학과" /></label>
      <label class="form-field"><span>학부 재학생 수(규모정보)</span><input name="bachelor" type="number" min="0" value="0" /></label>
      <label class="form-field"><span>석사 재학생 수(규모정보)</span><input name="master" type="number" min="0" value="0" /></label>
      <label class="form-field"><span>박사 재학생 수(규모정보)</span><input name="doctor" type="number" min="0" value="0" /></label>
      <label class="form-field"><span>나노디그리 참여자 수(규모정보)</span><input name="nano" type="number" min="0" value="0" /></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">저장</button><button class="btn btn-outline" type="reset">초기화</button></div>
    </form>`;
}

function bindDepartmentForm(unitTaskId) {
  const form = document.querySelector(`#${DEPT_FORM_ID}`);
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['department']).valid) return showToast('학과명을 입력해 주세요.');
    const numbers = ['bachelor', 'master', 'doctor', 'nano'];
    if (numbers.some(key => !validateNumber(values[key], { min: 0 }).valid)) return showToast('인원 입력값을 확인해 주세요.');
    upsertItem('departments', { id: `dept_${Date.now()}`, unitTaskId, department: values.department, bachelor: Number(values.bachelor), master: Number(values.master), doctor: Number(values.doctor), nano: Number(values.nano), note: '학과 규모 정보이며 KPI 산출 제외' });
    showToast('참여학과가 저장되었습니다. 해당 수치는 KPI에 직접 반영되지 않습니다.');
    form.reset();
    renderDepartmentTable(unitTaskId);
  });
}

function normalizeDepartmentRow(row) {
  const memo = row.memo || row.note || '';
  const masterMatch = String(memo).match(/석사\s*(\d+)/);
  const doctorMatch = String(memo).match(/박사\s*(\d+)/);
  const nanoMatch = String(memo).match(/나노디그리\s*(\d+)/);
  return {
    ...row,
    unitTaskId: row.unitTaskId || row.unit_task_id,
    department: row.department || row.name || '-',
    bachelor: Number(row.bachelor ?? row.studentCount ?? row.student_count ?? 0),
    master: Number(row.master ?? (masterMatch ? masterMatch[1] : row.graduateCount ?? row.graduate_count ?? 0) ?? 0),
    doctor: Number(row.doctor ?? (doctorMatch ? doctorMatch[1] : 0) ?? 0),
    nano: Number(row.nano ?? (nanoMatch ? nanoMatch[1] : 0) ?? 0),
    note: row.note || row.memo || 'KPI 산출 제외'
  };
}

function renderDepartmentTable(unitTaskId) {
  const target = document.querySelector(`#${DEPT_TABLE_ID}`);
  if (!target) return;
  const rows = getCollection('departments')
    .map(normalizeDepartmentRow)
    .filter(row => row.unitTaskId === unitTaskId && row.department && row.department !== '-');
  if (!rows.length) return target.innerHTML = createEmptyState({ title: '참여학과 없음', description: '참여학과를 등록해 주세요.' });
  target.innerHTML = `${createTable({ columns: [
    { key: 'department', label: '학과' },
    { key: 'bachelor', label: '학부 재학생' },
    { key: 'master', label: '석사 재학생' },
    { key: 'doctor', label: '박사 재학생' },
    { key: 'nano', label: '나노디그리 참여' },
    { key: 'note', label: '비고' }
  ], rows })}<div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestDepartment" type="button">최근 등록 학과 삭제</button></div>`;
  document.querySelector('#deleteLatestDepartment')?.addEventListener('click', () => { const latest = rows.at(-1); if (!latest) return; removeItem('departments', latest.id); showToast('최근 등록 학과가 삭제되었습니다.'); renderDepartmentTable(unitTaskId); });
}

function renderGraduateForm(unitTaskId) {
  const hasGraduateKpi = (KPI_DEFINITIONS[unitTaskId] || []).some(kpi => GRADUATE_KPI_NAMES.includes(kpi.name));
  if (!hasGraduateKpi) return `<div class="evidence-panel"><div class="evidence-card"><strong>프로그램 기반 성과관리</strong><p>이 단위과제는 프로그램 운영실적과 증빙자료를 중심으로 성과를 집계합니다.</p></div></div>`;
  return `
    <div class="evidence-panel" style="margin-bottom:12px;">
      <div class="evidence-card"><strong>산출기준</strong><p>인력양성 인원과 취업률은 참여학과 전체 학생 수가 아니라 해당 연도 졸업생 원자료를 기준으로 산출합니다.</p></div>
      <div class="evidence-card"><strong>권장 엑셀 컬럼</strong><p>학번, 성명, 학과, 학위구분, 졸업연월, 취업여부, 지역취업 여부</p></div>
    </div>
    <form id="${GRADUATE_FORM_ID}" class="form-grid">
      <input type="hidden" name="unitTaskId" value="${unitTaskId}" />
      <label class="form-field"><span>성명</span><input name="studentName" type="text" placeholder="예: 홍길동" /></label>
      <label class="form-field"><span>학과</span><input name="department" type="text" placeholder="예: 전기공학과" /></label>
      <label class="form-field"><span>학위구분</span><select name="degreeType"><option value="학부">학부</option><option value="석사">석사</option><option value="박사">박사</option><option value="나노디그리">나노디그리</option></select></label>
      <label class="form-field"><span>졸업연월</span><input name="graduationMonth" type="month" /></label>
      <label class="form-field"><span>취업여부</span><select name="employed"><option value="N">미취업/확인중</option><option value="Y">취업</option></select></label>
      <label class="form-field"><span>취업지역</span><select name="employmentRegion"><option value="지역외">지역외</option><option value="지역내">지역내</option><option value="인천">인천</option><option value="그외">그외</option></select></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">졸업생 등록</button><button class="btn btn-outline" type="reset">초기화</button></div>
    </form>`;
}

function bindGraduateForm(unitTaskId) {
  const form = document.querySelector(`#${GRADUATE_FORM_ID}`);
  if (!form) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['studentName', 'department', 'degreeType']).valid) return showToast('졸업생 기본정보를 입력해 주세요.');
    upsertItem('graduates', { id: `graduate_${Date.now()}`, unitTaskId, studentName: values.studentName, department: values.department, degreeType: values.degreeType, graduationMonth: values.graduationMonth || '', employed: values.employed, employmentRegion: values.employmentRegion });
    showToast('졸업생 원자료가 저장되었습니다. 인력양성 및 취업률 KPI 산출에 반영됩니다.');
    form.reset();
    renderGraduateTable(unitTaskId);
  });
}

function renderGraduateTable(unitTaskId) {
  const target = document.querySelector(`#${GRADUATE_TABLE_ID}`);
  if (!target) return;
  const rows = getCollection('graduates').filter(row => row.unitTaskId === unitTaskId);
  if (!rows.length) return target.innerHTML = createEmptyState({ title: '졸업생 원자료 없음', description: '졸업생 명단을 등록하면 인력양성 및 취업률 KPI가 자동 산출됩니다.' });
  target.innerHTML = `${createTable({ columns: [
    { key: 'studentName', label: '성명' },
    { key: 'department', label: '학과' },
    { key: 'degreeType', label: '학위구분' },
    { key: 'graduationMonth', label: '졸업연월' },
    { key: 'employedLabel', label: '취업여부' },
    { key: 'employmentRegion', label: '취업지역' },
    { key: 'graduateWeight', label: '인력양성 가중치' },
    { key: 'employmentWeight', label: '취업 가중치' }
  ], rows: rows.map(row => ({ ...row, employedLabel: row.employed === 'Y' ? '취업' : '미취업/확인중', graduateWeight: getDegreeWeight(row.degreeType), employmentWeight: row.employed === 'Y' ? getEmploymentRegionWeight(row.employmentRegion) : 0 })) })}<div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestGraduate" type="button">최근 등록 졸업생 삭제</button></div>`;
  document.querySelector('#deleteLatestGraduate')?.addEventListener('click', () => { const latest = rows.at(-1); if (!latest) return; removeItem('graduates', latest.id); showToast('최근 등록 졸업생이 삭제되었습니다.'); renderGraduateTable(unitTaskId); });
}

function renderCompanyForm(unitTaskId) {
  return `<form id="${COMPANY_FORM_ID}" class="form-grid"><input type="hidden" name="unitTaskId" value="${unitTaskId}" /><label class="form-field"><span>기업명</span><input name="companyName" type="text" placeholder="예: 유일로보틱스" /></label><label class="form-field"><span>산업분야</span><input name="industry" type="text" placeholder="예: 로봇, 바이오, 반도체" /></label><label class="form-field"><span>MOU 체결 여부</span><select name="hasMou"><option value="N">미체결</option><option value="Y">체결</option></select></label><label class="form-field"><span>MOU 체결일</span><input name="mouDate" type="date" /></label><label class="form-field"><span>참여유형</span><select name="participationType"><option value="멘토링">멘토링</option><option value="캡스톤">캡스톤</option><option value="재직자교육">재직자교육</option><option value="PBL">PBL</option><option value="공동연구">공동연구</option><option value="기타">기타</option></select></label><label class="form-field"><span>비고</span><input name="memo" type="text" placeholder="기업 참여 내용" /></label><div class="form-actions"><button class="btn btn-primary" type="submit">저장</button><button class="btn btn-outline" type="reset">초기화</button></div></form>`;
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

function renderCompanyTable(unitTaskId) {
  const target = document.querySelector(`#${COMPANY_TABLE_ID}`);
  if (!target) return;
  const rows = getCollection('companies').filter(row => row.unitTaskId === unitTaskId);
  if (!rows.length) return target.innerHTML = createEmptyState({ title: '참여기업 없음', description: '참여기업을 등록해 주세요.' });
  const displayRows = rows.map(row => ({ ...row, hasMou: row.hasMou === 'Y' ? '체결' : '미체결' }));
  target.innerHTML = `${createTable({ columns: [{ key: 'companyName', label: '기업명' }, { key: 'industry', label: '산업분야' }, { key: 'hasMou', label: 'MOU' }, { key: 'mouDate', label: '체결일' }, { key: 'participationType', label: '참여유형' }, { key: 'memo', label: '비고' }], rows: displayRows })}<div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestCompany" type="button">최근 등록 기업 삭제</button></div>`;
  document.querySelector('#deleteLatestCompany')?.addEventListener('click', () => { const latest = rows.at(-1); if (!latest) return; removeItem('companies', latest.id); showToast('최근 등록 기업이 삭제되었습니다.'); renderCompanyTable(unitTaskId); });
}

function renderIndustryIndexForm(unitTaskId) {
  const saved = getCollection('industryIndex').find(row => row.unitTaskId === unitTaskId) || {};
  return `<form id="${INDUSTRY_FORM_ID}" class="form-grid"><input type="hidden" name="unitTaskId" value="${unitTaskId}" /><label class="form-field"><span>A 교과목 개편 누적 수</span><input name="curriculumRevisionCount" type="number" min="0" value="${saved.curriculumRevisionCount || 0}" /></label><label class="form-field"><span>B 기업참여형 캡스톤 과제 수</span><input name="companyCapstoneCount" type="number" min="0" value="${saved.companyCapstoneCount || 0}" /></label><label class="form-field"><span>C 협력기업 MOU 체결 건수</span><input name="mouCount" type="number" min="0" value="${saved.mouCount || 0}" /></label><label class="form-field"><span>D 재직자 교육과정 운영 횟수</span><input name="workerTrainingCount" type="number" min="0" value="${saved.workerTrainingCount || 0}" /></label><div class="form-actions"><button class="btn btn-primary" type="submit">산학협력지수 저장</button></div></form>`;
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

function renderIndustryIndexTable(unitTaskId) {
  const target = document.querySelector(`#${INDUSTRY_TABLE_ID}`);
  if (!target) return;
  const row = getCollection('industryIndex').find(item => item.unitTaskId === unitTaskId);
  if (!row) return target.innerHTML = createEmptyState({ title: '산학협력지수 입력 없음', description: 'A~D 기초데이터를 입력해 주세요.' });
  target.innerHTML = createTable({ columns: [{ key: 'name', label: '항목' }, { key: 'count', label: '입력값' }, { key: 'target', label: '목표' }], rows: [{ name: 'A 교과목 개편', count: row.curriculumRevisionCount, target: 40 }, { name: 'B 기업참여형 캡스톤', count: row.companyCapstoneCount, target: 23 }, { name: 'C 협력기업 MOU', count: row.mouCount, target: 30 }, { name: 'D 재직자 교육과정', count: row.workerTrainingCount, target: 30 }] });
}

function renderProgramForm(unitTaskId) {
  const kpis = KPI_DEFINITIONS[unitTaskId] || [];
  return `<form id="${FORM_ID}" class="form-grid"><input type="hidden" name="id" /><input type="hidden" name="unitTaskId" value="${unitTaskId}" /><label class="form-field"><span>프로그램명</span><input name="name" type="text" placeholder="예: 융합기술 포럼, 단기전문교육과정" /></label><label class="form-field"><span>구분</span><select name="type"><option value="교육프로그램">교육프로그램</option><option value="포럼/세미나">포럼/세미나</option><option value="성과교류회">성과교류회</option><option value="PBL">PBL</option><option value="창업프로그램">창업프로그램</option><option value="산학협력 프로젝트">산학협력 프로젝트</option><option value="초광역 협력">초광역 협력</option><option value="기타">기타</option></select></label><label class="form-field"><span>연계 KPI</span><select name="linkedKpi">${kpis.map(kpi => `<option value="${kpi.name}">${kpi.name}</option>`).join('')}</select></label><label class="form-field"><span>참여교원</span><input name="faculty" type="text" placeholder="예: 김OO(총괄), 이OO(강연)" /></label><label class="form-field"><span>참여기업</span><input name="companyNames" type="text" placeholder="예: 유일로보틱스, 엘라인" /></label><label class="form-field"><span>시작일</span><input name="startDate" type="date" /></label><label class="form-field"><span>종료일</span><input name="endDate" type="date" /></label><label class="form-field"><span>참여자/수료자 수</span><input name="participants" type="number" min="0" value="0" /></label><label class="form-field"><span>KPI 인정실적</span><input name="expectedRecognized" type="number" min="0" placeholder="미입력 시 참여자/수료자 수 기준" /></label><label class="form-field"><span>예산</span><input name="budget" type="number" min="0" value="0" /></label><label class="form-field"><span>사업계획서</span><select name="hasPlan"><option value="Y">첨부완료</option><option value="N">미첨부</option></select></label><label class="form-field"><span>결과보고서</span><select name="hasResultReport"><option value="Y">첨부완료</option><option value="N">미첨부</option></select></label><label class="form-field"><span>상태</span><select name="status"><option value="PLANNED">계획</option><option value="IN_PROGRESS">진행중</option><option value="COMPLETED">완료</option></select></label><div class="form-actions"><button class="btn btn-primary" type="submit">저장</button><button class="btn btn-outline" type="reset">초기화</button></div></form>`;
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
    if (values.expectedRecognized && !validateNumber(values.expectedRecognized, { min: 0 }).valid) return showToast('KPI 인정실적 입력값을 확인해 주세요.');
    upsertItem('programs', { id: values.id || `program_${Date.now()}`, unitTaskId, name: values.name, type: values.type, linkedKpi: values.linkedKpi, faculty: values.faculty || '', companyNames: values.companyNames || '', startDate: values.startDate, endDate: values.endDate, participants: Number(values.participants), expectedRecognized: values.expectedRecognized === '' ? null : Number(values.expectedRecognized), budget: Number(values.budget), hasPlan: values.hasPlan, hasResultReport: values.hasResultReport, status: values.status });
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
  const rows = programs.map(program => {
    const evidence = getProgramEvidenceStatus(program);
    return { ...program, statusLabel: getProgramStatusLabel(program.status), hasPlan: program.hasPlan === 'Y' || evidence.planReady ? '첨부완료' : '미첨부', hasResultReport: program.hasResultReport === 'Y' || evidence.resultReady ? '첨부완료' : '미첨부', evidenceReady: evidence.ready ? '완비' : `보완필요(${evidence.readyCount}/${evidence.totalCount})`, kpiReady: program.status === 'COMPLETED' && evidence.ready ? 'KPI 반영 가능' : '대기', expectedRecognized: program.expectedRecognized ?? '-' };
  });
  target.innerHTML = `${renderProgramStatusControls(programs)}${createTable({ columns: [{ key: 'name', label: '프로그램명' }, { key: 'type', label: '구분' }, { key: 'linkedKpi', label: '연계 KPI' }, { key: 'participants', label: '참여/수료' }, { key: 'expectedRecognized', label: 'KPI 인정실적' }, { key: 'faculty', label: '참여교원' }, { key: 'companyNames', label: '참여기업' }, { key: 'hasPlan', label: '계획서' }, { key: 'hasResultReport', label: '결과보고서' }, { key: 'evidenceReady', label: '증빙상태' }, { key: 'kpiReady', label: 'KPI 반영' }, { key: 'statusLabel', label: '상태' }], rows })}<div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestProgram" type="button">최근 등록 프로그램 삭제</button></div>`;
  bindProgramStatusControls(unitTaskId);
  document.querySelector('#deleteLatestProgram')?.addEventListener('click', () => { const latest = getUnitPrograms(unitTaskId).at(-1); if (!latest) return; removeItem('programs', latest.id); showToast('최근 등록 프로그램이 삭제되었습니다.'); renderProgramTable(unitTaskId); renderFacultySummary(unitTaskId); renderEvidenceSummary(unitTaskId); });
}

function renderProgramStatusControls(programs) {
  return `<div class="form-actions" style="margin-bottom:12px;align-items:center;"><select id="programStatusTarget" class="form-control">${programs.map(program => `<option value="${program.id}">${program.name}</option>`).join('')}</select><button class="btn btn-outline" type="button" data-program-status="PLANNED">계획</button><button class="btn btn-outline" type="button" data-program-status="IN_PROGRESS">진행중</button><button class="btn btn-primary" type="button" data-program-status="COMPLETED">완료</button></div>`;
}

function bindProgramStatusControls(unitTaskId) {
  document.querySelectorAll('[data-program-status]').forEach(button => {
    button.addEventListener('click', () => {
      const programId = document.querySelector('#programStatusTarget')?.value;
      const program = getUnitPrograms(unitTaskId).find(item => item.id === programId);
      if (!program) return;
      const nextStatus = button.dataset.programStatus;
      upsertItem('programs', { ...program, status: nextStatus });
      const evidence = getProgramEvidenceStatus(program);
      if (nextStatus === 'COMPLETED' && !evidence.ready) showToast(`완료 처리됨. 단, 필수 증빙 ${evidence.readyCount}/${evidence.totalCount}건만 등록되어 KPI 반영은 대기 상태입니다.`);
      else showToast(`프로그램 상태가 ${getProgramStatusLabel(nextStatus)}으로 변경되었습니다.`);
      renderProgramTable(unitTaskId);
      renderEvidenceSummary(unitTaskId);
    });
  });
}

function getProgramEvidenceStatus(program) {
  const files = getCollection('files').filter(file => file.unitTaskId === program.unitTaskId && (file.programName === program.name || String(file.title || '').includes(program.name)));
  const evidenceMap = REQUIRED_EVIDENCE.map(category => {
    const matched = files.find(file => file.category === category);
    const ready = matched ? matched.fileName && matched.fileName !== '미등록' && matched.fileName !== '파일 미선택' : false;
    return { category, ready };
  });
  const readyCount = evidenceMap.filter(item => item.ready).length;
  const fallbackReady = program.hasPlan === 'Y' && program.hasResultReport === 'Y';
  return { planReady: evidenceMap.find(item => item.category === '사업계획서')?.ready || program.hasPlan === 'Y', resultReady: evidenceMap.find(item => item.category === '결과보고서')?.ready || program.hasResultReport === 'Y', ready: files.length ? readyCount === REQUIRED_EVIDENCE.length : fallbackReady, readyCount: files.length ? readyCount : (fallbackReady ? REQUIRED_EVIDENCE.length : 0), totalCount: REQUIRED_EVIDENCE.length };
}

function getProgramStatusLabel(status) {
  const labels = { PLANNED: '계획', IN_PROGRESS: '진행중', COMPLETED: '완료' };
  return labels[status] || status || '계획';
}

function renderFacultySummary(unitTaskId) {
  const target = document.querySelector(`#${FACULTY_SUMMARY_ID}`);
  if (!target) return;
  const programs = getUnitPrograms(unitTaskId).filter(program => program.faculty);
  if (!programs.length) return target.innerHTML = createEmptyState({ title: '참여교원 없음', description: '참여교원이 입력된 프로그램이 없습니다.' });
  const rows = programs.map(program => ({ programName: program.name, faculty: program.faculty, role: program.type, evidence: getProgramEvidenceStatus(program).resultReady ? '결과보고서 첨부' : '결과보고서 미첨부' }));
  target.innerHTML = createTable({ columns: [{ key: 'programName', label: '프로그램' }, { key: 'faculty', label: '참여교원' }, { key: 'role', label: '참여유형' }, { key: 'evidence', label: '근거자료' }], rows });
}

function renderEvidenceSummary(unitTaskId) {
  const target = document.querySelector(`#${EVIDENCE_SUMMARY_ID}`);
  if (!target) return;
  const programs = getUnitPrograms(unitTaskId);
  if (!programs.length) return target.innerHTML = createEmptyState({ title: '증빙현황 없음', description: '등록된 프로그램이 없습니다.' });
  const rows = programs.map(program => {
    const evidence = getProgramEvidenceStatus(program);
    return { name: program.name, linkedKpi: program.linkedKpi, plan: evidence.planReady ? '첨부완료' : '미첨부', result: evidence.resultReady ? '첨부완료' : '미첨부', status: evidence.ready ? '완비' : `보완필요(${evidence.readyCount}/${evidence.totalCount})`, kpiReady: program.status === 'COMPLETED' && evidence.ready ? 'KPI 반영 가능' : '대기' };
  });
  target.innerHTML = createTable({ columns: [{ key: 'name', label: '프로그램' }, { key: 'linkedKpi', label: '연계 KPI' }, { key: 'plan', label: '사업계획서' }, { key: 'result', label: '결과보고서' }, { key: 'status', label: '증빙상태' }, { key: 'kpiReady', label: 'KPI 반영' }], rows });
}

function getDegreeWeight(type) {
  const weights = { 학부: 1, 학부생: 1, 석사: 1.5, 박사: 2, 나노디그리: 0.3 };
  return weights[type] ?? 1;
}

function getEmploymentRegionWeight(region) {
  const weights = { 지역내: 1, 인천: 1, 지역외: 0.5, 그외: 0.5 };
  return weights[region] ?? 0.5;
}
