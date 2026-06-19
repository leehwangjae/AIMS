import { createCard } from './components.js';
import { showToast } from './ui.js';

const FORM_ID = 'cardnewsForm';
const OUTPUT_ID = 'cardnewsOutput';
const DECK_ID = 'cardnewsDeck';
const PROGRESS_ID = 'cardnewsProgress';
const PROMPT_ID = 'cardnewsImagePrompt';
const PREVIEW_ID = 'cardnewsImagePreview';
const CARDS_KEY = 'aims_latest_cardnews_cards';
const TEXT_KEY = 'aims_latest_cardnews_text';

const TONES = [
  { id: 'dark-premium', label: '다크 프리미엄', desc: '#121212 + White + Gold' },
  { id: 'blue-saas', label: '블루 SaaS', desc: 'Navy + Blue + Cyan' },
  { id: 'white-minimal', label: '화이트 미니멀', desc: 'White + Navy + Line' },
  { id: 'green-rise', label: '그린 RISE', desc: 'Deep Green + Mint' },
  { id: 'gold-impact', label: '골드 임팩트', desc: 'Charcoal + Gold' }
];

const THEMES = {
  'dark-premium': { bg: '#121212', bg2: '#1f2937', fg: '#ffffff', sub: '#d1d5db', accent: '#ffd700', line: '#374151', box: 'rgba(255,255,255,.08)' },
  'blue-saas': { bg: '#0b1f4d', bg2: '#1d4ed8', fg: '#ffffff', sub: '#dbeafe', accent: '#67e8f9', line: '#60a5fa', box: 'rgba(255,255,255,.10)' },
  'white-minimal': { bg: '#f8fafc', bg2: '#ffffff', fg: '#0f172a', sub: '#475569', accent: '#1d4ed8', line: '#cbd5e1', box: '#eff6ff' },
  'green-rise': { bg: '#064e3b', bg2: '#047857', fg: '#ffffff', sub: '#d1fae5', accent: '#a7f3d0', line: '#34d399', box: 'rgba(255,255,255,.10)' },
  'gold-impact': { bg: '#1c1917', bg2: '#44403c', fg: '#fff7ed', sub: '#e7e5e4', accent: '#fbbf24', line: '#d97706', box: 'rgba(255,255,255,.09)' }
};

export function renderCardnewsView(targetSelector = '#contentContainer') {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  ensureStyles();
  target.innerHTML = `
    <section class="dashboard-hero sc"><div class="scb"><div class="eyebrow">AI Card News Studio</div><h2 class="page-title">AI 카드뉴스 생성</h2><p class="page-desc">보도자료 입력 → 내용 분석 및 요약 → 카드별 구분 → 텍스트 입력 → 관련 이미지 생성 → 최종 카드뉴스 제공까지 자동 처리합니다.</p></div></section>
    ${createCard({ title: '카드뉴스 생성 조건', content: formHtml() })}
    ${createCard({ title: '최종 카드뉴스', content: deckHtml() })}
    ${createCard({ title: 'AI 카드뉴스 원고', content: outputHtml() })}
    ${createCard({ title: '표지 이미지 프롬프트', content: imageHtml() })}
  `;
  bindEvents();
}

function formHtml() {
  return `<form id="${FORM_ID}" class="form-grid">
    <label class="form-field"><span>카드 장수</span><select name="cardCount"><option value="5">5장</option><option value="6">6장</option><option value="7">7장</option><option value="8" selected>8장</option></select></label>
    <label class="form-field"><span>배경톤</span><select name="tone">${TONES.map(t => `<option value="${t.id}">${t.label} · ${t.desc}</option>`).join('')}</select></label>
    <label class="form-field"><span>목적</span><select name="purpose"><option value="성과확산">성과확산</option><option value="행사홍보">행사홍보</option><option value="참여모집">참여모집</option><option value="대외보고">대외보고</option></select></label>
    <label class="form-field"><span>타겟</span><input name="targetAudience" type="text" value="재학생, 교직원, 지역기업, 지자체 관계자" /></label>
    <label class="form-field full"><span>보도자료 본문</span><textarea name="pressText" rows="12" placeholder="보도자료 전문 또는 핵심 내용을 붙여넣으세요."></textarea></label>
    <div class="form-actions"><button class="btn btn-primary" type="submit">최종 카드뉴스 생성</button><button class="btn btn-outline" type="button" id="regenImages">관련 이미지 다시 생성</button><button class="btn btn-outline" type="button" id="downloadAllSvg">전체 SVG 다운로드</button><button class="btn btn-outline" type="button" id="copyCardnewsText">원고 복사</button></div>
  </form>`;
}

