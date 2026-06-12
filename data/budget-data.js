export const BUDGET_SOURCE = {
  name: '2차년도 RISE사업비 편성(260327)-공유용.xlsx',
  sheet: '예산표/편성표',
  unit: '원'
};

export const BUDGET_UNITS = [
  { id: '1-1', name: '1-1 전략산업 융합기술 고급인력 양성' },
  { id: '1-2', name: '1-2 스마트 모빌리티 특화 기술 교육' },
  { id: '1-3', name: '1-3 I-Union 혁신창업 생태계 구축' },
  { id: '2-1-ai', name: '2-1 혁신기술 지원을 위한 산학협력 공유플랫폼 조성[AI인재양성]' }
];

export const BUDGET_ALLOCATIONS = [
  { id: 'b-1-1-personnel-common', unitTaskId: '1-1', riseCategory: '인건비', erpItem: '사업단>인건비(110-01보수)', allocated: 263250000, allocationType: '사업단공통', detail: '사업단 자체인력 인건비' },
  { id: 'b-1-1-scholarship', unitTaskId: '1-1', riseCategory: '장학금', erpItem: '1-1>장학금(310-01보상금)', allocated: 0, allocationType: '단위과제', detail: '' },
  { id: 'b-1-1-program-general', unitTaskId: '1-1', riseCategory: '교육·연구 프로그램 개발 운영비', erpItem: '1-1>교육·연구 프로그램 개발 운영비(210-01일반수용비)', allocated: 145380000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-1-program-rd', unitTaskId: '1-1', riseCategory: '교육·연구 프로그램 개발 운영비', erpItem: '1-1>교육·연구 프로그램 개발 운영비(260-01연구개발비)', allocated: 40000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-1-program-reward', unitTaskId: '1-1', riseCategory: '교육·연구 프로그램 개발 운영비', erpItem: '1-1>교육·연구 프로그램 개발 운영비(310-01보상금)', allocated: 120000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-1-env-service', unitTaskId: '1-1', riseCategory: '교육·연구 환경개선비', erpItem: '1-1>교육·연구 환경개선비(210-14일반용역비)', allocated: 20000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-1-env-common-facility', unitTaskId: '1-1', riseCategory: '교육·연구 환경개선비', erpItem: '사업단>교육·연구 환경개선비(420-03시설비)', allocated: 59670000, allocationType: '사업단공통', detail: '공통예산 배분' },
  { id: 'b-1-1-equipment-asset', unitTaskId: '1-1', riseCategory: '실험·실습장비 및 기자재 구입 운영비', erpItem: '1-1>실험·실습장비 및 기자재 구입 운영비(430-01자산취득비)', allocated: 301500000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-1-region-general', unitTaskId: '1-1', riseCategory: '지역 연계·협업 운영비', erpItem: '1-1>지역 연계·협업 운영비(210-01일반수용비)', allocated: 10000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-1-company-general', unitTaskId: '1-1', riseCategory: '기업 지원·협력 활동비', erpItem: '1-1>기업 지원·협력 활동비(210-01일반수용비)', allocated: 20000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-1-outcome-general', unitTaskId: '1-1', riseCategory: '성과 활용·확산 지원비', erpItem: '1-1>성과 활용·확산 지원비(210-01일반수용비)', allocated: 120000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-1-operation-general', unitTaskId: '1-1', riseCategory: '그 밖의 사업운영 경비', erpItem: '1-1>그 밖의 사업운영 경비(210-01일반수용비)', allocated: 35100000, allocationType: '단위과제/공통', detail: '단위과제 2%, 사업단공통 1%' },
  { id: 'b-1-1-indirect', unitTaskId: '1-1', riseCategory: '간접비', erpItem: '1-1>간접비(320-10기타부담금)', allocated: 35100000, allocationType: '단위과제/공통', detail: '단위과제 2%, 사업단공통 1%' },

  { id: 'b-1-2-personnel-common', unitTaskId: '1-2', riseCategory: '인건비', erpItem: '사업단>인건비(110-01보수)', allocated: 72000000, allocationType: '사업단공통', detail: '사업단 자체인력 인건비' },
  { id: 'b-1-2-scholarship', unitTaskId: '1-2', riseCategory: '장학금', erpItem: '1-2>장학금(310-01보상금)', allocated: 0, allocationType: '단위과제', detail: '' },
  { id: 'b-1-2-program-general', unitTaskId: '1-2', riseCategory: '교육·연구 프로그램 개발 운영비', erpItem: '1-2>교육·연구 프로그램 개발 운영비(210-01일반수용비)', allocated: 94000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-2-program-travel', unitTaskId: '1-2', riseCategory: '교육·연구 프로그램 개발 운영비', erpItem: '1-2>교육·연구 프로그램 개발 운영비(220-01국내여비)', allocated: 10000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-2-program-rd', unitTaskId: '1-2', riseCategory: '교육·연구 프로그램 개발 운영비', erpItem: '1-2>교육·연구 프로그램 개발 운영비(260-01연구개발비)', allocated: 15000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-2-program-reward', unitTaskId: '1-2', riseCategory: '교육·연구 프로그램 개발 운영비', erpItem: '1-2>교육·연구 프로그램 개발 운영비(310-01보상금)', allocated: 20000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-2-equipment-asset', unitTaskId: '1-2', riseCategory: '실험·실습장비 및 기자재 구입 운영비', erpItem: '1-2>실험·실습장비 및 기자재 구입 운영비(430-01자산취득비)', allocated: 40000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-2-equipment-common-asset', unitTaskId: '1-2', riseCategory: '실험·실습장비 및 기자재 구입 운영비', erpItem: '사업단, 1-2>실험·실습장비 및 기자재 구입 운영비(430-01자산취득비)', allocated: 16320000, allocationType: '사업단공통', detail: '공통예산 배분' },
  { id: 'b-1-2-company-general', unitTaskId: '1-2', riseCategory: '기업 지원·협력 활동비', erpItem: '1-2>기업 지원·협력 활동비(210-01일반수용비)', allocated: 10000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-2-outcome-general', unitTaskId: '1-2', riseCategory: '성과 활용·확산 지원비', erpItem: '1-2>성과 활용·확산 지원비(210-01일반수용비)', allocated: 23480000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-2-operation-general', unitTaskId: '1-2', riseCategory: '그 밖의 사업운영 경비', erpItem: '1-2>그 밖의 사업운영 경비(210-01일반수용비)', allocated: 9600000, allocationType: '단위과제/공통', detail: '단위과제 2%, 사업단공통 1%' },
  { id: 'b-1-2-indirect', unitTaskId: '1-2', riseCategory: '간접비', erpItem: '1-2>간접비(320-10기타부담금)', allocated: 9600000, allocationType: '단위과제/공통', detail: '단위과제 2%, 사업단공통 1%' },

  { id: 'b-1-3-personnel-common', unitTaskId: '1-3', riseCategory: '인건비', erpItem: '사업단>인건비(110-01보수)', allocated: 51750000, allocationType: '사업단공통', detail: '사업단 자체인력 인건비' },
  { id: 'b-1-3-program-rd', unitTaskId: '1-3', riseCategory: '교육·연구 프로그램 개발 운영비', erpItem: '1-3>교육·연구 프로그램 개발 운영비(260-01연구개발비)', allocated: 60000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-3-equipment-common-asset', unitTaskId: '1-3', riseCategory: '실험·실습장비 및 기자재 구입 운영비', erpItem: '사업단, 1-3>실험·실습장비 및 기자재 구입 운영비(430-01자산취득비)', allocated: 11730000, allocationType: '사업단공통', detail: '공통예산 배분' },
  { id: 'b-1-3-outcome-general', unitTaskId: '1-3', riseCategory: '성과 활용·확산 지원비', erpItem: '1-3>성과 활용·확산 지원비(210-01일반수용비)', allocated: 92720000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-3-operation-general', unitTaskId: '1-3', riseCategory: '그 밖의 사업운영 경비', erpItem: '1-3>그 밖의 사업운영 경비(210-01일반수용비)', allocated: 1140000, allocationType: '단위과제', detail: '* 그 밖의 사업운영 경비 총 합계 : 4,140,000원' },
  { id: 'b-1-3-operation-travel-abroad', unitTaskId: '1-3', riseCategory: '그 밖의 사업운영 경비', erpItem: '1-3>그 밖의 사업운영 경비(220-02국외여비)', allocated: 3000000, allocationType: '단위과제', detail: '' },
  { id: 'b-1-3-operation-common', unitTaskId: '1-3', riseCategory: '그 밖의 사업운영 경비', erpItem: '사업단>그 밖의 사업운영 경비(210-02공공요금 및 제세)', allocated: 2760000, allocationType: '사업단공통', detail: '공통예산 배분' },
  { id: 'b-1-3-indirect', unitTaskId: '1-3', riseCategory: '간접비', erpItem: '1-3>간접비(320-10기타부담금)', allocated: 6900000, allocationType: '단위과제/공통', detail: '단위과제 2%, 사업단공통 1%' },

  { id: 'b-2-1-ai-personnel-common', unitTaskId: '2-1-ai', riseCategory: '인건비', erpItem: '사업단>인건비(110-01보수)', allocated: 72000000, allocationType: '사업단공통', detail: '' },
  { id: 'b-2-1-ai-program-general', unitTaskId: '2-1-ai', riseCategory: '교육·연구 프로그램 개발 운영비', erpItem: '2-1,AI인재양성>교육·연구 프로그램 개발 운영비(210-01일반수용비)', allocated: 120800000, allocationType: '단위과제', detail: '' },
  { id: 'b-2-1-ai-env-service', unitTaskId: '2-1-ai', riseCategory: '교육·연구 환경개선비', erpItem: '2-1,AI인재양성>교육·연구 환경개선비(210-14일반용역비)', allocated: 16000000, allocationType: '단위과제', detail: '' },
  { id: 'b-2-1-ai-equipment-asset', unitTaskId: '2-1-ai', riseCategory: '실험·실습장비 및 기자재 구입 운영비', erpItem: '2-1,AI인재양성>실험·실습장비 및 기자재 구입 운영비(430-01자산취득비)', allocated: 51000000, allocationType: '단위과제', detail: '' },
  { id: 'b-2-1-ai-region-general', unitTaskId: '2-1-ai', riseCategory: '지역 연계·협업 운영비', erpItem: '2-1,AI인재양성>지역 연계·협업 운영비(210-01일반수용비)', allocated: 8600000, allocationType: '단위과제', detail: '' },
  { id: 'b-2-1-ai-company-general', unitTaskId: '2-1-ai', riseCategory: '기업 지원·협력 활동비', erpItem: '2-1,AI인재양성>기업 지원·협력 활동비(210-01일반수용비)', allocated: 8000000, allocationType: '단위과제', detail: '' },
  { id: 'b-2-1-ai-outcome-general', unitTaskId: '2-1-ai', riseCategory: '성과 활용·확산 지원비', erpItem: '2-1,AI인재양성>성과 활용·확산 지원비(210-01일반수용비)', allocated: 8080000, allocationType: '단위과제', detail: '' },
  { id: 'b-2-1-ai-outcome-common', unitTaskId: '2-1-ai', riseCategory: '성과 활용·확산 지원비', erpItem: '사업단>성과 활용·확산 지원비(210-01일반수용비)', allocated: 16320000, allocationType: '사업단공통', detail: '공통예산 배분' },
  { id: 'b-2-1-ai-operation-general', unitTaskId: '2-1-ai', riseCategory: '그 밖의 사업운영 경비', erpItem: '2-1,AI인재양성>그 밖의 사업운영 경비(210-01일반수용비)', allocated: 9600000, allocationType: '단위과제/공통', detail: '단위과제 2%, 사업단공통 1%' },
  { id: 'b-2-1-ai-indirect', unitTaskId: '2-1-ai', riseCategory: '간접비', erpItem: '2-1,AI인재양성>간접비(320-10기타부담금)', allocated: 9600000, allocationType: '단위과제/공통', detail: '단위과제 2%, 사업단공통 1%' }
];

export function getBudgetItems(unitTaskId) {
  return BUDGET_ALLOCATIONS.filter(item => item.unitTaskId === unitTaskId);
}

export function getBudgetItem(itemId) {
  return BUDGET_ALLOCATIONS.find(item => item.id === itemId);
}

export function getBudgetExecutedAmount(item, executions = []) {
  return executions
    .filter(row => row.unitTaskId === item.unitTaskId)
    .filter(row => row.budgetItemId ? row.budgetItemId === item.id : row.category === item.riseCategory)
    .reduce((sum, row) => sum + Number(row.executed || 0), 0);
}

export function getBudgetRemaining(item, executions = []) {
  return Math.max(Number(item.allocated || 0) - getBudgetExecutedAmount(item, executions), 0);
}

export function getBudgetRate(item, executions = []) {
  const allocated = Number(item.allocated || 0);
  if (!allocated) return 0;
  return Math.round((getBudgetExecutedAmount(item, executions) / allocated) * 1000) / 10;
}

export function getUnitBudgetTotal(unitTaskId) {
  return getBudgetItems(unitTaskId).reduce((sum, item) => sum + Number(item.allocated || 0), 0);
}
