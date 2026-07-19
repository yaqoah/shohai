from typing import Dict, List
from pydantic import BaseModel

class CalculatedFinancials(BaseModel):
    base_salary: float
    estimated_overhead_cost: float
    total_human_cost: float
    estimated_ai_token_cost: float
    net_monthly_savings: float
    roi_multiplier: float

class TimelinePhase(BaseModel):
    phase_number: str
    title: str
    duration: str
    description: str

def compute_arbitrage_metrics(inferred_seniority: str, estimated_monthly_tasks: int) -> CalculatedFinancials:
    """
    Computes exact net savings and ROI based on inferred seniority and tasks.
    """
    seniority = inferred_seniority.lower()
    if "senior" in seniority:
        base_salary = 9000.0
    elif "junior" in seniority:
        base_salary = 4000.0
    else:
        # Default to mid-level
        base_salary = 6500.0
        
    estimated_overhead_cost = base_salary * 0.25
    total_human_cost = base_salary * 1.25
    
    # Token cost floor of $5 or precise usage estimate
    estimated_ai_token_cost = max(5.0, estimated_monthly_tasks * 0.00015)
    
    net_monthly_savings = total_human_cost - estimated_ai_token_cost
    
    # ROI multiplier rounded cleanly (e.g., 100.5x)
    roi_multiplier = round(total_human_cost / estimated_ai_token_cost, 1)
    
    return CalculatedFinancials(
        base_salary=base_salary,
        estimated_overhead_cost=estimated_overhead_cost,
        total_human_cost=total_human_cost,
        estimated_ai_token_cost=estimated_ai_token_cost,
        net_monthly_savings=net_monthly_savings,
        roi_multiplier=roi_multiplier
    )

def get_implementation_timeline() -> List[TimelinePhase]:
    """
    Returns a deterministic, 3-step timeline layout payload.
    """
    return [
        TimelinePhase(
            phase_number="01",
            title="Sandbox & API Configuration",
            duration="Days 1–3",
            description="Isolating core data feeds, mapping webhook triggers, and safely standing up the isolated LLM execution pipeline in a zero-risk staging sandbox."
        ),
        TimelinePhase(
            phase_number="02",
            title="Parallel Performance Run",
            duration="Days 4–7",
            description="Executing the automated agent loops concurrently alongside the active human operative to profile processing accuracy, error limits, and trace telemetry."
        ),
        TimelinePhase(
            phase_number="03",
            title="Live Hand-off & Training",
            duration="Day 8",
            description="Final migration to active production, clearing processing locks, and conducting a modular review workshop with operational stakeholders."
        )
    ]
