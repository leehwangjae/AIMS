import { getCollection, upsertItem } from './store.js';
import { createCard } from './components.js';
import { validateRequired, validateNumber } from './form-utils.js';
import { showToast } from './ui.js';
import { KPI_DEFINITIONS } from '../data/kpi-data.js';
import { getBudgetItems } from '../data/budget-data.js';

const FORM_ID = 'planDraftForm';
const OUTPUT_ID = 'planDraftOutput';
const KPI_SELECT_ID = 'planLinkedKpi';
const BUDGET_SELECT_ID = 'planBudgetCategory';
const BALANCE_TEXT_ID = 'budgetBalanceText';
const AFTER_BALANCE_TEXT_ID = 'budgetAfterBalanceText';
const KPI_TYPE_ID = 'planKpiPerformanceType';
const KPI_GUIDE_ID = 'kpiPerformanceGuide';
const EXPECTED_INPUT_ID = 'expectedPerformanceInput';
const EXPECTED_RESULT_ID = 'expectedKpiResult';
const KPI_CONTRIBUTION_ID = 'expectedKpiContribution';
const BUDGET_AMOUNT_ID = 'planBudgetAmount';

const EVIDENCE_CATEGORIES = ['사업계획서', '결과보고서', '참석자명단', '만족도조사', '정산자료', '기타증빙'];

