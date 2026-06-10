import { getCollection } from './store.js';
import { KPI_DEFINITIONS } from '../data/kpi-data.js';

const PEOPLE_SUM_KPIS = [
  '단기전문교육과정 배출인원',
  '창업교육 이수학생 수',
  'AI 인재양성 인원 수'
];

const GRADUATE_KPIS = ['인력양성 인원', 'AI 인재양성 인원 수'];

export function getAutoKpis(unitTaskId) {
  return (KPI_DEFINITIONS[unitTaskId] || []).map(kpi => {
    const result = getActual(unitTaskId, kpi.name);
    const actual = result.actual ?? kpi.actual;
    const rate = getRate(kpi.target, actual);

    return {
      ...kpi,
      actual,
      rate,
      sourceType: result.sourceType,
      sources: result.sources
    };
  });
}

function getActual(unitTaskId, kpiName) {
  if (GRADUATE_KPIS.includes(kpiName)) return getGraduateCount(unitTaskId);
  if (kpiName === '취업률') return getEmploymentRate(unitTaskId);
  if (kpiName === '캡스톤디자인 이수학생 비율') return getCapstoneWeightedResult(unitTaskId, kpiName);
  if (kpiName === '산학협력지수') return getIndustryCooperationIndex(unitTaskId);
  return getProgramResult(unitTaskId, kpiName);
}

function getGraduateCount(unitTaskId) {
  const rows = getCollection('graduates').filter(row => row.unitTaskId === unitTaskId);
  if (!rows.length) return { actual: null, sourceType: '졸업생명단', sources: [] };
  const actual = rows.reduce((sum, row) => sum + getDegreeWeight(row.degreeType), 0);
  return { actual: round1(actual), sourceType: '졸업생명단 가중치', sources: rows };
}

function getEmploymentRate(unitTaskId) {
  const rows = getCollection('graduates').filter(row => row.unitTaskId === unitTaskId);
  if (!rows.length) return { actual: null, sourceType: '졸업생명단', sources: [] };

  const denominator = rows.reduce((sum, row) => sum + getDegreeWeight(row.degreeType), 0);
  const numerator = rows
    .filter(row => row.employed === 'Y')
    .reduce((sum, row) => sum + getEmploymentRegionWeight(row.employmentRegion), 0);

  const actual = denominator ? round1((numerator / denominator) * 100) : null;
  return { actual, sourceType: '취업률 가중치', sources: rows };
}

function getCapstoneWeightedResult(unitTaskId, kpiName) {
  const rows = getCollection('capstones').filter(row => row.unitTaskId === unitTaskId);
  if (rows.length) {
    const actual = rows.reduce((sum, row) => sum + getCapstoneWeight(row.capstoneType), 0);
    return { actual: round1(actual), sourceType: '캡스톤 가중치', sources: rows };
  }

  return getProgramResult(unitTaskId, kpiName);
}

function getProgramResult(unitTaskId, kpiName) {
  const programs = getCollection('programs').filter(program => program.unitTaskId === unitTaskId && program.linkedKpi === kpiName);
  if (!programs.length) return { actual: null, sourceType: '프로그램', sources: [] };
  const actual = PEOPLE_SUM_KPIS.includes(kpiName)
    ? programs.reduce((sum, program) => sum + Number(program.participants || 0), 0)
    : programs.length;
  return { actual, sourceType: PEOPLE_SUM_KPIS.includes(kpiName) ? '참여인원 합산' : '프로그램 건수', sources: programs };
}

function getIndustryCooperationIndex(unitTaskId) {
  const data = getCollection('industryIndex').find(row => row.unitTaskId === unitTaskId) || {};
  const a = safeDivide(data.curriculumRevisionCount, 40);
  const b = safeDivide(data.companyCapstoneCount, 23);
  const c = safeDivide(data.mouCount, 30);
  const d = safeDivide(data.workerTrainingCount, 30);
  const actual = round1((a * 0.4 + b * 0.2 + c * 0.2 + d * 0.2) * 100);

  if (!Object.keys(data).length) {
    return { actual: null, sourceType: '산학협력지수 산식', sources: [] };
  }

  return {
    actual,
    sourceType: '산학협력지수 산식',
    sources: [
      { name: 'A 교과목 개편 비율', value: round1(a * 100), target: 40 },
      { name: 'B 기업참여형 캡스톤 달성률', value: round1(b * 100), target: 23 },
      { name: 'C 협력기업 MOU 달성률', value: round1(c * 100), target: 30 },
      { name: 'D 재직자 교육과정 운영 비율', value: round1(d * 100), target: 30 }
    ]
  };
}

function getDegreeWeight(type) {
  const weights = {
    학부: 1,
    학부생: 1,
    석사: 1.5,
    박사: 2,
    나노디그리: 0.3
  };
  return weights[type] ?? 1;
}

function getEmploymentRegionWeight(region) {
  const weights = {
    지역내: 1,
    인천: 1,
    지역외: 0.5,
    그외: 0.5
  };
  return weights[region] ?? 0.5;
}

function getCapstoneWeight(type) {
  const weights = {
    일반: 1,
    기업연계형: 1.5,
    융합형: 2,
    글로벌: 2
  };
  return weights[type] ?? 1;
}

function safeDivide(value, target) {
  const numeric = Number(value || 0);
  return target ? numeric / target : 0;
}

function round1(value) {
  return Math.round(Number(value) * 10) / 10;
}

export function getRate(target, actual) {
  if (actual === null || actual === undefined || !target || Number(target) === 0) return null;
  return round1((Number(actual) / Number(target)) * 100);
}
