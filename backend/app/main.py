from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.routes import analysis, auth, quotes

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Validate if academic papers correctly quote their references",
    version="0.1.0",
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(quotes.router, prefix="/api/quotes", tags=["quotes"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])


@app.get("/")
async def root():
    return {"message": "Academic Quoting Validator API", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
