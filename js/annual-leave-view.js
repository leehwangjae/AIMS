import { getCollection, upsertItem, removeItem } from './store.js';
import { createCard, createEmptyState, createTable } from './components.js';
import { validateRequired } from './form-utils.js';
import { showToast } from './ui.js';

const STAFF_FORM_ID = 'leaveStaffForm';
const USE_FORM_ID = 'leaveUseForm';
const STAFF_TABLE_ID = 'leaveStaffTable';
const HISTORY_TABLE_ID = 'leaveHistoryTable';
const ACCRUAL_TABLE_ID = 'leaveAccrualTable';

const HOURS_PER_DAY = 8;

const LEAVE_TYPES = [
  { id: 'ANNUAL', label: '연가', defaultHours: 8, deduct: true },
  { id: 'AM_HALF', label: '오전반차', defaultHours: 4, deduct: true, startTime: '09:00', endTime: '13:00' },
  { id: 'PM_HALF', label: '오후반차', defaultHours: 4, deduct: true, startTime: '14:00', endTime: '18:00' },
  { id: 'LATE', label: '지참', defaultHours: 1, deduct: true },
  { id: 'OUTING', label: '외출', defaultHours: 1, deduct: true },
  { id: 'EARLY_LEAVE', label: '조퇴', defaultHours: 1, deduct: true },
  { id: 'ADVANCE', label: '당겨쓰기', defaultHours: 8, deduct: true, allowNegative: true },
  { id: 'SPECIAL', label: '특별휴가', defaultHours: 8, deduct: false }
];

