from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.auth import router as auth_router
from app.routers.projects import router as projects_router
from app.routers.tokens import router as tokens_router
from app.routers.validate import router as validate_router

app = FastAPI(
    title="Valify",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    openapi_url="/openapi.json" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(tokens_router)
app.include_router(validate_router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
