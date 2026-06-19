import { createCard } from './components.js';
import { showToast } from './ui.js';

const FORM_ID = 'cardnewsForm';
const OUTPUT_ID = 'cardnewsOutput';
const DECK_ID = 'cardnewsDeck';
const IMAGE_PROMPT_ID = 'cardnewsImagePrompt';
const IMAGE_PREVIEW_ID = 'cardnewsImagePreview';
const GENERATED_TEXT_KEY = 'aims_latest_cardnews_text';
const GENERATED_CARDS_KEY = 'aims_latest_cardnews_cards';

const TONES = [
  { id: 'dark-premium', label: '다크 프리미엄', desc: '#121212 + White + Gold' },
  { id: 'blue-saas', label: '블루 SaaS', desc: 'Navy + Blue + Cyan' },
  { id: 'white-minimal', label: '화이트 미니멀', desc: 'White + Navy + Line' },
  { id: 'green-rise', label: '그린 RISE', desc: 'Deep Green + Mint' },
  { id: 'gold-impact', label: '골드 임팩트', desc: 'Charcoal + Gold' }
];

const THEME_MAP = {
  'dark-premium': { bg: '#121212', bg2: '#1f2937', fg: '#ffffff', sub: '#d1d5db', accent: '#ffd700', line: '#374151' },
  'blue-saas': { bg: '#0b1f4d', bg2: '#1d4ed8', fg: '#ffffff', sub: '#dbeafe', accent: '#67e8f9', line: '#60a5fa' },
  'white-minimal': { bg: '#f8fafc', bg2: '#ffffff', fg: '#0f172a', sub: '#475569', accent: '#1d4ed8', line: '#cbd5e1' },
  'green-rise': { bg: '#064e3b', bg2: '#047857', fg: '#ffffff', sub: '#d1fae5', accent: '#a7f3d0', line: '#34d399' },
  'gold-impact': { bg: '#1c1917', bg2: '#44403c', fg: '#fff7ed', sub: '#e7e5e4', accent: '#fbbf24', line: '#d97706' }
};

export function renderCardnewsView(targetSelector = '#contentContainer') {
  const target = document.querySelector(targetSelector);
  if (!target) return;
  ensureCardnewsStyles();

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">AI Card News Studio</div>
        <h2 class="page-title">AI 카드뉴스 생성</h2>
        <p class="page-desc">보도자료 텍스트를 입력하면 인스타그램 4:5 카드뉴스 원고와 실제 카드 이미지 시안을 자동 생성합니다.</p>
      </div>
    </section>
    ${createCard({ title: '카드뉴스 생성 조건', content: renderCardnewsForm() })}
    ${createCard({ title: '카드뉴스 이미지 시안', content: renderDeckPanel() })}
    ${createCard({ title: 'AI 카드뉴스 원고', content: renderOutputPanel() })}
    ${createCard({ title: '표지 이미지 AI 생성', content: renderImagePanel() })}
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
      <div class="form-actions"><button class="btn btn-primary" type="submit">AI 카드뉴스 생성</button><button class="btn btn-outline" type="button" id="downloadAllSvg">전체 SVG 다운로드</button><button class="btn btn-outline" type="button" id="copyCardnewsText">원고 복사</button></div>
    </form>`;
}

function renderDeckPanel() {
  return `
    <div class="cardnews-deck-toolbar">
      <strong>4:5 카드뉴스 미리보기</strong>
      <span>각 카드 우측 하단의 다운로드 버튼으로 이미지 파일을 저장할 수 있습니다.</span>
    </div>
    <div id="${DECK_ID}" class="cardnews-deck-empty">보도자료를 입력한 뒤 [AI 카드뉴스 생성]을 누르면 카드 이미지 시안이 생성됩니다.</div>`;
}

function renderOutputPanel() {
  return `
    <div class="cardnews-output-toolbar"><span>생성된 원고는 편집·복사용으로 함께 제공합니다.</span></div>
    <pre id="${OUTPUT_ID}" class="draft-output cardnews-output">보도자료를 입력한 뒤 [AI 카드뉴스 생성]을 누르세요.</pre>`;
}

function renderImagePanel() {
  return `
    <div class="form-grid">
      <label class="form-field full"><span>표지 이미지 생성 프롬프트</span><textarea id="${IMAGE_PROMPT_ID}" rows="8" placeholder="카드뉴스 생성 후 표지 이미지 프롬프트가 자동 입력됩니다."></textarea></label>
      <div class="form-actions"><button class="btn btn-primary" type="button" id="generateCardnewsImage">AI 표지 이미지 생성</button><button class="btn btn-outline" type="button" id="copyImagePrompt">프롬프트 복사</button></div>
    </div>
    <div id="${IMAGE_PREVIEW_ID}" class="cardnews-image-preview">생성된 AI 표지 이미지가 여기에 표시됩니다. 전체 카드뉴스는 위의 카드 이미지 시안 영역에서 자동 생성됩니다.</div>`;
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

    output.textContent = 'AI가 보도자료를 분석하여 카드뉴스 원고와 이미지 시안을 생성 중입니다...';
    renderDeckLoading();

    try {
      const response = await fetch('/api/generate-cardnews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      const result = await response.json();
      const text = result?.ok && result.text ? result.text : buildLocalCardnewsFallback(values, result?.message);
      applyGeneratedCardnews(text, values);
      showToast('카드뉴스 원고와 이미지 시안이 생성되었습니다.');
    } catch (error) {
      const text = buildLocalCardnewsFallback(values, error?.message);
      applyGeneratedCardnews(text, values);
      showToast('API 오류로 기본 카드뉴스 시안을 생성했습니다.');
    }

    if (preview) preview.innerHTML = '표지 이미지만 별도 고품질 이미지로 생성하려면 아래 버튼을 누르세요.';
  });

  document.querySelector('#copyCardnewsText')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(output.textContent || '');
    showToast('카드뉴스 원고가 복사되었습니다.');
  });

  document.querySelector('#downloadAllSvg')?.addEventListener('click', () => {
    const cards = JSON.parse(localStorage.getItem(GENERATED_CARDS_KEY) || '[]');
    const tone = document.querySelector(`#${FORM_ID} select[name="tone"]`)?.value || 'dark-premium';
    if (!cards.length) return showToast('다운로드할 카드뉴스가 없습니다.');
    cards.forEach((card, index) => downloadCardSvg(card, index, tone));
    showToast('카드뉴스 SVG 다운로드를 시작했습니다.');
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
      showToast('AI 표지 이미지가 생성되었습니다.');
    } catch (error) {
      preview.innerHTML = `<div class="cardnews-image-fallback"><strong>이미지 자동생성 실패</strong><p>${error?.message || '알 수 없는 오류'}</p><p>프롬프트를 복사하여 이미지 생성 도구에서 사용할 수 있습니다.</p></div>`;
      showToast('이미지 생성에 실패했습니다. 프롬프트를 복사해 사용해 주세요.');
    }
  });
}

