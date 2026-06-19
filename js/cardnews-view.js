import { createCard } from './components.js';
import { showToast } from './ui.js';

const FORM_ID = 'cardnewsForm';
const MAKER_IFRAME_ID = 'cardNewsMakerFrame';
const OUTPUT_ID = 'cardnewsOutput';
const PROGRESS_ID = 'cardnewsProgress';
const CARDS_KEY = 'aims_latest_cardnews_cards';
const TEXT_KEY = 'aims_latest_cardnews_text';

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
  ensureStyles();
  target.innerHTML = `
    <section class="dashboard-hero sc"><div class="scb"><div class="eyebrow">AI Card News Studio</div><h2 class="page-title">AI 카드뉴스 생성</h2><p class="page-desc">보도자료 입력 → 내용 분석 및 요약 → 카드별 구분 → 텍스트 입력 → 관련 이미지 생성 → 카드뉴스 제작기 자동 연동 → PNG 다운로드까지 처리합니다.</p></div></section>
    ${createCard({ title: '카드뉴스 생성 조건', content: renderForm() })}
    ${createCard({ title: '카드뉴스 제작기', content: renderMaker() })}
    ${createCard({ title: 'AI 카드뉴스 원고', content: renderOutput() })}
  `;
  bindEvents();
}

function renderForm() {
  return `<form id="${FORM_ID}" class="form-grid">
    <label class="form-field"><span>카드 장수</span><select name="cardCount"><option value="5">5장</option><option value="6">6장</option><option value="7">7장</option><option value="8" selected>8장</option></select></label>
    <label class="form-field"><span>배경톤</span><select name="tone">${TONES.map(t => `<option value="${t.id}">${t.label} · ${t.desc}</option>`).join('')}</select></label>
    <label class="form-field"><span>목적</span><select name="purpose"><option value="성과확산">성과확산</option><option value="행사홍보">행사홍보</option><option value="참여모집">참여모집</option><option value="대외보고">대외보고</option></select></label>
    <label class="form-field"><span>타겟</span><input name="targetAudience" type="text" value="재학생, 교직원, 지역기업, 지자체 관계자" /></label>
    <label class="form-field full"><span>보도자료 본문</span><textarea name="pressText" rows="12" placeholder="보도자료 전문 또는 핵심 내용을 붙여넣으세요."></textarea></label>
    <div class="form-actions"><button class="btn btn-primary" type="submit">최종 카드뉴스 생성</button><button class="btn btn-outline" type="button" id="syncMakerBtn">제작기에 다시 전송</button><button class="btn btn-outline" type="button" id="copyCardnewsText">원고 복사</button></div>
  </form>`;
}

function renderMaker() {
  return `<div class="cardnews-maker-head"><div><strong>연동 방식</strong><span>iframe + postMessage 방식으로 AIMS 카드뉴스 데이터를 제작기에 자동 주입합니다.</span></div><div id="${PROGRESS_ID}" class="cardnews-progress">대기 중</div></div><div class="cardnews-maker-frame-wrap"><iframe id="${MAKER_IFRAME_ID}" src="/tools/card_news_maker.html" title="AIMS Card News Maker" loading="lazy"></iframe></div>`;
}

function renderOutput() {
  return `<pre id="${OUTPUT_ID}" class="draft-output cardnews-output">보도자료를 입력한 뒤 [최종 카드뉴스 생성]을 누르세요.</pre>`;
}

function bindEvents() {
  const form = document.querySelector(`#${FORM_ID}`);
  const output = document.querySelector(`#${OUTPUT_ID}`);
  if (!form || !output) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!values.pressText?.trim()) return showToast('보도자료 본문을 입력해 주세요.');

    setProgress('1/5 보도자료 분석 및 카드 분할 중');
    output.textContent = 'AI가 보도자료를 분석하고 카드뉴스 원고를 생성 중입니다...';

    try {
      const response = await fetch('/api/generate-cardnews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const result = await response.json();
      const text = result?.ok && result.text ? result.text : fallbackText(values, result?.message);
      output.textContent = text;
      localStorage.setItem(TEXT_KEY, text);
      const cards = normalizeCards(parseCards(text), values).map(card => ({ ...card, theme: values.tone, visualPrompt: buildVisualPrompt(card, values.tone) }));
      localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
      setProgress('2/5 카드별 텍스트 생성 완료');
      syncMaker(cards, values.tone);
      await generateAndSyncImages(cards, values.tone);
    } catch (error) {
      const text = fallbackText(values, error?.message);
      output.textContent = text;
      localStorage.setItem(TEXT_KEY, text);
      const cards = normalizeCards(parseCards(text), values).map(card => ({ ...card, theme: values.tone, visualPrompt: buildVisualPrompt(card, values.tone) }));
      localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
      syncMaker(cards, values.tone);
      await generateAndSyncImages(cards, values.tone);
    }
  });

  document.querySelector('#syncMakerBtn')?.addEventListener('click', () => {
    const tone = form.querySelector('[name="tone"]')?.value || 'dark-premium';
    const cards = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
    if (!cards.length) return showToast('먼저 카드뉴스를 생성해 주세요.');
    syncMaker(cards, tone);
    showToast('제작기에 카드뉴스 데이터를 다시 전송했습니다.');
  });

  document.querySelector('#copyCardnewsText')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(output.textContent || '');
    showToast('원고가 복사되었습니다.');
  });
}

