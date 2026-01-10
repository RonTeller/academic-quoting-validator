"""Quote Extraction Service - Extracts quotes and citations from academic papers."""

import re
from typing import Optional


def extract_quotes(text: str) -> list[dict]:
    """
    Extract all quotes and their associated citations from paper text.

    This identifies:
    - Direct quotes (in quotation marks)
    - Citations in various formats: [1], [Smith2020], (Smith, 2020), etc.

    Args:
        text: The full text of the paper

    Returns:
        List of quote dictionaries with text, context, page, and reference_key
    """
    quotes = []

    # Pattern for quoted text with citation
    # Matches: "quoted text" [1] or "quoted text" (Smith, 2020)
    quote_pattern = r'"([^"]{10,500})"[\s]*(\[[^\]]+\]|\([^)]+,\s*\d{4}[^)]*\))'

    # Split text by pages (assuming "--- Page X ---" markers)
    page_pattern = r'--- Page (\d+) ---'
    pages = re.split(page_pattern, text)

    current_page = 1
    for i, section in enumerate(pages):
        if i % 2 == 1:  # This is a page number
            current_page = int(section)
            continue

        # Find quotes in this section
        for match in re.finditer(quote_pattern, section):
            quote_text = match.group(1)
            citation = match.group(2)

            # Get context (50 chars before and after)
            start = max(0, match.start() - 50)
            end = min(len(section), match.end() + 50)
            context_before = section[start:match.start()].strip()
            context_after = section[match.end():end].strip()

            # Normalize citation key
            reference_key = normalize_citation_key(citation)

            quotes.append({
                "text": quote_text.strip(),
                "reference_key": reference_key,
                "page": current_page,
                "context_before": context_before[-100:] if context_before else None,
                "context_after": context_after[:100] if context_after else None,
            })

    return quotes


def normalize_citation_key(citation: str) -> str:
    """
    Normalize citation to a standard format.

    Examples:
        "[1]" -> "[1]"
        "[Smith2020]" -> "[Smith2020]"
        "(Smith, 2020)" -> "[Smith2020]"
        "(Smith & Jones, 2020)" -> "[SmithJones2020]"
    """
    # Already in bracket format
    if citation.startswith("["):
        return citation.strip()

    # Parenthetical format - convert to bracket
    if citation.startswith("("):
        # Remove parentheses
        inner = citation[1:-1]

        # Extract author and year
        # Pattern: "Author, Year" or "Author & Author, Year"
        match = re.match(r'([^,]+),\s*(\d{4})', inner)
        if match:
            author = match.group(1).replace(" & ", "").replace(" ", "")
            year = match.group(2)
            return f"[{author}{year}]"

    return citation


def extract_citations_only(text: str) -> list[dict]:
    """
    Extract just citation markers without the quoted text.
    Useful for finding all references used in a paper.

    Returns list of unique citation keys found.
    """
    citations = set()

    # Bracket citations: [1], [1,2,3], [Smith2020]
    bracket_pattern = r'\[([^\]]+)\]'
    for match in re.finditer(bracket_pattern, text):
        content = match.group(1)
        # Split multiple citations
        for cite in re.split(r'[,;]', content):
            cite = cite.strip()
            if cite:
                citations.add(f"[{cite}]")

    # Parenthetical citations: (Smith, 2020), (Smith & Jones, 2020)
    paren_pattern = r'\(([A-Z][a-z]+(?:\s*(?:&|and)\s*[A-Z][a-z]+)*,\s*\d{4}[a-z]?)\)'
    for match in re.finditer(paren_pattern, text):
        citations.add(normalize_citation_key(f"({match.group(1)})"))

    return [{"key": cite} for cite in sorted(citations)]
