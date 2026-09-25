from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import trips, journal, gmail, ai

app = FastAPI(title="Travel Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://travelapp129.netlify.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(trips.router, prefix="/api/trips", tags=["trips"])
app.include_router(journal.router, prefix="/api/journal", tags=["journal"])
app.include_router(gmail.router, prefix="/api/gmail", tags=["gmail"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])

@app.get("/")
def root():
    return {"message": "Travel Manager API is running"}
