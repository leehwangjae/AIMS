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
  return getProgramResult(unitTaskId, kpiName);
}

function getGraduateCount(unitTaskId) {
  const rows = getCollection('graduates').filter(row => row.unitTaskId === unitTaskId);
  if (!rows.length) return { actual: null, sourceType: '졸업생명단', sources: [] };
  return { actual: rows.length, sourceType: '졸업생명단', sources: rows };
}

function getEmploymentRate(unitTaskId) {
  const rows = getCollection('graduates').filter(row => row.unitTaskId === unitTaskId);
  if (!rows.length) return { actual: null, sourceType: '졸업생명단', sources: [] };
  const employed = rows.filter(row => row.employed === 'Y').length;
  return { actual: Math.round((employed / rows.length) * 1000) / 10, sourceType: '졸업생명단', sources: rows };
}

function getProgramResult(unitTaskId, kpiName) {
  const programs = getCollection('programs').filter(program => program.unitTaskId === unitTaskId && program.linkedKpi === kpiName);
  if (!programs.length) return { actual: null, sourceType: '프로그램', sources: [] };
  const actual = PEOPLE_SUM_KPIS.includes(kpiName)
    ? programs.reduce((sum, program) => sum + Number(program.participants || 0), 0)
    : programs.length;
  return { actual, sourceType: PEOPLE_SUM_KPIS.includes(kpiName) ? '참여인원 합산' : '프로그램 건수', sources: programs };
}

export function getRate(target, actual) {
  if (actual === null || actual === undefined || !target || Number(target) === 0) return null;
  return Math.round((Number(actual) / Number(target)) * 1000) / 10;
}
