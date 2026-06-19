import { createCard } from './components.js';
import { showToast } from './ui.js';

const FORM_ID = 'cardnewsForm';
const OUTPUT_ID = 'cardnewsOutput';
const IMAGE_PROMPT_ID = 'cardnewsImagePrompt';
const IMAGE_PREVIEW_ID = 'cardnewsImagePreview';
const GENERATED_TEXT_KEY = 'aims_latest_cardnews_text';

const TONES = [
  { id: 'dark-premium', label: '다크 프리미엄', desc: '#121212 + White + Gold' },
  { id: 'blue-saas', label: '블루 SaaS', desc: 'Navy + Blue + Cyan' },
  { id: 'white-minimal', label: '화이트 미니멀', desc: 'White + Navy + Line' },
  { id: 'green-rise', label: '그린 RISE', desc: 'Deep Green + Mint' },
  { id: 'gold-impact', label: '골드 임팩트', desc: 'Charcoal + Gold' }
];

export function renderCardnewsView(targetSelector = '#contentContainer') {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  ensureCardnewsStyles();

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">AI Card News Studio</div>
        <h2 class="page-title">AI 카드뉴스 생성</h2>
        <p class="page-desc">보도자료 텍스트를 입력하면 카드뉴스 원고와 표지 이미지 생성 프롬프트를 자동으로 생성합니다.</p>
      </div>
    </section>
    ${createCard({ title: '카드뉴스 생성 조건', content: renderCardnewsForm() })}
    ${createCard({ title: 'AI 카드뉴스 원고', content: renderOutputPanel() })}
    ${createCard({ title: '표지 이미지 자동 생성', content: renderImagePanel() })}
  `;

  bindCardnewsEvents();
}

function renderCardnewsForm() {
  return `
    <form id="${FORM_ID}" class="form-grid">
      <label class="form-field"><span>카드 장수</span><select name="cardCount"><option value="5">5장</option><option value="6">6장</option><option value="7">7장</option><option value="8" selected>8장</option></select></label>
      <label class="form-field"><span>배경톤</span><select name="tone">${TONES.map(tone => `<option value="${tone.id}">${tone.label} · ${tone.desc}</option>`).join('')}</select></label>
      <label class="form-field"><span>목적</span><select name="purpose"><option value="성과확산">성과확산</option><option value="행사홍보">행사홍보</option><option value="참여모집">참여모집</option><option value="대외보고">대외보고</option></select></label>
      <label class="form-field"><span>타겟</span><input name="targetAudience" type="text" value="재학생, 교직원, 지역기업, 지자체 관계자" /></label>
      <label class="form-field full"><span>보도자료 텍스트</span><textarea name="pressText" rows="12" placeholder="보도자료 전문 또는 핵심 내용을 붙여넣으세요."></textarea></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">AI 카드뉴스 생성</button><button class="btn btn-outline" type="button" id="copyCardnewsText">원고 복사</button></div>
    </form>`;
}

function renderOutputPanel() {
  return `
    <div class="cardnews-output-toolbar">
      <span>생성 결과는 카드별 원고, 디자인 가이드, 인스타그램 게시글까지 포함됩니다.</span>
    </div>
    <pre id="${OUTPUT_ID}" class="draft-output cardnews-output">보도자료를 입력한 뒤 [AI 카드뉴스 생성]을 누르세요.</pre>`;
}

function renderImagePanel() {
  return `
    <div class="form-grid">
      <label class="form-field full"><span>표지 이미지 생성 프롬프트</span><textarea id="${IMAGE_PROMPT_ID}" rows="8" placeholder="카드뉴스 생성 후 표지 이미지 프롬프트가 자동 입력됩니다."></textarea></label>
      <div class="form-actions"><button class="btn btn-primary" type="button" id="generateCardnewsImage">표지 이미지 생성</button><button class="btn btn-outline" type="button" id="copyImagePrompt">프롬프트 복사</button></div>
    </div>
    <div id="${IMAGE_PREVIEW_ID}" class="cardnews-image-preview">생성된 표지 이미지가 여기에 표시됩니다. 이미지 비율은 인스타그램 카드뉴스용 4:5입니다.</div>`;
}

function bindCardnewsEvents() {
  const form = document.querySelector(`#${FORM_ID}`);
  const output = document.querySelector(`#${OUTPUT_ID}`);
  const imagePrompt = document.querySelector(`#${IMAGE_PROMPT_ID}`);
  const preview = document.querySelector(`#${IMAGE_PREVIEW_ID}`);
  if (!form || !output) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!values.pressText?.trim()) return showToast('보도자료 텍스트를 입력해 주세요.');

    output.textContent = 'AI가 보도자료를 분석하여 카드뉴스 원고를 생성 중입니다...';
    if (preview) preview.innerHTML = '표지 이미지 프롬프트 생성 후 이미지를 만들 수 있습니다.';

    try {
      const response = await fetch('/api/generate-cardnews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const result = await response.json();
      const text = result?.ok && result.text ? result.text : buildLocalCardnewsFallback(values, result?.message);
      output.textContent = text;
      localStorage.setItem(GENERATED_TEXT_KEY, text);
      if (imagePrompt) imagePrompt.value = extractImagePrompt(text) || buildFallbackImagePrompt(values);
      showToast('AI 카드뉴스 원고가 생성되었습니다.');
    } catch (error) {
      const text = buildLocalCardnewsFallback(values, error?.message);
      output.textContent = text;
      localStorage.setItem(GENERATED_TEXT_KEY, text);
      if (imagePrompt) imagePrompt.value = buildFallbackImagePrompt(values);
      showToast('API 오류로 기본 카드뉴스 초안을 생성했습니다.');
    }
  });

  document.querySelector('#copyCardnewsText')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(output.textContent || '');
    showToast('카드뉴스 원고가 복사되었습니다.');
  });

  document.querySelector('#copyImagePrompt')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(imagePrompt?.value || '');
    showToast('이미지 프롬프트가 복사되었습니다.');
  });

  document.querySelector('#generateCardnewsImage')?.addEventListener('click', async () => {
    const prompt = imagePrompt?.value?.trim();
    if (!prompt) return showToast('표지 이미지 프롬프트가 없습니다.');
    if (preview) preview.innerHTML = '<div class="cardnews-loading">표지 이미지를 생성 중입니다...</div>';
    try {
      const response = await fetch('/api/generate-cardnews-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const result = await response.json();
      if (!result?.ok || !result.image) throw new Error(result?.message || '이미지 생성 실패');
      preview.innerHTML = `<img src="${result.image}" alt="AI 카드뉴스 표지 이미지" /><div class="form-actions"><a class="btn btn-outline" href="${result.image}" download="cardnews-cover.png">이미지 다운로드</a></div>`;
      showToast('표지 이미지가 생성되었습니다.');
    } catch (error) {
      preview.innerHTML = `<div class="cardnews-image-fallback"><strong>이미지 자동생성 실패</strong><p>${error?.message || '알 수 없는 오류'}</p><p>프롬프트를 복사하여 이미지 생성 도구에서 사용할 수 있습니다.</p></div>`;
      showToast('이미지 생성에 실패했습니다. 프롬프트를 복사해 사용해 주세요.');
    }
  });
}