export function renderPlanDraftView(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">AI Work Center</div>
        <h2 class="page-title">사업계획 기안 생성</h2>
        <p class="page-desc">사업계획 기안 초안을 생성하고, 프로그램·예산·증빙관리까지 자동 연계합니다.</p>
      </div>
    </section>
    ${createCard({ title: '기안 기본정보 입력', content: renderForm() })}
    ${createCard({ title: '자동 생성 초안', content: `<pre id="${OUTPUT_ID}" class="draft-output">입력 후 [기안 초안 생성]을 누르세요.</pre>` })}
  `;

  bindPlanDraftForm();
  updateLinkedKpiOptions();
  updateKpiPerformanceOptions();
  updateExpectedKpiResult();
  updateBudgetOptions();
  updateBudgetBalance();
}

function renderForm() {
  return `
    <form id="${FORM_ID}" class="form-grid">
      <label class="form-field"><span>단위과제</span><select name="unitTaskId" id="planUnitTaskId"><option value="1-1">1-1 전략산업</option><option value="1-2">1-2 스마트모빌리티</option><option value="1-3">1-3 혁신창업</option><option value="2-1-ai">2-1 AI인재양성</option></select></label>
      <label class="form-field"><span>프로그램명</span><input name="programName" type="text" placeholder="예: 초광역 K-Bio BootCamp" /></label>
      <label class="form-field"><span>운영 시작일</span><input name="startDate" type="date" /></label>
      <label class="form-field"><span>운영 종료일</span><input name="endDate" type="date" /></label>
      <label class="form-field"><span>운영장소</span><input name="location" type="text" placeholder="예: 인천대학교, 송도 일원" /></label>
      <label class="form-field"><span>대상</span><input name="target" type="text" placeholder="예: 참여학과 재학생 및 재직자" /></label>
      <label class="form-field"><span>담당자</span><input name="manager" type="text" placeholder="예: 미래인재양성팀 홍길동" /></label>
      <label class="form-field"><span>연계 KPI</span><select name="linkedKpi" id="${KPI_SELECT_ID}"></select></label>
      <label class="form-field"><span>KPI 실적유형</span><select name="kpiPerformanceType" id="${KPI_TYPE_ID}"></select></label>
      <label class="form-field"><span>예상 원자료 실적</span><input name="expectedRawValue" id="${EXPECTED_INPUT_ID}" type="number" min="0" step="0.1" value="0" /></label>
      <label class="form-field"><span>예상 인정 실적</span><input id="${EXPECTED_RESULT_ID}" type="text" value="0" readonly /></label>
      <label class="form-field"><span>예상 KPI 기여도</span><input id="${KPI_CONTRIBUTION_ID}" type="text" value="0%" readonly /></label>
      <label class="form-field full"><span>KPI 인정기준</span><input id="${KPI_GUIDE_ID}" type="text" value="" readonly /></label>
      <label class="form-field"><span>예산항목</span><select name="budgetCategory" id="${BUDGET_SELECT_ID}"></select></label>
      <label class="form-field"><span>사용 예정 금액</span><input name="budgetAmount" id="${BUDGET_AMOUNT_ID}" type="number" min="0" value="0" /></label>
      <label class="form-field full"><span>현재 예산현황</span><input id="${BALANCE_TEXT_ID}" type="text" value="0원" readonly /></label>
      <label class="form-field"><span>집행 후 예상 잔액</span><input id="${AFTER_BALANCE_TEXT_ID}" type="text" value="0원" readonly /></label>
      <label class="form-field"><span>예산비고</span><input name="budgetMemo" type="text" placeholder="예: 강사료, 회의비, 자료집 제작 등" /></label>
      <label class="form-field full"><span>추진배경</span><textarea name="background" rows="3" placeholder="사업 추진 필요성"></textarea></label>
      <label class="form-field full"><span>추진목적</span><textarea name="purpose" rows="3" placeholder="달성하고자 하는 목적"></textarea></label>
      <label class="form-field full"><span>주요내용</span><textarea name="contents" rows="4" placeholder="교육, 세미나, 현장실습 등 주요 운영내용"></textarea></label>
      <label class="form-field full"><span>기대효과</span><textarea name="effect" rows="3" placeholder="성과 및 기대효과"></textarea></label>
      <label class="form-field"><span>예산관리 반영</span><select name="syncBudget"><option value="Y">반영</option><option value="N">미반영</option></select></label>
      <label class="form-field"><span>프로그램 자동 생성</span><select name="syncProgram"><option value="Y">생성</option><option value="N">미생성</option></select></label>
      <label class="form-field"><span>증빙 체크리스트 생성</span><select name="syncEvidence"><option value="Y">생성</option><option value="N">미생성</option></select></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">기안 초안 생성</button><button class="btn btn-outline" type="button" id="copyPlanDraft">초안 복사</button></div>
    </form>`;
}

function bindPlanDraftForm() {
  const form = document.querySelector(`#${FORM_ID}`);
  const output = document.querySelector(`#${OUTPUT_ID}`);
  if (!form || !output) return;

  form.querySelector('#planUnitTaskId')?.addEventListener('change', () => {
    updateLinkedKpiOptions();
    updateKpiPerformanceOptions();
    updateExpectedKpiResult();
    updateBudgetOptions();
    updateBudgetBalance();
  });
  form.querySelector(`#${KPI_SELECT_ID}`)?.addEventListener('change', () => { updateKpiPerformanceOptions(); updateExpectedKpiResult(); });
  form.querySelector(`#${KPI_TYPE_ID}`)?.addEventListener('change', () => { updateKpiPerformanceGuide(); updateExpectedKpiResult(); });
  form.querySelector(`#${EXPECTED_INPUT_ID}`)?.addEventListener('input', updateExpectedKpiResult);
  form.querySelector(`#${BUDGET_SELECT_ID}`)?.addEventListener('change', updateBudgetBalance);
  form.querySelector(`#${BUDGET_AMOUNT_ID}`)?.addEventListener('input', updateBudgetBalance);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['unitTaskId', 'programName', 'startDate', 'endDate', 'target', 'background', 'purpose', 'contents']).valid) return showToast('필수 입력 항목을 확인해 주세요.');
    if (values.startDate > values.endDate) return showToast('운영 종료일은 시작일 이후여야 합니다.');
    if (!validateNumber(values.budgetAmount, { min: 0 }).valid) return showToast('예산금액을 확인해 주세요.');
    if (!validateNumber(values.expectedRawValue, { min: 0 }).valid) return showToast('예상 원자료 실적을 확인해 주세요.');

    const selectedBudget = getSelectedBudget(values.unitTaskId, values.budgetCategory);
    const remaining = getManagedRemaining(selectedBudget, getCollection('budgets'));
    if (selectedBudget && Number(values.budgetAmount) > remaining) return showToast('사용 예정 금액이 현재 잔액을 초과합니다.');

    output.textContent = buildDraft(values, selectedBudget);
    if (values.syncProgram === 'Y') createProgramFromDraft(values);
    if (values.syncEvidence === 'Y') createEvidenceChecklist(values);
    if (values.syncBudget === 'Y' && Number(values.budgetAmount) > 0) createBudgetExecution(values, selectedBudget);
    showToast('기안 초안 생성 및 연계 데이터 반영 완료');
  });

  document.querySelector('#copyPlanDraft')?.addEventListener('click', async () => {
    const text = output.textContent || '';
    await navigator.clipboard.writeText(text);
    showToast('기안 초안이 복사되었습니다.');
  });
}

