from datetime import date
from typing import List, Optional
from app.models.schemas import Trip, TripCreate, TripUpdate, JournalEntry, JournalEntryCreate, Expense

# --- In-memory stores (replace with SQLAlchemy for production) ---
_trips: List[dict] = [
    {"id": 1, "from_city": "Alger", "to_city": "Paris", "start": date(2024, 3, 10), "end": date(2024, 3, 17),
     "budget": 1200, "spent": 980, "status": "past", "notes": "Visite famille",
     "expenses": [{"cat": "Vol", "amount": 420}, {"cat": "Hôtel", "amount": 350},
                  {"cat": "Repas", "amount": 150}, {"cat": "Activités", "amount": 60}]},
    {"id": 2, "from_city": "Alger", "to_city": "Istanbul", "start": date(2024, 7, 20), "end": date(2024, 7, 28),
     "budget": 1800, "spent": 2100, "status": "past", "notes": "Voyage culturel",
     "expenses": [{"cat": "Vol", "amount": 680}, {"cat": "Hôtel", "amount": 790},
                  {"cat": "Repas", "amount": 380}, {"cat": "Activités", "amount": 250}]},
    {"id": 3, "from_city": "Paris", "to_city": "Barcelone", "start": date(2025, 9, 5), "end": date(2025, 9, 12),
     "budget": 1500, "spent": 0, "status": "upcoming", "notes": "Vacances d'été", "expenses": []},
]
_journal: List[dict] = [
    {"id": 1, "trip_id": 1, "date": date(2024, 3, 11), "text": "Arrivée à Paris sous la pluie. Promenade sur les Champs-Élysées."},
    {"id": 2, "trip_id": 2, "date": date(2024, 7, 21), "text": "Première journée à Istanbul : la Mosquée Bleue est somptueuse."},
]
_trip_counter = 4
_journal_counter = 3


# --- Trips CRUD ---
def get_all_trips() -> List[dict]:
    return _trips

def get_trip(trip_id: int) -> Optional[dict]:
    return next((t for t in _trips if t["id"] == trip_id), None)

def create_trip(data: TripCreate) -> dict:
    global _trip_counter
    trip = data.model_dump()
    trip["id"] = _trip_counter
    _trips.append(trip)
    _trip_counter += 1
    return trip

def update_trip(trip_id: int, data: TripUpdate) -> Optional[dict]:
    trip = get_trip(trip_id)
    if not trip:
        return None
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    trip.update(updates)
    return trip

def delete_trip(trip_id: int) -> bool:
    global _trips
    before = len(_trips)
    _trips = [t for t in _trips if t["id"] != trip_id]
    return len(_trips) < before


# --- Journal CRUD ---
def get_all_journal() -> List[dict]:
    return sorted(_journal, key=lambda e: e["date"], reverse=True)

def get_journal_for_trip(trip_id: int) -> List[dict]:
    return [e for e in _journal if e["trip_id"] == trip_id]

def create_journal_entry(data: JournalEntryCreate) -> dict:
    global _journal_counter
    entry = data.model_dump()
    entry["id"] = _journal_counter
    entry["date"] = date.today()
    _journal.append(entry)
    _journal_counter += 1
    return entry

def delete_journal_entry(entry_id: int) -> bool:
    global _journal
    before = len(_journal)
    _journal = [e for e in _journal if e["id"] != entry_id]
    return len(_journal) < before