function deckHtml() {
  return `<div class="cardnews-deck-toolbar"><div><strong>4:5 최종 카드뉴스</strong><span>카드별 AI 관련 이미지를 생성해 텍스트와 합성합니다.</span></div><div id="${PROGRESS_ID}" class="cardnews-progress">대기 중</div></div><div id="${DECK_ID}" class="cardnews-deck-empty">보도자료를 입력한 뒤 [최종 카드뉴스 생성]을 누르세요.</div>`;
}
function outputHtml() { return `<pre id="${OUTPUT_ID}" class="draft-output cardnews-output">보도자료를 입력한 뒤 [최종 카드뉴스 생성]을 누르세요.</pre>`; }
function imageHtml() { return `<div class="form-grid"><label class="form-field full"><span>표지 이미지 생성 프롬프트</span><textarea id="${PROMPT_ID}" rows="8"></textarea></label><div class="form-actions"><button class="btn btn-primary" type="button" id="generateCoverOnly">표지 이미지만 별도 생성</button><button class="btn btn-outline" type="button" id="copyImagePrompt">프롬프트 복사</button></div></div><div id="${PREVIEW_ID}" class="cardnews-image-preview">표지 이미지만 별도로 생성할 수 있습니다.</div>`; }

function bindEvents() {
  const form = document.querySelector(`#${FORM_ID}`);
  const output = document.querySelector(`#${OUTPUT_ID}`);
  const promptArea = document.querySelector(`#${PROMPT_ID}`);
  const preview = document.querySelector(`#${PREVIEW_ID}`);
  if (!form || !output) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!values.pressText?.trim()) return showToast('보도자료 본문을 입력해 주세요.');
    setProgress('1/5 보도자료 분석 및 요약 중');
    renderDeckMessage('보도자료를 분석하고 카드별 구성을 만드는 중입니다...');
    output.textContent = 'AI가 카드뉴스 원고를 생성 중입니다...';
    try {
      const response = await fetch('/api/generate-cardnews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const result = await response.json();
      const text = result?.ok && result.text ? result.text : fallbackText(values, result?.message);
      output.textContent = text;
      localStorage.setItem(TEXT_KEY, text);
      if (promptArea) promptArea.value = extractImagePrompt(text) || fallbackImagePrompt(values);
      let cards = normalizeCards(parseCards(text), values).map(card => ({ ...card, visualPrompt: buildVisualPrompt(card, values.tone) }));
      setProgress('2/5 카드별 텍스트 입력 및 레이아웃 구성 완료');
      saveAndRender(cards, values.tone);
      await generateImages(cards, values.tone);
    } catch (error) {
      const text = fallbackText(values, error?.message);
      output.textContent = text;
      localStorage.setItem(TEXT_KEY, text);
      let cards = normalizeCards(parseCards(text), values).map(card => ({ ...card, visualPrompt: buildVisualPrompt(card, values.tone) }));
      saveAndRender(cards, values.tone);
      await generateImages(cards, values.tone);
    }
  });

  document.querySelector('#regenImages')?.addEventListener('click', async () => {
    const cards = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
    const tone = form.querySelector('[name="tone"]')?.value || 'dark-premium';
    if (!cards.length) return showToast('먼저 카드뉴스를 생성해 주세요.');
    await generateImages(cards.map(c => ({ ...c, imageData: '', imageError: '' })), tone);
  });
  document.querySelector('#downloadAllSvg')?.addEventListener('click', () => {
    const cards = JSON.parse(localStorage.getItem(CARDS_KEY) || '[]');
    const tone = form.querySelector('[name="tone"]')?.value || 'dark-premium';
    if (!cards.length) return showToast('다운로드할 카드뉴스가 없습니다.');
    cards.forEach((card, index) => downloadSvg(card, index, tone));
    showToast('최종 카드뉴스 다운로드를 시작했습니다.');
  });
  document.querySelector('#copyCardnewsText')?.addEventListener('click', async () => { await navigator.clipboard.writeText(output.textContent || ''); showToast('원고가 복사되었습니다.'); });
  document.querySelector('#copyImagePrompt')?.addEventListener('click', async () => { await navigator.clipboard.writeText(promptArea?.value || ''); showToast('프롬프트가 복사되었습니다.'); });
  document.querySelector('#generateCoverOnly')?.addEventListener('click', async () => {
    const prompt = promptArea?.value?.trim();
    if (!prompt) return showToast('표지 이미지 프롬프트가 없습니다.');
    preview.innerHTML = '<div class="cardnews-loading">표지 이미지를 생성 중입니다...</div>';
    const result = await requestImage(prompt);
    preview.innerHTML = result?.ok && result.image ? `<img src="${result.image}" alt="표지 이미지"/><div class="cardnews-provider">${result.provider || 'AI Image API'} ${result.model || ''}</div>` : `<div class="cardnews-image-fallback">이미지 생성 실패: ${result?.message || '알 수 없는 오류'}</div>`;
  });
}

