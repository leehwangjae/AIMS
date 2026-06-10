import { getCollection, upsertItem, removeItem } from './store.js';
import { createCard, createEmptyState, createTable } from './components.js';
import { validateRequired } from './form-utils.js';
import { showToast } from './ui.js';

const FILE_FORM_ID = 'fileUploadForm';
const FILE_TABLE_ID = 'fileTableContainer';

export function renderFileView(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">File Management</div>
        <h2 class="page-title">자료 업로드·다운로드</h2>
        <p class="page-desc">사업계획서, 결과보고서, 졸업생 명단, 증빙자료 등 주요 파일의 업로드 현황을 관리합니다.</p>
      </div>
    </section>

    ${createCard({ title: '자료 등록', content: renderFileForm() })}
    ${createCard({ title: '자료 목록', content: `<div id="${FILE_TABLE_ID}"></div>` })}
  `;

  bindFileForm();
  renderFileTable();
}

function renderFileForm() {
  return `
    <form id="${FILE_FORM_ID}" class="form-grid">
      <label class="form-field"><span>자료구분</span><select name="category"><option value="사업계획서">사업계획서</option><option value="결과보고서">결과보고서</option><option value="졸업생명단">졸업생명단</option><option value="취업자명단">취업자명단</option><option value="참여기업">참여기업</option><option value="KPI증빙">KPI증빙</option><option value="기타">기타</option></select></label>
      <label class="form-field"><span>단위과제</span><select name="unitTaskId"><option value="1-1">1-1 전략산업</option><option value="1-2">1-2 스마트모빌리티</option><option value="1-3">1-3 혁신창업</option><option value="2-1-ai">2-1 AI</option><option value="common">공통</option></select></label>
      <label class="form-field"><span>자료명</span><input name="title" type="text" placeholder="예: 1-1 졸업생 명단" /></label>
      <label class="form-field"><span>파일 선택</span><input name="file" type="file" /></label>
      <label class="form-field"><span>비고</span><input name="memo" type="text" placeholder="자료 설명" /></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">등록</button><button class="btn btn-outline" type="button" id="downloadFileCsv">목록 CSV 다운로드</button></div>
    </form>
  `;
}

function bindFileForm() {
  const form = document.querySelector(`#${FILE_FORM_ID}`);
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateRequired(values, ['category', 'unitTaskId', 'title']).valid) return showToast('필수 입력 항목을 확인해 주세요.');

    const fileInput = form.querySelector('input[type="file"]');
    const file = fileInput?.files?.[0];

    upsertItem('files', {
      id: `file_${Date.now()}`,
      category: values.category,
      unitTaskId: values.unitTaskId,
      title: values.title,
      fileName: file?.name || '파일 미선택',
      fileSize: file ? `${Math.round(file.size / 1024)}KB` : '-',
      uploadedAt: new Date().toISOString().slice(0, 10),
      memo: values.memo || ''
    });

    showToast('자료가 등록되었습니다.');
    form.reset();
    renderFileTable();
  });

  document.querySelector('#downloadFileCsv')?.addEventListener('click', downloadFileCsv);
}

function renderFileTable() {
  const target = document.querySelector(`#${FILE_TABLE_ID}`);
  if (!target) return;
  const rows = getCollection('files');
  if (!rows.length) return target.innerHTML = createEmptyState({ title: '등록된 자료 없음', description: '자료를 먼저 등록해 주세요.' });

  target.innerHTML = `
    ${createTable({ columns: [
      { key: 'category', label: '자료구분' },
      { key: 'unitTaskId', label: '단위과제' },
      { key: 'title', label: '자료명' },
      { key: 'fileName', label: '파일명' },
      { key: 'fileSize', label: '크기' },
      { key: 'uploadedAt', label: '등록일' },
      { key: 'memo', label: '비고' }
    ], rows })}
    <div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestFile" type="button">최근 등록 자료 삭제</button></div>
  `;

  document.querySelector('#deleteLatestFile')?.addEventListener('click', () => {
    const latest = getCollection('files').at(-1);
    if (!latest) return;
    removeItem('files', latest.id);
    showToast('최근 등록 자료가 삭제되었습니다.');
    renderFileTable();
  });
}

function downloadFileCsv() {
  const rows = getCollection('files');
  if (!rows.length) return showToast('다운로드할 자료 목록이 없습니다.');
  const header = ['자료구분', '단위과제', '자료명', '파일명', '크기', '등록일', '비고'];
  const body = rows.map(row => [row.category, row.unitTaskId, row.title, row.fileName, row.fileSize, row.uploadedAt, row.memo]);
  const csv = [header, ...body].map(cols => cols.map(value => `"${String(value || '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AIMS_자료목록_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
