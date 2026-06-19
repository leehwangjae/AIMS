import { createCard } from './components.js';
import { showToast } from './ui.js';

const FORM_ID = 'cardnewsForm';
const OUTPUT_ID = 'cardnewsOutput';
const PROGRESS_ID = 'cardnewsProgress';
const CAPTURE_ID = 'cardnewsCapture';
const CARDS_KEY = 'aims_latest_cardnews_cards';
const TEXT_KEY = 'aims_latest_cardnews_text';

let currentIndex = 0;
let currentTone = 'dark-premium';
let currentCards = [];

const TONES = [
  { id: 'dark-premium', label: '다크 프리미엄', desc: '#121212 + White + Gold' },
  { id: 'blue-saas', label: '블루 SaaS', desc: 'Navy + Blue + Cyan' },
  { id: 'white-minimal', label: '화이트 미니멀', desc: 'White + Navy + Line' },
  { id: 'green-rise', label: '그린 RISE', desc: 'Deep Green + Mint' },
  { id: 'gold-impact', label: '골드 임팩트', desc: 'Charcoal + Gold' }
];

const THEME = {
  'dark-premium': { bg: 'linear-gradient(135deg,#121212,#1f2937)', fg: '#fff', sub: '#d1d5db', accent: '#ffd700', panel: 'rgba(255,255,255,.11)' },
  'blue-saas': { bg: 'linear-gradient(135deg,#0b1f4d,#1d4ed8)', fg: '#fff', sub: '#dbeafe', accent: '#67e8f9', panel: 'rgba(255,255,255,.12)' },
  'white-minimal': { bg: 'linear-gradient(135deg,#f8fafc,#fff)', fg: '#0f172a', sub: '#475569', accent: '#1d4ed8', panel: '#eff6ff' },
  'green-rise': { bg: 'linear-gradient(135deg,#064e3b,#047857)', fg: '#fff', sub: '#d1fae5', accent: '#a7f3d0', panel: 'rgba(255,255,255,.12)' },
  'gold-impact': { bg: 'linear-gradient(135deg,#1c1917,#44403c)', fg: '#fff7ed', sub: '#e7e5e4', accent: '#fbbf24', panel: 'rgba(255,255,255,.11)' }
};

export function renderCardnewsView(targetSelector = '#contentContainer') {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  ensureStyles();
  target.innerHTML = `
    <section class="dashboard-hero sc"><div class="scb"><div class="eyebrow">AI Card News Studio</div><h2 class="page-title">AI 카드뉴스 생성</h2><p class="page-desc">보도자료 입력 → 분석·요약 → 카드별 텍스트 생성 → 관련 이미지 생성 → 내부 제작기 편집 → PNG 다운로드까지 처리합니다.</p></div></section>
    ${createCard({ title: '카드뉴스 생성 조건', content: renderForm() })}
    ${createCard({ title: '카드뉴스 제작기', content: renderInternalMaker() })}
    ${createCard({ title: 'AI 카드뉴스 원고', content: renderOutput() })}
  `;
  bindEvents();
  renderEditor();
}

function renderForm() {
  return `<form id="${FORM_ID}" class="form-grid">
    <label class="form-field"><span>카드 장수</span><select name="cardCount"><option value="5">5장</option><option value="6">6장</option><option value="7">7장</option><option value="8" selected>8장</option></select></label>
    <label class="form-field"><span>배경톤</span><select name="tone">${TONES.map(t => `<option value="${t.id}">${t.label} · ${t.desc}</option>`).join('')}</select></label>
    <label class="form-field"><span>목적</span><select name="purpose"><option value="성과확산">성과확산</option><option value="행사홍보">행사홍보</option><option value="참여모집">참여모집</option><option value="대외보고">대외보고</option></select></label>
    <label class="form-field"><span>타겟</span><input name="targetAudience" type="text" value="재학생, 교직원, 지역기업, 지자체 관계자" /></label>
    <label class="form-field full"><span>보도자료 본문</span><textarea name="pressText" rows="12" placeholder="보도자료 전문 또는 핵심 내용을 붙여넣으세요."></textarea></label>
    <div class="form-actions"><button class="btn btn-primary" type="submit">최종 카드뉴스 생성</button><button class="btn btn-outline" type="button" id="regenImages">관련 이미지 다시 생성</button><button class="btn btn-outline" type="button" id="downloadCurrentPng">현재 카드 PNG</button><button class="btn btn-outline" type="button" id="downloadAllPng">전체 PNG</button><button class="btn btn-outline" type="button" id="copyCardnewsText">원고 복사</button></div>
  </form>`;
}