async function generateAndSyncImages(cards, tone) {
  const updated = [...cards];
  setProgress('3/5 Nano Banana 기반 관련 이미지 생성 중');
  for (let i = 0; i < updated.length; i += 1) {
    setProgress(`3/5 관련 이미지 생성 중 · ${i + 1}/${updated.length}`);
    try {
      const result = await requestImage(updated[i].visualPrompt);
      if (result?.ok && result.image) updated[i] = { ...updated[i], imageData: result.image, imageProvider: result.provider || 'AI Image API', imageModel: result.model || '' };
      else updated[i] = { ...updated[i], imageError: result?.message || '이미지 생성 실패' };
    } catch (error) {
      updated[i] = { ...updated[i], imageError: error?.message || '이미지 생성 실패' };
    }
    localStorage.setItem(CARDS_KEY, JSON.stringify(updated));
    syncMaker(updated, tone);
  }
  setProgress('5/5 카드뉴스 제작기 연동 완료');
  showToast('최종 카드뉴스가 제작기에 연동되었습니다. 제작기에서 PNG로 다운로드하세요.');
}

async function requestImage(prompt) {
  const response = await fetch('/api/generate-cardnews-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
  return response.json();
}

function syncMaker(cards, tone) {
  const iframe = document.querySelector(`#${MAKER_IFRAME_ID}`);
  if (!iframe?.contentWindow) return;
  const slides = cards.map((card, index) => ({
    tag: card.title || `CARD ${index + 1}`,
    title: card.headline || card.title || '',
    body: card.body || '',
    highlight: card.highlight || '',
    theme: card.theme || tone || 'dark-premium',
    imageData: card.imageData || ''
  }));
  iframe.contentWindow.postMessage({ type: 'LOAD_NEWS_DATA', tone, slides }, '*');
}

function parseCards(text) {
  return [...String(text || '').matchAll(/\[슬라이드\s*(\d+)\s*:\s*([^\]]+)\]([\s\S]*?)(?=\n\[슬라이드\s*\d+\s*:|\n5\.\s*인스타그램|$)/g)].map(match => {
    const block = match[3] || '';
    return { title: clean(match[2]), headline: field(block, 'Headline') || clean(match[2]), body: field(block, 'Body'), highlight: field(block, 'Highlight') };
  });
}

function normalizeCards(cards, values) {
  const count = Number(values.cardCount || 8);
  const base = inferTitle(values.pressText);
  const fallback = [
    ['표지', base, '인천대학교 RISE사업 성과 카드뉴스', '지역혁신의 현장'],
    ['왜 필요한가', '변화는 현장에서 시작됩니다', '대학 교육과 지역 산업의 수요가 만날 때 실질적인 성과가 만들어집니다.', '교육과 산업의 거리 좁히기'],
    ['무엇을 했나', '이번 사업의 핵심 활동', '프로그램, 참여자, 협력기관, 운영내용을 중심으로 정리합니다.', '운영내용을 한눈에'],
    ['성과', '성과는 숫자와 변화로 남습니다', '참여인원, 만족도, 협력기업, 교육성과 등 확인 가능한 성과를 배치합니다.', '근거 있는 성과'],
    ['의미', '단순한 행사가 아니라 연결의 시작', '학생은 현장을 이해하고 기업은 미래 인재를 발견합니다.', '지역혁신은 연결에서 시작'],
    ['저장 포인트', '기억할 3가지', '대학-지역-기업 연계, 실무형 인재양성, 성과 확산 기반 구축', '저장해둘 핵심 요약'],
    ['확산', '성과는 공유될 때 커집니다', '성과를 기록하고 확산하면 다음 사업의 설득력 있는 근거가 됩니다.', '성과확산'],
    ['마무리', 'RISE의 변화는 계속됩니다', 'AIMS와 함께 사업 운영과 성과관리를 더 체계적으로 이어갑니다.', '지속가능한 사업 운영']
  ].map(([title, headline, body, highlight]) => ({ title, headline, body, highlight }));
  return [...cards, ...fallback].slice(0, count).map((card, index) => ({
    title: card.title || fallback[index].title,
    headline: card.headline || fallback[index].headline,
    body: card.body || fallback[index].body,
    highlight: card.highlight || fallback[index].highlight,
    index: index + 1,
    total: count
  }));
}

function buildVisualPrompt(card, tone) {
  return `Create a premium vertical Instagram card news background image, 4:5 ratio, no text, no logo, no watermark. Theme: ${tone}. Topic: ${card.title}. Visual concept: ${card.headline}. Context: Korean university RISE project, regional innovation, students, industry collaboration, modern campus, public sector achievement, clean editorial style, high-end social media visual, enough empty space for Korean typography overlay.`;
}

function field(block, name) {
  const regex = new RegExp(`-\\s*${name}\\s*:\\s*([\\s\\S]*?)(?=\\n-\\s*(Design Guide|Headline|Body|Highlight|Insight Content)\\s*:|$)`, 'i');
  const match = String(block || '').match(regex);
  return match ? clean(match[1]) : '';
}
function clean(value) { return String(value || '').replace(/\n+/g, ' ').replace(/^[-•\s]+/, '').trim(); }
function inferTitle(text) { const first = String(text || '').split('\n').map(v => v.trim()).find(Boolean) || 'RISE 성과'; return first.length > 28 ? `${first.slice(0, 28)}...` : first; }
function setProgress(message) { const el = document.querySelector(`#${PROGRESS_ID}`); if (el) el.textContent = message; }
function fallbackText(values, error = '') { const title = inferTitle(values.pressText); return `1. 기획 분석\n- 목적: ${values.purpose || '성과확산'}\n- 타겟: ${values.targetAudience || '재학생, 교직원, 지역기업, 지자체 관계자'}\n- 메시지 관통선: RISE 사업의 성과를 쉽고 명확하게 전달\n\n2. 표지용 타이틀 제안\n- 후보 1: ${title}, 왜 주목해야 할까요?\n- 후보 2: 지역과 대학이 함께 만든 변화\n- 최종안: ${title}, 왜 주목해야 할까요?\n\n4. 텍스트 중심 상세 슬라이드 구성\n[슬라이드 1: 표지]\n- Headline: ${title}, 왜 주목해야 할까요?\n- Body: 인천대학교 RISE사업 성과 카드뉴스\n- Highlight: 지역혁신의 현장\n[슬라이드 2: 왜 필요한가]\n- Headline: 변화는 현장에서 시작됩니다\n- Body: 대학 교육과 지역 산업의 수요가 만날 때 실질적인 성과가 만들어집니다.\n- Highlight: 교육과 산업의 거리 좁히기\n[슬라이드 3: 무엇을 했나]\n- Headline: 이번 사업의 핵심 활동\n- Body: 프로그램, 참여자, 협력기관, 운영내용을 중심으로 정리합니다.\n- Highlight: 운영내용을 한눈에\n[슬라이드 4: 성과]\n- Headline: 성과는 숫자와 변화로 남습니다\n- Body: 참여인원, 만족도, 협력기업, 교육성과 등 확인 가능한 성과를 배치합니다.\n- Highlight: 근거 있는 성과\n[슬라이드 5: 의미]\n- Headline: 단순한 행사가 아니라 연결의 시작\n- Body: 학생은 현장을 이해하고 기업은 미래 인재를 발견합니다.\n- Highlight: 지역혁신은 연결에서 시작\n${error ? `\n[오류 참고] ${error}` : ''}`; }
function ensureStyles() { if (document.querySelector('#cardnewsMakerStyles')) return; const style = document.createElement('style'); style.id = 'cardnewsMakerStyles'; style.textContent = `.cardnews-output{white-space:pre-wrap;line-height:1.7;min-height:300px}.cardnews-maker-head{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:12px;color:#64748b;font-size:12px}.cardnews-maker-head strong{display:block;font-size:15px;color:#0f172a}.cardnews-progress{font-weight:900;color:#1d4ed8}.cardnews-maker-frame-wrap{width:100%;border:1px solid #dbe3ef;border-radius:18px;overflow:hidden;background:#f8fafc;box-shadow:0 12px 32px rgba(15,23,42,.08)}.cardnews-maker-frame-wrap iframe{display:block;width:100%;height:900px;border:0}.cardnews-maker-frame-wrap iframe{background:#f8fafc}`; document.head.appendChild(style); }
