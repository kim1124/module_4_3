# Login 기능 개발 Plan (Security Enhanced)

## 프로젝트 정보

- **BE**: FastAPI + SQLAlchemy + SQLite
- **FE**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **인증 방식**: JWT (JSON Web Token) + **Short-lived Access Token**

---

## Feature 1. User 모델 및 DB 스키마 설계

### BE

- [ ] `backend/app/models/user.py` — User 모델 생성 (id, email, password_hash, nickname, is_active, created_at)
- [ ] `backend/app/schemas/user.py` — Pydantic 스키마 (UserJoin, UserLogin, UserResponse)
- [ ] **[보안]** 비밀번호 필드는 절대 응답 모델(UserResponse)에 포함되지 않도록 제외 설정

### FE

- [ ] 해당 없음

### Kernel

- [ ] DB 테이블 생성 확인

---

## Feature 2. 강력한 보안 유틸리티 구현

### BE

- [ ] `passlib[bcrypt]` 설치 및 설정
- [ ] `backend/app/utils/security.py`:
  - `hash_password(password)`: bcrypt 솔팅 및 해싱
  - `verify_password(plain, hashed)`: 안전한 비밀번호 검증
  - `create_access_token(data, expires)`: JWT 발급 (알고리즘 HS256)
- [ ] **[보안]** `.env`에서 `SECRET_KEY` 로드 실패 시 서버 시작 차단 (안전 장치)

### FE

- [ ] 해당 없음

### Kernel

- [ ] `requirements.txt` 업데이트

---

## Feature 3. 회원가입 및 검증 시스템

### BE

- [ ] `POST /api/auth/register` 구현
- [ ] **[보안]** 이메일 형식 정규식 검증
- [ ] **[보안]** 비밀번호 복잡도 검증 (길이, 특수문자 등)
- [ ] **[보안]** 이미 가입된 이메일 가입 시도 시, 보안상 "이미 사용 중" 대신 모호한 메시지 권장되나 UX 고려하여 적절히 처리

### FE

- [ ] 회원가입 폼 UI (`register/page.tsx`)
- [ ] 클라이언트 측 비밀번호 강도 실시간 체크
- [ ] API 연동

### Kernel

- [ ] Swagger 테스트

---

## Feature 4. 로그인 및 토큰 발급 (JWT)

### BE

- [ ] `POST /api/auth/login` 구현 (OAuth2PasswordRequestForm 사용 권장)
- [ ] 로그인 성공 시 Access Token 반환
- [ ] **[보안]** 로그인 실패 시 "이메일이 없음" vs "비밀번호 틀림" 구분하지 않고 "이메일 또는 비밀번호가 올바르지 않습니다"로 통일 (계정 열거 공격 방지)

### FE

- [ ] 로그인 폼 UI (`login/page.tsx`)
- [ ] **[보안]** 로그인 버튼에 Rate Limiting 처리 (다중 클릭 방지)
- [ ] API 연동

### Kernel

- [ ] 토큰 발급 테스트

---

## Feature 5. 보안 미들웨어 및 Axios Interceptor

### BE

- [ ] `get_current_user` 의존성 함수 구현
- [ ] **[보안]** Authorization 헤더 포맷(`Bearer <token>`) 엄격 검증
- [ ] **[보안]** 만료된 토큰에 대해 명확한 401 에러 반환

### FE

- [ ] `frontend/src/lib/axios.ts` (또는 fetch wrapper) 구현
- [ ] **[보안]** Request Interceptor: 모든 API 요청에 자동으로 토큰 주입
- [ ] **[보안]** Response Interceptor: 401 에러 발생 시 자동으로 로그아웃 처리 및 리다이렉트

### Kernel

- [ ] 미들웨어 적용 테스트

---

## Feature 6. 서버 측 로그아웃 (Token Blacklist)

### BE

- [ ] **[보안]** `TokenBlacklist` 모델 생성 (token, blacklisted_at)
- [ ] `POST /api/auth/logout` 엔드포인트 구현
  - 요청된 토큰을 블랙리스트 DB에 저장
- [ ] `get_current_user`에 블랙리스트 체크 로직 추가 (이미 로그아웃된 토큰 재사용 방지)

### FE

- [ ] 로그아웃 함수 구현
- [ ] 로컬 스토리지 토큰 삭제 + 서버 로그아웃 API 호출 병행

### Kernel

- [ ] 로그아웃 후 해당 토큰으로 API 접근 시도 시 차단 확인 (Replay Attack 방지)

---

## Feature 7. 회원가입/로그인 UI 고도화

### BE

- [ ] 해당 없음

### FE

- [ ] 폼 유효성 검사 라이브러리 (React Hook Form + Zod) 적용 권장
- [ ] 로딩 상태(Spinner) 및 에러 메시지 UI 컴포넌트화
- [ ] 엔터 키 제출 처리 등 UX 개선

### Kernel

- [ ] 해당 없음

---

## Feature 8. 사용자 정보 조회 및 상태 관리

### BE

- [ ] `GET /api/auth/me` 구현 (현재 로그인한 사용자 정보)

### FE

- [ ] `AuthContext` 또는 `Zustand` 스토어로 전역 인증 상태 관리
- [ ] 앱 초기 로딩 시 `token` 있으면 `me` API 호출하여 로그인 유지
- [ ] `useAuth` 훅 구현 (user, login, logout, isLoading 제공)

### Kernel

- [ ] 기능 연동 테스트

---

## Feature 9. 보호된 라우트 (Protected Routes)

### BE

- [ ] 해당 없음

### FE

- [ ] `components/auth/ProtectedRoute.tsx` HOC(Higher Order Component) 생성
- [ ] 비로그인 접근 시 `/login?returnUrl=...` 로 리다이렉트 처리 (UX 향상)
- [ ] 페이지/컴포넌트 단위 접근 제어 적용

### Kernel

- [ ] 비로그인 시 보호된 페이지 접근 불가 확인

---

## Feature 10. 보안 강화 및 에러 핸들링 표준화

### BE

- [ ] **[보안]** CORS 설정 검토 (필요한 도메인만 허용)
- [ ] **[보안]** HTTPException 핸들러 표준화 (상세 에러 로그는 서버에만 남기고, 클라이언트엔 일반적인 메시지 전달)

### FE

- [ ] 전역 에러 바운더리(Error Boundary) 적용
- [ ] 네트워크 에러, 서버 500 에러 등에 대한 사용자 친화적 UI

### Kernel

- [ ] 전체 인증 흐름 보안 점검 (SQL Injection, XSS 등 기본 취약점)
