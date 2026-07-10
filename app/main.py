import os

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import Base, engine, get_db
from app.shortener import generate_unique_code

Base.metadata.create_all(bind=engine)

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")

app = FastAPI(title="URL Shortener")

Instrumentator().instrument(app).expose(app)


@app.post("/shorten", response_model=schemas.URLResponse)
def shorten_url(payload: schemas.URLCreateRequest, db: Session = Depends(get_db)):
    code = generate_unique_code(db)
    url = models.URL(code=code, target_url=str(payload.url))
    db.add(url)
    db.commit()
    db.refresh(url)
    return schemas.URLResponse(
        code=url.code,
        target_url=url.target_url,
        short_url=f"{BASE_URL}/{url.code}",
        created_at=url.created_at,
        visits=url.visits,
    )


@app.get("/{code}")
def redirect_to_target(code: str, db: Session = Depends(get_db)):
    url = db.query(models.URL).filter(models.URL.code == code).first()
    if url is None:
        raise HTTPException(status_code=404, detail="Short URL not found")
    url.visits += 1
    db.commit()
    return RedirectResponse(url.target_url)


@app.get("/api/urls/{code}", response_model=schemas.URLResponse)
def get_url_stats(code: str, db: Session = Depends(get_db)):
    url = db.query(models.URL).filter(models.URL.code == code).first()
    if url is None:
        raise HTTPException(status_code=404, detail="Short URL not found")
    return schemas.URLResponse(
        code=url.code,
        target_url=url.target_url,
        short_url=f"{BASE_URL}/{url.code}",
        created_at=url.created_at,
        visits=url.visits,
    )


@app.get("/api/stats", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    total_links = db.query(func.count(models.URL.id)).scalar()
    total_visits = db.query(func.coalesce(func.sum(models.URL.visits), 0)).scalar()
    return schemas.StatsResponse(total_links=total_links, total_visits=total_visits)
