export const UNIT_TASKS = [
  { id: '1-1', name: '1-1 전략산업', description: '전략산업 융합기술 고급인력 양성' },
  { id: '1-2', name: '1-2 스마트모빌리티', description: '스마트 모빌리티 특화 기술교육' },
  { id: '1-3', name: '1-3 혁신창업', description: 'I-Union 혁신창업 생태계' },
  { id: '2-1-ai', name: '2-1 AI인재양성', description: 'AI 기반 인재양성 및 초광역 협력' }
];

export const KPI_DEFINITIONS = {
  '1-1': [
    { name: '인력양성 인원', type: '필수', target: 461, actual: 481, unit: '명' },
    { name: '취업률', type: '필수', target: 38.3, actual: 8.89, unit: '%' },
    { name: '캡스톤디자인 이수학생 비율', type: '선택', target: 35.0, actual: 25.6, unit: '%' },
    { name: '학생성공지수 우수자 비율', type: '선택', target: 10.0, actual: 8.0, unit: '%' },
    { name: '산학협력지수', type: '선택', target: 12, actual: 7, unit: '점' }
  ],
  '1-2': [
    { name: '인력양성 인원', type: '필수', target: 0, actual: 0, unit: '명' },
    { name: '취업률', type: '필수', target: 28.0, actual: 9.2, unit: '%' },
    { name: '캡스톤디자인 이수학생 비율', type: '선택', target: 0, actual: 0, unit: '%' },
    { name: '교육과정 개발(개편)건수', type: '선택', target: 0, actual: 0, unit: '건' },
    { name: 'PBL 지원 과제 수', type: '선택', target: 3, actual: 1, unit: '건' },
    { name: '융합기술 포럼(세미나) 및 성과 교류회', type: '선택', target: 0, actual: 0, unit: '건' },
    { name: '단기전문교육과정 개설건수', type: '선택', target: 0, actual: 0, unit: '건' },
    { name: '단기전문교육과정 배출인원', type: '선택', target: 0, actual: 0, unit: '명' }
  ],
  '1-3': [
    { name: '창업교육 이수학생 수', type: '필수', target: 0, actual: 0, unit: '명' },
    { name: '교원/대학생 창업건수', type: '필수', target: 0, actual: 0, unit: '건' },
    { name: '창업 프로그램 만족도', type: '선택', target: 0, actual: 0, unit: '점' },
    { name: '창업 협력 프로그램 개발 운영', type: '선택', target: 0, actual: 0, unit: '건' }
  ],
  '2-1-ai': [
    { name: 'AI 인재양성 인원 수', type: '필수', target: 0, actual: 0, unit: '명' },
    { name: 'AI 교육과정 개발운영 건수', type: '필수', target: 0, actual: 0, unit: '건' },
    { name: 'AI 교육 만족도', type: '선택', target: 0, actual: 0, unit: '점' },
    { name: '산학협력 프로젝트 수', type: '선택', target: 0, actual: 0, unit: '건' },
    { name: '초광역 협력 프로그램 운영건수', type: '선택', target: 0, actual: 0, unit: '건' }
  ]
};

export const BUDGET_EXECUTION = [
  { unitTaskId: '1-1', label: '1-1 전략산업', allocated: 100, executed: 72 },
  { unitTaskId: '1-2', label: '1-2 스마트모빌리티', allocated: 100, executed: 58 },
  { unitTaskId: '1-3', label: '1-3 혁신창업', allocated: 100, executed: 81 },
  { unitTaskId: '2-1-ai', label: '2-1 AI인재양성', allocated: 100, executed: 43 }
];

export function calculateAchievementRate(kpi) {
  if (!kpi.target || Number(kpi.target) === 0) return null;
  return Math.round((Number(kpi.actual) / Number(kpi.target)) * 1000) / 10;
}

export function calculateUnitAchievement(unitTaskId) {
  const kpis = KPI_DEFINITIONS[unitTaskId] || [];
  const rates = kpis
    .map(calculateAchievementRate)
    .filter(rate => rate !== null);

  if (!rates.length) return null;

  return Math.round((rates.reduce((sum, rate) => sum + rate, 0) / rates.length) * 10) / 10;
}