function renderInternalMaker() {
  return `<div class="cardnews-maker-head"><div><strong>내부 카드뉴스 제작기</strong><span>iframe 없이 AIMS 내부에서 직접 편집·캡처합니다.</span></div><div id="${PROGRESS_ID}" class="cardnews-progress">대기 중</div></div>
  <div class="cardnews-editor-grid">
    <div class="cardnews-stage-wrap"><div id="${CAPTURE_ID}" class="cardnews-stage"><div id="cardnewsSlide" class="cardnews-slide"></div></div></div>
    <aside class="cardnews-side-editor">
      <div class="cardnews-nav"><button class="btn btn-outline" id="prevCard" type="button">이전</button><strong id="cardCounter">0/0</strong><button class="btn btn-primary" id="nextCard" type="button">다음</button></div>
      <label>배경톤<select id="editorTone">${TONES.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}</select></label>
      <label>제목<textarea id="editorTitle" rows="3"></textarea></label>
      <label>본문<textarea id="editorBody" rows="5"></textarea></label>
      <label>강조문구<textarea id="editorHighlight" rows="2"></textarea></label>
      <button class="btn btn-primary" id="applyCardEdit" type="button">수정사항 적용</button>
    </aside>
  </div>`;
}
function renderOutput() { return `<pre id="${OUTPUT_ID}" class="draft-output cardnews-output">보도자료를 입력한 뒤 [최종 카드뉴스 생성]을 누르세요.</pre>`; }

function bindEvents() {
  const form = document.querySelector(`#${FORM_ID}`);
  const output = document.querySelector(`#${OUTPUT_ID}`);
  if (!form || !output) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!values.pressText?.trim()) return showToast('보도자료 본문을 입력해 주세요.');
    currentTone = values.tone || 'dark-premium';
    setProgress('1/5 보도자료 분석 및 카드 분할 중');
    output.textContent = 'AI가 보도자료를 분석하고 카드뉴스 원고를 생성 중입니다...';
    try {
      const response = await fetch('/api/generate-cardnews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const result = await response.json();
      const text = result?.ok && result.text ? result.text : fallbackText(values, result?.message);
      output.textContent = text;
      localStorage.setItem(TEXT_KEY, text);
      currentCards = normalizeCards(parseCards(text), values).map(card => ({ ...card, theme: currentTone, visualPrompt: buildVisualPrompt(card, currentTone) }));
      currentIndex = 0;
      saveCards();
      setProgress('2/5 카드별 텍스트 입력 완료');
      renderEditor();
      await generateImages(currentCards, currentTone);
    } catch (error) {
      const text = fallbackText(values, error?.message);
      output.textContent = text;
      currentCards = normalizeCards(parseCards(text), values).map(card => ({ ...card, theme: currentTone, visualPrompt: buildVisualPrompt(card, currentTone) }));
      currentIndex = 0;
      saveCards();
      renderEditor();
      await generateImages(currentCards, currentTone);
    }
  });

  document.querySelector('#regenImages')?.addEventListener('click', async () => {
    if (!currentCards.length) return showToast('먼저 카드뉴스를 생성해 주세요.');
    currentCards = currentCards.map(card => ({ ...card, imageData: '', imageError: '' }));
    await generateImages(currentCards, currentTone);
  });
  document.querySelector('#downloadCurrentPng')?.addEventListener('click', () => downloadPng(currentIndex));
  document.querySelector('#downloadAllPng')?.addEventListener('click', downloadAllPng);
  document.querySelector('#copyCardnewsText')?.addEventListener('click', async () => { await navigator.clipboard.writeText(output.textContent || ''); showToast('원고가 복사되었습니다.'); });
  document.querySelector('#prevCard')?.addEventListener('click', () => { currentIndex = Math.max(0, currentIndex - 1); renderEditor(); });
  document.querySelector('#nextCard')?.addEventListener('click', () => { currentIndex = Math.min(currentCards.length - 1, currentIndex + 1); renderEditor(); });
  document.querySelector('#applyCardEdit')?.addEventListener('click', applyEdit);
}

