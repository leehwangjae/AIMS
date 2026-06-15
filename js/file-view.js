import { getCollection, upsertItem, removeItem } from './store.js';
import { createCard, createEmptyState, createTable } from './components.js';
import { validateRequired } from './form-utils.js';
import { showToast } from './ui.js';

const FILE_FORM_ID = 'documentUploadForm';
const FILE_TABLE_ID = 'documentTableContainer';
const SUMMARY_ID = 'documentSummaryContainer';
const TYPE_FILTER_ID = 'documentTypeFilter';
const UNIT_FILTER_ID = 'documentUnitFilter';
const SEARCH_ID = 'documentSearchInput';

const DOCUMENT_TYPES = ['전체', '사업계획서', '결과보고서', '증빙자료', '정산자료', '회의자료', '성과자료', '졸업생명단', '취업자명단', '기타'];
const UNIT_OPTIONS = [
  { id: 'all', name: '전체' },
  { id: '1-1', name: '1-1 전략산업' },
  { id: '1-2', name: '1-2 스마트모빌리티' },
  { id: '1-3', name: '1-3 혁신창업' },
  { id: '2-1-ai', name: '2-1 AI' },
  { id: 'common', name: '공통' }
];

export function renderFileView(targetSelector) {
  renderDocumentView(targetSelector);
}

export function renderDocumentView(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">Document Management</div>
        <h2 class="page-title">문서관리</h2>
        <p class="page-desc">사업계획서, 결과보고서, 증빙자료, 정산자료, 회의자료, 성과자료를 한 곳에서 업로드·조회·다운로드합니다.</p>
      </div>
    </section>

    ${createCard({ title: '문서 요약', content: `<div id="${SUMMARY_ID}"></div>` })}
    ${createCard({ title: '문서 등록', content: renderDocumentForm() })}
    ${createCard({ title: '문서 목록', content: renderDocumentFilters() + `<div id="${FILE_TABLE_ID}"></div>` })}
  `;

  bindDocumentForm();
  bindDocumentFilters();
  renderDocumentSummary();
  renderDocumentTable();
}

function renderDocumentForm() {
  return `
    <form id="${FILE_FORM_ID}" class="form-grid">
      <label class="form-field"><span>문서유형</span><select name="category">${DOCUMENT_TYPES.filter(type => type !== '전체').map(type => `<option value="${type}">${type}</option>`).join('')}</select></label>
      <label class="form-field"><span>단위과제</span><select name="unitTaskId">${UNIT_OPTIONS.filter(unit => unit.id !== 'all').map(unit => `<option value="${unit.id}">${unit.name}</option>`).join('')}</select></label>
      <label class="form-field"><span>프로그램명</span><input name="programName" type="text" placeholder="예: 바이오 재직자 교육" /></label>
      <label class="form-field"><span>문서명</span><input name="title" type="text" placeholder="예: 바이오 재직자 교육 결과보고서" /></label>
      <label class="form-field"><span>파일 선택</span><input name="file" type="file" /></label>
      <label class="form-field"><span>상태</span><select name="status"><option value="완료">완료</option><option value="미등록">미등록</option><option value="검토중">검토중</option></select></label>
      <label class="form-field full"><span>비고</span><input name="memo" type="text" placeholder="문서 설명, 증빙 메모 등" /></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">문서 등록</button><button class="btn btn-outline" type="button" id="downloadFileCsv">문서목록 CSV 다운로드</button></div>
    </form>
  `;
}

function renderDocumentFilters() {
  return `
    <div class="form-grid" style="margin-bottom:12px;">
      <label class="form-field"><span>문서유형</span><select id="${TYPE_FILTER_ID}">${DOCUMENT_TYPES.map(type => `<option value="${type}">${type}</option>`).join('')}</select></label>
      <label class="form-field"><span>단위과제</span><select id="${UNIT_FILTER_ID}">${UNIT_OPTIONS.map(unit => `<option value="${unit.id}">${unit.name}</option>`).join('')}</select></label>
      <label class="form-field"><span>검색</span><input id="${SEARCH_ID}" type="text" placeholder="문서명 또는 프로그램명 검색" /></label>
    </div>
  `;
}

function bindDocumentForm() {
  const form = document.querySelector(`#${FILE_FORM_ID}`);
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['category', 'unitTaskId', 'title']).valid) return showToast('필수 입력 항목을 확인해 주세요.');

    const fileInput = form.querySelector('input[type="file"]');
    const file = fileInput?.files?.[0];
    const fileDataUrl = file ? await readFileAsDataUrl(file) : '';
    const existingChecklist = findExistingChecklist(values);

    upsertItem('files', {
      id: existingChecklist?.id || `file_${Date.now()}`,
      category: values.category,
      unitTaskId: values.unitTaskId,
      programName: values.programName || existingChecklist?.programName || '',
      title: values.title,
      fileName: file?.name || existingChecklist?.fileName || '파일 미선택',
      fileSize: file ? `${Math.round(file.size / 1024)}KB` : existingChecklist?.fileSize || '-',
      fileType: file?.type || existingChecklist?.fileType || '',
      fileDataUrl: fileDataUrl || existingChecklist?.fileDataUrl || '',
      uploadedAt: file ? new Date().toISOString().slice(0, 10) : existingChecklist?.uploadedAt || '-',
      uploadedBy: getCurrentUserName(),
      status: values.status || (file ? '완료' : '미등록'),
      memo: values.memo || existingChecklist?.memo || ''
    });

    showToast(existingChecklist ? '기존 체크리스트 문서가 업데이트되었습니다.' : '문서가 등록되었습니다.');
    form.reset();
    renderDocumentSummary();
    renderDocumentTable();
  });

  document.querySelector('#downloadFileCsv')?.addEventListener('click', downloadDocumentCsv);
}

