from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import JournalEntry, JournalEntryCreate
from app.services import db

router = APIRouter()


@router.get("/", response_model=List[dict])
def list_entries():
    return db.get_all_journal()


@router.get("/trip/{trip_id}", response_model=List[dict])
def entries_for_trip(trip_id: int):
    return db.get_journal_for_trip(trip_id)


@router.post("/", response_model=dict, status_code=201)
def create_entry(data: JournalEntryCreate):
    if not db.get_trip(data.trip_id):
        raise HTTPException(status_code=404, detail="Voyage introuvable")
    return db.create_journal_entry(data)


@router.delete("/{entry_id}", status_code=204)
def delete_entry(entry_id: int):
    if not db.delete_journal_entry(entry_id):
        raise HTTPException(status_code=404, detail="Entrée introuvable")
