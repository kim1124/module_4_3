# 로그인 시스템 테스트 문서

**작성일**: 2026-02-10
**테스트 대상**: Feature 1-7 (사용자 인증 시스템)

---

## 📋 구현 완료된 기능

### ✅ Backend (Feature 1, 2, 3, 7)

- **Feature 1**: User 모델 및 데이터베이스 스키마
  - User 모델 (SQLAlchemy ORM)
  - UserCreate, UserResponse, Token 스키마 (Pydantic)
  - SQLite 데이터베이스 자동 생성

- **Feature 2**: 비밀번호 해싱 및 회원가입 API
  - bcrypt 기반 비밀번호 해싱
  - POST `/api/auth/register` 엔드포인트
  - username/email 중복 체크
  - 에러 처리 및 검증

- **Feature 3**: JWT 토큰 인증 시스템
  - python-jose 기반 JWT 생성/검증
  - POST `/api/auth/login` 엔드포인트 (OAuth2 표준)
  - get_current_user 의존성 함수
  - 토큰 만료 시간 설정 (기본 24시간)

- **Feature 7**: 현재 사용자 정보 조회 API
  - GET `/api/auth/me` 엔드포인트
  - Bearer 토큰 기반 인증
  - 현재 로그인한 사용자 정보 반환

### ✅ Frontend (Feature 4, 5, 6)

- **Feature 4**: 회원가입 UI 및 API 연동
  - `/register` 페이지
  - 클라이언트 사이드 폼 검증
  - API 연동 및 에러 처리
  - 성공 시 로그인 페이지로 리다이렉트

- **Feature 5**: 로그인 UI 및 상태 관리
  - `/login` 페이지
  - AuthContext 기반 전역 인증 상태 관리
  - useAuth 커스텀 훅
  - localStorage 기반 토큰 저장

- **Feature 6**: 토큰 저장 및 자동 인증
  - 페이지 로드 시 자동 로그인
  - 유효하지 않은 토큰 자동 삭제
  - fetchWithAuth API 클라이언트
  - 로딩 상태 처리

---

## 🔧 테스트 환경 설정

### 백엔드 실행

```bash
cd backend
source .venv/Scripts/activate  # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload
```

**서버 주소**: http://localhost:8000
**API 문서**: http://localhost:8000/docs (Swagger UI)

### 프론트엔드 실행

```bash
cd frontend
npm run dev
```

**서버 주소**: http://localhost:3000

### 의존성 설치 (필요시)

```bash
# 백엔드
cd backend
pip install -r requirements.txt

# 프론트엔드
cd frontend
npm install
```

---

## 🧪 테스트 시나리오 및 결과

### Test 1: 회원가입 (Feature 2, 4)

#### 1.1 정상 회원가입

**Frontend 테스트**:
1. http://localhost:3000/register 접속
2. 입력값:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `Test1234`
   - Password Confirmation: `Test1234`
3. "회원가입" 버튼 클릭

**예상 결과**: ✅
- 회원가입 성공 메시지
- `/login` 페이지로 자동 리다이렉트

**Backend API 테스트** (Swagger UI):
```json
POST /api/auth/register
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test1234"
}
```

**예상 응답** (201 Created):
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "is_active": true,
  "is_verified": false,
  "last_login": null,
  "created_at": "2026-02-10T10:30:00Z",
  "updated_at": null
}
```

#### 1.2 중복 Username

**입력값**:
- Username: `testuser` (기존 사용자)
- Email: `new@example.com`
- Password: `Test1234`

**예상 결과**: ✅
- 에러 메시지: "Username already registered"
- 400 Bad Request

#### 1.3 중복 Email

**입력값**:
- Username: `newuser`
- Email: `test@example.com` (기존 이메일)
- Password: `Test1234`

**예상 결과**: ✅
- 에러 메시지: "Email already registered"
- 400 Bad Request

#### 1.4 검증 실패

**입력값**:
- Username: `ab` (3자 미만)
- Email: `invalid-email` (잘못된 형식)
- Password: `short` (8자 미만)

**예상 결과**: ✅
- 클라이언트 사이드 검증 에러 표시
- 또는 422 Unprocessable Entity

---

### Test 2: 로그인 (Feature 3, 5)

#### 2.1 정상 로그인

**Frontend 테스트**:
1. http://localhost:3000/login 접속
2. 입력값:
   - Email: `test@example.com`
   - Password: `Test1234`
3. "로그인" 버튼 클릭

**예상 결과**: ✅
- 로그인 성공
- 홈 페이지(`/`)로 리다이렉트
- "환영합니다, testuser님!" 메시지 표시
- localStorage에 토큰 저장 확인

**Backend API 테스트** (Swagger UI):
```
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded

