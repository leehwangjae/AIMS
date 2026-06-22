import { createCard } from './components.js';
import { showToast } from './ui.js';

const FORM_ID = 'cardnewsForm';
const OUTPUT_ID = 'cardnewsOutput';
const PROGRESS_ID = 'cardnewsProgress';
const CAPTURE_ID = 'cardnewsCapture';
const CARDS_KEY = 'aims_latest_cardnews_cards';
const TEXT_KEY = 'aims_latest_cardnews_text';
const PROJECT_KEY = 'aims_latest_cardnews_project';

let currentStep = 1;
let currentIndex = 0;
let currentTone = 'inu-brand';
let currentDesignType = 'official-report';
let currentImageMode = 'ai-image';
let currentCards = [];
let sourceFileName = '';
let sourceFileText = '';

const TONES = [
  { id: 'inu-brand', label: '인천대 브랜드', desc: 'INU Navy + Blue' },
  { id: 'dark-premium', label: '다크 프리미엄', desc: '#121212 + White + Gold' },
  { id: 'blue-saas', label: '블루 SaaS', desc: 'Navy + Blue + Cyan' },
  { id: 'white-minimal', label: '화이트 미니멀', desc: 'White + Navy + Line' },
  { id: 'green-rise', label: '그린 RISE', desc: 'Deep Green + Mint' },
  { id: 'gold-impact', label: '골드 임팩트', desc: 'Charcoal + Gold' }
];

const DESIGN_TYPES = [
  { id: 'official-report', label: '공식 보고형', desc: '정제된 행정·성과보고형' },
  { id: 'premium-pr', label: '프리미엄 홍보형', desc: '행사·성과 확산형' },
  { id: 'infographic', label: '인포그래픽형', desc: '수치·성과 강조형' },
  { id: 'photo-centered', label: '사진 중심형', desc: '행사 사진·현장감 중심' },
  { id: 'research-result', label: '연구성과형', desc: '기술·연구·실험실 중심' },
  { id: 'interview', label: '인터뷰형', desc: '참여자 메시지 중심' }
];