async function generateImages(cards, tone) {
  setProgress('3/5 Nano Banana 기반 관련 이미지 생성 중');
  for (let i = 0; i < cards.length; i += 1) {
    setProgress(`3/5 관련 이미지 생성 중 · ${i + 1}/${cards.length}`);
    try {
      const result = await requestImage(cards[i].visualPrompt || buildVisualPrompt(cards[i], tone));
      cards[i] = result?.ok && result.image ? { ...cards[i], imageData: result.image, imageProvider: result.provider || 'AI Image API' } : { ...cards[i], imageError: result?.message || '이미지 생성 실패' };
    } catch (error) {
      cards[i] = { ...cards[i], imageError: error?.message || '이미지 생성 실패' };
    }
    currentCards = cards;
    saveCards();
    renderEditor();
  }
  setProgress('5/5 최종 카드뉴스 생성 완료');
  showToast('최종 카드뉴스가 완성되었습니다. PNG로 다운로드하세요.');
}
async function requestImage(prompt) { const r = await fetch('/api/generate-cardnews-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) }); return r.json(); }
function saveCards() { localStorage.setItem(CARDS_KEY, JSON.stringify(currentCards)); }

function renderEditor() {
  if (!currentCards.length) {
    document.querySelector('#cardnewsSlide')?.replaceChildren();
    const slide = document.querySelector('#cardnewsSlide');
    if (slide) slide.innerHTML = `<div class="cn-empty">보도자료를 입력하면 카드뉴스가 생성됩니다.</div>`;
    const counter = document.querySelector('#cardCounter'); if (counter) counter.textContent = '0/0';
    return;
  }
  const card = currentCards[currentIndex];
  const themeId = card.theme || currentTone;
  const t = THEME[themeId] || THEME['dark-premium'];
  const slide = document.querySelector('#cardnewsSlide');
  if (!slide) return;
  slide.style.background = t.bg; slide.style.color = t.fg;
  slide.innerHTML = `<div class="cn-visual" style="${card.imageData ? `background-image:url(${card.imageData});` : ''}"><span>${card.imageData ? '' : 'AI VISUAL'}</span></div><div class="cn-top"><b>${String(currentIndex + 1).padStart(2, '0')}/${String(currentCards.length).padStart(2, '0')}</b><b>AIMS CARD NEWS</b></div><div class="cn-content"><div class="cn-tag" style="color:${t.accent}">${escapeHtml(card.title)}</div><h1>${escapeHtml(card.headline)}</h1><p>${escapeHtml(card.body)}</p><div class="cn-highlight" style="background:${t.panel};border-color:${t.accent};color:${t.accent}">${escapeHtml(card.highlight)}</div><footer style="color:${t.sub}">인천대학교 RISE사업단 · AI 기반 성과확산</footer></div>`;
  document.querySelector('#cardCounter').textContent = `${currentIndex + 1}/${currentCards.length}`;
  document.querySelector('#editorTone').value = themeId;
  document.querySelector('#editorTitle').value = card.headline || '';
  document.querySelector('#editorBody').value = card.body || '';
  document.querySelector('#editorHighlight').value = card.highlight || '';
}
function applyEdit() { if (!currentCards.length) return; const card = currentCards[currentIndex]; currentCards[currentIndex] = { ...card, theme: document.querySelector('#editorTone').value, headline: document.querySelector('#editorTitle').value, body: document.querySelector('#editorBody').value, highlight: document.querySelector('#editorHighlight').value }; saveCards(); renderEditor(); showToast('수정사항이 반영되었습니다.'); }

async function loadHtml2Canvas() { if (window.html2canvas) return; await new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'; s.onload = resolve; s.onerror = reject; document.head.appendChild(s); }); }
async function downloadPng(index) { if (!currentCards.length) return showToast('다운로드할 카드가 없습니다.'); currentIndex = index; renderEditor(); await loadHtml2Canvas(); await document.fonts?.ready; const el = document.querySelector(`#${CAPTURE_ID}`); const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null }); const a = document.createElement('a'); a.download = `AIMS_cardnews_${String(index + 1).padStart(2, '0')}.png`; a.href = canvas.toDataURL('image/png'); a.click(); }
async function downloadAllPng() { if (!currentCards.length) return showToast('다운로드할 카드가 없습니다.'); for (let i = 0; i < currentCards.length; i += 1) { await downloadPng(i); await new Promise(r => setTimeout(r, 350)); } }

function parseCards(text) { return [...String(text || '').matchAll(/\[슬라이드\s*(\d+)\s*:\s*([^\]]+)\]([\s\S]*?)(?=\n\[슬라이드\s*\d+\s*:|\n5\.\s*인스타그램|$)/g)].map(m => { const block = m[3] || ''; return { title: clean(m[2]), headline: field(block, 'Headline') || clean(m[2]), body: field(block, 'Body'), highlight: field(block, 'Highlight') }; }); }
function normalizeCards(cards, values) { const count = Number(values.cardCount || 8); const base = inferTitle(values.pressText); const fallback = [['표지', base, '인천대학교 RISE사업 성과 카드뉴스', '지역혁신의 현장'], ['왜 필요한가', '변화는 현장에서 시작됩니다', '대학 교육과 지역 산업의 수요가 만날 때 실질적인 성과가 만들어집니다.', '교육과 산업의 거리 좁히기'], ['무엇을 했나', '이번 사업의 핵심 활동', '프로그램, 참여자, 협력기관, 운영내용을 중심으로 정리합니다.', '운영내용을 한눈에'], ['성과', '성과는 숫자와 변화로 남습니다', '참여인원, 만족도, 협력기업, 교육성과 등 확인 가능한 성과를 배치합니다.', '근거 있는 성과'], ['의미', '단순한 행사가 아니라 연결의 시작', '학생은 현장을 이해하고 기업은 미래 인재를 발견합니다.', '지역혁신은 연결에서 시작'], ['저장 포인트', '기억할 3가지', '대학-지역-기업 연계, 실무형 인재양성, 성과 확산 기반 구축', '저장해둘 핵심 요약'], ['확산', '성과는 공유될 때 커집니다', '성과를 기록하고 확산하면 다음 사업의 설득력 있는 근거가 됩니다.', '성과확산'], ['마무리', 'RISE의 변화는 계속됩니다', 'AIMS와 함께 사업 운영과 성과관리를 더 체계적으로 이어갑니다.', '지속가능한 사업 운영']].map(([title, headline, body, highlight]) => ({ title, headline, body, highlight })); return [...cards, ...fallback].slice(0, count).map((c, i) => ({ title: c.title || fallback[i].title, headline: c.headline || fallback[i].headline, body: c.body || fallback[i].body, highlight: c.highlight || fallback[i].highlight, index: i + 1, total: count })); }
function buildVisualPrompt(card, tone) { return `Create a premium vertical Instagram card news background image, 4:5 ratio, no text, no logo, no watermark. Theme: ${tone}. Topic: ${card.title}. Visual concept: ${card.headline}. Context: Korean university RISE project, regional innovation, students, industry collaboration, modern campus, public sector achievement, clean editorial style, high-end social media visual, enough empty space for Korean typography overlay.`; }
function field(block, name) { const m = String(block || '').match(new RegExp(`-\\s*${name}\\s*:\\s*([\\s\\S]*?)(?=\\n-\\s*(Design Guide|Headline|Body|Highlight|Insight Content)\\s*:|$)`, 'i')); return m ? clean(m[1]) : ''; }
function clean(v) { return String(v || '').replace(/\n+/g, ' ').replace(/^[-•\s]+/, '').trim(); }
function inferTitle(text) { const first = String(text || '').split('\n').map(v => v.trim()).find(Boolean) || 'RISE 성과'; return first.length > 28 ? `${first.slice(0, 28)}...` : first; }
function fallbackText(values, error = '') { const title = inferTitle(values.pressText); return `4. 텍스트 중심 상세 슬라이드 구성\n[슬라이드 1: 표지]\n- Headline: ${title}, 왜 주목해야 할까요?\n- Body: 인천대학교 RISE사업 성과 카드뉴스\n- Highlight: 지역혁신의 현장\n[슬라이드 2: 왜 필요한가]\n- Headline: 변화는 현장에서 시작됩니다\n- Body: 대학 교육과 지역 산업의 수요가 만날 때 실질적인 성과가 만들어집니다.\n- Highlight: 교육과 산업의 거리 좁히기\n[슬라이드 3: 무엇을 했나]\n- Headline: 이번 사업의 핵심 활동\n- Body: 프로그램, 참여자, 협력기관, 운영내용을 중심으로 정리합니다.\n- Highlight: 운영내용을 한눈에\n[슬라이드 4: 성과]\n- Headline: 성과는 숫자와 변화로 남습니다\n- Body: 참여인원, 만족도, 협력기업, 교육성과 등 확인 가능한 성과를 배치합니다.\n- Highlight: 근거 있는 성과\n[슬라이드 5: 의미]\n- Headline: 단순한 행사가 아니라 연결의 시작\n- Body: 학생은 현장을 이해하고 기업은 미래 인재를 발견합니다.\n- Highlight: 지역혁신은 연결에서 시작\n${error ? `\n[오류 참고] ${error}` : ''}`; }
function setProgress(message) { const el = document.querySelector(`#${PROGRESS_ID}`); if (el) el.textContent = message; }
function escapeHtml(v) { return String(v || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
function ensureStyles() { if (document.querySelector('#cardnewsInternalStyles')) return; const style = document.createElement('style'); style.id = 'cardnewsInternalStyles'; style.textContent = `.cardnews-output{white-space:pre-wrap;line-height:1.7;min-height:260px}.cardnews-maker-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;color:#64748b;font-size:12px}.cardnews-maker-head strong{display:block;color:#0f172a;font-size:15px}.cardnews-progress{font-weight:900;color:#1d4ed8}.cardnews-editor-grid{display:grid;grid-template-columns:minmax(320px,1fr) 330px;gap:20px}.cardnews-stage-wrap{background:#f8fafc;border:1px solid #dbe3ef;border-radius:20px;padding:20px;display:flex;justify-content:center}.cardnews-stage{width:min(440px,100%);aspect-ratio:4/5;border-radius:28px;overflow:hidden;box-shadow:0 22px 55px rgba(15,23,42,.18)}.cardnews-slide{position:relative;width:100%;height:100%;padding:34px;box-sizing:border-box;overflow:hidden}.cn-empty{display:grid;place-items:center;height:100%;background:#f1f5f9;color:#64748b;font-weight:900;text-align:center}.cn-visual{position:absolute;inset:0 0 auto 0;height:42%;background-size:cover;background-position:center;opacity:.28;background-color:rgba(255,255,255,.16);display:flex;align-items:center;padding-left:38px;font-weight:950;font-size:30px}.cn-top{position:relative;z-index:2;display:flex;justify-content:space-between;font-size:13px}.cn-content{position:relative;z-index:2;height:100%;display:flex;flex-direction:column}.cn-tag{margin-top:44%;font-weight:950;font-size:17px}.cn-content h1{font-size:42px;line-height:1.12;margin:15px 0 0;font-weight:950;word-break:keep-all}.cn-content p{font-size:18px;line-height:1.55;margin:18px 0 0;font-weight:700;word-break:keep-all}.cn-highlight{margin-top:auto;border:2px solid;border-radius:22px;padding:18px;font-size:24px;line-height:1.2;font-weight:950;word-break:keep-all}.cn-content footer{font-size:12px;font-weight:800;margin-top:16px}.cardnews-side-editor{border:1px solid #e2e8f0;border-radius:18px;background:#fff;padding:16px}.cardnews-side-editor label{display:block;font-size:12px;font-weight:900;color:#64748b;margin:12px 0}.cardnews-side-editor textarea,.cardnews-side-editor select{width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:10px;font-size:13px}.cardnews-nav{display:flex;align-items:center;justify-content:space-between;gap:10px}.cardnews-nav strong{font-size:15px;color:#1d4ed8}@media(max-width:980px){.cardnews-editor-grid{grid-template-columns:1fr}.cardnews-side-editor{order:-1}}`; document.head.appendChild(style); }
