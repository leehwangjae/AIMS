# RISE 미래인재개발팀 성과관리시스템

인천대학교 RISE 사업 단위과제 1-1 · 1-2 · 1-3 · 2-1 AI 통합 성과관리 웹 시스템

---

## 🚀 Vercel 배포 방법 (3가지 중 택1)

---

### 방법 1. GitHub + Vercel 연동 (추천)

1. **GitHub 저장소 생성**
   - github.com 로그인 → New repository
   - 저장소 이름: `rise-dashboard` (Public 또는 Private)

2. **파일 업로드**
   - `index.html`, `vercel.json` 두 파일을 저장소에 업로드

3. **Vercel 연동**
   - vercel.com 로그인 (GitHub 계정으로 가입 가능)
   - "Add New Project" → GitHub 저장소 선택
   - "Deploy" 클릭

4. **완료**
   - 약 30초 후 `https://rise-dashboard.vercel.app` 형태의 URL 발급
   - 이후 GitHub에 파일 수정 시 자동 재배포

---

### 방법 2. Vercel CLI (터미널 사용)

```bash
# Node.js 설치 후
npm install -g vercel

# 프로젝트 폴더에서
cd rise-dashboard
vercel

# 로그인 후 안내 따라가면 자동 배포
```

---

### 방법 3. Vercel 드래그&드롭 (가장 간단)

1. vercel.com 로그인
2. 대시보드에서 `rise-dashboard` 폴더 전체를 브라우저로 드래그&드롭
3. 자동 배포 완료

---

## 📌 참고사항

- **데이터 저장**: localStorage 방식으로, 같은 브라우저에서는 입력 데이터가 유지됩니다.
- **팀 공유**: Supabase 등 외부 DB를 연동하면 팀원 간 실시간 공유 가능합니다.
- **커스텀 도메인**: Vercel 프로젝트 설정 → Domains에서 자체 도메인 연결 가능 (예: `rise.inu.ac.kr`)
- **비용**: Vercel 무료 플랜으로 충분히 운영 가능합니다.
