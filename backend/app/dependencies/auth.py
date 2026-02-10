from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.utils.security import decode_access_token

# OAuth2 스키마 (토큰을 Authorization 헤더에서 추출)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    JWT 토큰에서 현재 사용자를 가져옵니다.

    Args:
        token: Authorization 헤더에서 추출한 Bearer 토큰
        db: 데이터베이스 세션

    Returns:
        User: 현재 인증된 사용자 객체

    Raises:
        HTTPException: 토큰이 유효하지 않거나 사용자를 찾을 수 없는 경우 401 에러
    """
    # 토큰 디코딩 (decode_access_token에서 JWTError 처리)
    payload = decode_access_token(token)

    # 토큰에서 user_id 추출
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # DB에서 사용자 조회
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
