import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import sys
import os

# Add root directory to sys.path so we can import 'api' correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.index import app
from api.utils.ai_engine import AIExtractionResponse, NodeModel

client = TestClient(app)

def test_health_check():
    """
    Test the diagnostic /api/health endpoint.
    """
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"
    assert "uptime_seconds" in data
    assert "environment_variables" in data
    assert "MISTRAL_API_KEY" in data["environment_variables"]

@patch("api.index.analyze_job_posting_image")
def test_analyze_endpoint(mock_analyze):
    """
    Test the POST /api/analyze endpoint by mocking the Mistral AI extraction completely.
    This validates the Pydantic schema assembly and calculator execution safely.
    """
    # Create a mock AIExtractionResponse that Mistral would theoretically return
    mock_extraction = AIExtractionResponse(
        job_title="Senior Process Engineer",
        company_name="Acme Corp",
        extracted_job_description="Acme Corp is seeking a Senior Process Engineer to automate manual data entry workflows, optimize invoice processing pipelines, and improve operational efficiency through systematic automation solutions.",
        detected_bottleneck="Manual invoice data entry into CRM systems.",
        estimated_monthly_tasks=2500,
        inferred_seniority="Senior",
        proposed_nodes=[
            NodeModel(id="node_1", label="Receive Invoice", type="trigger", description="Listens for incoming webhooks and validates invoice payload structure"),
            NodeModel(id="node_2", label="Extract Data", type="process", description="Parses unformatted PDF tables into structured JSON using OCR and validation"),
            NodeModel(id="node_3", label="Update CRM", type="output", description="Pushes validated data to CRM via API with error handling and audit trail")
        ]
    )
    
    mock_analyze.return_value = mock_extraction

    # Dummy base64 payload
    payload = {
        "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAYAAjCB0C8AAAAASUVORK5CYII="
    }

    # Execute the request
    response = client.post("/api/analyze", json=payload)
    
    # Assert successful execution and structure matching
    assert response.status_code == 200
    data = response.json()
    
    # Assert values from the mocked extraction are present
    assert data["job_title"] == "Senior Process Engineer"
    assert data["company_name"] == "Acme Corp"
    assert "extracted_job_description" in data
    assert "Manual invoice" in data["detected_bottleneck"]  # Verify concise bottleneck
    
    # Assert calculator successfully ran (Senior: 108000/yr base, 11250/mo total human cost with overhead)
    assert "calculated_financials" in data
    assert data["calculated_financials"]["base_salary"] == 108000.0  # Yearly base salary
    assert data["calculated_financials"]["total_human_cost"] == 11250.0  # Monthly total with 25% overhead
    assert "solution_value" in data["calculated_financials"]
    # Ensure no duplicate $ symbols in solution_value
    assert data["calculated_financials"]["solution_value"].count("$") == 1
    assert "Saves $11,245/month" in data["calculated_financials"]["solution_value"]
    
    # Assert timeline is attached deterministically
    assert "implementation_timeline" in data
    assert len(data["implementation_timeline"]) == 3
    assert data["implementation_timeline"][0]["phase_number"] == "01"
    
    # Assert nodes have description field
    assert len(data["proposed_nodes"]) == 3
    for node in data["proposed_nodes"]:
        assert "description" in node
        assert len(node["description"]) > 10  # Ensure meaningful description


@patch("api.index.analyze_job_posting_image")
def test_analyze_with_extracted_salary(mock_analyze):
    """
    Test that extracted annual salary from job posting overrides default seniority-based values.
    """
    # Mock with extracted salary from job posting
    mock_extraction = AIExtractionResponse(
        job_title="Process Analyst",
        company_name="TechCorp",
        extracted_job_description="Process Analyst position with salary $85,000 per year.",
        detected_bottleneck="Manual data entry and record updates.",
        estimated_monthly_tasks=1500,
        inferred_seniority="Mid",
        extracted_annual_salary=85000.0,  # Extracted from job posting
        proposed_nodes=[
            NodeModel(id="node_1", label="Process", type="trigger", description="Triggers on schedule")
        ]
    )
    
    mock_analyze.return_value = mock_extraction

    payload = {
        "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAYAAjCB0C8AAAAASUVORK5CYII="
    }

    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Should use extracted salary (85000) instead of default (78000)
    assert data["calculated_financials"]["base_salary"] == 85000.0
    # Monthly cost should be based on extracted salary
    assert data["calculated_financials"]["total_human_cost"] == 85000.0 / 12 * 1.25  # 8854.17/mo


@patch("api.index.analyze_job_posting_image")
def test_analyze_with_aed_salary(mock_analyze):
    """
    Test that AED salary is correctly converted to USD.
    AED 300,000 / 3.67 ≈ $81,744 USD
    """
    mock_extraction = AIExtractionResponse(
        job_title="Process Analyst",
        company_name="Dubai Corp",
        extracted_job_description="Process Analyst position with salary AED 300,000 per year.",
        detected_bottleneck="Manual data entry.",
        estimated_monthly_tasks=2000,
        inferred_seniority="Mid",
        extracted_annual_salary=300000.0,
        salary_currency="AED",
        proposed_nodes=[
            NodeModel(id="node_1", label="Process", type="trigger", description="Triggers on schedule")
        ]
    )
    
    mock_analyze.return_value = mock_extraction

    payload = {
        "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAYAAjCB0C8AAAAASUVORK5CYII="
    }

    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # AED 300,000 / 3.67 ≈ 81,744 USD
    expected_usd = 300000.0 / 3.67
    assert abs(data["calculated_financials"]["base_salary"] - expected_usd) < 1.0  # Floating point comparison
