import { getCollection, upsertItem, removeItem } from './store.js';
import { createCard, createEmptyState, createTable } from './components.js';
import { validateRequired, validateNumber } from './form-utils.js';
import { showToast } from './ui.js';

const STAFF_FORM_ID = 'leaveStaffForm';
const USE_FORM_ID = 'leaveUseForm';
const STAFF_TABLE_ID = 'leaveStaffTable';
const HISTORY_TABLE_ID = 'leaveHistoryTable';
const ACCRUAL_TABLE_ID = 'leaveAccrualTable';

export function renderAnnualLeaveView(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">Annual Leave</div>
        <h2 class="page-title">전담인력 연차관리</h2>
        <p class="page-desc">입사일 기준 월 만근 연차, 1년 도달 연차, 사용연차, 계약종료 예정자를 관리합니다.</p>
      </div>
    </section>

    ${createCard({ title: '전담인력 등록', content: renderStaffForm() })}
    ${createCard({ title: '연차 사용 등록', content: renderUseForm() })}
    ${createCard({ title: '전담인력 연차현황', content: `<div id="${STAFF_TABLE_ID}"></div>` })}
    ${createCard({ title: '연차 발생이력', content: `<div id="${ACCRUAL_TABLE_ID}"></div>` })}
    ${createCard({ title: '연차 사용이력', content: `<div id="${HISTORY_TABLE_ID}"></div>` })}
  `;

  bindStaffForm();
  bindUseForm();
  renderLeaveTables();
}

function renderStaffForm() {
  return `
    <form id="${STAFF_FORM_ID}" class="form-grid">
      <label class="form-field"><span>이름</span><input name="name" type="text" placeholder="예: 홍길동" /></label>
      <label class="form-field"><span>입사일/계약시작일</span><input name="startDate" type="date" /></label>
      <label class="form-field"><span>계약종료일</span><input name="endDate" type="date" /></label>
      <label class="form-field"><span>1년 도달 시 80% 이상 출근</span><select name="attendance80"><option value="N">미확인/미충족</option><option value="Y">충족</option></select></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">등록</button><button class="btn btn-outline" type="reset">초기화</button></div>
    </form>
  `;
}

function renderUseForm() {
  const staff = getCollection('leaveStaff');
  return `
    <form id="${USE_FORM_ID}" class="form-grid">
      <label class="form-field"><span>대상자</span><select name="staffId">${staff.map(item => `<option value="${item.id}">${item.name}</option>`).join('')}</select></label>
      <label class="form-field"><span>사용일자</span><input name="useDate" type="date" /></label>
      <label class="form-field"><span>사용일수</span><input name="days" type="number" min="0" step="0.5" value="1" /></label>
      <label class="form-field"><span>사유</span><input name="memo" type="text" placeholder="예: 연차휴가, 반차" /></label>
      <div class="form-actions"><button class="btn btn-primary" type="submit">사용 등록</button></div>
    </form>
  `;
}

function bindStaffForm() {
  const form = document.querySelector(`#${STAFF_FORM_ID}`);
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const required = validateRequired(values, ['name', 'startDate', 'endDate']);
    if (!required.valid) return showToast('필수 입력 항목을 확인해 주세요.');

    upsertItem('leaveStaff', {
      id: `staff_${Date.now()}`,
      name: values.name,
      startDate: values.startDate,
      endDate: values.endDate,
      attendance80: values.attendance80
    });

    showToast('전담인력이 등록되었습니다.');
    renderAnnualLeaveView('#contentContainer');
  });
}

function bindUseForm() {
  const form = document.querySelector(`#${USE_FORM_ID}`);
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const required = validateRequired(values, ['staffId', 'useDate', 'days']);
    const numberCheck = validateNumber(values.days, { min: 0.5 });
    if (!required.valid || !numberCheck.valid) return showToast('연차 사용 입력값을 확인해 주세요.');

    upsertItem('leaveUsage', {
      id: `leave_${Date.now()}`,
      staffId: values.staffId,
      useDate: values.useDate,
      days: Number(values.days),
      memo: values.memo || '연차사용'
    });

    showToast('연차 사용이 등록되었습니다.');
    renderAnnualLeaveView('#contentContainer');
  });
}

function renderLeaveTables() {
  renderStaffTable();
  renderAccrualTable();
  renderHistoryTable();
}

