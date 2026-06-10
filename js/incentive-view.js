import { getCollection } from './store.js';
import { createCard, createEmptyState, createTable } from './components.js';

export function renderIncentiveView(targetSelector) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  const rows = buildFacultyRows();

  target.innerHTML = `
    <section class="dashboard-hero sc">
      <div class="scb">
        <div class="eyebrow">Faculty Incentive</div>
        <h2 class="page-title">교원 인센티브 관리</h2>
        <p class="page-desc">사업관리 프로그램에 입력된 참여교원 정보를 기반으로 교원별 참여실적을 자동 집계합니다.</p>
      </div>
    </section>

    ${createCard({ title: '교원 참여실적 집계', content: rows.length ? renderFacultyTable(rows) : createEmptyState({ title: '참여교원 없음', description: '사업관리 프로그램에 참여교원을 먼저 입력해 주세요.' }) })}
    ${createCard({ title: '인센티브 산정 기준 안내', content: renderGuide() })}
  `;
}

function buildFacultyRows() {
  const programs = getCollection('programs').filter(program => program.faculty);
  const map = new Map();

  programs.forEach(program => {
    parseFaculty(program.faculty).forEach(name => {
      const prev = map.get(name) || {
        faculty: name,
        programCount: 0,
        lectureCount: 0,
        mentoringCount: 0,
        capstoneCount: 0,
        pblCount: 0,
        startupCount: 0,
        evidenceCount: 0,
        score: 0
      };

      prev.programCount += 1;
      prev.lectureCount += getTypeCount(program, ['교육프로그램', '포럼/세미나', '성과교류회']);
      prev.mentoringCount += hasText(program.faculty, name, '멘토') ? 1 : 0;
      prev.capstoneCount += getTypeCount(program, ['캡스톤', '산학협력 프로젝트']);
      prev.pblCount += getTypeCount(program, ['PBL']);
      prev.startupCount += getTypeCount(program, ['창업프로그램']);
      prev.evidenceCount += program.hasResultReport === 'Y' ? 1 : 0;
      prev.score = calculateScore(prev);

      map.set(name, prev);
    });
  });

  return Array.from(map.values()).map(row => ({
    ...row,
    expectedAmount: `${row.score * 100000}원`
  }));
}

function parseFaculty(value) {
  return String(value || '')
    .split(',')
    .map(item => item.replace(/\(.+?\)/g, '').trim())
    .filter(Boolean);
}

function getTypeCount(program, types) {
  return types.includes(program.type) ? 1 : 0;
}

function hasText(source, name, keyword) {
  return String(source || '').includes(name) && String(source || '').includes(keyword);
}

function calculateScore(row) {
  return row.programCount + row.lectureCount + row.mentoringCount + row.capstoneCount * 2 + row.pblCount * 1.5 + row.startupCount + row.evidenceCount;
}

function renderFacultyTable(rows) {
  return createTable({
    columns: [
      { key: 'faculty', label: '교원명' },
      { key: 'programCount', label: '참여 프로그램' },
      { key: 'lectureCount', label: '강의/포럼' },
      { key: 'mentoringCount', label: '멘토링' },
      { key: 'capstoneCount', label: '캡스톤/산학' },
      { key: 'pblCount', label: 'PBL' },
      { key: 'startupCount', label: '창업' },
      { key: 'evidenceCount', label: '증빙완료' },
      { key: 'score', label: '실적점수' },
      { key: 'expectedAmount', label: '지급예상액' }
    ],
    rows
  });
}

function renderGuide() {
  return `
    <div class="evidence-panel">
      <div class="evidence-card"><strong>자동 집계 기준</strong><p>프로그램 등록 시 입력한 참여교원, 프로그램 유형, 결과보고서 첨부 여부를 기준으로 집계합니다.</p></div>
      <div class="evidence-card"><strong>실적점수</strong><p>참여 프로그램, 강의·포럼, 멘토링, 캡스톤, PBL, 창업, 증빙완료 항목을 합산합니다.</p></div>
      <div class="evidence-card"><strong>지급예상액</strong><p>현재는 1점당 100,000원 기준의 임시 산식이며, 추후 내부 지급기준에 맞춰 조정할 수 있습니다.</p></div>
    </div>
  `;
}
