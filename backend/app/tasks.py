from app.celery_app import celery_app
from app.models.database import SessionLocal
from app.models.models import Analysis, Paper, Quote, AnalysisStatus, QuoteStatus
from typing import Optional


def process_analysis(analysis_id: int, manual_mode: bool = False):
    """
    Main function to process an uploaded paper.

    Steps:
    1. Extract text from uploaded PDF
    2. Extract quotes and citations
    3. Parse reference list
    4. If not manual_mode: attempt to download reference papers
    5. Validate quotes against source papers
    """
    db = SessionLocal()
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return {"error": "Analysis not found"}

        # Update status to extracting
        analysis.status = AnalysisStatus.EXTRACTING_QUOTES
        analysis.status_message = "Extracting quotes and references from paper..."
        db.commit()

        # Step 1: Extract text from PDF
        from app.services.pdf_processor import extract_text_from_pdf
        paper = analysis.uploaded_paper
        if not paper or not paper.file_path:
            raise ValueError("No uploaded paper found")

        text = extract_text_from_pdf(paper.file_path)
        paper.extracted_text = text
        db.commit()

        # Step 2: Extract quotes and citations
        from app.services.quote_extractor import extract_quotes
        quotes_data = extract_quotes(text)

        # Step 3: Parse reference list
        from app.services.reference_parser import parse_references
        references = parse_references(text)

        # Create paper records for references
        for ref in references:
            ref_paper = Paper(
                title=ref.get("title"),
                authors=ref.get("authors"),
                year=ref.get("year"),
                doi=ref.get("doi"),
                arxiv_id=ref.get("arxiv_id"),
                reference_key=ref.get("key"),
                reference_text=ref.get("raw_text"),
                analysis_id=analysis_id,
            )
            db.add(ref_paper)
        db.commit()

        # Create quote records
        for quote_data in quotes_data:
            quote = Quote(
                text=quote_data["text"],
                page_number=quote_data.get("page"),
                context_before=quote_data.get("context_before"),
                context_after=quote_data.get("context_after"),
                reference_key=quote_data.get("reference_key"),
                analysis_id=analysis_id,
            )
            db.add(quote)
        db.commit()

        if manual_mode:
            # Skip auto-download, wait for user to upload all papers
            analysis.status = AnalysisStatus.AWAITING_UPLOADS
            analysis.status_message = "Please upload the reference papers"
            db.commit()
            return {"status": "awaiting_uploads"}

        # Step 4: Attempt to download reference papers
        analysis.status = AnalysisStatus.FETCHING_REFERENCES
        analysis.status_message = "Downloading reference papers..."
        db.commit()

        from app.services.paper_fetcher import fetch_paper
        ref_papers = db.query(Paper).filter(
            Paper.analysis_id == analysis_id,
            Paper.reference_key.isnot(None)
        ).all()

        missing_papers = []
        for ref_paper in ref_papers:
            success = fetch_paper(ref_paper, db)
            if not success:
                missing_papers.append(ref_paper.reference_key)

        if missing_papers:
            analysis.status = AnalysisStatus.AWAITING_UPLOADS
            analysis.status_message = f"Could not download {len(missing_papers)} reference papers. Please upload them manually."
            db.commit()
            return {"status": "awaiting_uploads", "missing": missing_papers}

        # Step 5: Validate quotes
        return validate_quotes_task(analysis_id)

    except Exception as e:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis:
            analysis.status = AnalysisStatus.FAILED
            analysis.status_message = str(e)
            db.commit()
        raise
    finally:
        db.close()


def validate_quotes_task(analysis_id: int):
    """Validate all quotes in an analysis."""
    db = SessionLocal()
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            return {"error": "Analysis not found"}

        analysis.status = AnalysisStatus.VALIDATING
        analysis.status_message = "Validating quotes against source papers..."
        db.commit()

        from app.services.validation_agent import validate_quote

        quotes = db.query(Quote).filter(Quote.analysis_id == analysis_id).all()

        for quote in quotes:
            try:
                # Find the reference paper
                ref_paper = db.query(Paper).filter(
                    Paper.analysis_id == analysis_id,
                    Paper.reference_key == quote.reference_key
                ).first()

                if not ref_paper or not ref_paper.extracted_text:
                    quote.status = QuoteStatus.FAILED
                    quote.explanation = "Could not find or read the reference paper"
                    db.commit()
                    continue

                # Validate the quote
                result = validate_quote(
                    quote_text=quote.text,
                    context_before=quote.context_before,
                    context_after=quote.context_after,
                    source_text=ref_paper.extracted_text,
                )

                quote.grade = result["grade"]
                quote.explanation = result["explanation"]
                quote.source_text = result.get("source_text")
                quote.source_page = result.get("source_page")
                quote.status = QuoteStatus.VALIDATED

            except Exception as e:
                quote.status = QuoteStatus.FAILED
                quote.explanation = f"Validation error: {str(e)}"

            db.commit()

        analysis.status = AnalysisStatus.COMPLETED
        analysis.status_message = "Analysis complete"
        db.commit()

        return {"status": "completed"}

    except Exception as e:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis:
            analysis.status = AnalysisStatus.FAILED
            analysis.status_message = str(e)
            db.commit()
        raise
    finally:
        db.close()


# Celery task wrappers (for use with Redis/Celery in production)
@celery_app.task(bind=True)
def process_analysis_task(self, analysis_id: int, manual_mode: bool = False):
    """Celery task wrapper for process_analysis."""
    return process_analysis(analysis_id, manual_mode)


@celery_app.task(bind=True)
def continue_analysis_celery_task(self, analysis_id: int):
    """Celery task wrapper for validate_quotes_task."""
    return validate_quotes_task(analysis_id)
