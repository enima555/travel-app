from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import Trip, TripCreate, TripUpdate
from app.services import db

router = APIRouter()


@router.get("/", response_model=List[dict])
def list_trips():
    return db.get_all_trips()


@router.get("/{trip_id}", response_model=dict)
def get_trip(trip_id: int):
    trip = db.get_trip(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Voyage introuvable")
    return trip


@router.post("/", response_model=dict, status_code=201)
def create_trip(data: TripCreate):
    return db.create_trip(data)


@router.patch("/{trip_id}", response_model=dict)
def update_trip(trip_id: int, data: TripUpdate):
    trip = db.update_trip(trip_id, data)
    if not trip:
        raise HTTPException(status_code=404, detail="Voyage introuvable")
    return trip


@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: int):
    if not db.delete_trip(trip_id):
        raise HTTPException(status_code=404, detail="Voyage introuvable")
