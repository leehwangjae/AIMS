export const BUDGET_SOURCE = {
  name: '사용자 입력 예산 편성 데이터',
  sheet: 'Supabase budget_allocations',
  unit: '원'
};

export const BUDGET_UNITS = [
  { id: '1-1', name: '1-1 전략산업 융합기술 고급인력 양성' },
  { id: '1-2', name: '1-2 스마트 모빌리티 특화 기술 교육' },
  { id: '1-3', name: '1-3 I-Union 혁신창업 생태계 구축' },
  { id: '2-1-ai', name: '2-1 혁신기술 지원을 위한 산학협력 공유플랫폼 조성[AI인재양성]' }
];

// 예산 편성은 더 이상 코드에 하드코딩하지 않는다.
// Supabase public.budget_allocations에 저장된 사용자 입력값만 화면에 표시한다.
// DB가 비어 있으면 예산관리 화면은 "편성 항목 없음" 상태로 시작한다.
export const BUDGET_ALLOCATIONS = [];

export function getBudgetItems(unitTaskId) {
  return BUDGET_ALLOCATIONS.filter(item => item.unitTaskId === unitTaskId);
}

export function getBudgetItem(itemId) {
  return BUDGET_ALLOCATIONS.find(item => item.id === itemId);
}

export function getBudgetExecutedAmount(item, executions = []) {
  if (!item) return 0;
  return executions
    .filter(row => row.unitTaskId === item.unitTaskId)
    .filter(row => row.budgetItemId ? row.budgetItemId === item.id : row.category === item.riseCategory)
    .reduce((sum, row) => sum + Number(row.executed || 0), 0);
}

export function getBudgetRemaining(item, executions = []) {
  return item ? Math.max(Number(item.allocated || 0) - getBudgetExecutedAmount(item, executions), 0) : 0;
}

export function getBudgetRate(item, executions = []) {
  const allocated = Number(item?.allocated || 0);
  if (!allocated) return 0;
  return Math.round((getBudgetExecutedAmount(item, executions) / allocated) * 1000) / 10;
}

export function getUnitBudgetTotal(unitTaskId) {
  return getBudgetItems(unitTaskId).reduce((sum, item) => sum + Number(item.allocated || 0), 0);
}
