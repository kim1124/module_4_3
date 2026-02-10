import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.widget import Widget
from app.schemas.widget import (
    WidgetCreate,
    WidgetUpdate,
    WidgetResponse,
    LayoutBatchUpdate
)
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/widgets", tags=["widgets"])


def serialize_widget(widget: Widget) -> WidgetResponse:
    """
    Widget 모델을 WidgetResponse로 변환.
    JSON 문자열을 dict로 파싱합니다.
    """
    return WidgetResponse(
        id=widget.id,
        user_id=widget.user_id,
        name=widget.name,
        type=widget.type,
        config=json.loads(widget.config) if widget.config else None,
        layout=json.loads(widget.layout),
        created_at=widget.created_at,
        updated_at=widget.updated_at
    )


@router.get("", response_model=list[WidgetResponse])
def get_user_widgets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    현재 사용자의 모든 위젯을 조회합니다.

    - 인증 필요
    - user_id로 필터링하여 사용자 격리 보장
    """
    widgets = db.query(Widget).filter(Widget.user_id == current_user.id).all()
    return [serialize_widget(widget) for widget in widgets]


@router.post("", response_model=WidgetResponse, status_code=status.HTTP_201_CREATED)
def create_widget(
    widget_data: WidgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    새 위젯을 생성합니다.

    - 인증 필요
    - user_id는 현재 로그인한 사용자로 자동 설정
    - config와 layout은 JSON 문자열로 저장
    """
    new_widget = Widget(
        user_id=current_user.id,
        name=widget_data.name,
        type=widget_data.type,
        config=json.dumps(widget_data.config) if widget_data.config else None,
        layout=json.dumps(widget_data.layout.model_dump())
    )

    try:
        db.add(new_widget)
        db.commit()
        db.refresh(new_widget)
        return serialize_widget(new_widget)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create widget: {str(e)}"
        )


@router.put("/layout", response_model=list[WidgetResponse])
def batch_update_layouts(
    batch_data: LayoutBatchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    여러 위젯의 레이아웃을 일괄 업데이트합니다.

    - 인증 필요
    - 각 위젯의 소유권 검증
    - 존재하지 않는 위젯 ID는 무시
    """
    updated_widgets = []

    for layout_data in batch_data.layouts:
        # 위젯 ID는 layout.i 에서 가져옴 (예: "widget_1" -> 1)
        try:
            # "widget_123" 형식에서 숫자 추출
            if layout_data.i.startswith("widget_"):
                widget_id = int(layout_data.i.replace("widget_", ""))
            else:
                # 숫자만 있는 경우
                widget_id = int(layout_data.i)
        except ValueError:
            # 변환 실패한 ID는 건너뜀
            continue

        # 위젯 조회 및 소유권 검증
        widget = db.query(Widget).filter(
            Widget.id == widget_id,
            Widget.user_id == current_user.id
        ).first()

        if widget:
            # 레이아웃 업데이트
            widget.layout = json.dumps(layout_data.model_dump())
            updated_widgets.append(widget)

    if not updated_widgets:
        return []  # 에러 대신 빈 배열 반환

    try:
        db.commit()
        # 업데이트된 위젯 재조회
        for widget in updated_widgets:
            db.refresh(widget)
        return [serialize_widget(widget) for widget in updated_widgets]
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update layouts: {str(e)}"
        )


@router.delete("/all", status_code=status.HTTP_204_NO_CONTENT)
def delete_all_widgets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    현재 사용자의 모든 위젯을 삭제합니다.

    - 인증 필요
    - 현재 사용자 소유의 모든 위젯 삭제
    """
    try:
        db.query(Widget).filter(Widget.user_id == current_user.id).delete()
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete all widgets: {str(e)}"
        )


@router.put("/{widget_id}", response_model=WidgetResponse)
def update_widget(
    widget_id: int,
    widget_data: WidgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    위젯을 업데이트합니다.

    - 인증 필요
    - 소유권 검증 (다른 사용자의 위젯 수정 불가)
    - 제공된 필드만 업데이트
    """
    # 위젯 조회
    widget = db.query(Widget).filter(Widget.id == widget_id).first()

    if not widget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Widget with id {widget_id} not found"
        )

    # 소유권 검증
    if widget.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this widget"
        )

    # 필드 업데이트 (제공된 값만)
    if widget_data.name is not None:
        widget.name = widget_data.name
    if widget_data.type is not None:
        widget.type = widget_data.type
    if widget_data.config is not None:
        widget.config = json.dumps(widget_data.config)
    if widget_data.layout is not None:
        widget.layout = json.dumps(widget_data.layout.model_dump())

    try:
        db.commit()
        db.refresh(widget)
        return serialize_widget(widget)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update widget: {str(e)}"
        )


@router.delete("/{widget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_widget(
    widget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    위젯을 삭제합니다.

    - 인증 필요
    - 소유권 검증 (다른 사용자의 위젯 삭제 불가)
    """
    # 위젯 조회
    widget = db.query(Widget).filter(Widget.id == widget_id).first()

    if not widget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Widget with id {widget_id} not found"
        )

    # 소유권 검증
    if widget.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this widget"
        )

    try:
        db.delete(widget)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete widget: {str(e)}"
        )
