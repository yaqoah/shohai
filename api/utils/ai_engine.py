import os
import logging
from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 1. Strict Data Structures
class NodeModel(BaseModel):
    id: str
    label: str
    type: Literal["trigger", "process", "output"]

class AIExtractionResponse(BaseModel):
    job_title: str = Field(default="N/A")
    company_name: str = Field(default="N/A")
    detected_bottleneck: str
    estimated_monthly_tasks: int = Field(default=1000)
    inferred_seniority: Literal["Junior", "Mid", "Senior"] = Field(default="Mid")
    proposed_nodes: List[NodeModel]

from api.utils.calculator import CalculatedFinancials, TimelinePhase

class AnalysisResponse(AIExtractionResponse):
    calculated_financials: CalculatedFinancials
    implementation_timeline: List[TimelinePhase]

class AnalysisRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded string of the job posting screenshot")

# 3. Langfuse Tracing & Observability
langfuse_client = None

try:
    from langfuse import Langfuse, observe as langfuse_observe
    if os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY") and os.getenv("LANGFUSE_HOST"):
        langfuse_client = Langfuse()
        logger.info("Langfuse tracing initialized successfully.")
    else:
        logger.warning("Langfuse credentials not present. Tracing disabled.")
except ImportError:
    logger.warning("langfuse package not found. Tracing disabled.")

# Defensive dummy decorator if langfuse isn't available
def observe(*args, **kwargs):
    if langfuse_client:
        return langfuse_observe(*args, **kwargs)
    def decorator(func):
        return func
    return decorator

def flush_langfuse():
    if langfuse_client:
        langfuse_client.flush()

# Initialize Mistral Client
mistral_client = None
try:
    from mistralai.client import Mistral
    MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
    if MISTRAL_API_KEY:
        mistral_client = Mistral(api_key=MISTRAL_API_KEY)
    else:
        logger.warning("MISTRAL_API_KEY not found in environment.")
except ImportError:
    logger.warning("mistralai package not found.")

# 2. Mistral AI Integration
@observe(as_type="generation")
def analyze_job_posting_image(base64_image: str) -> AIExtractionResponse:
    if not mistral_client:
        raise ValueError("Mistral client not initialized. Check API key.")
        
    system_prompt = """You are a Principal Automation Systems Architect.
Analyze the provided job posting image and extract details. 
Completely ignore creative or human-centric tasks (e.g., team-building, strategy).
Isolate raw administrative or data-ingestion bottlenecks (e.g., copy-pasting, visual invoice parsing, record updates).
You MUST output your response matching the provided JSON schema.
"""
    
    image_url = base64_image
    if not image_url.startswith("data:image"):
        image_url = f"data:image/jpeg;base64,{base64_image}"

    messages = [
        {
            "role": "system",
            "content": system_prompt
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Analyze this job posting and extract the required automation data."},
                {"type": "image_url", "image_url": image_url}
            ]
        }
    ]
    
    try:
        # Utilizing mistralai SDK v1+ structured outputs capabilities
        chat_response = mistral_client.chat.parse(
            model="pixtral-12b-2409",
            messages=messages,
            response_format=AIExtractionResponse,
            temperature=0.1
        )
        
        result = chat_response.choices[0].message.parsed
        
        # Track usage in Langfuse manually since we use mistralai natively
        if langfuse_client:
            try:
                langfuse_client.update_current_generation(
                    usage={
                        "prompt_tokens": chat_response.usage.prompt_tokens,
                        "completion_tokens": chat_response.usage.completion_tokens,
                        "total_tokens": chat_response.usage.total_tokens
                    },
                    model="pixtral-12b-2409"
                )
            except Exception as e:
                logger.warning(f"Could not update langfuse context: {e}")
            
        return result
        
    except Exception as e:
        logger.error(f"Error during Mistral API call: {e}")
        raise ValueError(f"Failed to analyze image: {str(e)}")