const THEME = {
  'inu-brand': { bg: 'linear-gradient(135deg,#001f4e,#0066b3)', fg: '#fff', sub: '#dbeafe', accent: '#8fd3ff', panel: 'rgba(255,255,255,.13)' },
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
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">AI Card News Studio</div>
        <h2 class="page-title">AI 카드뉴스 제작</h2>
        <p class="page-desc">보도자료 업로드부터 콘텐츠 요약, 디자인 설정, 초안 확인·수정, 최종 저장 및 다운로드까지 단계별로 제작합니다.</p>
      </div>
    </section>
    ${createCard({ title: '제작 단계', content: wizardHtml() })}
    <div id="cardnewsStepBody"></div>
  `;
  renderStep();
}

function wizardHtml() {
  return `<div class="cn-wizard">
    ${['콘텐츠 요약', '디자인 설정', '초안 확인·수정', '저장 및 다운로드'].map((label, i) => `<button type="button" class="cn-step ${currentStep === i + 1 ? 'on' : ''}" data-step="${i + 1}"><span>${i + 1}</span>${label}</button>`).join('')}
  </div>`;
}

function renderStep() {
  const body = document.querySelector('#cardnewsStepBody');
  if (!body) return;
  if (currentStep === 1) body.innerHTML = createCard({ title: '1단계. 콘텐츠 요약', content: stepOneHtml() });
  if (currentStep === 2) body.innerHTML = createCard({ title: '2단계. 디자인 설정', content: stepTwoHtml() });
  if (currentStep === 3) body.innerHTML = createCard({ title: '3단계. 초안 확인·수정', content: stepThreeHtml() });
  if (currentStep === 4) body.innerHTML = createCard({ title: '4단계. 최종 저장 및 다운로드', content: stepFourHtml() });
  bindStepEvents();
  renderEditor();
  updateWizard();
}

function stepOneHtml() {
  return `<form id="${FORM_ID}" class="form-grid">
    <label class="form-field full"><span>보도자료 업로드 · HWP / PDF / DOCX / TXT</span><input name="pressFile" type="file" accept=".hwp,.hwpx,.pdf,.doc,.docx,.txt" /><small id="fileStatus">파일 미선택 · PDF/HWP/DOCX는 현재 파일명 기반으로 저장되며, 본문은 아래 텍스트 입력을 함께 사용합니다.</small></label>
    <label class="form-field"><span>카드 장수 선택</span><select name="cardCount"><option value="5">5장</option><option value="7" selected>7장</option><option value="10">10장</option><option value="custom">직접 입력</option></select></label>
    <label class="form-field"><span>직접 입력</span><input name="customCardCount" type="number" min="3" max="15" placeholder="예: 8" /></label>
    <label class="form-field"><span>생성 목적</span><select name="purpose"><option value="홍보">홍보</option><option value="안내">안내</option><option value="성과공유" selected>성과공유</option><option value="행사소개">행사소개</option></select></label>
    <label class="form-field"><span>타겟</span><input name="targetAudience" type="text" value="재학생, 교직원, 지역기업, 지자체 관계자" /></label>
    <label class="form-field full"><span>보도자료 본문</span><textarea name="pressText" rows="12" placeholder="보도자료 전문 또는 핵심 내용을 붙여넣으세요.">${sourceFileText || ''}</textarea></label>
    <div class="form-actions"><button class="btn btn-primary" type="submit">AI 요약 생성</button><button class="btn btn-outline" type="button" id="addCardBtn">카드 추가</button><button class="btn btn-outline" type="button" id="regenSummaryBtn">다시 생성</button><button class="btn btn-primary" type="button" id="approveStepOne">다음: 디자인 설정</button></div>
    <div class="cn-summary-panel full"><div><b>AI 생성 결과</b><p>카드 장수에 맞춰 메인 화면 문구, 타이틀, 본문 요약, 카드별 핵심 메시지, 최종 메시지/CTA를 생성합니다.</p></div><div id="summaryList" class="cn-summary-list">${summaryListHtml()}</div></div>
  </form>`;
}

function stepTwoHtml() {
  return `<div class="form-grid">
    <div class="form-field full"><span>디자인 유형 선택 · 우수사례 18건 기준 디자인별 구분</span><div class="cn-choice-grid">${DESIGN_TYPES.map(type => `<button class="cn-choice ${currentDesignType === type.id ? 'on' : ''}" data-design="${type.id}" type="button"><b>${type.label}</b><small>${type.desc}</small></button>`).join('')}</div></div>
    <label class="form-field"><span>색상 설정</span><select id="toneSelect">${TONES.map(t => `<option value="${t.id}" ${currentTone === t.id ? 'selected' : ''}>${t.label} · ${t.desc}</option>`).join('')}</select></label>
    <label class="form-field"><span>이미지 설정</span><select id="imageMode"><option value="ai-image" ${currentImageMode === 'ai-image' ? 'selected' : ''}>AI 이미지 생성</option><option value="upload" ${currentImageMode === 'upload' ? 'selected' : ''}>사용자 PNG/JPG 업로드</option><option value="default" ${currentImageMode === 'default' ? 'selected' : ''}>기본 이미지 사용</option><option value="graphic" ${currentImageMode === 'graphic' ? 'selected' : ''}>이미지 없이 그래픽 중심 제작</option></select></label>
    <label class="form-field"><span>사용자 이미지 업로드</span><input id="userImageUpload" type="file" accept="image/png,image/jpeg" multiple /></label>
    <label class="form-field"><span>배경 설정</span><select id="backgroundType"><option>AI 추천 배경</option><option>캠퍼스</option><option>송도</option><option>연구실</option><option>행사 사진</option><option>추상 그래픽</option></select></label>
    <label class="form-field full cn-check"><input id="bestPractice" type="checkbox" checked /> 인천대 우수 카드뉴스 스타일 참고</label>
    <div class="cn-info full">우수사례 반영 시 제목 스타일, 문장 길이, 정보 배치, 컬러 사용, CTA 패턴, 레이아웃 구성을 참고하여 생성합니다.</div>
    <div class="form-actions"><button class="btn btn-outline" type="button" id="backStepOne">이전</button><button class="btn btn-primary" type="button" id="generateDraftBtn">시안 생성</button><button class="btn btn-primary" type="button" id="goStepThree">다음: 초안 확인·수정</button></div>
  </div>`;
}

function stepThreeHtml() {
  return `<div class="cn-review-grid">
    <aside class="cn-thumbnails"><div class="cn-thumb-title">카드 목록</div><div id="thumbnailList">${thumbnailHtml()}</div><button class="btn btn-outline" id="addCardFromReview" type="button">카드 추가</button></aside>
    <section class="cn-preview"><div class="cardnews-maker-head"><div><strong>선택 카드 미리보기</strong><span>1080×1350 기준 카드뉴스 화면입니다.</span></div><div id="${PROGRESS_ID}" class="cardnews-progress">대기 중</div></div><div class="cardnews-stage-wrap"><div id="${CAPTURE_ID}" class="cardnews-stage"><div id="cardnewsSlide" class="cardnews-slide"></div></div></div></section>
    <aside class="cardnews-side-editor"><div class="cardnews-nav"><button class="btn btn-outline" id="prevCard" type="button">이전</button><strong id="cardCounter">0/0</strong><button class="btn btn-primary" id="nextCard" type="button">다음</button></div><label>제목<textarea id="editorTitle" rows="3"></textarea></label><label>본문<textarea id="editorBody" rows="5"></textarea></label><label>강조문구<textarea id="editorHighlight" rows="2"></textarea></label><label>배경톤<select id="editorTone">${TONES.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}</select></label><label>레이아웃<select id="layoutSelect"><option value="standard">표준형</option><option value="headline">타이틀 강조형</option><option value="insight">인사이트형</option></select></label><div class="form-actions stack"><button class="btn btn-primary" id="applyCardEdit" type="button">수정 저장</button><button class="btn btn-outline" id="regenCurrentCard" type="button">카드별 재생성</button><button class="btn btn-outline" id="regenAllCards" type="button">전체 재생성</button></div><div class="cn-checklist"><b>검수 체크리스트</b>${['오탈자 확인','로고 위치 확인','공식 컬러 적용 확인','이미지 저작권 확인','개인정보 포함 여부 확인'].map(x => `<label><input type="checkbox" /> ${x}</label>`).join('')}</div><button class="btn btn-primary full-btn" id="goStepFour" type="button">최종 저장 및 다운로드</button></aside>
  </div>`;
}

function stepFourHtml() {
  return `<div class="form-grid">
    <div class="cn-save-box full"><b>저장 위치</b><p>AIMS 내부 DB 저장 구조로 관리합니다. 현재 MVP에서는 브라우저 LocalStorage에 임시 저장되며, 향후 Supabase DB와 연결합니다.</p></div>
    <div class="cn-meta-grid full">${['원본 보도자료','카드뉴스 최종 PNG/JPG','PDF','PPT 편집본','썸네일 이미지','생성일','생성자','카드 수','디자인 유형','최종 승인 여부'].map(item => `<div>${item}</div>`).join('')}</div>
    <label class="form-field full cn-check"><input id="finalApproved" type="checkbox" /> 최종 승인 완료</label>
    <div class="form-actions"><button class="btn btn-outline" type="button" id="backStepThree">이전</button><button class="btn btn-primary" type="button" id="saveProjectBtn">최종 확정</button><button class="btn btn-outline" type="button" id="downloadCurrentPng">PNG 다운로드</button><button class="btn btn-outline" type="button" id="downloadAllPng">전체 PNG 다운로드</button><button class="btn btn-outline" type="button" id="downloadPdfBtn">PDF 다운로드</button><button class="btn btn-outline" type="button" id="downloadPptBtn">PPT 다운로드</button></div>
    <pre id="${OUTPUT_ID}" class="draft-output cardnews-output full">${localStorage.getItem(TEXT_KEY) || '생성된 카드뉴스 원고가 여기에 표시됩니다.'}</pre>
  </div>`;
}

function bindStepEvents() {
  document.querySelectorAll('[data-step]').forEach(btn => btn.addEventListener('click', () => { currentStep = Number(btn.dataset.step); renderStep(); }));
  const form = document.querySelector(`#${FORM_ID}`);
  if (form) {
    form.querySelector('[name="pressFile"]')?.addEventListener('change', handleFileSelect);
    form.addEventListener('submit', async event => { event.preventDefault(); await generateSummary(new FormData(form)); });
  }
  document.querySelector('#regenSummaryBtn')?.addEventListener('click', async () => { const f = document.querySelector(`#${FORM_ID}`); if (f) await generateSummary(new FormData(f)); });
  document.querySelector('#approveStepOne')?.addEventListener('click', () => { currentStep = 2; renderStep(); });
  document.querySelector('#backStepOne')?.addEventListener('click', () => { currentStep = 1; renderStep(); });
  document.querySelector('#goStepThree')?.addEventListener('click', () => { currentStep = 3; renderStep(); });
  document.querySelector('#goStepFour')?.addEventListener('click', () => { currentStep = 4; renderStep(); });
  document.querySelector('#backStepThree')?.addEventListener('click', () => { currentStep = 3; renderStep(); });
  document.querySelector('#addCardBtn')?.addEventListener('click', addCard);
  document.querySelector('#addCardFromReview')?.addEventListener('click', addCard);
  document.querySelectorAll('[data-design]').forEach(btn => btn.addEventListener('click', () => { currentDesignType = btn.dataset.design; renderStep(); }));
  document.querySelector('#toneSelect')?.addEventListener('change', e => { currentTone = e.target.value; currentCards = currentCards.map(c => ({ ...c, theme: currentTone })); saveCards(); });
  document.querySelector('#imageMode')?.addEventListener('change', e => { currentImageMode = e.target.value; });
  document.querySelector('#userImageUpload')?.addEventListener('change', handleImageUpload);
  document.querySelector('#generateDraftBtn')?.addEventListener('click', async () => { await generateImages(currentCards, currentTone); currentStep = 3; renderStep(); });
  document.querySelector('#prevCard')?.addEventListener('click', () => { currentIndex = Math.max(0, currentIndex - 1); renderEditor(); renderThumbActive(); });
  document.querySelector('#nextCard')?.addEventListener('click', () => { currentIndex = Math.min(currentCards.length - 1, currentIndex + 1); renderEditor(); renderThumbActive(); });
  document.querySelector('#applyCardEdit')?.addEventListener('click', applyEdit);
  document.querySelector('#regenCurrentCard')?.addEventListener('click', async () => { if (currentCards[currentIndex]) await generateImages([currentCards[currentIndex]], currentTone, currentIndex); });
  document.querySelector('#regenAllCards')?.addEventListener('click', async () => { await generateImages(currentCards, currentTone); });
  document.querySelector('#saveProjectBtn')?.addEventListener('click', saveProject);
  document.querySelector('#downloadCurrentPng')?.addEventListener('click', () => downloadPng(currentIndex));
  document.querySelector('#downloadAllPng')?.addEventListener('click', downloadAllPng);
  document.querySelector('#downloadPdfBtn')?.addEventListener('click', () => showToast('PDF 다운로드는 다음 단계에서 자동 변환 기능으로 연결됩니다.'));
  document.querySelector('#downloadPptBtn')?.addEventListener('click', () => showToast('PPT 편집본 다운로드는 다음 단계에서 PPTX 생성 기능으로 연결됩니다.'));
  document.querySelector('#copyCardnewsText')?.addEventListener('click', async () => { const text = localStorage.getItem(TEXT_KEY) || ''; await navigator.clipboard.writeText(text); showToast('원고가 복사되었습니다.'); });
  document.querySelectorAll('[data-thumb]').forEach(btn => btn.addEventListener('click', () => { currentIndex = Number(btn.dataset.thumb); renderEditor(); renderThumbActive(); }));
}