function applyGeneratedCardnews(text, values) {
  const output = document.querySelector(`#${OUTPUT_ID}`);
  const imagePrompt = document.querySelector(`#${IMAGE_PROMPT_ID}`);
  output.textContent = text;
  localStorage.setItem(GENERATED_TEXT_KEY, text);
  if (imagePrompt) imagePrompt.value = extractImagePrompt(text) || buildFallbackImagePrompt(values);
  const cards = normalizeCards(parseCardsFromGeneratedText(text), values);
  localStorage.setItem(GENERATED_CARDS_KEY, JSON.stringify(cards));
  renderCardDeck(cards, values.tone);
}

function renderDeckLoading() {
  const deck = document.querySelector(`#${DECK_ID}`);
  if (deck) deck.className = 'cardnews-deck-empty', deck.innerHTML = '<div class="cardnews-loading">카드뉴스 이미지를 구성 중입니다...</div>';
}

function renderCardDeck(cards, tone) {
  const deck = document.querySelector(`#${DECK_ID}`);
  if (!deck) return;
  deck.className = 'cardnews-deck-grid';
  deck.innerHTML = cards.map((card, index) => {
    const svg = buildCardSvg(card, index, tone);
    const encoded = encodeURIComponent(svg);
    return `<article class="cardnews-preview-item">
      <img src="data:image/svg+xml;charset=utf-8,${encoded}" alt="카드뉴스 ${index + 1}" />
      <div class="cardnews-preview-actions">
        <strong>${index + 1}/${cards.length}</strong>
        <button class="btn btn-outline" type="button" data-download-card="${index}">SVG 다운로드</button>
      </div>
    </article>`;
  }).join('');

  deck.querySelectorAll('[data-download-card]').forEach(button => {
    button.addEventListener('click', () => downloadCardSvg(cards[Number(button.dataset.downloadCard)], Number(button.dataset.downloadCard), tone));
  });
}

function parseCardsFromGeneratedText(text) {
  const source = String(text || '');
  const matches = [...source.matchAll(/\[슬라이드\s*(\d+)\s*:\s*([^\]]+)\]([\s\S]*?)(?=\n\[슬라이드\s*\d+\s*:|\n5\.\s*인스타그램|$)/g)];
  return matches.map(match => {
    const block = match[3] || '';
    return {
      title: cleanLine(match[2]),
      headline: extractField(block, 'Headline') || cleanLine(match[2]),
      body: extractField(block, 'Body'),
      highlight: extractField(block, 'Highlight'),
      insight: extractField(block, 'Insight Content'),
      design: extractField(block, 'Design Guide')
    };
  });
}

