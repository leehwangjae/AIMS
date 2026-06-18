import { generatePlanDraftWithAi } from './ai-plan-client.js';
import { showToast } from './ui.js';

let isGenerating = false;
let latestDraftState = null;

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
      const payload = buildPayload(values);
      const text = await generatePlanDraftWithAi(payload);
      latestDraftState = { values, payload, text };
      output.textContent = text;
      renderTemplateExportActions(output);
      showToast('AI 사업계획안 초안이 생성되었습니다.');
    } catch (error) {
      const payload = buildPayload(values);
      const text = buildLocalImprovedDraft(values);
      latestDraftState = { values, payload, text };
      output.textContent = text;
      renderTemplateExportActions(output);
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

  document.addEventListener('click', event => {
    const button = event.target.closest('#downloadPlanTemplateDoc');
    if (!button) return;
    if (!latestDraftState) return showToast('먼저 AI 기안을 생성해 주세요.');
    downloadPlanTemplateDoc(latestDraftState);
  });
}

function renderTemplateExportActions(output) {
  const card = output.closest('.scb') || output.parentElement;
  if (!card || card.querySelector('#downloadPlanTemplateDoc')) return;
  const actions = document.createElement('div');
  actions.className = 'form-actions';
  actions.style.marginTop = '12px';
  actions.innerHTML = '<button class="btn btn-primary" type="button" id="downloadPlanTemplateDoc">샘플 서식 문서 다운로드(.doc)</button>';
  card.appendChild(actions);
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

function downloadPlanTemplateDoc(state) {
  const html = buildPlanTemplateHtml(state);
  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const link = document.createElement('a');
  const safeName = sanitizeFileName(`${state.values.programName || '사업계획서'} 운영 계획안`);
  link.href = URL.createObjectURL(blob);
  link.download = `${safeName}.doc`;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
  showToast('샘플 서식 기반 문서가 다운로드되었습니다. 한글 또는 Word에서 열어 편집할 수 있습니다.');
}

function buildPlanTemplateHtml({ values, payload, text }) {
  const today = new Date().toISOString().slice(0, 10).replaceAll('-', '.');
  const title = `[단위과제 ${formatUnit(values.unitTaskId)}] ${values.programName || '프로그램'} 운영 계획(안)`;
  const scheduleRows = buildScheduleRows(values);
  const budgetRows = buildBudgetRows(values, payload);
  const purposeBullets = buildBullets([values.background, values.purpose], 3);
  const effectBullets = buildBullets([values.effect, `연계 KPI(${values.linkedKpi || '미지정'}) 달성 및 단위과제 성과관리에 기여`, '프로그램 운영 결과와 증빙자료를 체계적으로 관리하여 후속 평가 대응 기반 구축'], 3);
  const contentText = escapeHtml(values.contents || extractSection(text, '세부 추진내용') || '세부 운영계획은 프로그램 목적과 대상에 맞추어 추진함.');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 22mm 20mm 18mm 20mm; }
  body { font-family: '맑은 고딕', 'Malgun Gothic', Batang, serif; font-size: 11pt; color: #000; line-height: 1.65; }
  .approval-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 9.5pt; }
  .approval-table td { border: 1px solid #000; padding: 5px 7px; height: 24px; vertical-align: middle; }
  .approval-label { width: 11%; text-align: center; background: #f2f2f2; font-weight: bold; }
  .approval-cell { width: 14%; text-align: center; }
  .cover-title { text-align: center; font-size: 18pt; font-weight: bold; line-height: 1.6; margin: 42px 0 16px; }
  .cover-date { text-align: center; font-size: 13pt; margin-bottom: 50px; }
  .dept { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 42px; }
  .doc-title { font-size: 15pt; font-weight: bold; margin: 22px 0 18px; }
  .section { margin-top: 18px; }
  .section-heading { display: flex; align-items: center; gap: 10px; margin: 18px 0 8px; font-weight: bold; font-size: 14pt; }
  .section-no { display: inline-block; min-width: 28px; padding: 2px 7px; border: 1px solid #000; text-align: center; font-weight: bold; }
  .bullet { margin: 3px 0 3px 18px; text-indent: -18px; }
  .overview { margin-left: 18px; }
  .overview div { margin: 2px 0; }
  table.data { width: 100%; border-collapse: collapse; margin: 8px 0 6px; font-size: 10.5pt; }
  table.data th, table.data td { border: 1px solid #000; padding: 6px 8px; text-align: center; vertical-align: middle; }
  table.data th { background: #f2f2f2; font-weight: bold; }
  table.data td.left { text-align: left; }
  .note { font-size: 10pt; margin-top: 4px; }
  .indent { margin-left: 18px; }
  .end { text-align: right; margin-top: 22px; }
</style>
</head>
<body>
<table class="approval-table">
  <tr><td class="approval-label">문서번호</td><td colspan="5">RISE전략과-</td></tr>
  <tr><td class="approval-label">기안자</td><td class="approval-cell">담당자</td><td class="approval-cell">팀장</td><td class="approval-cell">RISE전략과장</td><td class="approval-cell">RISE사업부단장</td><td class="approval-cell">RISE사업단장</td></tr>
  <tr><td class="approval-label">보존일자</td><td>5년</td><td class="approval-label">보고일자</td><td>${today}</td><td class="approval-label">협 조</td><td></td></tr>
</table>
<div class="cover-title">${escapeHtml(title)}</div>
<div class="cover-date">${today}</div>
<div class="dept">RISE전략과</div>
<div class="doc-title">${escapeHtml(title)}</div>

<div class="section"><div class="section-heading"><span class="section-no">1</span><span>목적</span></div>
  ${purposeBullets.map(item => `<div class="bullet">❍ ${item}</div>`).join('')}
</div>

<div class="section"><div class="section-heading"><span class="section-no">2</span><span>개요</span></div>
  <div class="overview">
    <div>❍ 프로그램명 : ${escapeHtml(values.programName || '-')}</div>
    <div>❍ 일&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;시 : ${escapeHtml(formatPeriod(values))}</div>
    <div>❍ 장&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소 : ${escapeHtml(values.location || '미정')}</div>
    <div>❍ 대&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;상 : ${escapeHtml(values.target || '-')}</div>
    <div>❍ 참여인원 : ${escapeHtml(values.expectedRawValue || '미정')}명 내외</div>
    <div>❍ 담당부서 : RISE전략과 / ${escapeHtml(values.manager || '담당자 미정')}</div>
  </div>
</div>

<div class="section"><div class="section-heading"><span class="section-no">3</span><span>세부 일정</span></div>
  <div class="bullet">❍ 프로그램 운영내용 : ${contentText}</div>
  <table class="data">
    <tr><th style="width:22%">일정</th><th style="width:22%">시간</th><th>내용</th></tr>
    ${scheduleRows.map(row => `<tr><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.time)}</td><td class="left">${escapeHtml(row.content)}</td></tr>`).join('')}
  </table>
  <div class="note">※ 상기 일정은 상황에 따라 변경될 수 있음</div>
</div>

<div class="section"><div class="section-heading"><span class="section-no">4</span><span>소요예산</span></div>
  <div class="bullet">❍ 소요예산 : 금${Number(values.budgetAmount || 0).toLocaleString()}원 범위 내</div>
  <div class="bullet">❍ 예산과목 : RISE사업비, ${escapeHtml(formatUnit(values.unitTaskId))}&gt;${escapeHtml(payload.budget.name || '교육·연구 프로그램 개발 운영비')}</div>
  <div class="note indent">※ 예산 내 항목은 상황에 따라 변동될 수 있음</div>
  <table class="data">
    <tr><th>구분</th><th>세부내역</th><th>소요예산(원)</th><th>비고</th></tr>
    ${budgetRows.map(row => `<tr><td>${escapeHtml(row.type)}</td><td class="left">${escapeHtml(row.detail)}</td><td>${Number(row.amount || 0).toLocaleString()}</td><td>${escapeHtml(row.memo || '')}</td></tr>`).join('')}
    <tr><th colspan="2">합계</th><th>${Number(values.budgetAmount || 0).toLocaleString()}</th><th></th></tr>
  </table>
</div>

<div class="section"><div class="section-heading"><span class="section-no">5</span><span>기대 효과</span></div>
  ${effectBullets.map(item => `<div class="bullet">❍ ${item}</div>`).join('')}
</div>
<div class="end">끝.</div>
</body>
</html>`;
}

function buildScheduleRows(values) {
  const date = values.startDate ? values.startDate.replaceAll('-', '.') : '운영일';
  return [
    { date, time: '운영 전', content: '참여자 안내 및 사전 준비' },
    { date, time: '운영 중', content: values.contents || '프로그램 세부 운영' },
    { date, time: '운영 후', content: '만족도 조사, 결과보고서 작성 및 증빙자료 등록' }
  ];
}

function buildBudgetRows(values, payload) {
  const memo = values.budgetMemo || payload.budget.name || '프로그램 운영비';
  return [{ type: '운영비', detail: memo, amount: Number(values.budgetAmount || 0), memo: '' }];
}

function buildBullets(items, limit = 3) {
  return items
    .map(item => stripNumbering(String(item || '').trim()))
    .flatMap(item => item.split(/\n+/))
    .map(item => stripBullet(item).trim())
    .filter(Boolean)
    .slice(0, limit);
}

function extractSection(text, heading) {
  const source = String(text || '');
  const pattern = new RegExp(`${heading}\\s*\\n([\\s\\S]*?)(?:\\n\\d+\\.|$)`);
  const match = source.match(pattern);
  return match?.[1]?.trim() || '';
}

function stripNumbering(text) { return text.replace(/^\d+\.\s*[^\n]*\n?/, '').trim(); }
function stripBullet(text) { return text.replace(/^[-•❍○◦]\s*/, '').trim(); }
function formatUnit(unitTaskId) { return String(unitTaskId || '').replace('2-1-ai', '2-1'); }
function formatPeriod(values) { return `${values.startDate || '미정'} ~ ${values.endDate || '미정'}`; }
function sanitizeFileName(value) { return String(value || '문서').replace(/[\\/:*?"<>|]/g, '_').slice(0, 80); }
function escapeHtml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }

function buildLocalImprovedDraft(values) {
  const payload = buildPayload(values);
  return `[사업계획 기안 초안]\n\n1. 추진배경\n${values.background}를 바탕으로, 본 프로그램은 해당 단위과제의 전략산업 연계성과 인재양성 성과를 제고하기 위해 추진하고자 함. 특히 지역 산업계 수요와 대학 교육·연구 자원을 연계하여 참여자의 실무역량을 강화하고, 단위과제 성과지표 달성에 기여할 수 있는 운영 기반을 마련하고자 함.\n\n2. 추진목적\n본 프로그램의 목적은 ${values.purpose}에 있음. 이를 통해 참여 대상자의 전문성 및 현장 적응력을 높이고, 관련 산업 분야의 기업·기관과 연계한 실질적 성과 창출을 도모하고자 함.\n\n3. 운영개요\n- 단위과제: ${values.unitTaskId}\n- 프로그램명: ${values.programName}\n- 운영기간: ${values.startDate} ~ ${values.endDate}\n- 운영장소: ${values.location || '미정'}\n- 운영대상: ${values.target}\n- 담당자: ${values.manager || '미정'}\n- 연계 KPI: ${values.linkedKpi || '미지정'}\n- KPI 실적유형: ${values.kpiPerformanceType || '미지정'}\n- KPI 인정기준: ${payload.kpi.guideText || '별도 인정기준 없음'}\n- 예상 원자료 실적: ${values.expectedRawValue || 0}\n- 예상 인정 실적: ${payload.kpi.expectedText || '-'}\n- 예상 KPI 기여도: ${payload.kpi.contributionText || '-'}\n\n4. 세부 추진내용\n${values.contents}\n\n위 내용을 중심으로 사전 준비, 참여자 모집, 프로그램 운영, 만족도 및 실적 확인, 결과보고서 작성의 절차로 추진함. 운영 과정에서 참여자 명단, 교육자료, 운영사진, 만족도조사, 정산자료 등 증빙자료를 체계적으로 확보하여 성과관리와 사후 평가에 활용하고자 함.\n\n5. 소요예산\n- 예산항목: ${payload.budget.name || '미분류'}\n- 예산현황: ${payload.budget.statusText || '-'}\n- 사용 예정 금액: ${payload.budget.amountText}\n- 집행 후 예상 잔액: ${payload.budget.afterRemainingText || '-'}\n- 산출내역/비고: ${values.budgetMemo || '세부 산출내역은 운영계획 확정 후 구체화'}\n\n해당 예산은 프로그램 운영에 필요한 강사료, 회의비, 자료 제작비, 운영비 등으로 집행하고, 집행 후 관련 증빙을 문서관리 화면에 등록하여 정산 및 성과관리와 연계함.\n\n6. 기대효과\n${values.effect || '본 프로그램 운영을 통해 참여자의 전공·실무 역량을 강화하고, 지역 전략산업과 연계한 인재양성 성과를 창출할 것으로 기대됨. 또한 연계 KPI 실적 확보와 사업단 성과관리 체계 고도화에도 기여할 수 있음.'}\n\n7. 향후계획\n- 세부 운영계획 확정 및 참여자 모집\n- 프로그램 운영 및 현장 관리\n- 결과보고서, 참석자명단, 만족도조사, 정산자료 등 증빙자료 확보\n- 연계 KPI 실적 반영 및 성과관리 자료 등록`;
}
