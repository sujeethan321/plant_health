from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .database import Base, engine
from .routers import analysis, people, plants


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Routers import both models before their tables are created.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="AI Plant Health Analysis API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(people.router)
app.include_router(plants.router)
app.include_router(analysis.router)
