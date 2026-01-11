# Academic Quoting Validator

A web application that helps academics validate if a paper correctly quotes its references. Upload a paper, and an AI agent will extract quotes, download referenced papers, and grade each quote (1-100) with detailed explanations.

## Features

- **PDF Upload**: Upload academic papers in PDF format
- **Automatic Quote Extraction**: AI identifies all quotes and citations in the paper
- **Reference Paper Fetching**: Automatically downloads reference papers from:
  - arXiv
  - Semantic Scholar
  - DOI resolution (via Unpaywall)
- **Manual Upload Fallback**: Upload reference papers that couldn't be automatically found
- **AI-Powered Validation**: Each quote is validated against the source material using Claude
- **Detailed Grading**: Quotes are graded 1-100 with explanations covering:
  - Accuracy (exact match vs. paraphrase)
  - Context preservation
  - Proper attribution

## Tech Stack

- **Backend**: Python 3.9+ with FastAPI
- **Frontend**: Next.js 14 with React and Tailwind CSS
- **Database**: PostgreSQL (production) / SQLite (development)
- **Task Queue**: Celery with Redis (optional for production)
- **AI**: Anthropic Claude API
- **PDF Processing**: PyMuPDF

## Quick Start (Local Development)

### Prerequisites

- Python 3.9+
- Node.js 18+
- An Anthropic API key (get one at https://console.anthropic.com)

### 1. Clone the Repository

```bash
git clone https://github.com/RonTeller/academic-quoting-validator.git
cd academic-quoting-validator
```

### 2. Set Up the Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=sqlite:///./test.db
REDIS_URL=redis://localhost:6379/0
ANTHROPIC_API_KEY=your-api-key-here
SECRET_KEY=your-secret-key-here
DEBUG=true
EOF

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The backend will be available at http://localhost:8000

### 3. Set Up the Frontend

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at http://localhost:3000

### 4. Use the Application

1. Open http://localhost:3000 in your browser
2. Upload a PDF of an academic paper
3. Wait for the analysis to complete
4. Review the quote validation results

## Running with Docker (Production-like)

For a production-like setup with PostgreSQL, Redis, and Celery:

### Prerequisites

- Docker and Docker Compose
- An Anthropic API key

### Start All Services

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY=your-api-key-here

# Start all services
docker-compose up --build
```

This will start:
- PostgreSQL database (port 5432)
- Redis (port 6379)
- FastAPI backend (port 8000)
- Celery worker (for background tasks)
- Next.js frontend (port 3000)

Access the application at http://localhost:3000

### Stop Services

```bash
docker-compose down

# To also remove volumes (database data):
docker-compose down -v
```

## Project Structure

```
academic-quoting-validator/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # API endpoints
│   │   ├── models/          # SQLAlchemy models
│   │   ├── services/        # Business logic
│   │   │   ├── pdf_processor.py      # PDF text extraction
│   │   │   ├── quote_extractor.py    # Quote/citation extraction
│   │   │   ├── reference_parser.py   # Reference list parsing
│   │   │   ├── paper_fetcher.py      # Paper downloading
│   │   │   └── validation_agent.py   # Claude-based validation
│   │   ├── config.py        # Configuration
│   │   ├── main.py          # FastAPI app
│   │   └── tasks.py         # Background tasks
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and API client
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/` | Upload a paper and start analysis |
| GET | `/api/analysis/{id}` | Get analysis status and details |
| GET | `/api/analysis/{id}/quotes` | Get all quotes with grades |
| GET | `/api/analysis/{id}/missing-papers` | Get papers that need manual upload |
| POST | `/api/analysis/{id}/papers` | Upload a reference paper |
| POST | `/api/analysis/{id}/continue` | Continue analysis after uploading papers |

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `sqlite:///./test.db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `ANTHROPIC_API_KEY` | Anthropic API key | Required |
| `SECRET_KEY` | JWT secret key | Required for auth |
| `DEBUG` | Enable debug mode | `false` |
| `UPLOAD_DIR` | Directory for uploaded files | `./uploads` |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Style

The project uses:
- Python: Standard Python conventions
- TypeScript/React: ESLint with Next.js config
- CSS: Tailwind CSS

## Grading Scale

Quotes are graded on a 1-100 scale:

| Grade | Label | Description |
|-------|-------|-------------|
| 90-100 | Excellent | Quote is accurate, properly contextualized |
| 75-89 | Good | Minor issues but fundamentally accurate |
| 60-74 | Fair | Some accuracy or context issues |
| 40-59 | Poor | Significant problems with accuracy or context |
| 1-39 | Inaccurate | Seriously misrepresents the source |

## Limitations

- PDF text extraction may not work perfectly on all documents (especially scanned PDFs)
- Reference paper fetching depends on open access availability
- Rate limits apply to external APIs (arXiv, Semantic Scholar)
- Quote validation quality depends on AI model performance

## License

MIT License

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
