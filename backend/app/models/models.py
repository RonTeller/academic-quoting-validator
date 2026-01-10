from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.models.database import Base


class AnalysisStatus(str, enum.Enum):
    PENDING = "pending"
    EXTRACTING_QUOTES = "extracting_quotes"
    FETCHING_REFERENCES = "fetching_references"
    AWAITING_UPLOADS = "awaiting_uploads"
    VALIDATING = "validating"
    COMPLETED = "completed"
    FAILED = "failed"


class PaperSourceType(str, enum.Enum):
    UPLOADED = "uploaded"  # User uploaded
    ARXIV = "arxiv"
    SEMANTIC_SCHOLAR = "semantic_scholar"
    PUBMED = "pubmed"
    DOI = "doi"
    MANUAL = "manual"  # User uploaded as fallback


class QuoteStatus(str, enum.Enum):
    PENDING = "pending"
    VALIDATED = "validated"
    FAILED = "failed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    analyses = relationship("Analysis", back_populates="user")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.PENDING)
    status_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Optional user association
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="analyses")

    # The main paper being analyzed
    uploaded_paper_id = Column(Integer, ForeignKey("papers.id"), nullable=True)
    uploaded_paper = relationship("Paper", foreign_keys=[uploaded_paper_id], post_update=True)

    # All papers (uploaded + references)
    papers = relationship("Paper", back_populates="analysis", foreign_keys="Paper.analysis_id")
    quotes = relationship("Quote", back_populates="analysis")


class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=True)
    authors = Column(Text, nullable=True)  # JSON array of authors
    year = Column(Integer, nullable=True)
    doi = Column(String(255), nullable=True, index=True)
    arxiv_id = Column(String(50), nullable=True, index=True)
    file_path = Column(String(500), nullable=True)
    source_type = Column(Enum(PaperSourceType), default=PaperSourceType.UPLOADED)
    extracted_text = Column(Text, nullable=True)

    # Reference info (from the uploaded paper's reference list)
    reference_key = Column(String(50), nullable=True)  # e.g., "[1]", "[Smith2020]"
    reference_text = Column(Text, nullable=True)  # Original reference text

    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=True)
    analysis = relationship("Analysis", back_populates="papers", foreign_keys=[analysis_id])

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)

    # The quote as it appears in the uploaded paper
    text = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    context_before = Column(Text, nullable=True)
    context_after = Column(Text, nullable=True)

    # Reference to the source paper
    reference_id = Column(Integer, ForeignKey("papers.id"), nullable=True)
    reference = relationship("Paper")
    reference_key = Column(String(50), nullable=True)  # The citation marker, e.g., "[1]"

    # Validation results
    status = Column(Enum(QuoteStatus), default=QuoteStatus.PENDING)
    grade = Column(Float, nullable=True)  # 1-100
    explanation = Column(Text, nullable=True)
    source_text = Column(Text, nullable=True)  # The original text from the source paper
    source_page = Column(Integer, nullable=True)

    analysis_id = Column(Integer, ForeignKey("analyses.id"), nullable=False)
    analysis = relationship("Analysis", back_populates="quotes")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