function normalizeCards(cards, values) {
  const targetCount = Number(values.cardCount || 8);
  const baseTitle = inferTitle(values.pressText);
  const fallback = [
    { title: '표지', headline: baseTitle, body: '인천대학교 RISE사업 성과 카드뉴스', highlight: '지역혁신의 현장' },
    { title: '왜 필요한가', headline: '변화는 현장에서 시작됩니다', body: '대학 교육과 지역 산업의 수요가 만날 때 실질적인 성과가 만들어집니다.', highlight: '교육과 산업의 거리 좁히기' },
    { title: '무엇을 했나', headline: '이번 사업의 핵심 활동', body: '프로그램, 참여자, 협력기관, 운영내용을 중심으로 정리합니다.', highlight: '운영내용을 한눈에' },
    { title: '성과', headline: '성과는 숫자와 변화로 남습니다', body: '참여인원, 만족도, 협력기업, 교육성과 등 확인 가능한 성과를 배치합니다.', highlight: '근거 있는 성과' },
    { title: '의미', headline: '단순한 행사가 아니라 연결의 시작', body: '학생은 현장을 이해하고 기업은 미래 인재를 발견합니다.', highlight: '지역혁신은 연결에서 시작' },
    { title: '저장 포인트', headline: '기억할 3가지', body: '대학-지역-기업 연계, 실무형 인재양성, 성과 확산 기반 구축', highlight: '저장해둘 핵심 요약' },
    { title: '확산', headline: '성과는 공유될 때 커집니다', body: '성과를 기록하고 확산하면 다음 사업의 설득력 있는 근거가 됩니다.', highlight: '성과확산' },
    { title: '마무리', headline: 'RISE의 변화는 계속됩니다', body: 'AIMS와 함께 사업 운영과 성과관리를 더 체계적으로 이어갑니다.', highlight: '지속가능한 사업 운영' }
  ];
  const merged = [...cards, ...fallback].slice(0, targetCount);
  return merged.map((card, index) => ({
    title: card.title || `카드 ${index + 1}`,
    headline: card.headline || card.title || fallback[index]?.headline || baseTitle,
    body: card.body || fallback[index]?.body || '',
    highlight: card.highlight || fallback[index]?.highlight || 'RISE 성과확산',
    insight: card.insight || '',
    design: card.design || getToneLabel(values.tone),
    index: index + 1,
    total: targetCount
  }));
}

