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
    description: str = Field(..., description="Precise operational behavior of this pipeline node")

from api.utils.calculator import CalculatedFinancials, TimelinePhase

class AIExtractionResponse(BaseModel):
    job_title: str = Field(default="N/A")
    company_name: str = Field(default="N/A")
    extracted_job_description: str = Field(..., description="Clean, formatted text of the parsed job description")
    detected_bottleneck: str
    estimated_monthly_tasks: int = Field(default=1000)
    inferred_seniority: Literal["Junior", "Mid", "Senior"] = Field(default="Mid")
    extracted_annual_salary: Optional[float] = Field(default=None, description="Extracted annual salary in USD from job posting")
    salary_currency: Optional[str] = Field(default="USD", description="Original currency of extracted salary (USD, AED, EUR, etc.)")
    proposed_nodes: List[NodeModel]
    implementation_timeline: Optional[List[TimelinePhase]] = Field(default=None, description="Three phases for implementing the AI solution, customized to this specific job")

class AnalysisResponse(AIExtractionResponse):
    calculated_financials: CalculatedFinancials

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

# Currency conversion rates to USD (approximate, as of 2024)
CURRENCY_TO_USD = {
    'USD': 1.0,
    'AED': 3.67,   # UAE Dirham
    'EUR': 1.1,   # Euro
    'GBP': 1.27,  # British Pound
    'CAD': 0.74,  # Canadian Dollar
    'AUD': 0.67,  # Australian Dollar
    'JPY': 0.0067, # Japanese Yen
    'INR': 0.012, # Indian Rupee
    'SGD': 0.74,  # Singapore Dollar
    'HKD': 0.13,  # Hong Kong Dollar
}

# Currency symbols for extraction
CURRENCY_SYMBOLS = {'$': 'USD', '£': 'GBP', '€': 'EUR', 'AED': 'AED', 'AED ': 'AED'}


def convert_to_usd(amount: float, currency: str = 'USD') -> float:
    """Convert an amount to USD using approximate exchange rates."""
    rate = CURRENCY_TO_USD.get(currency.upper(), 1.0)
    return amount / rate
@observe(as_type="generation")
def analyze_job_posting_image(base64_image: str) -> AIExtractionResponse:
    if not mistral_client:
        raise ValueError("Mistral client not initialized. Check API key.")
        
    system_prompt = """You are a Principal Automation Systems Architect.
Analyze the provided job posting image and extract details. 
Completely ignore creative or human-centric tasks (e.g., team-building, strategy).
Isolate raw administrative or data-ingestion bottlenecks (e.g., copy-pasting, visual invoice parsing, record updates).

STRICT OUTPUT CONSTRAINTS:
- detected_bottleneck: MUST be strictly 1 sentence maximum (under 25 words). Be concise and direct.
- Each proposed node's description field: MUST describe precise operational behavior (e.g., "Listens for incoming webhooks and validates payload structure", "Parses unformatted PDF tables into structured JSON using OCR").
- extracted_job_description: Provide clean, formatted text representation of the job description.
- extracted_annual_salary: Extract the salary figure. If MONTHLY (e.g., "10,000 - 13,000 AED per month"), multiply by 12 first, then provide the annual amount. If ANNUAL (e.g., "$95,000/year"), provide as-is. Always return as a NUMBER in the ORIGINAL currency (do NOT convert - the system handles conversion). Examples: "AED 10,000 per month" → 120000.0, "£45,000 per year" → 45000.0. If no salary found, return null.
- salary_currency: Extract the currency code if present (USD, AED, EUR, GBP, CAD, AUD, JPY, INR, SGD, HKD). Default to USD if dollar symbol.
- NO redundant currency symbols in any string fields. Single $ prefix only.

IMPLEMENTATION TIMELINE GENERATION:
Based on the detected bottleneck and proposed architecture, create a three-phase implementation timeline:
- phase_number: "01", "02", "03"
- title: Concise phase title (2-4 words)
- duration: Timeframe (e.g., "Days 1-3", "Days 4-7", "Day 8")
- description: SPECIFIC to this job's bottleneck and proposed solution. Describe concrete technical steps, not generic phrases. Include specific tools, APIs, or processes mentioned in the job description.

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
