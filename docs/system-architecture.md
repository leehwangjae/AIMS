# AIMS 시스템 구조 정리 및 1차 리팩토링 계획

## 1. 목적

AIMS는 RISE 미래인재개발팀의 성과관리, 사업관리, 예산관리, 보고서관리, 일정관리, 권한관리를 통합적으로 지원하는 웹 기반 성과관리시스템이다.

현재 프로젝트는 `index.html` 단일 파일 안에 HTML, CSS, JavaScript, 샘플 데이터, 로그인 및 권한 처리 로직이 함께 포함된 구조이므로, 향후 기능 확장, AI 기능 연동, DB 연동, 유지보수를 위해 기능별 파일 구조로 단계적 분리가 필요하다.

---

## 2. 리팩토링 우선순위

### 1단계: 화면/파일 구조 분리

현재 구조:

```text
AIMS/
├─ index.html
├─ README.md
└─ vercel.json
```

목표 구조:

```text
AIMS/
├─ index.html
├─ css/
│  └─ style.css
├─ js/
│  ├─ app.js
│  ├─ auth.js
│  ├─ dashboard.js
│  ├─ crud.js
│  ├─ ui.js
│  └─ constants.js
├─ data/
│  ├─ schema.js
│  └─ sample-data.js
├─ docs/
│  └─ system-architecture.md
└─ vercel.json
```

분리 원칙:

- `index.html`: 화면 구조와 최소 진입점만 유지
- `css/style.css`: 전체 디자인 토큰, 레이아웃, 컴포넌트 스타일 관리
- `js/app.js`: 앱 초기화, 화면 라우팅, 전역 이벤트 연결
- `js/auth.js`: 로그인, 로그아웃, 세션, 권한 관리
- `js/dashboard.js`: 대시보드 KPI 및 주요 현황 렌더링
- `js/crud.js`: 등록, 조회, 수정, 삭제 공통 처리
- `js/ui.js`: 토스트, 모달, 탭, 필터 등 UI 유틸리티
- `data/schema.js`: 데이터 구조 정의
- `data/sample-data.js`: 샘플 데이터 및 초기값 관리

---

## 3. 데이터 구조 설계

### 3.1 users

사용자 및 권한 정보를 관리한다.

```js
{
  id: 'user_001',
  name: '관리자',
  email: 'admin@example.com',
  role: 'MASTER',
  department: '미래인재개발팀',
  status: 'ACTIVE',
  createdAt: '2026-05-28T00:00:00+09:00'
}
```

### 3.2 projects

RISE 단위과제 및 세부사업 정보를 관리한다.

```js
{
  id: 'project_001',
  year: 2026,
  unitTask: '1-1',
  name: '미래인재양성 성과관리',
  managerId: 'user_001',
  status: 'ACTIVE'
}
```

### 3.3 programs

교육, 세미나, 기업지원, 산학협력 등 프로그램 실적을 관리한다.

```js
{
  id: 'program_001',
  projectId: 'project_001',
  name: '재직자 교육 프로그램',
  type: '교육',
  startDate: '2026-06-01',
  endDate: '2026-06-30',
  participants: 30,
  companies: 5,
  budget: 50000000,
  status: 'PLANNED'
}
```

### 3.4 performanceIndicators

성과지표 목표값, 실적값, 달성률을 관리한다.

```js
{
  id: 'indicator_001',
  projectId: 'project_001',
  name: '참여학생 수',
  target: 100,
  actual: 85,
  unit: '명',
  achievementRate: 85
}
```

### 3.5 budgets

사업비 예산, 집행액, 잔액, 집행률을 관리한다.

```js
{
  id: 'budget_001',
  projectId: 'project_001',
  category: '교육운영비',
  allocated: 100000000,
  executed: 45000000,
  balance: 55000000,
  executionRate: 45
}
```

### 3.6 reports

주간보고, 월간보고, 실적보고서, 자체진단 등 보고서 초안 및 최종본을 관리한다.

```js
{
  id: 'report_001',
  projectId: 'project_001',
  type: 'WEEKLY',
  title: '5월 4주차 주간보고',
  content: '',
  status: 'DRAFT',
  createdBy: 'user_001',
  createdAt: '2026-05-28T00:00:00+09:00'
}
```

