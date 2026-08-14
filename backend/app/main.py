from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.auth.router import router as auth_router
from app.routers.tools import router as tools_router
from app.database import db_manager
from app.auth.security import hash_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed default admin user if not exists
    admin_user = db_manager.get_user_by_email_or_username("admin")
    if not admin_user:
        hashed = hash_password("admin123")
        db_manager.create_user(
            user_id="usr_admin_001",
            email="admin@extractiontools.com",
            username="admin",
            hashed_password=hashed,
            full_name="Administrator"
        )
        print("Default user seeded: username='admin' / password='admin123'")
    yield
    # Shutdown logic if any


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="High-performance data extraction, subset matching, and overtime recap web API with 1-Device Session Locking.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(tools_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "session_store": "active"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
