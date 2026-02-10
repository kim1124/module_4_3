import os
from datetime import datetime, timedelta
import bcrypt
from jose import jwt, JWTError
from fastapi import HTTPException, status
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 환경 변수
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


def hash_password(password: str) -> str:
    """
    평문 비밀번호를 bcrypt로 해싱합니다.

    Args:
        password: 평문 비밀번호

    Returns:
        해싱된 비밀번호 문자열
    """
    # bcrypt는 bytes를 요구하므로 encode 필요
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    # 문자열로 반환 (데이터베이스 저장용)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    평문 비밀번호와 해싱된 비밀번호를 비교합니다.

    Args:
        plain_password: 평문 비밀번호
        hashed_password: 해싱된 비밀번호

    Returns:
        비밀번호가 일치하면 True, 아니면 False
    """
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    JWT 액세스 토큰을 생성합니다.

    Args:
        data: 토큰에 포함할 데이터 (보통 {"sub": user_id})
        expires_delta: 토큰 만료 시간 (지정하지 않으면 환경 변수 기본값 사용)

    Returns:
        생성된 JWT 토큰 문자열
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    JWT 토큰을 디코딩하고 검증합니다.

    Args:
        token: JWT 토큰 문자열

    Returns:
        디코딩된 토큰 페이로드 (user_id 포함)

    Raises:
        HTTPException: 토큰이 유효하지 않거나 만료된 경우 401 에러
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