function renderStaffTable() {
  const target = document.querySelector(`#${STAFF_TABLE_ID}`);
  if (!target) return;
  const staff = getCollection('leaveStaff');
  if (!staff.length) return target.innerHTML = createEmptyState({ title: '등록된 전담인력 없음', description: '전담인력을 먼저 등록해 주세요.' });

  const rows = staff.map(item => {
    const accrued = calculateAccruedLeave(item);
    const used = getUsedLeave(item.id);
    const dday = getContractDday(item.endDate);
    return {
      name: item.name,
      startDate: item.startDate,
      endDate: item.endDate,
      dday: formatDday(dday),
      status: getContractStatus(dday),
      attendance80: item.attendance80 === 'Y' ? '충족' : '미확인/미충족',
      accrued,
      used,
      remaining: Math.max(accrued - used, 0)
    };
  });

  target.innerHTML = `
    ${createTable({ columns: [
      { key: 'name', label: '이름' },
      { key: 'startDate', label: '입사일' },
      { key: 'endDate', label: '계약종료일' },
      { key: 'dday', label: '종료 D-day' },
      { key: 'status', label: '상태' },
      { key: 'attendance80', label: '80% 출근' },
      { key: 'accrued', label: '발생연차' },
      { key: 'used', label: '사용연차' },
      { key: 'remaining', label: '잔여연차' }
    ], rows })}
    <div class="form-actions" style="margin-top:12px;"><button class="btn btn-outline" id="deleteLatestLeaveStaff" type="button">최근 등록 인력 삭제</button></div>
  `;

  document.querySelector('#deleteLatestLeaveStaff')?.addEventListener('click', () => {
    const latest = getCollection('leaveStaff').at(-1);
    if (!latest) return;
    removeItem('leaveStaff', latest.id);
    showToast('최근 등록 인력이 삭제되었습니다.');
    renderAnnualLeaveView('#contentContainer');
  });
}

function renderAccrualTable() {
  const target = document.querySelector(`#${ACCRUAL_TABLE_ID}`);
  if (!target) return;
  const staff = getCollection('leaveStaff');
  const rows = staff.flatMap(item => buildAccrualRows(item));
  if (!rows.length) return target.innerHTML = createEmptyState({ title: '연차 발생이력 없음', description: '발생된 연차가 없습니다.' });

  target.innerHTML = createTable({ columns: [
    { key: 'name', label: '이름' },
    { key: 'date', label: '발생일' },
    { key: 'type', label: '구분' },
    { key: 'days', label: '발생일수' },
    { key: 'memo', label: '비고' }
  ], rows });
}

function renderHistoryTable() {
  const target = document.querySelector(`#${HISTORY_TABLE_ID}`);
  if (!target) return;
  const staff = getCollection('leaveStaff');
  const usage = getCollection('leaveUsage');
  if (!usage.length) return target.innerHTML = createEmptyState({ title: '연차 사용이력 없음', description: '등록된 연차 사용내역이 없습니다.' });

  const rows = usage.map(item => {
    const person = staff.find(staffItem => staffItem.id === item.staffId);
    return {
      name: person?.name || '알 수 없음',
      useDate: item.useDate,
      days: item.days,
      memo: item.memo
    };
  });

  target.innerHTML = createTable({ columns: [
    { key: 'name', label: '이름' },
    { key: 'useDate', label: '사용일자' },
    { key: 'days', label: '사용일수' },
    { key: 'memo', label: '사유' }
  ], rows });
}

function calculateAccruedLeave(staff) {
  return buildAccrualRows(staff).reduce((sum, row) => sum + Number(row.days || 0), 0);
}

function buildAccrualRows(staff) {
  const today = new Date();
  const start = new Date(staff.startDate);
  const end = new Date(staff.endDate);
  const basisDate = today < end ? today : end;
  if (basisDate < start) return [];

  const rows = [];
  let months = (basisDate.getFullYear() - start.getFullYear()) * 12 + (basisDate.getMonth() - start.getMonth());
  if (basisDate.getDate() < start.getDate()) months -= 1;
  const monthlyLeave = Math.min(Math.max(months, 0), 11);

  for (let index = 1; index <= monthlyLeave; index += 1) {
    const date = new Date(start);
    date.setMonth(date.getMonth() + index);
    rows.push({ name: staff.name, date: toDateString(date), type: '월 만근', days: 1, memo: '1개월 만근 연차 발생' });
  }

  const oneYearDate = new Date(start);
  oneYearDate.setFullYear(oneYearDate.getFullYear() + 1);
  if (basisDate >= oneYearDate && staff.attendance80 === 'Y') {
    rows.push({ name: staff.name, date: toDateString(oneYearDate), type: '1년 도달', days: 15, memo: '80% 이상 출근 확인' });
  }

  return rows;
}

function getUsedLeave(staffId) {
  return getCollection('leaveUsage')
    .filter(item => item.staffId === staffId)
    .reduce((sum, item) => sum + Number(item.days || 0), 0);
}

function getContractDday(endDate) {
  const today = new Date();
  const end = new Date(endDate);
  const diff = end.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDday(dday) {
  if (dday < 0) return `D+${Math.abs(dday)}`;
  if (dday === 0) return 'D-day';
  return `D-${dday}`;
}

function getContractStatus(dday) {
  if (dday < 0) return '계약종료';
  if (dday <= 30) return '종료예정';
  return '계약중';
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}
