# Login Feature Development Plan

로그인 기능 개발을 위한 Feature 단위 작업 목록입니다.

---

## Feature 1: 사용자 모델 및 데이터베이스 스키마 구축

### BE
- [ ] User 모델 생성 (`backend/app/models/user.py`)
  - id, username, email, hashed_password, created_at, updated_at 필드
  - SQLAlchemy 모델 정의
- [ ] User 스키마 생성 (`backend/app/schemas/user.py`)
  - UserCreate (회원가입 요청)
  - UserResponse (응답용)
  - UserLogin (로그인 요청)
- [ ] database.py에 User 모델 테이블 생성 반영

### FE
- N/A

### Kernel
- N/A

---

## Feature 2: 비밀번호 해싱 및 회원가입 API

### BE
- [ ] 비밀번호 해싱 유틸리티 생성 (`backend/app/utils/security.py`)
  - bcrypt 또는 passlib 사용
  - `hash_password()` 함수
  - `verify_password()` 함수
- [ ] 회원가입 API 엔드포인트 (`backend/app/routers/auth.py`)
  - POST `/api/auth/register`
  - 이메일 중복 체크
  - 사용자 생성 및 저장
- [ ] main.py에 auth 라우터 등록

### FE
- N/A

### Kernel
- N/A

---

## Feature 3: JWT 토큰 인증 시스템

### BE
- [ ] JWT 토큰 생성/검증 유틸리티 (`backend/app/utils/security.py`)
  - `create_access_token()` 함수
  - `decode_access_token()` 함수
  - SECRET_KEY 환경변수 설정
- [ ] 로그인 API 엔드포인트 (`backend/app/routers/auth.py`)
  - POST `/api/auth/login`
  - 사용자 인증 (이메일/비밀번호 검증)
  - JWT 토큰 발급
- [ ] 토큰 검증 의존성 함수 (`backend/app/dependencies/auth.py`)
  - `get_current_user()` 의존성
  - Authorization 헤더에서 토큰 추출 및 검증

### FE
- N/A

### Kernel
- N/A

---

## Feature 4: 회원가입 UI 및 API 연동

### BE
- N/A

### FE
- [ ] 회원가입 페이지 생성 (`frontend/src/app/register/page.tsx`)
  - 이메일, 비밀번호, 비밀번호 확인 입력 폼
  - 폼 검증 (이메일 형식, 비밀번호 일치 등)
- [ ] 회원가입 API 호출 함수 (`frontend/src/lib/api/auth.ts`)
  - `registerUser()` 함수
  - fetch 또는 axios 사용
- [ ] 회원가입 성공 시 로그인 페이지로 리다이렉트
- [ ] 에러 처리 및 사용자 피드백 (토스트 또는 알림)

### Kernel
- N/A

---

## Feature 5: 로그인 UI 및 상태 관리

### BE
- N/A

### FE
- [ ] 로그인 페이지 생성 (`frontend/src/app/login/page.tsx`)
  - 이메일, 비밀번호 입력 폼
  - 로그인 버튼
  - 회원가입 페이지 링크
- [ ] 로그인 API 호출 함수 (`frontend/src/lib/api/auth.ts`)
  - `loginUser()` 함수
- [ ] 인증 상태 관리 Context 생성 (`frontend/src/context/AuthContext.tsx`)
  - AuthProvider 컴포넌트
  - useAuth 훅
  - user 상태, token 상태, login/logout 함수
- [ ] 로그인 성공 시 토큰 저장 및 홈으로 리다이렉트

### Kernel
- N/A

---

## Feature 6: 토큰 저장 및 자동 인증

### BE
- N/A

### FE
- [ ] 토큰 저장 로직 구현 (`frontend/src/lib/storage.ts`)
  - localStorage에 access_token 저장
  - `saveToken()`, `getToken()`, `removeToken()` 함수
- [ ] axios interceptor 설정 (`frontend/src/lib/api/client.ts`)
  - 모든 API 요청에 Authorization 헤더 자동 첨부
