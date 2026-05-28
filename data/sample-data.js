export const sampleUsers = [
  {
    id: 'user_001',
    name: '총괄관리자',
    email: 'master@aims.local',
    role: 'MASTER',
    department: '미래인재개발팀'
  },
  {
    id: 'user_002',
    name: '단위과제 책임교수',
    email: 'professor@aims.local',
    role: 'PROFESSOR',
    department: '전기공학과'
  }
];

export const sampleProjects = [
  {
    id: 'project_001',
    year: 2026,
    unitTask: '1-1',
    name: '미래인재양성 성과관리',
    managerId: 'user_001',
    status: 'ACTIVE'
  }
];

export const samplePrograms = [
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
];
