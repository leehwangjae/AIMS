import { generatePlanDraftWithAi } from './ai-plan-client.js';
import { showToast } from './ui.js';

let isGenerating = false;

export function bindPlanAiEnhancer() {
  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!form || form.id !== 'planDraftForm') return;
    if (isGenerating) return;

    const output = document.querySelector('#planDraftOutput');
    const submitButton = form.querySelector('button[type="submit"]');
    if (!output) return;

    const values = Object.fromEntries(new FormData(form).entries());
    const required = ['unitTaskId', 'programName', 'startDate', 'endDate', 'target', 'background', 'purpose', 'contents'];
    const missing = required.some(key => !String(values[key] || '').trim());
    if (missing) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    isGenerating = true;
    const previousLabel = submitButton?.textContent || '기안 초안 생성';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'AI 생성 중';
    }
    output.textContent = 'AI가 입력값·KPI·예산정보를 바탕으로 사업계획안 문체의 초안을 작성 중입니다...';

    try {
      const text = await generatePlanDraftWithAi(buildPayload(values));
      output.textContent = text;
      showToast('AI 사업계획안 초안이 생성되었습니다.');
    } catch (error) {
      output.textContent = buildLocalImprovedDraft(values);
      showToast('AI 연동이 미설정되어 개선형 로컬 초안이 생성되었습니다.');
      console.warn('AI plan draft fallback:', error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = previousLabel;
      }
      isGenerating = false;
    }
  }, true);
}

function buildPayload(values) {
  const guideText = document.querySelector('#kpiPerformanceGuide')?.value || '';
  const expectedText = document.querySelector('#expectedKpiResult')?.value || '';
  const contributionText = document.querySelector('#expectedKpiContribution')?.value || '';
  const budgetStatus = document.querySelector('#budgetBalanceText')?.value || '';
  const afterBalance = document.querySelector('#budgetAfterBalanceText')?.value || '';
  const budgetSelect = document.querySelector('#planBudgetCategory');
  const budgetName = budgetSelect?.options?.[budgetSelect.selectedIndex]?.textContent || '';

  return {
    values,
    kpi: {
      guideText,
      targetText: values.linkedKpi || '',
      expectedRaw: values.expectedRawValue || '0',
      expectedText,
      contributionText
    },
    budget: {
      name: budgetName,
      statusText: budgetStatus,
      amountText: `${Number(values.budgetAmount || 0).toLocaleString()}원`,
      afterRemainingText: afterBalance
    }
  };
}

function buildLocalImprovedDraft(values) {
  const payload = buildPayload(values);
  return `[사업계획 기안 초안]\n\n1. 추진배경\n${values.background}를 바탕으로, 본 프로그램은 해당 단위과제의 전략산업 연계성과 인재양성 성과를 제고하기 위해 추진하고자 함. 특히 지역 산업계 수요와 대학 교육·연구 자원을 연계하여 참여자의 실무역량을 강화하고, 단위과제 성과지표 달성에 기여할 수 있는 운영 기반을 마련하고자 함.\n\n2. 추진목적\n본 프로그램의 목적은 ${values.purpose}에 있음. 이를 통해 참여 대상자의 전문성 및 현장 적응력을 높이고, 관련 산업 분야의 기업·기관과 연계한 실질적 성과 창출을 도모하고자 함.\n\n3. 운영개요\n- 단위과제: ${values.unitTaskId}\n- 프로그램명: ${values.programName}\n- 운영기간: ${values.startDate} ~ ${values.endDate}\n- 운영장소: ${values.location || '미정'}\n- 운영대상: ${values.target}\n- 담당자: ${values.manager || '미정'}\n- 연계 KPI: ${values.linkedKpi || '미지정'}\n- KPI 실적유형: ${values.kpiPerformanceType || '미지정'}\n- KPI 인정기준: ${payload.kpi.guideText || '별도 인정기준 없음'}\n- 예상 원자료 실적: ${values.expectedRawValue || 0}\n- 예상 인정 실적: ${payload.kpi.expectedText || '-'}\n- 예상 KPI 기여도: ${payload.kpi.contributionText || '-'}\n\n4. 세부 추진내용\n${values.contents}\n\n위 내용을 중심으로 사전 준비, 참여자 모집, 프로그램 운영, 만족도 및 실적 확인, 결과보고서 작성의 절차로 추진함. 운영 과정에서 참여자 명단, 교육자료, 운영사진, 만족도조사, 정산자료 등 증빙자료를 체계적으로 확보하여 성과관리와 사후 평가에 활용하고자 함.\n\n5. 소요예산\n- 예산항목: ${payload.budget.name || '미분류'}\n- 예산현황: ${payload.budget.statusText || '-'}\n- 사용 예정 금액: ${payload.budget.amountText}\n- 집행 후 예상 잔액: ${payload.budget.afterRemainingText || '-'}\n- 산출내역/비고: ${values.budgetMemo || '세부 산출내역은 운영계획 확정 후 구체화'}\n\n해당 예산은 프로그램 운영에 필요한 강사료, 회의비, 자료 제작비, 운영비 등으로 집행하고, 집행 후 관련 증빙을 문서관리 화면에 등록하여 정산 및 성과관리와 연계함.\n\n6. 기대효과\n${values.effect || '본 프로그램 운영을 통해 참여자의 전공·실무 역량을 강화하고, 지역 전략산업과 연계한 인재양성 성과를 창출할 것으로 기대됨. 또한 연계 KPI 실적 확보와 사업단 성과관리 체계 고도화에도 기여할 수 있음.'}\n\n7. 향후계획\n- 세부 운영계획 확정 및 참여자 모집\n- 프로그램 운영 및 현장 관리\n- 결과보고서, 참석자명단, 만족도조사, 정산자료 등 증빙자료 확보\n- 연계 KPI 실적 반영 및 성과관리 자료 등록`;
}
