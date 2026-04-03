from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
from analyzer import ProfileAnalyzer

app = FastAPI(title="LinkedIn Profile Analyzer API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize analyzer
analyzer = ProfileAnalyzer()

class ProfileData(BaseModel):
    url: str
    timestamp: str
    profile: Dict[str, Any]

class AnalysisResult(BaseModel):
    score: int
    insights: List[Dict[str, str]]
    recommendations: List[str]
    strengths: List[str]
    weaknesses: List[str]

@app.get("/")
async def root():
    return {
        "message": "LinkedIn Profile Analyzer API",
        "version": "1.0.0",
        "endpoints": ["/analyze", "/health"]
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/analyze", response_model=AnalysisResult)
async def analyze_profile(data: ProfileData):
    try:
        result = analyzer.analyze(data.profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
