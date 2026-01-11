from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid

from app.models.database import get_db
from app.models.models import Analysis, Paper, AnalysisStatus, PaperSourceType
from app.config import get_settings
from app.api.schemas import AnalysisResponse, AnalysisCreate, AnalysisListResponse

router = APIRouter()
settings = get_settings()


def run_analysis_sync(analysis_id: int, manual_mode: bool = False):
    """Run analysis synchronously (for testing without Celery/Redis)."""
    from app.tasks import process_analysis
    # Call the task function directly (not as Celery task)
    process_analysis(analysis_id, manual_mode=manual_mode)


@router.post("/", response_model=AnalysisResponse)
async def create_analysis(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    manual_mode: bool = Form(False),
    db: Session = Depends(get_db),
):
    """
    Start a new analysis by uploading a paper to validate.

    - manual_mode: If True, user will upload all reference papers manually.
                   If False (default), system will try to download references automatically.
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Create upload directory if it doesn't exist
    os.makedirs(settings.upload_dir, exist_ok=True)

    # Save uploaded file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(settings.upload_dir, f"{file_id}.pdf")

    content = await file.read()
    if len(content) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large. Maximum size is {settings.max_upload_size_mb}MB")

    with open(file_path, "wb") as f:
        f.write(content)

    # Create analysis record
    analysis = Analysis(status=AnalysisStatus.PENDING)
    db.add(analysis)
    db.flush()

    # Create paper record for uploaded file
    paper = Paper(
        title=file.filename.replace(".pdf", ""),
        file_path=file_path,
        source_type=PaperSourceType.UPLOADED,
        analysis_id=analysis.id,
    )
    db.add(paper)
    db.flush()

    # Link paper to analysis
    analysis.uploaded_paper_id = paper.id
    db.commit()
    db.refresh(analysis)

    # Trigger background processing
    # Uses FastAPI BackgroundTasks (works without Redis/Celery)
    background_tasks.add_task(run_analysis_sync, analysis.id, manual_mode)

    return analysis


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """Get the status and results of an analysis."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


@router.post("/{analysis_id}/papers")
async def upload_reference_paper(
    analysis_id: int,
    file: UploadFile = File(...),
    reference_key: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Upload a reference paper that couldn't be automatically downloaded.
    reference_key should match the citation key (e.g., "[1]" or "[Smith2020]").
    """
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    if analysis.status != AnalysisStatus.AWAITING_UPLOADS:
        raise HTTPException(
            status_code=400,
            detail="Analysis is not awaiting paper uploads"
        )

    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Save file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(settings.upload_dir, f"{file_id}.pdf")

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Find and update the reference paper record
    paper = db.query(Paper).filter(
        Paper.analysis_id == analysis_id,
        Paper.reference_key == reference_key,
        Paper.file_path.is_(None)
    ).first()

    if paper:
        paper.file_path = file_path
        paper.source_type = PaperSourceType.MANUAL
    else:
        # Create new paper record
        paper = Paper(
            title=file.filename.replace(".pdf", ""),
            file_path=file_path,
            source_type=PaperSourceType.MANUAL,
            reference_key=reference_key,
            analysis_id=analysis_id,
        )
        db.add(paper)

    db.commit()

    # Check if all required papers are now uploaded
    missing_papers = db.query(Paper).filter(
        Paper.analysis_id == analysis_id,
        Paper.file_path.is_(None),
        Paper.reference_key.isnot(None)
    ).count()

    return {
        "message": "Paper uploaded successfully",
        "missing_papers_count": missing_papers
    }


@router.get("/{analysis_id}/missing-papers")
async def get_missing_papers(analysis_id: int, db: Session = Depends(get_db)):
    """Get list of reference papers that need to be uploaded manually."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    missing_papers = db.query(Paper).filter(
        Paper.analysis_id == analysis_id,
        Paper.file_path.is_(None),
        Paper.reference_key.isnot(None)
    ).all()

    return {
        "missing_papers": [
            {
                "reference_key": p.reference_key,
                "reference_text": p.reference_text,
                "title": p.title,
                "doi": p.doi,
            }
            for p in missing_papers
        ]
    }


def run_continue_analysis_sync(analysis_id: int):
    """Continue analysis synchronously after missing papers uploaded."""
    from app.tasks import validate_quotes_task
    validate_quotes_task(analysis_id)


@router.post("/{analysis_id}/continue")
async def continue_analysis(
    analysis_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Continue analysis after uploading missing papers."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    if analysis.status != AnalysisStatus.AWAITING_UPLOADS:
        raise HTTPException(status_code=400, detail="Analysis is not awaiting uploads")

    # Trigger background validation
    background_tasks.add_task(run_continue_analysis_sync, analysis_id)

    return {"message": "Analysis resumed"}
