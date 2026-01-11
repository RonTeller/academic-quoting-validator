"""Quote Validation Agent - Uses Claude to validate quotes against source papers."""

import anthropic
from typing import Optional

from app.config import get_settings

settings = get_settings()

# Lazy initialization of Anthropic client
_client = None


def get_client():
    """Get or create the Anthropic client."""
    global _client
    if _client is None:
        if not settings.anthropic_api_key or settings.anthropic_api_key.startswith("test"):
            raise ValueError("Valid ANTHROPIC_API_KEY is required for quote validation")
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


def validate_quote(
    quote_text: str,
    context_before: Optional[str],
    context_after: Optional[str],
    source_text: str,
) -> dict:
    """
    Validate a quote against the source paper using Claude.

    Args:
        quote_text: The quoted text as it appears in the paper being reviewed
        context_before: Text appearing before the quote
        context_after: Text appearing after the quote
        source_text: The full text of the source paper

    Returns:
        Dictionary with grade (1-100), explanation, source_text, and source_page
    """
    prompt = create_validation_prompt(
        quote_text=quote_text,
        context_before=context_before,
        context_after=context_after,
        source_text=source_text,
    )

    client = get_client()
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        system=SYSTEM_PROMPT,
    )

    # Parse the response
    return parse_validation_response(response.content[0].text)


SYSTEM_PROMPT = """You are an expert academic reviewer specializing in verifying the accuracy of citations and quotes in academic papers. Your task is to validate whether a quote accurately represents the source material.

When validating a quote, consider:
1. ACCURACY: Does the quote match the original text exactly (for direct quotes) or accurately paraphrase (for indirect quotes)?
2. CONTEXT: Does the quote preserve the original meaning and context? Is it taken out of context in a misleading way?
3. ATTRIBUTION: Is the quote properly attributed to the correct part of the source?

Grade quotes on a scale of 1-100:
- 90-100: Excellent - Quote is accurate, properly contextualized, and represents the source faithfully
- 75-89: Good - Minor issues but fundamentally accurate
- 60-74: Fair - Some accuracy or context issues that should be addressed
- 40-59: Poor - Significant problems with accuracy or context
- 1-39: Failing - Seriously misrepresents the source or cannot be verified

Always respond in the exact format specified, with clear sections for the grade, explanation, and source text."""


def create_validation_prompt(
    quote_text: str,
    context_before: Optional[str],
    context_after: Optional[str],
    source_text: str,
) -> str:
    """Create the validation prompt for Claude."""

    # Truncate source text if too long (keep first and last parts)
    max_source_length = 50000
    if len(source_text) > max_source_length:
        half = max_source_length // 2
        source_text = source_text[:half] + "\n\n[... content truncated ...]\n\n" + source_text[-half:]

    context_str = ""
    if context_before:
        context_str += f"Context before: ...{context_before}\n"
    context_str += f"QUOTE: \"{quote_text}\"\n"
    if context_after:
        context_str += f"Context after: {context_after}...\n"

    return f"""Please validate the following quote from an academic paper against its source.

## Quote to Validate
{context_str}

## Source Paper Text
{source_text}

## Instructions
1. Search the source paper for text matching or similar to the quote
2. Evaluate accuracy, context preservation, and proper representation
3. Provide your assessment in the following exact format:

GRADE: [number 1-100]

EXPLANATION: [2-4 sentences explaining your grade, noting any issues found]

SOURCE_TEXT: [The exact text from the source paper that the quote references, or "NOT FOUND" if you cannot locate it]

SOURCE_PAGE: [Page number if identifiable, or "UNKNOWN"]"""


def parse_validation_response(response_text: str) -> dict:
    """Parse Claude's response into structured data."""
    result = {
        "grade": None,
        "explanation": None,
        "source_text": None,
        "source_page": None,
    }

    lines = response_text.strip().split('\n')
    current_field = None
    current_value = []

    for line in lines:
        line = line.strip()

        if line.startswith("GRADE:"):
            if current_field and current_value:
                result[current_field] = ' '.join(current_value).strip()
            current_field = "grade"
            grade_str = line.replace("GRADE:", "").strip()
            try:
                result["grade"] = float(grade_str)
            except ValueError:
                # Try to extract number
                import re
                match = re.search(r'(\d+)', grade_str)
                if match:
                    result["grade"] = float(match.group(1))
            current_value = []

        elif line.startswith("EXPLANATION:"):
            if current_field and current_value:
                result[current_field] = ' '.join(current_value).strip()
            current_field = "explanation"
            current_value = [line.replace("EXPLANATION:", "").strip()]

        elif line.startswith("SOURCE_TEXT:"):
            if current_field and current_value:
                result[current_field] = ' '.join(current_value).strip()
            current_field = "source_text"
            current_value = [line.replace("SOURCE_TEXT:", "").strip()]

        elif line.startswith("SOURCE_PAGE:"):
            if current_field and current_value:
                result[current_field] = ' '.join(current_value).strip()
            current_field = "source_page"
            page_str = line.replace("SOURCE_PAGE:", "").strip()
            if page_str.lower() != "unknown":
                try:
                    result["source_page"] = int(page_str)
                except ValueError:
                    import re
                    match = re.search(r'(\d+)', page_str)
                    if match:
                        result["source_page"] = int(match.group(1))
            current_value = []

        elif current_field and line:
            current_value.append(line)

    # Handle last field
    if current_field and current_value:
        if current_field not in ["grade", "source_page"]:
            result[current_field] = ' '.join(current_value).strip()

    # Ensure grade is within bounds
    if result["grade"] is not None:
        result["grade"] = max(1, min(100, result["grade"]))

    # Handle NOT FOUND case
    if result["source_text"] and result["source_text"].upper() == "NOT FOUND":
        result["source_text"] = None

    return result
