from datetime import datetime

from pydantic import BaseModel, HttpUrl


class URLCreateRequest(BaseModel):
    url: HttpUrl


class URLResponse(BaseModel):
    code: str
    target_url: str
    short_url: str
    created_at: datetime
    visits: int

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_links: int
    total_visits: int