function bindDocumentFilters() {
  document.querySelector(`#${TYPE_FILTER_ID}`)?.addEventListener('change', renderDocumentTable);
  document.querySelector(`#${UNIT_FILTER_ID}`)?.addEventListener('change', renderDocumentTable);
  document.querySelector(`#${SEARCH_ID}`)?.addEventListener('input', renderDocumentTable);
}

function renderDocumentSummary() {
  const target = document.querySelector(`#${SUMMARY_ID}`);
  if (!target) return;
  const docs = getUnifiedDocuments();
  const total = docs.length;
  const plans = docs.filter(row => row.category === '사업계획서').length;
  const results = docs.filter(row => row.category === '결과보고서').length;
  const evidences = docs.filter(row => isEvidenceType(row.category)).length;
  const missing = docs.filter(row => getDocumentStatus(row) === '미등록').length;

  target.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;">
      ${renderSummaryCard(total, '전체문서')}
      ${renderSummaryCard(plans, '사업계획서')}
      ${renderSummaryCard(results, '결과보고서')}
      ${renderSummaryCard(evidences, '증빙자료')}
      ${renderSummaryCard(missing, '미등록 증빙')}
    </div>
  `;
}

function renderSummaryCard(value, label) {
  return `<div class="metric-card" style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:14px 16px;box-shadow:0 1px 4px rgba(0,0,0,.04);"><div class="metric-value" style="font-size:22px;font-weight:800;color:#185fa5;">${value}</div><div class="metric-label" style="font-size:12px;color:#6b7280;margin-top:4px;">${label}</div></div>`;
}

function renderDocumentTable() {
  const target = document.querySelector(`#${FILE_TABLE_ID}`);
  if (!target) return;
  const rows = getFilteredDocuments();
  if (!rows.length) return target.innerHTML = createEmptyState({ title: '등록된 문서 없음', description: '문서를 먼저 등록해 주세요.' });

  const displayRows = rows.map(row => ({
    category: row.category || '-',
    unitTaskId: row.unitTaskId || '-',
    programName: row.programName || '-',
    title: row.title || '-',
    status: getDocumentStatus(row),
    fileName: row.fileName || '-',
    uploadedAt: row.uploadedAt || row.createdAt?.slice?.(0, 10) || '-',
    uploadedBy: row.uploadedBy || row.createdBy || '-',
    download: row.fileDataUrl ? `<button class="btn btn-outline" type="button" data-download-doc="${row.id}">다운로드</button>` : '파일없음'
  }));

  target.innerHTML = `
    ${createTable({ columns: [
      { key: 'category', label: '문서유형' },
      { key: 'unitTaskId', label: '단위과제' },
      { key: 'programName', label: '프로그램' },
      { key: 'title', label: '문서명' },
      { key: 'status', label: '상태' },
      { key: 'fileName', label: '파일명' },
      { key: 'uploadedAt', label: '업로드일' },
      { key: 'uploadedBy', label: '업로드자' },
      { key: 'download', label: '다운로드' }
    ], rows: displayRows })}
    <div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestFile" type="button">최근 등록 문서 삭제</button></div>
  `;

  target.querySelectorAll('[data-download-doc]').forEach(button => {
    button.addEventListener('click', () => downloadDocument(button.dataset.downloadDoc));
  });

  document.querySelector('#deleteLatestFile')?.addEventListener('click', () => {
    const latest = getCollection('files').at(-1);
    if (!latest) return;
    removeItem('files', latest.id);
    showToast('최근 등록 문서가 삭제되었습니다.');
    renderDocumentSummary();
    renderDocumentTable();
  });
}

