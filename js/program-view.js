import { getCollection, upsertItem, removeItem } from './store.js';
import { createCard, createEmptyState, createTable } from './components.js';
import { validateRequired, validateDateRange, validateNumber } from './form-utils.js';
import { showToast } from './ui.js';

const FORM_ID = 'programForm';
const TABLE_ID = 'programTableContainer';

export function renderProgramView(targetSelector) {
  const target = document.querySelector(targetSelector);

  if (!target) return;

  target.innerHTML = `
    ${createCard({
      title: '프로그램 등록',
      content: renderProgramForm()
    })}

    ${createCard({
      title: '프로그램 목록',
      content: `<div id="${TABLE_ID}"></div>`
    })}
  `;

  bindProgramForm();
  renderProgramTable();
}

function renderProgramForm() {
  return `
    <form id="${FORM_ID}" class="form-grid">
      <input type="hidden" name="id" />

      <label class="form-field">
        <span>프로그램명</span>
        <input name="name" type="text" placeholder="예: 재직자 교육 프로그램" />
      </label>

      <label class="form-field">
        <span>구분</span>
        <select name="type">
          <option value="교육">교육</option>
          <option value="세미나">세미나</option>
          <option value="기업지원">기업지원</option>
          <option value="산학협력">산학협력</option>
          <option value="기타">기타</option>
        </select>
      </label>

      <label class="form-field">
        <span>시작일</span>
        <input name="startDate" type="date" />
      </label>

      <label class="form-field">
        <span>종료일</span>
        <input name="endDate" type="date" />
      </label>

      <label class="form-field">
        <span>참여자 수</span>
        <input name="participants" type="number" min="0" value="0" />
      </label>

      <label class="form-field">
        <span>참여기업 수</span>
        <input name="companies" type="number" min="0" value="0" />
      </label>

      <label class="form-field">
        <span>예산</span>
        <input name="budget" type="number" min="0" value="0" />
      </label>

      <label class="form-field">
        <span>상태</span>
        <select name="status">
          <option value="PLANNED">계획</option>
          <option value="IN_PROGRESS">진행중</option>
          <option value="COMPLETED">완료</option>
        </select>
      </label>

      <div class="form-actions">
        <button class="btn btn-primary" type="submit">저장</button>
        <button class="btn btn-outline" type="reset">초기화</button>
      </div>
    </form>
  `;
}

function bindProgramForm() {
  const form = document.querySelector(`#${FORM_ID}`);

  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();

    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    const required = validateRequired(values, ['name', 'type', 'startDate', 'endDate', 'status']);

    if (!required.valid) {
      showToast('필수 입력 항목을 확인해 주세요.');
      return;
    }

    const dateCheck = validateDateRange(values.startDate, values.endDate);

    if (!dateCheck.valid) {
      showToast(dateCheck.message);
      return;
    }

    const participantsCheck = validateNumber(values.participants, { min: 0 });
    const companiesCheck = validateNumber(values.companies, { min: 0 });
    const budgetCheck = validateNumber(values.budget, { min: 0 });

    if (!participantsCheck.valid || !companiesCheck.valid || !budgetCheck.valid) {
      showToast('숫자 입력값을 확인해 주세요.');
      return;
    }

    const item = {
      id: values.id || `program_${Date.now()}`,
      projectId: 'project_001',
      name: values.name,
      type: values.type,
      startDate: values.startDate,
      endDate: values.endDate,
      participants: Number(values.participants),
      companies: Number(values.companies),
      budget: Number(values.budget),
      status: values.status
    };

    upsertItem('programs', item);
    showToast('프로그램이 저장되었습니다.');

    form.reset();
    renderProgramTable();
  });
}

function renderProgramTable() {
  const target = document.querySelector(`#${TABLE_ID}`);

  if (!target) return;

  const programs = getCollection('programs');

  if (!programs.length) {
    target.innerHTML = createEmptyState({
      title: '프로그램 없음',
      description: '등록된 프로그램이 없습니다.'
    });
    return;
  }

  target.innerHTML = `
    ${createTable({
      columns: [
        { key: 'name', label: '프로그램명' },
        { key: 'type', label: '구분' },
        { key: 'startDate', label: '시작일' },
        { key: 'endDate', label: '종료일' },
        { key: 'participants', label: '참여자' },
        { key: 'companies', label: '기업' },
        { key: 'budget', label: '예산' },
        { key: 'status', label: '상태' }
      ],
      rows: programs
    })}

    <div class="form-actions" style="margin-top:12px;">
      <button class="btn btn-outline" id="deleteLatestProgram" type="button">최근 등록 프로그램 삭제</button>
    </div>
  `;

  document.querySelector('#deleteLatestProgram')?.addEventListener('click', () => {
    const latest = getCollection('programs').at(-1);

    if (!latest) return;

    removeItem('programs', latest.id);
    showToast('최근 등록 프로그램이 삭제되었습니다.');
    renderProgramTable();
  });
}