function createProgramFromDraft(values) {
  const exists = getCollection('programs').some(item => item.unitTaskId === values.unitTaskId && item.name === values.programName);
  if (exists) return;
  upsertItem('programs', { id: `program_${Date.now()}`, unitTaskId: values.unitTaskId, name: values.programName, type: inferProgramType(values.linkedKpi, values.kpiPerformanceType), linkedKpi: values.linkedKpi, faculty: values.manager || '', companyNames: '', startDate: values.startDate, endDate: values.endDate, participants: Number(values.expectedRawValue || 0), budget: Number(values.budgetAmount || 0), hasPlan: 'N', hasResultReport: 'N', status: 'PLANNED', location: values.location || '', target: values.target || '', expectedRecognized: getExpectedRecognized(values) });
}

function createEvidenceChecklist(values) {
  const existing = getCollection('files').filter(item => item.unitTaskId === values.unitTaskId && item.programName === values.programName);
  EVIDENCE_CATEGORIES.forEach(category => {
    if (existing.some(item => item.category === category)) return;
    upsertItem('files', { id: `evidence_${category}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, category, unitTaskId: values.unitTaskId, programName: values.programName, title: `${values.programName} ${category}`, fileName: '미등록', fileSize: '-', uploadedAt: '-', memo: '사업계획 기안 생성 시 자동 생성된 증빙 체크리스트' });
  });
}

function createBudgetExecution(values, selectedBudget) {
  upsertItem('budgets', { id: `budget_${Date.now()}`, unitTaskId: values.unitTaskId, budgetItemId: selectedBudget?.id || values.budgetCategory || '', programName: values.programName, category: selectedBudget?.riseCategory || '미분류', erpItem: selectedBudget?.erpItem || '', allocated: 0, executed: Number(values.budgetAmount), executionDate: new Date().toISOString().slice(0, 10), executionRate: selectedBudget?.allocated ? `${round1((Number(values.budgetAmount) / Number(selectedBudget.allocated)) * 100)}%` : '0%', memo: values.budgetMemo || '사업계획 기안 생성 연계' });
}

function updateLinkedKpiOptions() {
  const unitTaskId = document.querySelector('#planUnitTaskId')?.value || '1-1';
  const select = document.querySelector(`#${KPI_SELECT_ID}`);
  if (!select) return;
  const kpis = KPI_DEFINITIONS[unitTaskId] || [];
  select.innerHTML = kpis.length ? kpis.map(kpi => `<option value="${kpi.name}">${kpi.name} (${kpi.type}) / 목표 ${kpi.target}${kpi.unit}</option>`).join('') : '<option value="">등록된 KPI 없음</option>';
}

function updateKpiPerformanceOptions() {
  const kpiName = document.querySelector(`#${KPI_SELECT_ID}`)?.value || '';
  const select = document.querySelector(`#${KPI_TYPE_ID}`);
  if (!select) return;
  const options = getKpiPerformanceOptions(kpiName);
  select.innerHTML = options.map(option => `<option value="${option.label}" data-guide="${option.guide}" data-weight="${option.weight}" data-target="${option.target || ''}" data-component="${option.componentWeight || ''}">${option.label}</option>`).join('');
  updateKpiPerformanceGuide();
}

function updateKpiPerformanceGuide() {
  const select = document.querySelector(`#${KPI_TYPE_ID}`);
  const target = document.querySelector(`#${KPI_GUIDE_ID}`);
  if (!select || !target) return;
  const option = select.options[select.selectedIndex];
  target.value = option?.dataset?.guide || '별도 인정기준 없음';
}

function updateExpectedKpiResult() {
  const input = document.querySelector(`#${EXPECTED_INPUT_ID}`);
  const resultTarget = document.querySelector(`#${EXPECTED_RESULT_ID}`);
  const contributionTarget = document.querySelector(`#${KPI_CONTRIBUTION_ID}`);
  const select = document.querySelector(`#${KPI_TYPE_ID}`);
  if (!input || !resultTarget || !contributionTarget || !select) return;
  const raw = Number(input.value || 0);
  const kpiName = document.querySelector(`#${KPI_SELECT_ID}`)?.value || '';
  if (kpiName === '산학협력지수') {
    const industry = calculateIndustryIndexComponent(raw);
    resultTarget.value = industry.resultText;
    contributionTarget.value = industry.contributionText;
    return;
  }
  const recognized = round1(raw * getSelectedWeight());
  const target = getSelectedKpiTarget();
  resultTarget.value = `${recognized} 인정`;
  contributionTarget.value = target ? `${round1((recognized / target) * 100)}%` : '목표값 없음';
}

function getSelectedWeight() {
  const select = document.querySelector(`#${KPI_TYPE_ID}`);
  const option = select?.options?.[select.selectedIndex];
  return Number(option?.dataset?.weight || 1);
}

function getSelectedIndustryOption() {
  const select = document.querySelector(`#${KPI_TYPE_ID}`);
  const option = select?.options?.[select.selectedIndex];
  return { target: Number(option?.dataset?.target || 0), componentWeight: Number(option?.dataset?.component || 0), label: option?.value || '' };
}

function calculateIndustryIndexComponent(rawValue) {
  const option = getSelectedIndustryOption();
  const componentTarget = option.target || 1;
  const componentWeight = option.componentWeight || 0;
  const achievementRate = round1((Number(rawValue || 0) / componentTarget) * 100);
  const formulaContribution = round1((Number(rawValue || 0) / componentTarget) * componentWeight * 100);
  return { achievementRate, formulaContribution, resultText: `${option.label} 달성률 ${achievementRate}%`, contributionText: `산식 기여 ${formulaContribution}%p` };
}

function getSelectedKpiDefinition() {
  const unitTaskId = document.querySelector('#planUnitTaskId')?.value || '1-1';
  const kpiName = document.querySelector(`#${KPI_SELECT_ID}`)?.value || '';
  return (KPI_DEFINITIONS[unitTaskId] || []).find(kpi => kpi.name === kpiName);
}

function getSelectedKpiTarget() { return Number(getSelectedKpiDefinition()?.target || 0); }
function getSelectedKpiUnit() { return getSelectedKpiDefinition()?.unit || ''; }

function getKpiPerformanceOptions(kpiName) {
  if (kpiName.includes('인력양성')) return [{ label: '학부생', guide: '학부생 1명 = 1.0명 인정', weight: 1 }, { label: '석사', guide: '석사 1명 = 1.5명 인정', weight: 1.5 }, { label: '박사', guide: '박사 1명 = 2.0명 인정', weight: 2 }, { label: '나노디그리', guide: '나노디그리 1명 = 0.3명 인정', weight: 0.3 }];
  if (kpiName === '취업률') return [{ label: '지역내 취업', guide: '지역내 취업 1명 = 1.0명 인정', weight: 1 }, { label: '지역외 취업', guide: '지역외 취업 1명 = 0.5명 인정', weight: 0.5 }];
  if (kpiName.includes('캡스톤')) return [{ label: '일반', guide: '일반 캡스톤 1건 = 1.0건 인정', weight: 1 }, { label: '기업연계형', guide: '기업연계형 캡스톤 1건 = 1.5건 인정', weight: 1.5 }, { label: '융합형', guide: '융합형 캡스톤 1건 = 2.0건 인정', weight: 2 }, { label: '글로벌', guide: '글로벌 캡스톤 1건 = 2.0건 인정', weight: 2 }];
  if (kpiName === '산학협력지수') return [{ label: 'A 교과목 개편', guide: '산업체 수요 기반 교과목 개편 누적 수 / 5개년 목표 40 × 40%', weight: 1, target: 40, componentWeight: 0.4 }, { label: 'B 기업참여형 캡스톤', guide: '기업멘토 참여 캡스톤 과제 수 / 연간 목표 23 × 20%', weight: 1, target: 23, componentWeight: 0.2 }, { label: 'C 협력기업 MOU', guide: '전략산업분야 기업 MOU 누적 건수 / 5개년 목표 30 × 20%', weight: 1, target: 30, componentWeight: 0.2 }, { label: 'D 재직자 교육과정', guide: '재직자 재교육 프로그램 누적 운영 횟수 / 5개년 목표 30 × 20%', weight: 1, target: 30, componentWeight: 0.2 }];
  if (kpiName.includes('만족도')) return [{ label: '만족도 조사', guide: '프로그램 만족도 조사 결과 점수 반영', weight: 1 }];
  if (kpiName.includes('PBL')) return [{ label: 'PBL 과제', guide: 'PBL 지원 과제 1건 = 1건 인정', weight: 1 }];
  if (kpiName.includes('포럼') || kpiName.includes('세미나') || kpiName.includes('성과 교류회')) return [{ label: '포럼/세미나/성과교류회', guide: '운영 프로그램 1건 = 1건 인정', weight: 1 }];
  if (kpiName.includes('단기전문교육과정')) return [{ label: '교육과정 개설', guide: '단기전문교육과정 1개 과정 = 1건 인정', weight: 1 }, { label: '교육과정 수료인원', guide: '수료자 1명 = 1명 인정', weight: 1 }];
  return [{ label: '일반 실적', guide: '해당 KPI 기준에 따라 실적 반영', weight: 1 }];
}

function updateBudgetOptions() {
  const unitTaskId = document.querySelector('#planUnitTaskId')?.value || '1-1';
  const select = document.querySelector(`#${BUDGET_SELECT_ID}`);
  if (!select) return;
  const budgets = getManagedBudgetItems(unitTaskId);
  select.innerHTML = budgets.length ? budgets.map(budget => `<option value="${budget.id}">${budget.riseCategory} / ${shorten(budget.erpItem)}</option>`).join('') : '<option value="">편성된 예산항목 없음</option>';
}

function updateBudgetBalance() {
  const unitTaskId = document.querySelector('#planUnitTaskId')?.value || '1-1';
  const itemId = document.querySelector(`#${BUDGET_SELECT_ID}`)?.value || '';
  const statusTarget = document.querySelector(`#${BALANCE_TEXT_ID}`);
  const afterTarget = document.querySelector(`#${AFTER_BALANCE_TEXT_ID}`);
  const budget = getSelectedBudget(unitTaskId, itemId);
  if (!statusTarget) return;
  if (!budget) {
    statusTarget.value = '편성 예산 없음';
    if (afterTarget) afterTarget.value = '편성 예산 없음';
    return;
  }
  const executions = getCollection('budgets');
  const executed = getManagedExecuted(budget, executions);
  const remaining = getManagedRemaining(budget, executions);
  const rate = getManagedRate(budget, executions);
  const planned = Number(document.querySelector(`#${BUDGET_AMOUNT_ID}`)?.value || 0);
  const afterRemaining = Math.max(remaining - planned, 0);
  statusTarget.value = `편성액 ${formatWon(budget.allocated)} / 집행액 ${formatWon(executed)} / 잔액 ${formatWon(remaining)} / 집행률 ${rate}%`;
  if (afterTarget) afterTarget.value = planned > remaining ? `잔액 초과: ${formatWon(planned - remaining)}` : formatWon(afterRemaining);
}

function getSelectedBudget(unitTaskId, itemId) { return getManagedBudgetItems(unitTaskId).find(budget => budget.id === itemId || budget.baseItemId === itemId); }

function getManagedBudgetItems(unitTaskId, options = {}) {
  const customRows = getCollection('budgetAllocations');
  const customByBase = new Map(customRows.filter(row => row.baseItemId).map(row => [row.baseItemId, row]));
  const customOnly = customRows.filter(row => !row.baseItemId && row.unitTaskId === unitTaskId);
  const baseItems = getBudgetItems(unitTaskId).map(item => {
    const override = customByBase.get(item.id);
    return override ? { ...item, ...override, source: 'custom' } : { ...item, source: 'base', status: 'ACTIVE' };
  });
  return [...baseItems, ...customOnly].filter(item => item.unitTaskId === unitTaskId).filter(item => options.includeInactive || item.status !== 'INACTIVE');
}

function getManagedExecuted(item, executions = []) {
  if (!item) return 0;
  const linkedIds = [item.id, item.baseItemId].filter(Boolean);
  return executions.filter(row => row.unitTaskId === item.unitTaskId).filter(row => linkedIds.includes(row.budgetItemId) || (!row.budgetItemId && row.category === item.riseCategory)).reduce((sum, row) => sum + Number(row.executed || 0), 0);
}

function getManagedRemaining(item, executions = []) { return item ? Math.max(Number(item.allocated || 0) - getManagedExecuted(item, executions), 0) : 0; }
function getManagedRate(item, executions = []) { const allocated = Number(item?.allocated || 0); return allocated ? round1((getManagedExecuted(item, executions) / allocated) * 100) : 0; }

function inferProgramType(kpiName, kpiType) {
  if (kpiName.includes('PBL')) return 'PBL';
  if (kpiName.includes('창업')) return '창업프로그램';
  if (kpiName.includes('포럼') || kpiName.includes('세미나') || kpiName.includes('성과 교류회')) return '포럼/세미나';
  if (kpiName.includes('단기전문교육과정') || kpiName.includes('교육과정')) return '교육프로그램';
  if (kpiType?.includes('캡스톤')) return '산학협력 프로젝트';
  return '기타';
}

function getPeriodText(values) { return `${values.startDate || '미정'} ~ ${values.endDate || '미정'}`; }
function getExpectedRecognized(values) { return values.linkedKpi === '산학협력지수' ? calculateIndustryIndexComponent(Number(values.expectedRawValue || 0)).formulaContribution : round1(Number(values.expectedRawValue || 0) * getSelectedWeight()); }
function shorten(value) { const text = String(value || ''); return text.length > 42 ? `${text.slice(0, 42)}...` : text; }
function formatWon(value) { return `${Number(value || 0).toLocaleString()}원`; }
function round1(value) { return Math.round(Number(value || 0) * 10) / 10; }

function buildDraft(values, selectedBudget) {
  const executions = getCollection('budgets');
  const remainingText = selectedBudget ? formatWon(getManagedRemaining(selectedBudget, executions)) : '편성 예산 없음';
  const budgetName = selectedBudget ? `${selectedBudget.riseCategory} / ${selectedBudget.erpItem}` : '미분류';
  const currentRemaining = selectedBudget ? getManagedRemaining(selectedBudget, executions) : 0;
  const afterRemainingText = selectedBudget ? formatWon(Math.max(currentRemaining - Number(values.budgetAmount || 0), 0)) : '편성 예산 없음';
  const budgetStatusText = selectedBudget ? `편성 ${formatWon(selectedBudget.allocated)} / 집행 ${formatWon(getManagedExecuted(selectedBudget, executions))} / 잔액 ${remainingText} / 집행률 ${getManagedRate(selectedBudget, executions)}%` : '편성 예산 없음';
  const guideText = document.querySelector(`#${KPI_GUIDE_ID}`)?.value || '별도 인정기준 없음';
  const expectedRaw = Number(values.expectedRawValue || 0);
  const kpiUnit = getSelectedKpiUnit();
  const target = getSelectedKpiTarget();
  let expectedText = `${getExpectedRecognized(values)}${kpiUnit}`;
  let contributionText = target ? `${round1((getExpectedRecognized(values) / target) * 100)}%` : '목표값 없음';
  if (values.linkedKpi === '산학협력지수') {
    const industry = calculateIndustryIndexComponent(expectedRaw);
    expectedText = `${industry.resultText} / ${industry.contributionText}`;
    contributionText = '최종 KPI 12점 대비 단순 기여도 미산출(세부 산식 반영)';
  }
  return `[사업계획 기안 초안]\n\n1. 추진배경\n${values.background}\n\n2. 추진목적\n${values.purpose}\n\n3. 운영개요\n- 단위과제: ${values.unitTaskId}\n- 프로그램명: ${values.programName}\n- 운영기간: ${getPeriodText(values)}\n- 운영장소: ${values.location || '미정'}\n- 운영대상: ${values.target}\n- 담당자: ${values.manager || '미정'}\n- 연계 KPI: ${values.linkedKpi || '미지정'}\n- KPI 실적유형: ${values.kpiPerformanceType || '미지정'}\n- KPI 인정기준: ${guideText}\n- KPI 목표값: ${target || '미설정'}${kpiUnit}\n- 예상 원자료 실적: ${expectedRaw}\n- 예상 KPI 인정 실적: ${expectedText}\n- 예상 KPI 목표 기여도: ${contributionText}\n\n4. 세부 추진내용\n${values.contents}\n\n5. 소요예산\n- 예산항목: ${budgetName}\n- 예산현황: ${budgetStatusText}\n- 사용 예정 금액: ${Number(values.budgetAmount || 0).toLocaleString()}원\n- 집행 후 예상 잔액: ${afterRemainingText}\n- 산출내역/비고: ${values.budgetMemo || '세부 산출내역 별도 작성'}\n\n6. 기대효과\n${values.effect || '사업 추진을 통해 참여학생 역량 강화, 지역산업 연계 성과 창출 및 단위과제 KPI 달성에 기여할 것으로 기대됨.'}\n\n7. 향후계획\n- 세부 운영계획 확정\n- 참여자 모집 및 운영 준비\n- 프로그램 운영 후 결과보고서 및 증빙자료 등록\n- 연계 KPI 실적 반영 및 성과관리`;
}
