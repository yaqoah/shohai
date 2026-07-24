import os
import time
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from api.utils.ai_engine import AnalysisRequest, AnalysisResponse, analyze_job_posting_image, observe, flush_langfuse
from api.utils.calculator import compute_arbitrage_metrics, get_implementation_timeline

# Record startup time for uptime calculation
START_TIME = time.time()

app = FastAPI(
    title="Shōhai API",
    description="Serverless FastAPI backend for Shōhai on Vercel",
    version="1.0.0",
)

# CORS Configuration
# Whitelist local dev and allow production domains from environment variables
origins = [
    "http://localhost:5173",
]

# Add production domains from environment variables if present
PROD_FRONTEND_URL = os.getenv("PROD_FRONTEND_URL")
if PROD_FRONTEND_URL:
    # Handle multiple comma-separated URLs if needed
    origins.extend([url.strip() for url in PROD_FRONTEND_URL.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Generic Exception Handler to prevent serverless execution crashes
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": "An unexpected server error occurred.", "details": str(exc)},
    )

@app.get("/api/health")
async def health_check():
    """
    Diagnostics route returning system uptime, system status, and confirmation of environment variable loads.
    """
    uptime_seconds = time.time() - START_TIME
    
    # Check if critical environment variables are loaded
    env_vars_loaded = {
        "MISTRAL_API_KEY": os.getenv("MISTRAL_API_KEY") is not None,
    }
    
    return {
        "status": "active",
        "uptime_seconds": round(uptime_seconds, 2),
        "environment_variables": env_vars_loaded
    }

@app.post("/api/analyze", response_model=AnalysisResponse)
@observe()
async def analyze_image(request: AnalysisRequest):
    """
    Endpoint that accepts a Base64 image payload in an AnalysisRequest,
    processes it with Mistral AI, calculates financials and timeline, 
    and returns the strictly structured AnalysisResponse.
    """
    try:
        extraction = analyze_job_posting_image(request.image)
        
        financials = compute_arbitrage_metrics(
            inferred_seniority=extraction.inferred_seniority,
            estimated_monthly_tasks=extraction.estimated_monthly_tasks,
            extracted_annual_salary=extraction.extracted_annual_salary,
            salary_currency=extraction.salary_currency or "USD"
        )
        
        # Use AI-generated timeline if available, otherwise fall back to calculator
        ai_timeline = extraction.implementation_timeline
        if ai_timeline and len(ai_timeline) >= 3:
            timeline = ai_timeline
        else:
            timeline = get_implementation_timeline(detected_bottleneck=extraction.detected_bottleneck)
        
        # Build response - exclude implementation_timeline from extraction to avoid duplicate
        extraction_dict = extraction.model_dump()
        extraction_dict.pop('implementation_timeline', None)
        
        response = AnalysisResponse(
            **extraction_dict,
            calculated_financials=financials,
            implementation_timeline=timeline
        )
        
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
    finally:
        flush_langfuse()