async function generateImages(cards, tone) {
  const updated = [...cards];
  setProgress('3/5 카드별 관련 이미지 생성 중');
  for (let i = 0; i < updated.length; i += 1) {
    setProgress(`3/5 관련 이미지 생성 중 · ${i + 1}/${updated.length}`);
    try {
      const result = await requestImage(updated[i].visualPrompt || buildVisualPrompt(updated[i], tone));
      updated[i] = result?.ok && result.image ? { ...updated[i], imageData: result.image, imageProvider: result.provider || 'AI Image API', imageModel: result.model || '' } : { ...updated[i], imageError: result?.message || '이미지 생성 실패' };
    } catch (error) {
      updated[i] = { ...updated[i], imageError: error?.message || '이미지 생성 실패' };
    }
    saveAndRender(updated, tone);
  }
  setProgress('5/5 최종 카드뉴스 생성 완료');
  showToast('최종 카드뉴스가 완성되었습니다.');
}
async function requestImage(prompt) { const r = await fetch('/api/generate-cardnews-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) }); return r.json(); }
function saveAndRender(cards, tone) { localStorage.setItem(CARDS_KEY, JSON.stringify(cards)); renderDeck(cards, tone); }
function setProgress(msg) { const el = document.querySelector(`#${PROGRESS_ID}`); if (el) el.textContent = msg; }
function renderDeckMessage(msg) { const deck = document.querySelector(`#${DECK_ID}`); if (deck) { deck.className = 'cardnews-deck-empty'; deck.innerHTML = `<div class="cardnews-loading">${msg}</div>`; } }

function renderDeck(cards, tone) {
  const deck = document.querySelector(`#${DECK_ID}`); if (!deck) return;
  deck.className = 'cardnews-deck-grid';
  deck.innerHTML = cards.map((card, index) => {
    const svg = buildSvg(card, index, tone);
    const status = card.imageData ? 'AI 이미지 합성 완료' : card.imageError ? '기본 그래픽 사용' : '이미지 생성 대기';
    return `<article class="cardnews-preview-item"><img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}" alt="카드뉴스 ${index + 1}"/><div class="cardnews-preview-actions"><div><strong>${index + 1}/${cards.length}</strong><span>${status}</span></div><button class="btn btn-outline" type="button" data-card="${index}">최종본 다운로드</button></div></article>`;
  }).join('');
  deck.querySelectorAll('[data-card]').forEach(btn => btn.addEventListener('click', () => downloadSvg(cards[Number(btn.dataset.card)], Number(btn.dataset.card), tone)));
}

function parseCards(text) {
  return [...String(text || '').matchAll(/\[슬라이드\s*(\d+)\s*:\s*([^\]]+)\]([\s\S]*?)(?=\n\[슬라이드\s*\d+\s*:|\n5\.\s*인스타그램|$)/g)].map(m => {
    const block = m[3] || '';
    return { title: clean(m[2]), headline: field(block, 'Headline') || clean(m[2]), body: field(block, 'Body'), highlight: field(block, 'Highlight'), insight: field(block, 'Insight Content'), design: field(block, 'Design Guide') };
  });
}
function normalizeCards(cards, values) {
  const count = Number(values.cardCount || 8); const base = inferTitle(values.pressText);
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
  return [...cards, ...fallback].slice(0, count).map((c, i) => ({ title: c.title || fallback[i].title, headline: c.headline || fallback[i].headline, body: c.body || fallback[i].body, highlight: c.highlight || fallback[i].highlight, index: i + 1, total: count }));
}

function buildVisualPrompt(card, tone) {
  return `Create a premium vertical Instagram card news background image, 4:5 ratio, no text, no logo, no watermark. Theme: ${tone}. Topic: ${card.title}. Visual concept: ${card.headline}. Context: Korean university RISE project, regional innovation, students, industry collaboration, modern campus, public sector achievement, clean editorial style, high-end social media visual, enough empty space for Korean typography overlay.`;
}

function buildSvg(card, index, toneId) {
  const t = THEMES[toneId] || THEMES['dark-premium']; const white = toneId === 'white-minimal';
  const headline = wrap(card.headline, index === 0 ? 13 : 15).slice(0, index === 0 ? 4 : 3);
  const body = wrap(card.body, 24).slice(0, 6); const hi = wrap(card.highlight, 16).slice(0, 3);
  const img = card.imageData ? `<image href="${escapeXml(card.imageData)}" x="90" y="255" width="900" height="420" preserveAspectRatio="xMidYMid slice" opacity="0.92"/><rect x="90" y="255" width="900" height="420" fill="${t.bg}" opacity="0.18"/>` : `<rect x="90" y="255" width="900" height="420" rx="34" fill="${t.box}" stroke="${t.line}" stroke-width="2"/><circle cx="870" cy="340" r="110" fill="${t.accent}" opacity=".20"/><text x="130" y="470" font-family="Pretendard, Noto Sans KR, sans-serif" font-size="40" font-weight="900" fill="${t.sub}">AI VISUAL</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.bg}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#000" flood-opacity=".22"/></filter><clipPath id="clip"><rect x="90" y="255" width="900" height="420" rx="34"/></clipPath></defs><rect width="1080" height="1350" fill="url(#bg)"/><rect x="55" y="55" width="970" height="1240" rx="46" fill="${white ? '#fff' : 'rgba(255,255,255,.055)'}" stroke="${t.line}" stroke-width="3" filter="url(#shadow)"/><text x="90" y="125" font-family="Pretendard, Noto Sans KR, sans-serif" font-size="34" font-weight="900" fill="${t.accent}">${String(index + 1).padStart(2, '0')}/${card.total}</text><text x="990" y="125" text-anchor="end" font-family="Pretendard, Noto Sans KR, sans-serif" font-size="26" font-weight="800" fill="${t.sub}">AIMS CARD NEWS</text><line x1="90" y1="165" x2="990" y2="165" stroke="${t.line}" stroke-width="3"/>${img}<rect x="90" y="715" width="900" height="290" rx="32" fill="${white ? '#f8fafc' : 'rgba(0,0,0,.28)'}"/><text x="120" y="760" font-family="Pretendard, Noto Sans KR, sans-serif" font-size="30" font-weight="900" fill="${t.accent}">${escapeXml(card.title)}</text>${headline.map((l, i) => `<text x="120" y="${830 + i * 64}" font-family="Pretendard, Noto Sans KR, sans-serif" font-size="54" font-weight="950" fill="${t.fg}">${escapeXml(l)}</text>`).join('')}<rect x="90" y="1030" width="900" height="135" rx="28" fill="${t.accent}" opacity="${white ? '.16' : '.95'}"/>${hi.map((l, i) => `<text x="125" y="${1086 + i * 38}" font-family="Pretendard, Noto Sans KR, sans-serif" font-size="34" font-weight="950" fill="${white ? t.fg : '#111827'}">${escapeXml(l)}</text>`).join('')} ${body.map((l, i) => `<text x="95" y="${1210 + i * 31}" font-family="Pretendard, Noto Sans KR, sans-serif" font-size="24" font-weight="650" fill="${t.sub}">${escapeXml(l)}</text>`).join('')}<text x="90" y="1290" font-family="Pretendard, Noto Sans KR, sans-serif" font-size="22" font-weight="800" fill="${t.sub}">인천대학교 RISE사업단 · AI 기반 성과확산</text></svg>`;
}

function downloadSvg(card, index, tone) { const blob = new Blob([buildSvg(card, index, tone)], { type: 'image/svg+xml;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `AIMS_cardnews_final_${String(index + 1).padStart(2, '0')}.svg`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
function field(block, name) { const m = String(block || '').match(new RegExp(`-\\s*${name}\\s*:\\s*([\\s\\S]*?)(?=\\n-\\s*(Design Guide|Headline|Body|Highlight|Insight Content)\\s*:|$)`, 'i')); return m ? clean(m[1]) : ''; }
function clean(v) { return String(v || '').replace(/\n+/g, ' ').replace(/^[-•\s]+/, '').trim(); }
function wrap(text, max) { const chars = [...String(text || '').trim()]; const lines = []; for (let i = 0; i < chars.length; i += max) lines.push(chars.slice(i, i + max).join('')); return lines.length ? lines : ['']; }
function inferTitle(text) { const line = String(text || '').split('\n').map(s => s.trim()).find(Boolean) || 'RISE 성과'; return line.length > 28 ? `${line.slice(0, 28)}...` : line; }
function extractImagePrompt(text) { const i = String(text || '').indexOf('3. 표지 이미지 생성용 통합 프롬프트'); if (i < 0) return ''; const chunk = String(text).slice(i); const next = chunk.indexOf('\n4.'); return (next > -1 ? chunk.slice(0, next) : chunk).replace('3. 표지 이미지 생성용 통합 프롬프트', '').trim(); }
function fallbackImagePrompt(values) { return `Instagram card news cover, 4:5 vertical ratio, premium Korean university RISE project visual, ${values.tone}, clean editorial composition, enough empty space for large Korean headline text, modern campus and innovation program atmosphere, high-end social media design, no clutter`; }
function fallbackText(values, error = '') { const title = inferTitle(values.pressText); return `1. 기획 분석\n- 목적: ${values.purpose || '성과확산'}\n- 타겟: ${values.targetAudience || '재학생, 교직원, 지역기업, 지자체 관계자'}\n- 메시지 관통선: RISE 사업의 성과를 쉽고 명확하게 전달\n\n2. 표지용 타이틀 제안\n- 후보 1: ${title}, 왜 주목해야 할까요?\n- 후보 2: 지역과 대학이 함께 만든 변화\n- 최종안: ${title}, 왜 주목해야 할까요?\n\n3. 표지 이미지 생성용 통합 프롬프트\n${fallbackImagePrompt(values)}\n\n4. 텍스트 중심 상세 슬라이드 구성\n[슬라이드 1: 표지]\n- Headline: ${title}, 왜 주목해야 할까요?\n- Body: 인천대학교 RISE사업 성과 카드뉴스\n- Highlight: 지역혁신의 현장\n[슬라이드 2: 왜 필요한가]\n- Headline: 변화는 현장에서 시작됩니다\n- Body: 대학 교육과 지역 산업의 수요가 만날 때 실질적인 성과가 만들어집니다.\n- Highlight: 교육과 산업의 거리 좁히기\n[슬라이드 3: 무엇을 했나]\n- Headline: 이번 사업의 핵심 활동\n- Body: 프로그램, 참여자, 협력기관, 운영내용을 중심으로 정리합니다.\n- Highlight: 운영내용을 한눈에\n[슬라이드 4: 성과]\n- Headline: 성과는 숫자와 변화로 남습니다\n- Body: 참여인원, 만족도, 협력기업, 교육성과 등 확인 가능한 성과를 배치합니다.\n- Highlight: 근거 있는 성과\n[슬라이드 5: 의미]\n- Headline: 단순한 행사가 아니라 연결의 시작\n- Body: 학생은 현장을 이해하고 기업은 미래 인재를 발견합니다.\n- Highlight: 지역혁신은 연결에서 시작\n\n5. 인스타그램 마케팅 카피\n- 본문: ${title}를 통해 인천대학교 RISE사업의 성과를 소개합니다.\n- 저장/공유 유도 문구: 성과정리 때 다시 볼 수 있도록 저장해두세요.\n- 해시태그: #인천대학교 #RISE사업 #지역혁신 #인재양성 #성과확산\n${error ? `\n[오류 참고] ${error}` : ''}`; }
function escapeXml(v) { return String(v || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
function ensureStyles() { if (document.querySelector('#cardnewsViewStyles')) return; const s = document.createElement('style'); s.id = 'cardnewsViewStyles'; s.textContent = `.cardnews-output{white-space:pre-wrap;line-height:1.7;min-height:300px}.cardnews-deck-toolbar{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:12px;color:#64748b;font-size:12px}.cardnews-deck-toolbar strong{display:block;font-size:15px;color:#0f172a}.cardnews-progress{font-weight:900;color:#1d4ed8}.cardnews-deck-empty{min-height:280px;border:1px dashed #cbd5e1;border-radius:18px;background:#f8fafc;display:grid;place-items:center;text-align:center;color:#64748b;padding:20px}.cardnews-deck-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:18px}.cardnews-preview-item{border:1px solid #e2e8f0;border-radius:20px;background:#fff;padding:12px;box-shadow:0 10px 28px rgba(15,23,42,.08)}.cardnews-preview-item img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:16px;background:#111827}.cardnews-preview-actions{display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px}.cardnews-preview-actions strong{display:block;font-size:13px;color:#1d4ed8}.cardnews-preview-actions span{display:block;font-size:11px;color:#64748b}.cardnews-image-preview{min-height:240px;border:1px dashed #cbd5e1;border-radius:16px;background:#f8fafc;display:grid;place-items:center;text-align:center;color:#64748b;padding:18px;margin-top:14px;overflow:hidden}.cardnews-image-preview img{max-width:100%;width:min(420px,100%);border-radius:18px;box-shadow:0 12px 36px rgba(15,23,42,.18)}.cardnews-loading{font-weight:900;color:#1d4ed8}.cardnews-image-fallback{color:#dc2626}.cardnews-provider{font-size:12px;color:#64748b;margin-top:10px}`; document.head.appendChild(s); }