### 3.7 evidenceFiles

보고서와 성과지표에 연결되는 증빙자료를 관리한다.

```js
{
  id: 'evidence_001',
  targetType: 'REPORT',
  targetId: 'report_001',
  fileName: '결과보고서.pdf',
  fileUrl: '',
  uploadedBy: 'user_001',
  uploadedAt: '2026-05-28T00:00:00+09:00'
}
```

---

## 4. CRUD 기능 안정화 기준

### Create

- 프로그램 등록
- 성과지표 등록
- 예산 항목 등록
- 보고서 등록
- 증빙자료 등록

### Read

- 대시보드 KPI 조회
- 단위과제별 성과 조회
- 프로그램 목록 조회
- 보고서 목록 조회
- 권한별 메뉴 조회

### Update

- 프로그램 정보 수정
- 성과지표 실적값 수정
- 예산 집행액 수정
- 보고서 본문 수정
- 사용자 권한 수정

### Delete

- 기본 삭제 권한은 `MASTER`에게만 부여
- 실제 운영 단계에서는 완전 삭제보다 `deletedAt`을 사용하는 소프트 삭제 방식을 권장

---

## 5. 로그인 및 권한관리 설계

### 권한 유형

| 권한 | 설명 |
|---|---|
| MASTER | 전체 관리자. 사용자, 권한, 시스템 설정, 전체 데이터 관리 가능 |
| PROFESSOR | 단위과제 책임자. 담당 과제 성과, 프로그램, 보고서 관리 가능 |
| STAFF | 실무 담당자. 자료 입력, 증빙 업로드, 일정 및 보고서 초안 작성 가능 |
| VIEWER | 조회 전용 사용자. 대시보드 및 보고서 조회 가능 |

### 메뉴 접근 권한

| 메뉴 | MASTER | PROFESSOR | STAFF | VIEWER |
|---|---:|---:|---:|---:|
| 대시보드 | O | O | O | O |
| 사업관리 | O | O | O | 조회 |
| 성과관리 | O | O | O | 조회 |
| 예산관리 | O | O | 제한 | X |
| 보고서관리 | O | O | O | 조회 |
| 사용자관리 | O | X | X | X |
| 시스템설정 | O | X | X | X |

### 세션 관리 원칙

- 현재 단계에서는 `localStorage` 기반 임시 세션 사용 가능
- 실제 운영 단계에서는 Supabase Auth, 기관 SSO, 또는 자체 백엔드 인증 방식 적용 권장
- 비밀번호는 브라우저 코드에 평문 저장 금지
- 운영 단계에서는 JWT 또는 서버 세션 기반 인증 적용 필요

---

## 6. AI 기능 도입 대비 구조

AI 기능은 현재 단계에서 직접 구현하지 않고, 추후 다음 위치에 모듈 방식으로 추가한다.

```text
api/
└─ ai-report.js

js/
└─ ai.js
```

예상 기능:

- 성과보고서 초안 생성
- 자체진단 및 시사점 작성
- 지표 미달성 사유 작성
- 심사위원 예상 Q&A 생성
- 증빙자료 누락 점검

AI 기능 연동 시 원칙:

- API Key는 프론트엔드 코드에 저장하지 않음
- 반드시 서버 API Route 또는 별도 백엔드에서 관리
- 내부자료 기반 답변을 위해 RAG 구조 검토
- AI 결과는 담당자 검토 후 저장

---

## 7. 단계별 진행 계획

### Phase 1

- 구조 문서 작성
- 데이터 스키마 정의
- 권한 상수 정의
- CRUD 공통 함수 초안 작성
- UI 유틸리티 초안 작성

### Phase 2

- 기존 `index.html`에서 CSS를 `css/style.css`로 분리
- 기존 JavaScript를 기능별 모듈로 분리
- 화면별 렌더링 함수 정리

### Phase 3

- localStorage 데이터 구조 정비
- 샘플 데이터 초기화 방식 통일
- 권한별 메뉴 노출 제어 적용

### Phase 4

- Supabase 또는 별도 DB 연동 준비
- 파일 업로드 구조 설계
- AI API Route 추가 준비