function extractImagePrompt(text) {
  const source = String(text || '');
  const headingIndex = source.indexOf('3. 표지 이미지 생성용 통합 프롬프트');
  if (headingIndex < 0) return '';
  const chunk = source.slice(headingIndex);
  const nextIndex = chunk.indexOf('\n4.');
  return (nextIndex > -1 ? chunk.slice(0, nextIndex) : chunk).replace('3. 표지 이미지 생성용 통합 프롬프트', '').trim();
}

function buildFallbackImagePrompt(values) {
  return `Instagram card news cover, 4:5 vertical ratio, premium Korean university RISE project visual, ${getTonePrompt(values.tone)}, clean editorial composition, enough empty space for large Korean headline text, modern campus and innovation program atmosphere, high-end social media design, bold Korean title area centered, no clutter, readable text hierarchy`;
}

function getTonePrompt(tone) {
  const map = {
    'dark-premium': 'dark charcoal background, white typography, gold accent, luxury editorial mood',
    'blue-saas': 'navy and blue gradient background, cyan accent, modern SaaS dashboard mood',
    'white-minimal': 'white minimal background, navy typography, thin line graphic, generous whitespace',
    'green-rise': 'deep green and mint accent, sustainable regional innovation mood',
    'gold-impact': 'charcoal and gold impact theme, strong contrast, premium achievement mood'
  };
  return map[tone] || map['dark-premium'];
}

