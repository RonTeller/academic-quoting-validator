from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

from app.models.models import AnalysisStatus, QuoteStatus


# Auth schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Analysis schemas
class AnalysisCreate(BaseModel):
    manual_mode: bool = False


class PaperResponse(BaseModel):
    id: int
    title: Optional[str]
    authors: Optional[str]
    year: Optional[int]
    doi: Optional[str]
    source_type: str
    reference_key: Optional[str]

    class Config:
        from_attributes = True


class AnalysisResponse(BaseModel):
    id: int
    status: AnalysisStatus
    status_message: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    uploaded_paper: Optional[PaperResponse]

    class Config:
        from_attributes = True


class AnalysisListResponse(BaseModel):
    analyses: List[AnalysisResponse]
    total: int


# Quote schemas
class QuoteResponse(BaseModel):
    id: int
    text: str
    page_number: Optional[int]
    context_before: Optional[str]
    context_after: Optional[str]
    reference_key: Optional[str]
    status: QuoteStatus
    grade: Optional[float]
    explanation: Optional[str]
    source_text: Optional[str]
    source_page: Optional[int]

    class Config:
        from_attributes = True


class QuoteDetailResponse(QuoteResponse):
    reference: Optional[PaperResponse]


class QuotesListResponse(BaseModel):
    quotes: List[QuoteResponse]
    total: int
    average_grade: Optional[float]