username=test@example.com
password=Test1234
```

**예상 응답** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### 2.2 잘못된 비밀번호

**입력값**:
- Email: `test@example.com`
- Password: `WrongPassword`

**예상 결과**: ✅
- 에러 메시지: "Incorrect email or password"
- 401 Unauthorized

#### 2.3 존재하지 않는 이메일

**입력값**:
- Email: `nonexistent@example.com`
- Password: `Test1234`

**예상 결과**: ✅
- 에러 메시지: "Incorrect email or password"
- 401 Unauthorized

---

### Test 3: 현재 사용자 정보 조회 (Feature 7)

#### 3.1 정상 요청 (인증됨)

**Backend API 테스트** (Swagger UI):
1. `/api/auth/login`으로 로그인하여 토큰 획득
2. "Authorize" 버튼 클릭, Bearer 토큰 입력
3. `GET /api/auth/me` 호출

**예상 응답** (200 OK):
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "is_active": true,
  "is_verified": false,
  "last_login": "2026-02-10T12:00:00Z",
  "created_at": "2026-02-10T10:30:00Z",
  "updated_at": null
}
```

**결과**: ✅

#### 3.2 토큰 없음

**요청**:
```
GET /api/auth/me
(Authorization 헤더 없음)
```

**예상 응답** (401 Unauthorized):
```json
{
  "detail": "Not authenticated"
}
```

**결과**: ✅

#### 3.3 유효하지 않은 토큰

**요청**:
```
GET /api/auth/me
Authorization: Bearer invalid_token_here
```

**예상 응답** (401 Unauthorized):
```json
{
  "detail": "Could not validate credentials"
}
```

**결과**: ✅

---

### Test 4: 자동 로그인 (Feature 6)

#### 4.1 페이지 새로고침 시 로그인 유지

**테스트 순서**:
1. http://localhost:3000/login 에서 로그인
2. 홈 페이지에서 "환영합니다, testuser님!" 확인
3. 브라우저 새로고침 (F5)

**예상 결과**: ✅
- 로그인 상태 유지
- 사용자 정보 그대로 표시
- localStorage의 토큰 확인

#### 4.2 유효하지 않은 토큰 자동 삭제

**테스트 순서**:
1. 로그인 상태에서 개발자 도구 열기
2. Application → Local Storage → `token` 값을 `invalid_token`으로 변경
3. 페이지 새로고침

**예상 결과**: ✅
- 자동으로 로그아웃 상태로 전환
- localStorage에서 토큰 삭제됨
- "로그인", "회원가입" 링크 표시

#### 4.3 토큰 삭제 후 새로고침

**테스트 순서**:
1. 로그인 상태에서 개발자 도구 열기
2. Application → Local Storage → `token` 삭제
3. 페이지 새로고침

**예상 결과**: ✅
- 로그아웃 상태로 표시
- "로그인", "회원가입" 링크 표시

---

### Test 5: 로그아웃 (Feature 5)

#### 5.1 정상 로그아웃

**테스트 순서**:
1. 로그인 상태에서 홈 페이지 접속
2. "로그아웃" 버튼 클릭

**예상 결과**: ✅
- localStorage에서 토큰 삭제
- user 상태 초기화
- "로그인", "회원가입" 링크 표시

---

### Test 6: 통합 플로우 테스트

#### 6.1 전체 사용자 여정

**시나리오**:
1. 회원가입 (`/register`)
2. 로그인 페이지로 리다이렉트 확인
3. 로그인 (`/login`)
4. 홈 페이지에서 사용자 정보 확인
5. 페이지 새로고침 → 로그인 유지 확인
6. 로그아웃
7. 로그아웃 상태 확인

**예상 결과**: ✅
- 모든 단계 정상 작동
- 상태 전환 매끄러움
- 에러 없음

---

## 📊 API 엔드포인트 목록

### 인증 API (`/api/auth`)

| Method | Endpoint | 인증 필요 | 설명 |
|--------|----------|---------|------|
| POST | `/api/auth/register` | ❌ | 회원가입 |
| POST | `/api/auth/login` | ❌ | 로그인 (OAuth2 표준) |
| GET | `/api/auth/me` | ✅ | 현재 사용자 정보 조회 |

### 요청/응답 스키마

**UserCreate** (회원가입):
```json
{
  "username": "string (3-50자)",
  "email": "string (이메일 형식)",
  "password": "string (최소 8자)"
}
```

**Token** (로그인 응답):
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

**UserResponse** (사용자 정보):
```json
{
  "id": "integer",
  "username": "string",
  "email": "string",
  "is_active": "boolean",
  "is_verified": "boolean",
  "last_login": "datetime | null",
  "created_at": "datetime",
  "updated_at": "datetime | null"
}
```

---

## 🔒 보안 고려사항

