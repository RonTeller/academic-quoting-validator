# Academic Quoting Validator - Project Context

## Project Overview
A web application that helps academics and researchers validate if a given paper correctly quotes other papers it references.

## Core Workflow
1. Researcher uploads an academic paper (PDF) to review
2. An AI agent reads the paper and extracts all quotes/citations with their references
3. The agent automatically downloads referenced papers from the web (arXiv, Semantic Scholar, etc.)
4. If any papers can't be found, the user is prompted to upload them manually
5. The agent reviews if the uploaded paper correctly references the source papers
6. The web application presents each quote separately with:
   - A grade from 1-100
   - A short explanation of why it was graded that way

## Tech Stack Decisions
- **Backend**: Python + FastAPI
- **Frontend**: Next.js (React)
- **Database**: PostgreSQL + SQLAlchemy
- **LLM Provider**: Anthropic Claude
- **Task Queue**: Celery + Redis
- **File Storage**: Local filesystem (S3-ready)

## Key Decisions
- **Paper Access Strategy**: Auto-download by default, with fallback to user upload for unavailable papers. Also supports full manual upload mode.
- **Authentication**: Optional accounts - works anonymously, with optional login to save analysis history

## Project Status
- **Current Phase**: Phase 1 Complete + Tested
- **Repository**: `/Users/ronteller/Projects/academic-quoting-validator`

## Session History

### Session 1 (2026-01-10)
- Project initialized
- Git repository created
- Discussed and decided on tech stack
- Created comprehensive implementation plan
- **Completed Phase 1: Project Setup & Core Infrastructure**
  - FastAPI backend with full project structure
  - SQLAlchemy models (User, Analysis, Paper, Quote)
  - API routes (analysis, quotes, auth)
  - Celery task queue configuration
  - Next.js frontend with Tailwind CSS
  - Docker Compose for local development
  - PDF processing service (PyMuPDF)
  - Quote extraction service
  - Reference parser service
  - Paper fetcher service (arXiv, Semantic Scholar, DOI)
  - Claude-powered quote validation agent

- **Testing Completed**
  - Backend dependencies installed and working
  - FastAPI server starts successfully
  - All API routes registered correctly
  - Database tables create successfully (tested with SQLite)
  - User registration and login working
  - PDF upload endpoint working
  - PDF text extraction working
  - Quote extraction working (finds quotes with citations)
  - Reference parsing working (extracts author, year, key)
  - Frontend builds successfully

## Test Results (2026-01-10)

### Backend Tests Passed:
- `GET /health` - Returns `{"status":"healthy"}`
- `GET /` - Returns API info
- `POST /api/auth/register` - Creates user, returns user object
- `POST /api/auth/login` - Returns JWT token
- `POST /api/analysis/` - Uploads PDF, creates analysis record
- `GET /api/analysis/{id}` - Returns analysis with paper info

### Services Tested:
- **PDF Processor**: Extracts text with page markers
- **Quote Extractor**: Finds quotes in format `"text" [ref]`
- **Reference Parser**: Extracts author, year, key from references

### Fixes Applied:
- Added `email-validator` to requirements
- Fixed bcrypt version (4.0.1) for password hashing
- Added SQLite support for local testing
- Fixed TypeScript target for Set iteration

## Files Created

### Backend (`/backend`)
- `app/main.py` - FastAPI application entry point
- `app/config.py` - Configuration with Pydantic settings
- `app/celery_app.py` - Celery configuration
- `app/tasks.py` - Background task definitions
- `app/models/database.py` - SQLAlchemy database setup
- `app/models/models.py` - Database models
- `app/api/schemas.py` - Pydantic schemas
- `app/api/routes/analysis.py` - Analysis endpoints
- `app/api/routes/quotes.py` - Quote endpoints
- `app/api/routes/auth.py` - Authentication endpoints
- `app/services/pdf_processor.py` - PDF text extraction
- `app/services/quote_extractor.py` - Quote/citation extraction
- `app/services/reference_parser.py` - Reference list parsing
- `app/services/paper_fetcher.py` - Paper downloading
- `app/services/validation_agent.py` - Claude validation
- `requirements.txt` - Python dependencies
- `Dockerfile` - Backend container

### Frontend (`/frontend`)
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page with upload
- `app/analysis/[id]/page.tsx` - Analysis results page
- `app/globals.css` - Global styles
- `components/QuoteCard.tsx` - Quote display component
- `components/MissingPapersUpload.tsx` - Upload missing papers
- `lib/api.ts` - API client
- `package.json` - Node dependencies
- `Dockerfile` - Frontend container
- `tailwind.config.ts` - Tailwind configuration

### Root
- `docker-compose.yml` - Full stack orchestration
- `.env.example` - Environment template
- `.gitignore` - Git ignore rules

## Implementation Phases (Summary)
1. ~~Project Setup & Core Infrastructure~~ **COMPLETE + TESTED**
2. ~~PDF Processing & Text Extraction~~ **TESTED**
3. ~~Reference Paper Acquisition~~ (services created)
4. ~~Quote Validation Agent~~ (service created)
5. Frontend & Results Display (UI created, needs integration)
6. User Accounts & Polish

## How to Run Locally (Without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
echo "DATABASE_URL=sqlite:///./app.db" > .env
echo "ANTHROPIC_API_KEY=your-key-here" >> .env

# Start server
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## How to Run with Docker
```bash
# Create .env with your Anthropic API key
cp .env.example .env
# Edit .env to add ANTHROPIC_API_KEY

docker-compose up
```

## Next Steps
1. Enable Celery tasks (uncomment in analysis.py)
2. Test full workflow with real academic paper
3. Test paper fetching from arXiv/Semantic Scholar
4. Test Claude validation with real quotes
5. Add export functionality (PDF/CSV)
6. Add comprehensive error handling
