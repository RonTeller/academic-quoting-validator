"""PDF Processing Service - Extracts text from PDF files."""

import fitz  # PyMuPDF


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract all text content from a PDF file.

    Args:
        file_path: Path to the PDF file

    Returns:
        Extracted text content
    """
    text_parts = []

    with fitz.open(file_path) as doc:
        for page_num, page in enumerate(doc):
            text = page.get_text()
            if text.strip():
                text_parts.append(f"--- Page {page_num + 1} ---\n{text}")

    return "\n\n".join(text_parts)


def extract_text_by_page(file_path: str) -> list[dict]:
    """
    Extract text from each page separately.

    Args:
        file_path: Path to the PDF file

    Returns:
        List of dicts with page_number and text
    """
    pages = []

    with fitz.open(file_path) as doc:
        for page_num, page in enumerate(doc):
            pages.append({
                "page_number": page_num + 1,
                "text": page.get_text()
            })

    return pages