function buildCardSvg(card, index, toneId) {
  const theme = THEME_MAP[toneId] || THEME_MAP['dark-premium'];
  const width = 1080;
  const height = 1350;
  const isCover = index === 0;
  const headlineLines = wrapText(card.headline, isCover ? 13 : 15).slice(0, isCover ? 4 : 3);
  const bodyLines = wrapText(card.body, 24).slice(0, 7);
  const highlightLines = wrapText(card.highlight, 16).slice(0, 3);
  const titleEsc = escapeXml(card.title);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.bg}"/><stop offset="1" stop-color="${theme.bg2}"/></linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#000" flood-opacity="0.22"/></filter>
    </defs>
    <rect width="1080" height="1350" fill="url(#bg)"/>
    <circle cx="880" cy="140" r="220" fill="${theme.accent}" opacity="0.09"/>
    <circle cx="120" cy="1190" r="260" fill="${theme.accent}" opacity="0.07"/>
    <rect x="70" y="70" width="940" height="1210" rx="44" fill="${toneId === 'white-minimal' ? '#ffffff' : 'rgba(255,255,255,0.06)'}" stroke="${theme.line}" stroke-width="3" filter="url(#shadow)"/>
    <text x="90" y="126" font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="34" font-weight="900" fill="${theme.accent}">${String(index + 1).padStart(2, '0')}/${card.total}</text>
    <text x="990" y="126" text-anchor="end" font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="28" font-weight="800" fill="${theme.sub}">AIMS CARD NEWS</text>
    <line x1="90" y1="170" x2="990" y2="170" stroke="${theme.line}" stroke-width="3" opacity="0.7"/>
    <text x="90" y="240" font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="32" font-weight="900" fill="${theme.accent}">${titleEsc}</text>
    ${headlineLines.map((line, i) => `<text x="90" y="${isCover ? 410 + i * 92 : 360 + i * 78}" font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="${isCover ? 74 : 62}" font-weight="950" fill="${theme.fg}">${escapeXml(line)}</text>`).join('')}
    <rect x="90" y="${isCover ? 810 : 670}" width="900" height="${isCover ? 210 : 260}" rx="28" fill="${toneId === 'white-minimal' ? '#eff6ff' : 'rgba(255,255,255,0.10)'}" stroke="${theme.line}" stroke-width="2"/>
    ${bodyLines.map((line, i) => `<text x="130" y="${(isCover ? 870 : 735) + i * 42}" font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="31" font-weight="650" fill="${theme.sub}">${escapeXml(line)}</text>`).join('')}
    <rect x="90" y="1060" width="900" height="140" rx="30" fill="${theme.accent}" opacity="${toneId === 'white-minimal' ? '0.16' : '0.95'}"/>
    ${highlightLines.map((line, i) => `<text x="130" y="${1120 + i * 38}" font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="34" font-weight="950" fill="${toneId === 'white-minimal' ? theme.fg : '#111827'}">${escapeXml(line)}</text>`).join('')}
    <text x="90" y="1240" font-family="Pretendard, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="24" font-weight="750" fill="${theme.sub}">인천대학교 RISE사업단 · AI 기반 성과확산</text>
  </svg>`;
}

function downloadCardSvg(card, index, tone) {
  const svg = buildCardSvg(card, index, tone);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AIMS_cardnews_${String(index + 1).padStart(2, '0')}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function extractField(block, field) {
  const regex = new RegExp(`-\\s*${field}\\s*:\\s*([\\s\\S]*?)(?=\\n-\\s*(Design Guide|Headline|Body|Highlight|Insight Content)\\s*:|$)`, 'i');
  const match = String(block || '').match(regex);
  return match ? cleanLine(match[1]) : '';
}

function cleanLine(value) {
  return String(value || '').replace(/\n+/g, ' ').replace(/^[-•\s]+/, '').trim();
}

function wrapText(text, maxChars) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let current = '';
  words.forEach(word => {
    const next = current ? `${current} ${word}` : word;
    if ([...next].length > maxChars && current) {
      lines.push(current);
      current = word;
    } else current = next;
  });
  if (current) lines.push(current);
  return lines.length ? lines : [''];
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
- 본문: ${title}를 통해 인천대학교 RISE사업이 만들어가는 지역혁신의 현장을 소개합니다.
- 저장/공유 유도 문구: 나중에 보고자료나 성과정리 때 다시 볼 수 있도록 저장해두세요.
- 해시태그: #인천대학교 #RISE사업 #지역혁신 #인재양성 #성과확산

[참고]
${errorMessage ? `AI API 응답 오류: ${errorMessage}` : 'OPENAI_API_KEY 미설정 또는 API 오류 시 표시되는 기본 초안입니다.'}`;
}

function inferTitle(text) {
  const firstLine = String(text || '').split('\n').map(line => line.trim()).find(Boolean) || 'RISE 성과';
  return firstLine.length > 28 ? `${firstLine.slice(0, 28)}...` : firstLine;
}

function getToneLabel(tone) { return TONES.find(item => item.id === tone)?.label || '다크 프리미엄'; }
function escapeXml(value) { return String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }

function ensureCardnewsStyles() {
  if (document.querySelector('#cardnewsViewStyles')) return;
  const style = document.createElement('style');
  style.id = 'cardnewsViewStyles';
  style.textContent = `
    .cardnews-output{white-space:pre-wrap;line-height:1.7;min-height:360px}.cardnews-output-toolbar,.cardnews-deck-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px;color:#64748b;font-size:12px}.cardnews-deck-toolbar strong{font-size:14px;color:#0f172a}.cardnews-deck-empty{min-height:260px;border:1px dashed #cbd5e1;border-radius:18px;background:#f8fafc;display:grid;place-items:center;text-align:center;color:#64748b;padding:20px}.cardnews-deck-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}.cardnews-preview-item{border:1px solid #e2e8f0;border-radius:20px;background:#fff;padding:12px;box-shadow:0 10px 28px rgba(15,23,42,.08)}.cardnews-preview-item img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:16px;background:#111827}.cardnews-preview-actions{display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:8px}.cardnews-preview-actions strong{font-size:13px;color:#1d4ed8}.cardnews-image-preview{min-height:260px;border:1px dashed #cbd5e1;border-radius:16px;background:#f8fafc;display:grid;place-items:center;text-align:center;color:#64748b;padding:18px;margin-top:14px;overflow:hidden}.cardnews-image-preview img{max-width:100%;width:min(420px,100%);border-radius:18px;box-shadow:0 12px 36px rgba(15,23,42,.18)}.cardnews-loading{font-weight:900;color:#1d4ed8}.cardnews-image-fallback{max-width:520px;line-height:1.6}.cardnews-image-fallback strong{color:#dc2626}
  `;
  document.head.appendChild(style);
}
