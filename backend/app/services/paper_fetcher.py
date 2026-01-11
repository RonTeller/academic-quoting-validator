"""Paper Fetcher Service - Downloads reference papers from various sources."""

import os
import requests
import arxiv
from typing import Optional
from sqlalchemy.orm import Session

from app.models.models import Paper, PaperSourceType
from app.config import get_settings
from app.services.pdf_processor import extract_text_from_pdf

settings = get_settings()


def fetch_paper(paper: Paper, db: Session) -> bool:
    """
    Attempt to download a reference paper from various sources.

    Args:
        paper: Paper model with DOI, arXiv ID, or title to search
        db: Database session

    Returns:
        True if paper was successfully downloaded, False otherwise
    """
    success = False

    # Try arXiv first if we have an arXiv ID
    if paper.arxiv_id:
        success = fetch_from_arxiv(paper, db)
        if success:
            return True

    # Try DOI resolution
    if paper.doi:
        success = fetch_from_doi(paper, db)
        if success:
            return True

    # Try Semantic Scholar
    if paper.title:
        success = fetch_from_semantic_scholar(paper, db)
        if success:
            return True

    return False


def fetch_from_arxiv(paper: Paper, db: Session) -> bool:
    """
    Download paper from arXiv.
    """
    try:
        client = arxiv.Client()

        # Search by arXiv ID if available
        if paper.arxiv_id:
            # Clean up arXiv ID (remove version suffix if present)
            arxiv_id = paper.arxiv_id.split('v')[0]
            search = arxiv.Search(id_list=[arxiv_id])
        elif paper.title:
            # Search by title
            search = arxiv.Search(query=paper.title, max_results=3)
        else:
            return False

        for result in client.results(search):
            # If searching by title, verify it's a reasonable match
            if not paper.arxiv_id and paper.title:
                # Simple check: at least some words match
                title_words = set(paper.title.lower().split())
                result_words = set(result.title.lower().split())
                if len(title_words & result_words) < 2:
                    continue

            # Download PDF
            os.makedirs(settings.upload_dir, exist_ok=True)
            arxiv_id = result.entry_id.split('/')[-1]
            file_path = os.path.join(settings.upload_dir, f"arxiv_{arxiv_id}.pdf")

            result.download_pdf(dirpath=settings.upload_dir, filename=os.path.basename(file_path))

            # Update paper record
            paper.file_path = file_path
            paper.source_type = PaperSourceType.ARXIV
            paper.title = result.title
            paper.authors = ", ".join([a.name for a in result.authors])
            paper.year = result.published.year
            paper.arxiv_id = arxiv_id

            # Extract text
            paper.extracted_text = extract_text_from_pdf(file_path)

            db.commit()
            print(f"arXiv: Downloaded '{result.title}'")
            return True

    except Exception as e:
        print(f"arXiv fetch failed: {e}")
        return False

    return False


def fetch_from_doi(paper: Paper, db: Session) -> bool:
    """
    Try to fetch paper using DOI resolution.
    Many DOIs lead to paywalled content, but some have open access versions.
    """
    try:
        # Try Unpaywall API for open access versions
        unpaywall_url = f"https://api.unpaywall.org/v2/{paper.doi}?email=academic-validator@example.com"
        response = requests.get(unpaywall_url, timeout=10)

        if response.status_code == 200:
            data = response.json()

            # Look for open access PDF
            if data.get("is_oa") and data.get("best_oa_location"):
                pdf_url = data["best_oa_location"].get("url_for_pdf")
                if pdf_url:
                    return download_pdf_from_url(pdf_url, paper, db, PaperSourceType.DOI)

    except Exception as e:
        print(f"DOI fetch failed: {e}")

    return False


def fetch_from_semantic_scholar(paper: Paper, db: Session) -> bool:
    """
    Search Semantic Scholar for the paper.
    """
    try:
        # Search by title
        search_url = "https://api.semanticscholar.org/graph/v1/paper/search"
        params = {
            "query": paper.title or paper.reference_text[:100],
            "fields": "title,authors,year,openAccessPdf,externalIds",
            "limit": 1
        }

        response = requests.get(search_url, params=params, timeout=10)

        if response.status_code == 200:
            data = response.json()
            if data.get("data"):
                result = data["data"][0]

                # Check for open access PDF
                if result.get("openAccessPdf") and result["openAccessPdf"].get("url"):
                    pdf_url = result["openAccessPdf"]["url"]
                    success = download_pdf_from_url(pdf_url, paper, db, PaperSourceType.SEMANTIC_SCHOLAR)

                    if success:
                        # Update metadata
                        paper.title = result.get("title")
                        if result.get("authors"):
                            paper.authors = ", ".join([a["name"] for a in result["authors"]])
                        paper.year = result.get("year")
                        if result.get("externalIds", {}).get("DOI"):
                            paper.doi = result["externalIds"]["DOI"]
                        if result.get("externalIds", {}).get("ArXiv"):
                            paper.arxiv_id = result["externalIds"]["ArXiv"]
                        db.commit()
                        return True

    except Exception as e:
        print(f"Semantic Scholar fetch failed: {e}")

    return False


def download_pdf_from_url(url: str, paper: Paper, db: Session, source_type: PaperSourceType) -> bool:
    """
    Download a PDF from a URL and update the paper record.
    """
    try:
        response = requests.get(url, timeout=30, stream=True)
        if response.status_code == 200 and 'pdf' in response.headers.get('content-type', '').lower():
            os.makedirs(settings.upload_dir, exist_ok=True)

            # Generate filename
            filename = f"{source_type.value}_{paper.id}.pdf"
            file_path = os.path.join(settings.upload_dir, filename)

            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            paper.file_path = file_path
            paper.source_type = source_type
            paper.extracted_text = extract_text_from_pdf(file_path)
            db.commit()

            return True

    except Exception as e:
        print(f"PDF download failed: {e}")

    return False
