# JWT Authentication Test Guide

## Prerequisites
1. Install new dependencies:
```bash
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
```

2. Start the backend server:
```bash
uvicorn app.main:app --reload
```

## API Testing

### 1. Register a new user
**Endpoint:** `POST http://localhost:8000/api/auth/register`

**Request Body (JSON):**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test1234"
}
```

**Expected Response (201):**
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

---

### 2. Login (Get JWT Token)
**Endpoint:** `POST http://localhost:8000/api/auth/login`

**Request Body (application/x-www-form-urlencoded):**
```
username=test@example.com
password=Test1234
```

**Note:** Despite the field name being `username`, you should provide the **email address**.

**Expected Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzM5MjY4MDAwfQ.xyz...",
  "token_type": "bearer"
}
```

**Error Response (401) - Wrong credentials:**
```json
{
  "detail": "Incorrect email or password"
}
```

---

### 3. Use JWT Token for Protected Endpoints

Once you have the access token, include it in the `Authorization` header for protected endpoints:

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example using curl:**
```bash
curl -X GET "http://localhost:8000/api/protected-endpoint" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## Testing with Swagger UI

1. Open browser: http://localhost:8000/docs
2. Click on **POST /api/auth/register** → Try it out → Fill the form → Execute
3. Click on **POST /api/auth/login** → Try it out → Fill:
   - username: `test@example.com` (your email)
   - password: `Test1234`
   - Execute
4. Copy the `access_token` from the response
5. Click the **Authorize** button (green lock icon at the top)
6. Paste the token and click **Authorize**
7. Now you can access protected endpoints

---

## Testing with Python requests

```python
import requests

BASE_URL = "http://localhost:8000"

# 1. Register
register_data = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test1234"
}
response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
print("Register:", response.status_code, response.json())

# 2. Login
login_data = {
    "username": "test@example.com",  # Email goes in username field
    "password": "Test1234"
}
response = requests.post(f"{BASE_URL}/api/auth/login", data=login_data)
token = response.json()["access_token"]
print("Login:", response.status_code, token)

# 3. Use token for protected endpoint
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{BASE_URL}/api/protected-endpoint", headers=headers)
print("Protected:", response.status_code, response.json())
```

---

## Token Details

- **Algorithm:** HS256
- **Expiration:** 1440 minutes (24 hours) - configurable in `.env`
- **Payload:** `{"sub": "user_id", "exp": timestamp}`
- **Secret Key:** Stored in `.env` file (should be changed in production)

---

## Security Notes

1. The `.env` file contains a sample SECRET_KEY. **Generate a new one for production:**
   ```bash
   openssl rand -hex 32
   ```

2. The login endpoint uses the same error message for both "user not found" and "wrong password" to prevent user enumeration attacks.

3. Token is automatically validated and user is extracted using the `get_current_user` dependency.

---

## Next Steps

To protect an endpoint, add the dependency:

```python
from fastapi import Depends
from app.dependencies import get_current_user
from app.models.user import User

@router.get("/protected")
def protected_endpoint(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.username}!"}
```