- [ ] 페이지 로드 시 자동 로그인 체크
  - 저장된 토큰으로 사용자 정보 조회
  - AuthProvider에서 초기화 시 실행

### Kernel
- N/A

---

## Feature 7: 현재 사용자 정보 조회 API

### BE
- [ ] 현재 사용자 정보 조회 엔드포인트 (`backend/app/routers/auth.py`)
  - GET `/api/auth/me`
  - `get_current_user` 의존성 사용
  - 현재 로그인한 사용자 정보 반환
- [ ] 보호된 엔드포인트 예시 생성
  - Protected route 데코레이터 또는 의존성 활용

### FE
- [ ] 사용자 정보 조회 API 호출 (`frontend/src/lib/api/auth.ts`)
  - `getCurrentUser()` 함수
- [ ] 사용자 정보 표시 컴포넌트 (`frontend/src/components/UserProfile.tsx`)
  - 네비게이션 바에 사용자명/이메일 표시

### Kernel
- N/A

---

## Feature 8: 보호된 라우트 및 인증 체크

### BE
- [ ] Protected endpoint 테스트
  - 예시 API에 인증 필요 설정
  - 401 Unauthorized 응답 확인

### FE
- [ ] 인증 체크 컴포넌트 생성 (`frontend/src/components/ProtectedRoute.tsx`)
  - 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
- [ ] 보호된 페이지에 ProtectedRoute 적용
  - 예: 대시보드, 프로필 페이지 등
- [ ] 미들웨어 또는 layout에서 인증 체크 로직 통합

### Kernel
- N/A

---

## Feature 9: 로그아웃 기능

### BE
- [ ] 로그아웃 API 엔드포인트 (Optional - 토큰 블랙리스트)
  - POST `/api/auth/logout`
  - JWT 블랙리스트 구현 (Redis 또는 DB)

### FE
- [ ] 로그아웃 버튼 추가 (네비게이션 바 또는 사용자 메뉴)
- [ ] 로그아웃 처리 함수
  - 토큰 삭제 (localStorage)
  - 인증 상태 초기화
  - 로그인 페이지로 리다이렉트
- [ ] AuthContext에 logout 함수 구현

### Kernel
- N/A

---

## Feature 10: 에러 처리 및 사용자 피드백 개선

### BE
- [ ] 상세한 에러 응답 구조 정의
  - 인증 실패 시 명확한 에러 메시지
  - HTTP 상태 코드 표준화 (401, 403, 422 등)
- [ ] 입력 검증 강화 (Pydantic 스키마)

### FE
- [ ] 전역 에러 핸들링
  - 401 에러 시 자동 로그아웃 및 리다이렉트
- [ ] 로딩 상태 표시
  - 로그인/회원가입 버튼에 스피너
- [ ] 토스트 알림 또는 에러 메시지 컴포넌트
  - 성공/실패 피드백
- [ ] 폼 검증 및 실시간 에러 메시지

### Kernel
- N/A

---

## 의존성 및 패키지

### Backend
```bash
pip install python-jose[cryptography]  # JWT
pip install passlib[bcrypt]             # 비밀번호 해싱
pip install python-multipart            # form data 처리
```

### Frontend
```bash
npm install axios                       # HTTP 클라이언트 (optional)
# 또는 fetch API 사용
```

---

## 개발 순서 권장

1. Feature 1 → Feature 2 → Feature 3 (백엔드 인증 인프라)
2. Feature 4 (회원가입 UI)
3. Feature 5 → Feature 6 (로그인 UI 및 토큰 관리)
4. Feature 7 → Feature 8 (사용자 정보 조회 및 보호된 라우트)
5. Feature 9 (로그아웃)
6. Feature 10 (에러 처리 및 개선)

---

## 참고사항

- JWT SECRET_KEY는 환경변수로 관리 (`backend/.env`)
- 토큰 만료 시간 설정 (예: 24시간)
- HTTPS 사용 권장 (프로덕션 환경)
- CORS 설정 확인 (`backend/app/main.py`)
- 비밀번호 복잡도 정책 고려
