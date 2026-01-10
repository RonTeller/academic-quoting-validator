from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.database import get_db
from app.models.models import Quote, Analysis, QuoteStatus
from app.api.schemas import QuoteResponse, QuoteDetailResponse, QuotesListResponse

router = APIRouter()


@router.get("/analysis/{analysis_id}", response_model=QuotesListResponse)
async def get_quotes_for_analysis(
    analysis_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Get all quotes for an analysis with their grades."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    quotes = db.query(Quote).filter(
        Quote.analysis_id == analysis_id
    ).offset(skip).limit(limit).all()

    total = db.query(Quote).filter(Quote.analysis_id == analysis_id).count()

    # Calculate average grade for validated quotes
    avg_grade = db.query(func.avg(Quote.grade)).filter(
        Quote.analysis_id == analysis_id,
        Quote.status == QuoteStatus.VALIDATED,
        Quote.grade.isnot(None)
    ).scalar()

    return QuotesListResponse(
        quotes=quotes,
        total=total,
        average_grade=round(avg_grade, 1) if avg_grade else None
    )


@router.get("/{quote_id}", response_model=QuoteDetailResponse)
async def get_quote(quote_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific quote."""
    quote = db.query(Quote).filter(Quote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote
