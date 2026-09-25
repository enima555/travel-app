from pydantic import BaseModel
from typing import Optional, List
from datetime import date


class Expense(BaseModel):
    cat: str
    amount: float


class TripCreate(BaseModel):
    from_city: str
    to_city: str
    start: date
    end: Optional[date] = None
    budget: float = 0
    spent: float = 0
    status: str = "planning"  # planning | upcoming | past
    notes: Optional[str] = ""
    expenses: List[Expense] = []


class TripUpdate(BaseModel):
    from_city: Optional[str] = None
    to_city: Optional[str] = None
    start: Optional[date] = None
    end: Optional[date] = None
    budget: Optional[float] = None
    spent: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    expenses: Optional[List[Expense]] = None


class Trip(TripCreate):
    id: int

    class Config:
        from_attributes = True


class JournalEntryCreate(BaseModel):
    trip_id: int
    text: str


class JournalEntry(JournalEntryCreate):
    id: int
    date: date

    class Config:
        from_attributes = True


class AIQuery(BaseModel):
    question: str
    trips_context: Optional[str] = ""


class DetectRequest(BaseModel):
    text: str
