from typing import List
from pydantic import BaseModel

class CalculatedFinancials(BaseModel):
    base_salary: float
    estimated_overhead_cost: float
    total_human_cost: float
    estimated_ai_token_cost: float
    net_monthly_savings: float
    roi_multiplier: float
    solution_value: str = ""

class TimelinePhase(BaseModel):
    phase_number: str
    title: str
    duration: str
    description: str

def _generate_solution_value(net_savings: float) -> str:
    dollar = chr(36)
    formatted_savings = dollar + "{:,.0f}".format(net_savings)
    return "Saves " + formatted_savings + "/month in operational labor costs"

def compute_arbitrage_metrics(inferred_seniority: str, estimated_monthly_tasks: int, extracted_annual_salary: float = None, salary_currency: str = "USD") -> CalculatedFinancials:
    seniority = inferred_seniority.lower()
    # Currency conversion rates to USD
    CURRENCY_TO_USD = {
        'USD': 1.0,
        'AED': 3.67,
        'EUR': 1.1,
        'GBP': 1.27,
        'CAD': 0.74,
        'AUD': 0.67,
        'JPY': 0.0067,
        'INR': 0.012,
        'SGD': 0.74,
        'HKD': 0.13,
    }
    
    # Convert to USD if needed
    rate = CURRENCY_TO_USD.get(salary_currency.upper(), 1.0)
    
    # Use extracted salary if available, otherwise use seniority-based defaults
    if extracted_annual_salary is not None and extracted_annual_salary > 0:
        base_salary_yearly = extracted_annual_salary / rate
    elif "senior" in seniority:
        base_salary_yearly = 108000.0  # $9,000/month * 12
    elif "junior" in seniority:
        base_salary_yearly = 48000.0   # $4,000/month * 12
    else:
        base_salary_yearly = 78000.0   # $6,500/month * 12
    
    estimated_overhead_cost_monthly = (base_salary_yearly / 12) * 0.25
    total_human_cost_monthly = (base_salary_yearly / 12) * 1.25
    
    estimated_ai_token_cost = max(5.0, estimated_monthly_tasks * 0.00015)
    
    net_monthly_savings = total_human_cost_monthly - estimated_ai_token_cost
    
    roi_multiplier = round(total_human_cost_monthly / estimated_ai_token_cost, 1)
    
    return CalculatedFinancials(
        base_salary=base_salary_yearly,
        estimated_overhead_cost=estimated_overhead_cost_monthly,
        total_human_cost=total_human_cost_monthly,
        estimated_ai_token_cost=estimated_ai_token_cost,
        net_monthly_savings=net_monthly_savings,
        roi_multiplier=roi_multiplier,
        solution_value=_generate_solution_value(net_monthly_savings)
    )

def get_implementation_timeline(detected_bottleneck: str = "") -> List[TimelinePhase]:
    bottleneck = detected_bottleneck.lower() if detected_bottleneck else ""
    if "invoice" in bottleneck:
        phase1_desc = "Configuring OCR pipeline for invoice PDF ingestion, mapping vendor fields, and setting up AP system webhooks in sandbox."
        phase2_desc = "Running parallel invoice processing against last month archive to validate data extraction accuracy above 95%."
        phase3_desc = "Cutover to live AP workflow with variance alerting, stakeholder training on exception handling."
    elif "data entry" in bottleneck or "manual entry" in bottleneck:
        phase1_desc = "Setting up secure data ingestion endpoints, field mapping rules, and validation constraints in staging."
        phase2_desc = "Processing historical data in parallel to measure extraction accuracy and human correction rates."
        phase3_desc = "Deploying to production with confidence thresholds, configuring alerts for low-confidence predictions."
    elif "customer" in bottleneck or "onboarding" in bottleneck:
        phase1_desc = "Integrating CRM APIs, creating intake forms, and building welcome email automation workflows."
        phase2_desc = "Running parallel customer creation flows with manual QA to validate data integrity and compliance."
        phase3_desc = "Going live with customer self-service portal, training support on AI-handled vs human cases."
    else:
        phase1_desc = "Isolating core data feeds, mapping webhook triggers, and safely standing up the isolated LLM execution pipeline in a zero-risk staging sandbox."
        phase2_desc = "Executing the automated agent loops concurrently alongside the active human operative to profile processing accuracy, error limits, and trace telemetry."
        phase3_desc = "Final migration to active production, clearing processing locks, and conducting a modular review workshop with operational stakeholders."
    return [
        TimelinePhase(phase_number="01", title="Sandbox and API Configuration", duration="Days 1-3", description=phase1_desc),
        TimelinePhase(phase_number="02", title="Parallel Performance Run", duration="Days 4-7", description=phase2_desc),
        TimelinePhase(phase_number="03", title="Live Hand-off and Training", duration="Day 8", description=phase3_desc)
    ]
