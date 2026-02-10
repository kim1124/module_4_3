from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token
from app.utils.security import hash_password, verify_password, create_access_token
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    새로운 사용자를 등록합니다.

    - 사용자명 중복 검사
    - 이메일 중복 검사
    - 비밀번호 해싱
    - 사용자 생성
    """
    # 사용자명 중복 확인
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{user_data.username}' is already registered"
        )

    # 이메일 중복 확인
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{user_data.email}' is already registered"
        )

    # 비밀번호 해싱
    hashed_password = hash_password(user_data.password)

    # 새 사용자 생성
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except IntegrityError:
        # Race condition으로 인한 중복 발생 시
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email is already registered (race condition)"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register user: {str(e)}"
        )


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    사용자 로그인 및 JWT 토큰 발급.

    - OAuth2PasswordRequestForm의 username 필드에 이메일을 입력받습니다.
    - 이메일과 비밀번호를 검증합니다.
    - 성공 시 JWT 액세스 토큰을 반환합니다.
    - 실패 시 401 Unauthorized 에러를 반환합니다.
    """
    # 이메일로 사용자 조회 (username 필드에 이메일이 들어옴)
    user = db.query(User).filter(User.email == form_data.username).first()

    # 사용자가 없거나 비밀번호가 틀린 경우 (동일한 에러 메시지 사용 - 보안 모범 사례)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # JWT 토큰 생성 (user.id를 subject로 저장)
    access_token = create_access_token(data={"sub": str(user.id)})

    # last_login 타임스탬프 업데이트
    user.last_login = datetime.utcnow()
    db.commit()

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    현재 로그인한 사용자의 정보를 반환합니다.

    Authorization 헤더에 Bearer 토큰이 필요합니다.
    토큰이 없거나 유효하지 않은 경우 401 Unauthorized 에러를 반환합니다.
    """
    return current_user