function buildLocalCardnewsFallback(values, errorMessage = '') {
  const title = inferTitle(values.pressText);
  return `1. 기획 분석
- 목적: ${values.purpose || '성과확산'}
- 타겟: ${values.targetAudience || '재학생, 교직원, 지역기업, 지자체 관계자'}
- 메시지 관통선: RISE 사업의 성과를 쉽고 명확하게 전달하고, 저장하고 싶은 정보형 카드뉴스로 재구성

2. 표지용 타이틀 제안
- 후보 1: ${title}, 왜 주목해야 할까요?
- 후보 2: 지역과 대학이 함께 만든 변화
- 최종안: ${title}, 왜 주목해야 할까요?

3. 표지 이미지 생성용 통합 프롬프트
${buildFallbackImagePrompt(values)}

4. 텍스트 중심 상세 슬라이드 구성
[슬라이드 1: 표지]
- Design Guide: ${getToneLabel(values.tone)} / 큰 제목 중심 / 여백 넓게
- Headline: ${title}, 왜 주목해야 할까요?
- Body: 인천대학교 RISE사업 성과 카드뉴스
- Highlight: 지역혁신의 현장
- Insight Content: 보도자료의 핵심 성과를 한눈에 이해하도록 구성

[슬라이드 2: 왜 필요한가]
- Design Guide: Dark Charcoal 배경 / Headline White Bold / Highlight Gold
- Headline: 변화는 현장에서 시작됩니다
- Body: 대학의 교육과 지역 산업의 수요를 연결할 때, 학생과 기업 모두에게 실질적인 성과가 만들어집니다.
- Highlight: 교육과 산업의 거리 좁히기
- Insight Content: 사업 추진 필요성을 생활 속 언어로 설명

[슬라이드 3: 무엇을 했나]
- Design Guide: 핵심 활동을 3개 블록으로 분리
- Headline: 이번 사업의 핵심 활동
- Body: 보도자료에 포함된 프로그램, 참여자, 협력기관, 운영내용을 중심으로 정리합니다.
- Highlight: 운영내용을 한눈에
- Insight Content: 독자가 저장 후 보고자료로 참고할 수 있는 항목형 구성

[슬라이드 4: 어떤 성과가 있었나]
- Design Guide: 숫자와 키워드 강조
- Headline: 성과는 숫자와 변화로 남습니다
- Body: 참여인원, 만족도, 협력기업, 교육성과 등 보도자료에 명시된 성과를 중심으로 배치합니다.
- Highlight: 확인 가능한 성과만 명확하게
- Insight Content: 근거 없는 수치 창작 금지

[슬라이드 5: 왜 의미가 있나]
- Design Guide: 감성 문장 + 핵심 키워드
- Headline: 단순한 행사가 아니라 연결의 시작
- Body: 학생은 현장을 이해하고, 기업은 미래 인재를 발견하며, 대학은 지역혁신의 실행 거점이 됩니다.
- Highlight: 지역혁신은 연결에서 시작됩니다
- Insight Content: 사업의 사회적 의미 설명

[슬라이드 6: 저장 포인트]
- Design Guide: 체크리스트형
- Headline: 이 성과에서 기억할 3가지
- Body: ① 대학-지역-기업 연계 ② 실무형 인재양성 ③ 성과 확산 기반 구축
- Highlight: 저장해둘 핵심 요약
- Insight Content: 독자 저장 유도형 요약

5. 인스타그램 마케팅 카피
- 본문: ${title}를 통해 인천대학교 RISE사업이 만들어가는 지역혁신의 현장을 소개합니다. 이번 카드뉴스에서 사업의 추진 배경, 주요 활동, 성과와 의미를 한눈에 확인해 보세요.
- 저장/공유 유도 문구: 나중에 보고자료나 성과정리 때 다시 볼 수 있도록 저장해두세요.
- 해시태그: #인천대학교 #RISE사업 #지역혁신 #인재양성 #성과확산

[참고]
${errorMessage ? `AI API 응답 오류: ${errorMessage}` : 'OPENAI_API_KEY 미설정 또는 API 오류 시 표시되는 기본 초안입니다.'}`;
}

function inferTitle(text) {
  const firstLine = String(text || '').split('\n').map(line => line.trim()).find(Boolean) || 'RISE 성과';
  return firstLine.length > 28 ? `${firstLine.slice(0, 28)}...` : firstLine;
}

function getToneLabel(tone) {
  return TONES.find(item => item.id === tone)?.label || '다크 프리미엄';
}

function ensureCardnewsStyles() {
  if (document.querySelector('#cardnewsViewStyles')) return;
  const style = document.createElement('style');
  style.id = 'cardnewsViewStyles';
  style.textContent = `
    .cardnews-output{white-space:pre-wrap;line-height:1.7;min-height:420px}.cardnews-output-toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;color:#64748b;font-size:12px}.cardnews-image-preview{min-height:260px;border:1px dashed #cbd5e1;border-radius:16px;background:#f8fafc;display:grid;place-items:center;text-align:center;color:#64748b;padding:18px;margin-top:14px;overflow:hidden}.cardnews-image-preview img{max-width:100%;width:min(420px,100%);border-radius:18px;box-shadow:0 12px 36px rgba(15,23,42,.18)}.cardnews-loading{font-weight:900;color:#1d4ed8}.cardnews-image-fallback{max-width:520px;line-height:1.6}.cardnews-image-fallback strong{color:#dc2626}
  `;
  document.head.appendChild(style);
}