function getUnifiedDocuments() {
  const files = getCollection('files').map(row => normalizeFileDocument(row));
  const reportDocs = getCollection('reports').map(row => normalizeReportDocument(row));
  const fileReportKeys = new Set(files.map(row => `${row.category}|${row.title}`));
  return [...files, ...reportDocs.filter(row => !fileReportKeys.has(`${row.category}|${row.title}`))];
}

function getFilteredDocuments() {
  const selectedType = document.querySelector(`#${TYPE_FILTER_ID}`)?.value || '전체';
  const selectedUnit = document.querySelector(`#${UNIT_FILTER_ID}`)?.value || 'all';
  const keyword = (document.querySelector(`#${SEARCH_ID}`)?.value || '').trim().toLowerCase();

  return getUnifiedDocuments()
    .filter(row => selectedType === '전체' || row.category === selectedType || (selectedType === '증빙자료' && isEvidenceType(row.category)))
    .filter(row => selectedUnit === 'all' || row.unitTaskId === selectedUnit)
    .filter(row => !keyword || `${row.title} ${row.programName} ${row.fileName}`.toLowerCase().includes(keyword));
}

function normalizeFileDocument(row) {
  return { ...row, category: normalizeCategory(row.category), status: row.status || inferStatus(row), uploadedBy: row.uploadedBy || '-' };
}

function normalizeReportDocument(row) {
  return { id: `report_${row.id || row.title}`, category: normalizeCategory(row.type || '성과자료'), unitTaskId: row.unitTaskId || 'common', programName: row.programName || '', title: row.title || '보고서', status: row.status || '작성중', fileName: row.fileName || '보고서센터 등록자료', fileSize: row.fileSize || '-', uploadedAt: row.createdAt?.slice?.(0, 10) || '-', uploadedBy: row.createdBy || '-', memo: row.memo || '', fileDataUrl: row.fileDataUrl || '' };
}

function normalizeCategory(category) {
  const value = category || '기타';
  if (value === 'KPI증빙' || value === '참석자명단' || value === '만족도조사' || value === '기타증빙') return '증빙자료';
  if (value === '정산자료') return '정산자료';
  if (value === '사업계획안') return '사업계획서';
  if (value === '결과보고') return '결과보고서';
  if (String(value).includes('보고')) return '성과자료';
  return value;
}

function isEvidenceType(category) {
  return ['증빙자료', '졸업생명단', '취업자명단', '참여기업', '만족도조사', '참석자명단', '기타증빙'].includes(category);
}

function getDocumentStatus(row) {
  if (row.status) return row.status;
  return inferStatus(row);
}

function inferStatus(row) {
  if (!row.fileName || row.fileName === '미등록' || row.fileName === '파일 미선택') return '미등록';
  if (row.fileName === '보고서센터 등록자료') return row.status || '작성중';
  return '완료';
}

function findExistingChecklist(values) {
  return getCollection('files').find(row => {
    const sameUnit = row.unitTaskId === values.unitTaskId;
    const sameProgram = (row.programName || '') === (values.programName || '');
    const sameCategory = normalizeCategory(row.category) === normalizeCategory(values.category);
    const isEmpty = !row.fileName || row.fileName === '미등록' || row.fileName === '파일 미선택';
    return sameUnit && sameProgram && sameCategory && isEmpty;
  });
}

function readFileAsDataUrl(file) {
  return new Promise(resolve => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function downloadDocument(documentId) {
  const doc = getUnifiedDocuments().find(row => row.id === documentId);
  if (!doc?.fileDataUrl) return showToast('다운로드 가능한 파일이 없습니다.');
  const link = document.createElement('a');
  link.href = doc.fileDataUrl;
  link.download = doc.fileName || `${doc.title}.download`;
  link.click();
}

function downloadDocumentCsv() {
  const rows = getFilteredDocuments();
  if (!rows.length) return showToast('다운로드할 문서 목록이 없습니다.');
  const header = ['문서유형', '단위과제', '프로그램', '문서명', '상태', '파일명', '크기', '업로드일', '업로드자', '비고'];
  const body = rows.map(row => [row.category, row.unitTaskId, row.programName, row.title, getDocumentStatus(row), row.fileName, row.fileSize, row.uploadedAt, row.uploadedBy, row.memo]);
  const csv = [header, ...body].map(cols => cols.map(value => `"${String(value || '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AIMS_문서목록_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function getCurrentUserName() {
  return document.querySelector('#userNameTop')?.textContent || '사용자';
}