async function handleFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  sourceFileName = file.name;
  const status = document.querySelector('#fileStatus');
  if (status) status.textContent = `${file.name} 업로드됨`;
  if (file.name.toLowerCase().endsWith('.txt')) {
    sourceFileText = await file.text();
    const textarea = document.querySelector(`#${FORM_ID} [name="pressText"]`);
    if (textarea) textarea.value = sourceFileText;
  } else {
    showToast('PDF/HWP/DOCX 본문 추출은 다음 단계에서 서버 파서로 연결됩니다. 현재는 본문 텍스트를 함께 입력해 주세요.');
  }
}

async function handleImageUpload(event) {
  const files = [...(event.target.files || [])];
  if (!files.length || !currentCards.length) return;
  for (let i = 0; i < files.length && i < currentCards.length; i += 1) {
    const dataUrl = await fileToDataUrl(files[i]);
    currentCards[i].imageData = dataUrl;
  }
  saveCards();
  showToast('업로드 이미지가 카드에 반영되었습니다.');
}
function fileToDataUrl(file) { return new Promise(resolve => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(file); }); }

async function generateSummary(formData) {
  const values = Object.fromEntries(formData.entries());
  const cardCount = values.cardCount === 'custom' ? values.customCardCount || 7 : values.cardCount || 7;
  if (!values.pressText?.trim()) return showToast('보도자료 본문을 입력해 주세요.');
  const payload = { ...values, cardCount };
  setProgress('1/4 콘텐츠 요약 생성 중');
  try {
    const response = await fetch('/api/generate-cardnews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    const text = result?.ok && result.text ? result.text : fallbackText(payload, result?.message);
    localStorage.setItem(TEXT_KEY, text);
    currentCards = normalizeCards(parseCards(text), payload).map(c => ({ ...c, theme: currentTone, designType: currentDesignType, visualPrompt: buildVisualPrompt(c, currentTone) }));
    currentIndex = 0;
    saveCards();
    setProgress('콘텐츠 요약 완료');
    renderStep();
    showToast('AI 요약이 생성되었습니다. 카드별 문구를 확인해 주세요.');
  } catch (error) {
    const text = fallbackText(payload, error?.message);
    localStorage.setItem(TEXT_KEY, text);
    currentCards = normalizeCards(parseCards(text), payload).map(c => ({ ...c, theme: currentTone, designType: currentDesignType, visualPrompt: buildVisualPrompt(c, currentTone) }));
    saveCards();
    renderStep();
  }
}

async function generateImages(cards, tone, startIndex = 0) {
  if (!cards.length) return showToast('먼저 콘텐츠 요약을 생성해 주세요.');
  if (currentImageMode === 'graphic' || currentImageMode === 'default') return showToast('그래픽/기본 이미지 모드로 설정되어 AI 이미지 생성을 건너뜁니다.');
  setProgress('이미지 생성 중');
  for (let i = 0; i < cards.length; i += 1) {
    const targetIndex = cards.length === 1 ? startIndex : i;
    const card = cards[i];
    try {
      setProgress(`이미지 생성 중 · ${targetIndex + 1}/${currentCards.length}`);
      const result = await requestImage(card.visualPrompt || buildVisualPrompt(card, tone));
      if (result?.ok && result.image) currentCards[targetIndex] = { ...currentCards[targetIndex], imageData: result.image, imageProvider: result.provider || 'AI Image API' };
      else currentCards[targetIndex] = { ...currentCards[targetIndex], imageError: result?.message || '이미지 생성 실패' };
    } catch (error) {
      currentCards[targetIndex] = { ...currentCards[targetIndex], imageError: error?.message || '이미지 생성 실패' };
    }
    saveCards();
    renderEditor();
  }
  setProgress('시안 생성 완료');
  showToast('시안 생성이 완료되었습니다.');
}
async function requestImage(prompt) { const r = await fetch('/api/generate-cardnews-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) }); return r.json(); }

function renderEditor() {
  const slide = document.querySelector('#cardnewsSlide');
  if (!slide) return;
  if (!currentCards.length) {
    slide.innerHTML = `<div class="cn-empty">보도자료를 업로드하고 AI 요약을 생성하면 카드뉴스가 표시됩니다.</div>`;
    document.querySelector('#cardCounter') && (document.querySelector('#cardCounter').textContent = '0/0');
    return;
  }
  const card = currentCards[currentIndex];
  const themeId = card.theme || currentTone;
  const t = THEME[themeId] || THEME['inu-brand'];
  slide.style.background = t.bg; slide.style.color = t.fg;
  slide.innerHTML = `<div class="cn-visual" style="${card.imageData ? `background-image:url(${card.imageData});` : ''}"><span>${card.imageData ? '' : designTypeLabel(card.designType || currentDesignType)}</span></div><div class="cn-top"><b>${String(currentIndex + 1).padStart(2, '0')}/${String(currentCards.length).padStart(2, '0')}</b><b>AIMS CARD NEWS</b></div><div class="cn-content"><div class="cn-tag" style="color:${t.accent}">${escapeHtml(card.title)}</div><h1>${escapeHtml(card.headline)}</h1><p>${escapeHtml(card.body)}</p><div class="cn-highlight" style="background:${t.panel};border-color:${t.accent};color:${t.accent}">${escapeHtml(card.highlight)}</div><footer style="color:${t.sub}">인천대학교 RISE사업단 · AI 기반 성과확산</footer></div>`;
  const counter = document.querySelector('#cardCounter'); if (counter) counter.textContent = `${currentIndex + 1}/${currentCards.length}`;
  const title = document.querySelector('#editorTitle'); if (title) title.value = card.headline || '';
  const body = document.querySelector('#editorBody'); if (body) body.value = card.body || '';
  const highlight = document.querySelector('#editorHighlight'); if (highlight) highlight.value = card.highlight || '';
  const tone = document.querySelector('#editorTone'); if (tone) tone.value = themeId;
  renderThumbActive();
}
function renderThumbActive() { document.querySelectorAll('[data-thumb]').forEach(btn => btn.classList.toggle('on', Number(btn.dataset.thumb) === currentIndex)); }
function thumbnailHtml() { return currentCards.length ? currentCards.map((c, i) => `<button type="button" class="cn-thumb ${i === currentIndex ? 'on' : ''}" data-thumb="${i}"><b>${i + 1}. ${escapeHtml(c.title)}</b><small>${escapeHtml(c.headline)}</small></button>`).join('') : '<div class="cn-empty-small">카드 없음</div>'; }
function summaryListHtml() { return currentCards.length ? currentCards.map((c, i) => `<div class="cn-summary-card"><b>${i + 1}. ${escapeHtml(c.title)}</b><p>${escapeHtml(c.headline)}</p><button type="button" data-del="${i}">삭제</button></div>`).join('') : '<div class="cn-empty-small">AI 요약 생성 후 카드별 메시지가 표시됩니다.</div>'; }
function applyEdit() { if (!currentCards.length) return; const c = currentCards[currentIndex]; currentCards[currentIndex] = { ...c, theme: document.querySelector('#editorTone').value, headline: document.querySelector('#editorTitle').value, body: document.querySelector('#editorBody').value, highlight: document.querySelector('#editorHighlight').value }; saveCards(); renderEditor(); showToast('수정사항이 저장되었습니다.'); }
function addCard() { currentCards.push({ title: '신규 카드', headline: '새로운 핵심 메시지', body: '본문 내용을 입력하세요.', highlight: '강조문구', theme: currentTone, designType: currentDesignType }); currentIndex = currentCards.length - 1; saveCards(); renderStep(); }
function saveProject() { const project = { sourceFileName, cards: currentCards, tone: currentTone, designType: currentDesignType, imageMode: currentImageMode, createdAt: new Date().toISOString(), cardCount: currentCards.length, approved: document.querySelector('#finalApproved')?.checked || false }; localStorage.setItem(PROJECT_KEY, JSON.stringify(project)); showToast('최종 카드뉴스 프로젝트가 저장되었습니다.'); }
function saveCards() { localStorage.setItem(CARDS_KEY, JSON.stringify(currentCards)); }
function updateWizard() { const wrap = document.querySelector('.cn-wizard'); if (wrap) wrap.innerHTML = wizardHtml().replace('<div class="cn-wizard">','').replace('</div>',''); }

async function loadHtml2Canvas() { if (window.html2canvas) return; await new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'; s.onload = resolve; s.onerror = reject; document.head.appendChild(s); }); }
async function downloadPng(index) { if (!currentCards.length) return showToast('다운로드할 카드가 없습니다.'); currentIndex = index; renderEditor(); await loadHtml2Canvas(); await document.fonts?.ready; const el = document.querySelector(`#${CAPTURE_ID}`); const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null }); const a = document.createElement('a'); a.download = `AIMS_cardnews_${String(index + 1).padStart(2, '0')}.png`; a.href = canvas.toDataURL('image/png'); a.click(); }
async function downloadAllPng() { if (!currentCards.length) return showToast('다운로드할 카드가 없습니다.'); for (let i = 0; i < currentCards.length; i += 1) { await downloadPng(i); await new Promise(r => setTimeout(r, 350)); } }

function parseCards(text) { return [...String(text || '').matchAll(/\[슬라이드\s*(\d+)\s*:\s*([^\]]+)\]([\s\S]*?)(?=\n\[슬라이드\s*\d+\s*:|\n5\.\s*인스타그램|$)/g)].map(m => { const block = m[3] || ''; return { title: clean(m[2]), headline: field(block, 'Headline') || clean(m[2]), body: field(block, 'Body'), highlight: field(block, 'Highlight') }; }); }
function normalizeCards(cards, values) { const count = Number(values.cardCount || 7); const base = inferTitle(values.pressText); const fallback = [['표지', base, '인천대학교 RISE사업 성과 카드뉴스', '지역혁신의 현장'], ['왜 필요한가', '변화는 현장에서 시작됩니다', '대학 교육과 지역 산업의 수요가 만날 때 실질적인 성과가 만들어집니다.', '교육과 산업의 거리 좁히기'], ['무엇을 했나', '이번 사업의 핵심 활동', '프로그램, 참여자, 협력기관, 운영내용을 중심으로 정리합니다.', '운영내용을 한눈에'], ['성과', '성과는 숫자와 변화로 남습니다', '참여인원, 만족도, 협력기업, 교육성과 등 확인 가능한 성과를 배치합니다.', '근거 있는 성과'], ['의미', '단순한 행사가 아니라 연결의 시작', '학생은 현장을 이해하고 기업은 미래 인재를 발견합니다.', '지역혁신은 연결에서 시작'], ['저장 포인트', '기억할 3가지', '대학-지역-기업 연계, 실무형 인재양성, 성과 확산 기반 구축', '저장해둘 핵심 요약'], ['마무리', 'RISE의 변화는 계속됩니다', 'AIMS와 함께 사업 운영과 성과관리를 더 체계적으로 이어갑니다.', '지속가능한 사업 운영']].map(([title, headline, body, highlight]) => ({ title, headline, body, highlight })); return [...cards, ...fallback].slice(0, count).map((c, i) => ({ title: c.title || fallback[i]?.title || `카드 ${i+1}`, headline: c.headline || fallback[i]?.headline || base, body: c.body || fallback[i]?.body || '', highlight: c.highlight || fallback[i]?.highlight || '핵심 메시지', index: i + 1, total: count })); }
function buildVisualPrompt(card, tone) { return `Create a premium vertical Instagram card news background image, 4:5 ratio, no text, no logo, no watermark. Theme: ${tone}. Design type: ${currentDesignType}. Topic: ${card.title}. Visual concept: ${card.headline}. Context: Incheon National University RISE project, regional innovation, students, industry collaboration, modern campus, public sector achievement, clean editorial style, high-end social media visual, enough empty space for Korean typography overlay.`; }
function field(block, name) { const m = String(block || '').match(new RegExp(`-\\s*${name}\\s*:\\s*([\\s\\S]*?)(?=\\n-\\s*(Design Guide|Headline|Body|Highlight|Insight Content)\\s*:|$)`, 'i')); return m ? clean(m[1]) : ''; }
function clean(v) { return String(v || '').replace(/\n+/g, ' ').replace(/^[-•\s]+/, '').trim(); }
function inferTitle(text) { const first = String(text || '').split('\n').map(v => v.trim()).find(Boolean) || 'RISE 성과'; return first.length > 28 ? `${first.slice(0, 28)}...` : first; }
function designTypeLabel(id) { return DESIGN_TYPES.find(d => d.id === id)?.label || 'AI VISUAL'; }
function fallbackText(values, error = '') { const title = inferTitle(values.pressText); return `4. 텍스트 중심 상세 슬라이드 구성\n[슬라이드 1: 표지]\n- Headline: ${title}, 왜 주목해야 할까요?\n- Body: 인천대학교 RISE사업 성과 카드뉴스\n- Highlight: 지역혁신의 현장\n[슬라이드 2: 왜 필요한가]\n- Headline: 변화는 현장에서 시작됩니다\n- Body: 대학 교육과 지역 산업의 수요가 만날 때 실질적인 성과가 만들어집니다.\n- Highlight: 교육과 산업의 거리 좁히기\n[슬라이드 3: 무엇을 했나]\n- Headline: 이번 사업의 핵심 활동\n- Body: 프로그램, 참여자, 협력기관, 운영내용을 중심으로 정리합니다.\n- Highlight: 운영내용을 한눈에\n[슬라이드 4: 성과]\n- Headline: 성과는 숫자와 변화로 남습니다\n- Body: 참여인원, 만족도, 협력기업, 교육성과 등 확인 가능한 성과를 배치합니다.\n- Highlight: 근거 있는 성과\n[슬라이드 5: 의미]\n- Headline: 단순한 행사가 아니라 연결의 시작\n- Body: 학생은 현장을 이해하고 기업은 미래 인재를 발견합니다.\n- Highlight: 지역혁신은 연결에서 시작\n${error ? `\n[오류 참고] ${error}` : ''}`; }
function setProgress(message) { const el = document.querySelector(`#${PROGRESS_ID}`); if (el) el.textContent = message; }
function escapeHtml(v) { return String(v || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); }
function ensureStyles() { if (document.querySelector('#cardnewsWizardStyles')) return; const style = document.createElement('style'); style.id = 'cardnewsWizardStyles'; style.textContent = `.cn-wizard{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.cn-step{border:1px solid #dbe3ef;background:#fff;border-radius:16px;padding:14px;font-weight:900;color:#64748b;text-align:left}.cn-step span{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:999px;background:#eef2ff;color:#4f46e5;margin-right:8px}.cn-step.on{border-color:#4f46e5;background:#eef2ff;color:#1e1b4b}.cn-summary-panel,.cn-save-box{border:1px solid #dbe3ef;border-radius:18px;background:#f8fafc;padding:16px}.cn-summary-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:12px}.cn-summary-card,.cn-empty-small{border:1px solid #e2e8f0;background:#fff;border-radius:14px;padding:12px;font-size:12px}.cn-summary-card b{display:block;color:#0f172a}.cn-summary-card p{color:#64748b}.cn-choice-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.cn-choice{border:1px solid #dbe3ef;border-radius:16px;background:#fff;padding:14px;text-align:left}.cn-choice.on{border-color:#4f46e5;background:#eef2ff}.cn-choice b{display:block}.cn-choice small{color:#64748b}.cn-info{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:14px;padding:14px;color:#475569}.cn-check{display:flex;align-items:center;gap:8px}.full{grid-column:1/-1}.stack{flex-direction:column;align-items:stretch}.full-btn{width:100%;margin-top:12px}.cn-review-grid{display:grid;grid-template-columns:220px minmax(360px,1fr) 330px;gap:20px}.cn-thumbnails,.cardnews-side-editor{border:1px solid #e2e8f0;border-radius:18px;background:#fff;padding:16px}.cn-thumb-title{font-weight:900;margin-bottom:10px}.cn-thumb{width:100%;border:1px solid #e2e8f0;border-radius:12px;padding:10px;background:#fff;text-align:left;margin-bottom:8px}.cn-thumb.on{border-color:#4f46e5;background:#eef2ff}.cn-thumb b,.cn-thumb small{display:block}.cn-thumb small{color:#64748b;margin-top:4px}.cardnews-maker-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;color:#64748b;font-size:12px}.cardnews-maker-head strong{display:block;color:#0f172a;font-size:15px}.cardnews-progress{font-weight:900;color:#1d4ed8}.cardnews-stage-wrap{background:#f8fafc;border:1px solid #dbe3ef;border-radius:20px;padding:20px;display:flex;justify-content:center}.cardnews-stage{width:min(440px,100%);aspect-ratio:4/5;border-radius:28px;overflow:hidden;box-shadow:0 22px 55px rgba(15,23,42,.18)}.cardnews-slide{position:relative;width:100%;height:100%;padding:34px;box-sizing:border-box;overflow:hidden}.cn-empty{display:grid;place-items:center;height:100%;background:#f1f5f9;color:#64748b;font-weight:900;text-align:center;padding:30px}.cn-visual{position:absolute;inset:0 0 auto 0;height:42%;background-size:cover;background-position:center;opacity:.30;background-color:rgba(255,255,255,.16);display:flex;align-items:center;padding-left:38px;font-weight:950;font-size:28px}.cn-top{position:relative;z-index:2;display:flex;justify-content:space-between;font-size:13px}.cn-content{position:relative;z-index:2;height:100%;display:flex;flex-direction:column}.cn-tag{margin-top:44%;font-weight:950;font-size:17px}.cn-content h1{font-size:42px;line-height:1.12;margin:15px 0 0;font-weight:950;word-break:keep-all}.cn-content p{font-size:18px;line-height:1.55;margin:18px 0 0;font-weight:700;word-break:keep-all}.cn-highlight{margin-top:auto;border:2px solid;border-radius:22px;padding:18px;font-size:24px;line-height:1.2;font-weight:950;word-break:keep-all}.cn-content footer{font-size:12px;font-weight:800;margin-top:16px}.cardnews-side-editor label{display:block;font-size:12px;font-weight:900;color:#64748b;margin:12px 0}.cardnews-side-editor textarea,.cardnews-side-editor select{width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:10px;font-size:13px}.cardnews-nav{display:flex;align-items:center;justify-content:space-between;gap:10px}.cardnews-nav strong{font-size:15px;color:#1d4ed8}.cn-checklist{border-top:1px solid #e2e8f0;margin-top:14px;padding-top:14px}.cn-checklist b,.cn-checklist label{display:block;margin:8px 0;color:#334155}.cn-meta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}.cn-meta-grid div{border:1px solid #e2e8f0;background:#fff;border-radius:12px;padding:12px;font-weight:800;color:#334155}.cardnews-output{white-space:pre-wrap;line-height:1.7;min-height:240px}@media(max-width:1100px){.cn-review-grid{grid-template-columns:1fr}.cn-wizard{grid-template-columns:1fr 1fr}.cardnews-side-editor{order:-1}}`; document.head.appendChild(style); }