export function renderAnnualLeaveView(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">Annual Leave</div>
        <h2 class="page-title">전담인력 연차관리</h2>
        <p class="page-desc">연가·반차·지참·외출·조퇴·당겨쓰기·특별휴가를 시간 단위로 관리하고 잔여 연차를 일/시간 기준으로 확인합니다.</p>
      </div>
    </section>

    ${createCard({ title: '전담인력 등록', content: renderStaffForm() })}
    ${createCard({ title: '근태/휴가 사용 등록', content: renderUseForm() })}
    ${createCard({ title: '전담인력 연차현황', content: `<div id="${STAFF_TABLE_ID}"></div>` })}
    ${createCard({ title: '연차 발생이력', content: `<div id="${ACCRUAL_TABLE_ID}"></div>` })}
    ${createCard({ title: '근태/휴가 사용이력', content: `<div id="${HISTORY_TABLE_ID}"></div>` })}
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
      <label class="form-field"><span>사용구분</span><select name="leaveType" id="leaveTypeSelect">${LEAVE_TYPES.map(type => `<option value="${type.id}">${type.label}</option>`).join('')}</select></label>
      <label class="form-field"><span>사용일자</span><input name="useDate" type="date" /></label>
      <label class="form-field"><span>시작시간</span><input name="startTime" id="leaveStartTime" type="time" value="09:00" /></label>
      <label class="form-field"><span>종료시간</span><input name="endTime" id="leaveEndTime" type="time" value="18:00" /></label>
      <label class="form-field"><span>차감시간</span><input name="hours" id="leaveHours" type="number" min="0" step="0.5" value="8" /></label>
      <label class="form-field full"><span>사유/비고</span><input name="memo" type="text" placeholder="예: 개인사유, 병원방문, 행사참석 등" /></label>
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

  const typeSelect = form.querySelector('#leaveTypeSelect');
  const startInput = form.querySelector('#leaveStartTime');
  const endInput = form.querySelector('#leaveEndTime');
  const hoursInput = form.querySelector('#leaveHours');

  const syncHours = () => {
    const type = getLeaveType(typeSelect.value);
    if (type.startTime) startInput.value = type.startTime;
    if (type.endTime) endInput.value = type.endTime;
    if (type.defaultHours) hoursInput.value = type.defaultHours;
    if (type.id === 'SPECIAL') hoursInput.value = type.defaultHours || 8;
  };

  const calculateByTime = () => {
    const hours = calculateHours(startInput.value, endInput.value);
    if (hours > 0) hoursInput.value = hours;
  };

  typeSelect?.addEventListener('change', syncHours);
  startInput?.addEventListener('change', calculateByTime);
  endInput?.addEventListener('change', calculateByTime);
  syncHours();

  form.addEventListener('submit', event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    const required = validateRequired(values, ['staffId', 'leaveType', 'useDate', 'startTime', 'endTime', 'hours']);
    if (!required.valid) return showToast('근태/휴가 사용 입력값을 확인해 주세요.');

    const type = getLeaveType(values.leaveType);
    const hours = Math.max(Number(values.hours || 0), 0);
    if (hours <= 0) return showToast('차감시간을 확인해 주세요.');

    const remainingBefore = getRemainingHours(values.staffId);
    if (type.deduct && !type.allowNegative && hours > remainingBefore) {
      return showToast('잔여 연차 시간이 부족합니다. 당겨쓰기를 선택하면 음수 잔여도 등록할 수 있습니다.');
    }

    upsertItem('leaveUsage', {
      id: `leave_${Date.now()}`,
      staffId: values.staffId,
      leaveType: values.leaveType,
      leaveTypeLabel: type.label,
      useDate: values.useDate,
      startTime: values.startTime,
      endTime: values.endTime,
      hours,
      days: roundHours(hours / HOURS_PER_DAY),
      deductHours: type.deduct ? hours : 0,
      memo: values.memo || type.label
    });

    showToast('근태/휴가 사용이 등록되었습니다.');
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
    const accruedHours = calculateAccruedHours(item);
    const usedHours = getUsedHours(item.id);
    const specialHours = getSpecialHours(item.id);
    const remainingHours = accruedHours - usedHours;
    const dday = getContractDday(item.endDate);
    return {
      name: item.name,
      startDate: item.startDate,
      endDate: item.endDate,
      dday: formatDday(dday),
      status: getContractStatus(dday),
      attendance80: item.attendance80 === 'Y' ? '충족' : '미확인/미충족',
      accrued: formatLeaveHours(accruedHours),
      used: formatLeaveHours(usedHours),
      special: formatLeaveHours(specialHours),
      remaining: formatLeaveHours(remainingHours)
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
      { key: 'used', label: '차감사용' },
      { key: 'special', label: '특별휴가' },
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
  if (!staff.length) return target.innerHTML = createEmptyState({ title: '연차 발생이력 없음', description: '전담인력을 먼저 등록해 주세요.' });

  target.innerHTML = renderStaffDropdowns(staff, item => {
    const rows = buildAccrualRows(item).map(row => ({ ...row, amount: formatLeaveHours(row.hours) }));
    if (!rows.length) return createEmptyState({ title: '발생이력 없음', description: '아직 발생된 연차가 없습니다.' });
    return createTable({ columns: [
      { key: 'date', label: '발생일' },
      { key: 'type', label: '구분' },
      { key: 'amount', label: '발생' },
      { key: 'memo', label: '비고' }
    ], rows });
  });
}

function renderHistoryTable() {
  const target = document.querySelector(`#${HISTORY_TABLE_ID}`);
  if (!target) return;
  const staff = getCollection('leaveStaff');
  if (!staff.length) return target.innerHTML = createEmptyState({ title: '근태/휴가 사용이력 없음', description: '전담인력을 먼저 등록해 주세요.' });

  target.innerHTML = renderStaffDropdowns(staff, item => {
    const rows = getCollection('leaveUsage')
      .filter(usage => usage.staffId === item.id)
      .map(usage => ({
        useDate: usage.useDate,
        time: `${usage.startTime || '-'} ~ ${usage.endTime || '-'}`,
        leaveType: usage.leaveTypeLabel || getLeaveType(usage.leaveType).label || '연가',
        amount: formatLeaveHours(Number(usage.deductHours ?? usage.hours ?? legacyDaysToHours(usage.days))),
        memo: usage.memo
      }));

    if (!rows.length) return createEmptyState({ title: '사용이력 없음', description: '등록된 근태/휴가 사용내역이 없습니다.' });

    return createTable({ columns: [
      { key: 'useDate', label: '사용일자' },
      { key: 'time', label: '시간' },
      { key: 'leaveType', label: '구분' },
      { key: 'amount', label: '차감/사용' },
      { key: 'memo', label: '사유' }
    ], rows });
  });
}

function renderStaffDropdowns(staff, renderContent) {
  return `
    <div class="leave-dropdown-list">
      ${staff.map((item, index) => {
        const accruedHours = calculateAccruedHours(item);
        const usedHours = getUsedHours(item.id);
        const remainingHours = accruedHours - usedHours;
        return `
          <details class="leave-dropdown" ${index === 0 ? 'open' : ''}>
            <summary>
              <strong>${item.name}</strong>
              <span>발생 ${formatLeaveHours(accruedHours)}</span>
              <span>사용 ${formatLeaveHours(usedHours)}</span>
              <span>잔여 ${formatLeaveHours(remainingHours)}</span>
            </summary>
            <div class="leave-dropdown-body">
              ${renderContent(item)}
            </div>
          </details>
        `;
      }).join('')}
    </div>
  `;
}

function calculateAccruedHours(staff) {
  return buildAccrualRows(staff).reduce((sum, row) => sum + Number(row.hours || 0), 0);
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
    rows.push({ name: staff.name, date: toDateString(date), type: '월 만근', hours: HOURS_PER_DAY, memo: '1개월 만근 연차 1일 발생' });
  }

  const oneYearDate = new Date(start);
  oneYearDate.setFullYear(oneYearDate.getFullYear() + 1);
  if (basisDate >= oneYearDate && staff.attendance80 === 'Y') {
    rows.push({ name: staff.name, date: toDateString(oneYearDate), type: '1년 도달', hours: 15 * HOURS_PER_DAY, memo: '80% 이상 출근 확인, 연차 15일 발생' });
  }

  return rows;
}

function getUsedHours(staffId) {
  return getCollection('leaveUsage')
    .filter(item => item.staffId === staffId)
    .reduce((sum, item) => sum + Number(item.deductHours ?? item.hours ?? legacyDaysToHours(item.days)), 0);
}

function getSpecialHours(staffId) {
  return getCollection('leaveUsage')
    .filter(item => item.staffId === staffId)
    .filter(item => item.leaveType === 'SPECIAL')
    .reduce((sum, item) => sum + Number(item.hours || 0), 0);
}

function getRemainingHours(staffId) {
  const staff = getCollection('leaveStaff').find(item => item.id === staffId);
  if (!staff) return 0;
  return calculateAccruedHours(staff) - getUsedHours(staffId);
}

function getLeaveType(typeId) {
  return LEAVE_TYPES.find(type => type.id === typeId) || LEAVE_TYPES[0];
}

function calculateHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  const diff = Math.max(end - start, 0);
  return roundHours(diff / 60);
}

function formatLeaveHours(hours) {
  const sign = Number(hours) < 0 ? '-' : '';
  const abs = Math.abs(Number(hours || 0));
  const days = Math.floor(abs / HOURS_PER_DAY);
  const remainHours = roundHours(abs % HOURS_PER_DAY);
  return `${sign}${String(days).padStart(2, '0')}일 ${String(remainHours).padStart(2, '0')}시간`;
}

function legacyDaysToHours(days) {
  return Number(days || 0) * HOURS_PER_DAY;
}

function roundHours(value) {
  return Math.round(Number(value || 0) * 10) / 10;
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
