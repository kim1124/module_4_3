from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime


class WidgetLayoutData(BaseModel):
    """React-grid-layout 좌표 데이터"""
    x: int = Field(..., ge=0, description="X coordinate (>= 0)")
    y: int = Field(..., ge=0, description="Y coordinate (>= 0)")
    w: int = Field(..., ge=1, description="Width (>= 1)")
    h: int = Field(..., ge=1, description="Height (>= 1)")
    i: str = Field(..., description="Unique widget identifier")


class WidgetCreate(BaseModel):
    """Widget 생성 요청"""
    name: str = Field(..., min_length=1, max_length=100, description="Widget name")
    type: str = Field(default="default", description="Widget type")
    config: Optional[dict[str, Any]] = Field(default=None, description="Widget configuration")
    layout: WidgetLayoutData = Field(..., description="Widget layout data")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty or whitespace")
        return v.strip()


class WidgetUpdate(BaseModel):
    """Widget 업데이트 요청"""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Widget name")
    type: Optional[str] = Field(None, description="Widget type")
    config: Optional[dict[str, Any]] = Field(None, description="Widget configuration")
    layout: Optional[WidgetLayoutData] = Field(None, description="Widget layout data")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Name cannot be empty or whitespace")
        return v.strip() if v else None


class WidgetResponse(BaseModel):
    """Widget 응답"""
    id: int
    user_id: int
    name: str
    type: str
    config: Optional[dict[str, Any]]
    layout: dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class LayoutBatchUpdate(BaseModel):
    """레이아웃 일괄 업데이트 요청"""
    layouts: list[WidgetLayoutData] = Field(..., description="List of widget layouts to update")

    @field_validator("layouts")
    @classmethod
    def validate_layouts(cls, v: list[WidgetLayoutData]) -> list[WidgetLayoutData]:
        if not v:
            raise ValueError("Layouts list cannot be empty")
        return v