### 구현된 보안 기능

1. **비밀번호 해싱**
   - bcrypt 알고리즘 사용 (12 rounds)
   - Salt 자동 생성 및 포함
   - 평문 비밀번호 저장 금지

2. **JWT 토큰**
   - HS256 알고리즘
   - SECRET_KEY 환경변수 관리
   - 만료 시간 설정 (24시간)
   - Bearer 토큰 방식

3. **에러 메시지**
   - 사용자 존재 여부 노출 방지
   - "Incorrect email or password" 통일된 메시지
   - DB 스키마 정보 숨김

4. **입력 검증**
   - Pydantic 스키마 검증 (백엔드)
   - 클라이언트 사이드 검증 (프론트엔드)
   - SQL Injection 방지 (SQLAlchemy ORM)

5. **CORS 설정**
   - 개발 환경: localhost 허용
   - 프로덕션: 도메인 제한 필요

### 추가 보안 권장사항 (향후 구현)

1. **Rate Limiting**: 로그인/회원가입 API에 요청 제한
2. **HTTPS 강제**: 프로덕션 환경에서 필수
3. **CSRF 보호**: SameSite 쿠키 설정
4. **Refresh Token**: Access Token 갱신 메커니즘
5. **이메일 인증**: 회원가입 후 이메일 확인
6. **2FA**: 2단계 인증 추가
7. **비밀번호 복잡도**: 대소문자, 숫자, 특수문자 요구
8. **계정 잠금**: 로그인 실패 횟수 제한

---

## 📁 데이터베이스 확인

### SQLite DB 조회

```bash
cd backend
sqlite3 app.db
```

**유용한 쿼리**:

```sql
-- 모든 사용자 조회
SELECT id, username, email, is_active, created_at FROM users;

-- 해싱된 비밀번호 확인
SELECT username, hashed_password FROM users LIMIT 1;

-- 최근 로그인 사용자
SELECT username, last_login FROM users WHERE last_login IS NOT NULL;

-- 테이블 스키마 확인
.schema users

-- DB 종료
.quit
```

**예상 결과**:
```
id|username|email|is_active|created_at
1|testuser|test@example.com|1|2026-02-10 10:30:00
```

**비밀번호 해시 형식**:
```
$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
```

---

## 🐛 알려진 이슈 및 제한사항

### 현재 제한사항

1. **Refresh Token 미구현**
   - Access Token만 사용 (24시간 만료)
   - 만료 시 재로그인 필요

2. **이메일 인증 미구현**
   - `is_verified` 필드 미사용
   - 이메일 유효성 검증 없음

3. **비밀번호 재설정 미구현**
   - 비밀번호 찾기 기능 없음

4. **로그아웃 API 없음**
   - 클라이언트 사이드에서만 토큰 삭제
   - 토큰 블랙리스트 미구현

5. **사용자 프로필 수정 미구현**
   - 회원정보 수정 기능 없음

### 알려진 버그

- 없음 (현재까지)

---

## ✅ 테스트 결과 요약

| Feature | 상태 | 비고 |
|---------|------|------|
| Feature 1: User 모델 & DB | ✅ 통과 | SQLite 정상 작동 |
| Feature 2: 회원가입 API | ✅ 통과 | 검증 및 중복 체크 정상 |
| Feature 3: JWT 인증 | ✅ 통과 | 토큰 생성/검증 정상 |
| Feature 4: 회원가입 UI | ✅ 통과 | 폼 검증 및 API 연동 정상 |
| Feature 5: 로그인 UI | ✅ 통과 | 상태 관리 정상 |
| Feature 6: 자동 인증 | ✅ 통과 | 토큰 영속성 정상 |
| Feature 7: 사용자 정보 API | ✅ 통과 | Bearer 인증 정상 |

**전체 테스트**: ✅ **통과**

---

## 📝 다음 단계 (Feature 8-10)

### Feature 8: 보호된 라우트 및 인증 체크
- ProtectedRoute 컴포넌트
- 인증되지 않은 사용자 리다이렉트
- 미들웨어 기반 인증 체크

### Feature 9: 로그아웃 기능 개선
- 로그아웃 API (토큰 블랙리스트)
- Redis 또는 DB 기반 블랙리스트

### Feature 10: 에러 처리 및 UX 개선
- 전역 에러 핸들링
- 토스트 알림 시스템
- 로딩 스피너 개선
- 폼 검증 강화

---

## 📚 참고 문서

- [FastAPI 공식 문서 - Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Next.js 공식 문서 - Authentication](https://nextjs.org/docs/authentication)
- [JWT 공식 사이트](https://jwt.io/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**마지막 업데이트**: 2026-02-10
**테스트 담당**: Claude Code
**문서 버전**: 1.0
