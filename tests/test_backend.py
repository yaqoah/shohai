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
        detected_bottleneck="Manual data entry from invoices to CRM.",
        estimated_monthly_tasks=2500,
        inferred_seniority="Senior",
        proposed_nodes=[
            NodeModel(id="node_1", label="Receive Invoice", type="trigger"),
            NodeModel(id="node_2", label="Extract Data", type="process"),
            NodeModel(id="node_3", label="Update CRM", type="output")
        ]
    )
    
    mock_analyze.return_value = mock_extraction

    # Dummy base64 payload
    payload = {
        "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    }

    # Execute the request
    response = client.post("/api/analyze", json=payload)
    
    # Assert successful execution and structure matching
    assert response.status_code == 200
    data = response.json()
    
    # Assert values from the mocked extraction are present
    assert data["job_title"] == "Senior Process Engineer"
    assert data["company_name"] == "Acme Corp"
    
    # Assert calculator successfully ran (Senior base is 9000 -> 11250 total human cost)
    assert "calculated_financials" in data
    assert data["calculated_financials"]["base_salary"] == 9000.0
    assert data["calculated_financials"]["total_human_cost"] == 11250.0
    
    # Assert timeline is attached deterministically
    assert "implementation_timeline" in data
    assert len(data["implementation_timeline"]) == 3
    assert data["implementation_timeline"][0]["phase_number"] == "01"
