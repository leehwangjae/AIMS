import { upsertItem } from './store.js';
import { createCard } from './components.js';
import { validateRequired, validateNumber } from './form-utils.js';
import { showToast } from './ui.js';

const FORM_ID = 'planDraftForm';
const OUTPUT_ID = 'planDraftOutput';

export function renderPlanDraftView(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">AI Work Center</div>
        <h2 class="page-title">사업계획 기안 생성</h2>
        <p class="page-desc">핵심 정보를 입력하면 내부 사업계획 기안 초안을 표준 양식으로 생성하고, 예산관리에도 자동 반영합니다.</p>
      </div>
    </section>

    ${createCard({ title: '기안 기본정보 입력', content: renderForm() })}
    ${createCard({ title: '자동 생성 초안', content: `<pre id="${OUTPUT_ID}" class="draft-output">입력 후 [기안 초안 생성]을 누르세요.</pre>` })}
  `;

  bindPlanDraftForm();
}

function renderForm() {
  return `
    <form id="${FORM_ID}" class="form-grid">
      <label class="form-field"><span>단위과제</span><select name="unitTaskId"><option value="1-1">1-1 전략산업</option><option value="1-2">1-2 스마트모빌리티</option><option value="1-3">1-3 혁신창업</option><option value="2-1-ai">2-1 AI인재양성</option></select></label>
      <label class="form-field"><span>프로그램명</span><input name="programName" type="text" placeholder="예: 초광역 K-Bio BootCamp" /></label>
      <label class="form-field"><span>운영기간</span><input name="period" type="text" placeholder="예: 2026.7.1.~2026.7.3." /></label>
      <label class="form-field"><span>운영장소</span><input name="location" type="text" placeholder="예: 인천대학교, 송도 일원" /></label>
      <label class="form-field"><span>대상</span><input name="target" type="text" placeholder="예: 참여학과 재학생 및 재직자" /></label>
      <label class="form-field"><span>담당자</span><input name="manager" type="text" placeholder="예: 미래인재양성팀 홍길동" /></label>
      <label class="form-field"><span>연계 KPI</span><input name="linkedKpi" type="text" placeholder="예: 단기전문교육과정 배출인원" /></label>
      <label class="form-field"><span>예산항목</span><input name="budgetCategory" type="text" placeholder="예: 교육연구프로그램 개발·운영비" /></label>
      <label class="form-field"><span>예산금액</span><input name="budgetAmount" type="number" min="0" value="0" /></label>
      <label class="form-field"><span>예산비고</span><input name="budgetMemo" type="text" placeholder="예: 강사료, 회의비, 자료집 제작 등" /></label>
      <label class="form-field full"><span>추진배경</span><textarea name="background" rows="3" placeholder="사업 추진 필요성"></textarea></label>
      <label class="form-field full"><span>추진목적</span><textarea name="purpose" rows="3" placeholder="달성하고자 하는 목적"></textarea></label>
      <label class="form-field full"><span>주요내용</span><textarea name="contents" rows="4" placeholder="교육, 세미나, 현장실습 등 주요 운영내용"></textarea></label>
      <label class="form-field full"><span>기대효과</span><textarea name="effect" rows="3" placeholder="성과 및 기대효과"></textarea></label>
      <label class="form-field"><span>예산관리 반영</span><select name="syncBudget"><option value="Y">반영</option><option value="N">미반영</option></select></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">기안 초안 생성</button><button class="btn btn-outline" type="button" id="copyPlanDraft">초안 복사</button></div>
    </form>
  `;
}

function bindPlanDraftForm() {
  const form = document.querySelector(`#${FORM_ID}`);
  const output = document.querySelector(`#${OUTPUT_ID}`);
  if (!form || !output) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['unitTaskId', 'programName', 'period', 'target', 'background', 'purpose', 'contents']).valid) return showToast('필수 입력 항목을 확인해 주세요.');
    if (!validateNumber(values.budgetAmount, { min: 0 }).valid) return showToast('예산금액을 확인해 주세요.');

    const draft = buildDraft(values);
    output.textContent = draft;

    if (values.syncBudget === 'Y' && Number(values.budgetAmount) > 0) {
      upsertItem('budgets', {
        id: `budget_${Date.now()}`,
        unitTaskId: values.unitTaskId,
        programName: values.programName,
        category: values.budgetCategory || '미분류',
        allocated: Number(values.budgetAmount),
        executed: 0,
        executionRate: '0%',
        memo: values.budgetMemo || '사업계획 기안 생성 연계'
      });
      showToast('기안 초안 생성 및 예산관리 반영 완료');
      return;
    }

    showToast('기안 초안이 생성되었습니다.');
  });

  document.querySelector('#copyPlanDraft')?.addEventListener('click', async () => {
    const text = output.textContent || '';
    await navigator.clipboard.writeText(text);
    showToast('기안 초안이 복사되었습니다.');
  });
}

function buildDraft(values) {
  return `[사업계획 기안 초안]\n\n1. 추진배경\n${values.background}\n\n2. 추진목적\n${values.purpose}\n\n3. 운영개요\n- 단위과제: ${values.unitTaskId}\n- 프로그램명: ${values.programName}\n- 운영기간: ${values.period}\n- 운영장소: ${values.location || '미정'}\n- 운영대상: ${values.target}\n- 담당자: ${values.manager || '미정'}\n- 연계 KPI: ${values.linkedKpi || '미지정'}\n\n4. 세부 추진내용\n${values.contents}\n\n5. 소요예산\n- 예산항목: ${values.budgetCategory || '미분류'}\n- 예산금액: ${Number(values.budgetAmount || 0).toLocaleString()}원\n- 산출내역/비고: ${values.budgetMemo || '세부 산출내역 별도 작성'}\n\n6. 기대효과\n${values.effect || '사업 추진을 통해 참여학생 역량 강화, 지역산업 연계 성과 창출 및 단위과제 KPI 달성에 기여할 것으로 기대됨.'}\n\n7. 향후계획\n- 세부 운영계획 확정\n- 참여자 모집 및 운영 준비\n- 프로그램 운영 후 결과보고서 및 증빙자료 등록\n- 연계 KPI 실적 반영 및 성과관리`; 
}
