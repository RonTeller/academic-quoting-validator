"""Reference Parser Service - Parses reference lists from academic papers."""

import re
from typing import Optional


def parse_references(text: str) -> list[dict]:
    """
    Parse the reference/bibliography section of a paper.

    Args:
        text: Full paper text

    Returns:
        List of reference dictionaries with key, title, authors, year, doi, arxiv_id
    """
    references = []

    # Find the references section
    ref_section = extract_references_section(text)
    if not ref_section:
        return references

    # Split into individual references
    # Common patterns: numbered [1], [2] or just line breaks
    ref_entries = split_references(ref_section)

    for entry in ref_entries:
        parsed = parse_single_reference(entry)
        if parsed:
            references.append(parsed)

    return references


def extract_references_section(text: str) -> Optional[str]:
    """
    Extract the references/bibliography section from paper text.
    """
    # Common section headers
    headers = [
        r'References\s*\n',
        r'Bibliography\s*\n',
        r'REFERENCES\s*\n',
        r'BIBLIOGRAPHY\s*\n',
        r'Works Cited\s*\n',
    ]

    for pattern in headers:
        match = re.search(pattern, text)
        if match:
            # Return everything after the header
            return text[match.end():]

    return None


def split_references(ref_section: str) -> list[str]:
    """
    Split reference section into individual entries.
    """
    entries = []

    # Try numbered format first: [1], [2], etc.
    numbered_pattern = r'\[(\d+)\]'
    numbered_splits = re.split(numbered_pattern, ref_section)

    if len(numbered_splits) > 2:
        # Numbered format found
        for i in range(1, len(numbered_splits), 2):
            num = numbered_splits[i]
            text = numbered_splits[i + 1] if i + 1 < len(numbered_splits) else ""
            entries.append(f"[{num}] {text.strip()}")
        return entries

    # Try splitting by blank lines or numbered lists
    lines = ref_section.split('\n')
    current_entry = []

    for line in lines:
        line = line.strip()
        if not line:
            if current_entry:
                entries.append(' '.join(current_entry))
                current_entry = []
        else:
            current_entry.append(line)

    if current_entry:
        entries.append(' '.join(current_entry))

    return entries


def parse_single_reference(entry: str) -> Optional[dict]:
    """
    Parse a single reference entry.
    """
    entry = entry.strip()
    if len(entry) < 20:  # Too short to be a real reference
        return None

    result = {
        "raw_text": entry,
        "key": None,
        "title": None,
        "authors": None,
        "year": None,
        "doi": None,
        "arxiv_id": None,
    }

    # Extract reference key if numbered
    key_match = re.match(r'\[([^\]]+)\]', entry)
    if key_match:
        result["key"] = f"[{key_match.group(1)}]"

    # Extract year (4-digit number, typically 1900-2030)
    year_match = re.search(r'\b(19|20)\d{2}\b', entry)
    if year_match:
        result["year"] = int(year_match.group())

    # Extract DOI
    doi_match = re.search(r'(?:doi[:\s]*)?10\.\d{4,}/[^\s]+', entry, re.IGNORECASE)
    if doi_match:
        result["doi"] = doi_match.group().lower().replace('doi:', '').replace('doi', '').strip()

    # Extract arXiv ID
    arxiv_match = re.search(r'arXiv[:\s]*(\d{4}\.\d{4,5}(?:v\d+)?)', entry, re.IGNORECASE)
    if arxiv_match:
        result["arxiv_id"] = arxiv_match.group(1)

    # Try to extract title (usually in quotes or after authors)
    # This is a simplified heuristic
    title_match = re.search(r'"([^"]{10,200})"', entry)
    if title_match:
        result["title"] = title_match.group(1)
    else:
        # Try to find title after period following authors
        # Pattern: Authors. Title. Journal...
        parts = entry.split('. ')
        if len(parts) >= 2:
            # Skip the key and author part
            potential_title = parts[1] if result["key"] else parts[0]
            if len(potential_title) > 10:
                result["title"] = potential_title[:200]

    # Extract authors (usually at the beginning)
    if result["key"]:
        # After the [key], before the year or title
        author_section = entry[len(result["key"]):].strip()
    else:
        author_section = entry

    # Authors typically end with year in parentheses or period
    author_match = re.match(r'^([^.]+?)(?:\s*\(\d{4}\)|\.)', author_section)
    if author_match:
        result["authors"] = author_match.group(1).strip()

    return result
