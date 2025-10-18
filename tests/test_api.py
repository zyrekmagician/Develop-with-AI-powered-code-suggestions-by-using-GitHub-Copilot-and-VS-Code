import json
import pytest

from fastapi.testclient import TestClient

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities():
    # Make a deep copy of original activities to restore after each test
    original = json.loads(json.dumps(activities))
    yield
    activities.clear()
    activities.update(original)


def test_get_activities():
    client = TestClient(app)
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # ensure some known activity exists
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    client = TestClient(app)
    email = "tester@example.com"
    activity = "Chess Club"

    # Ensure not already signed up
    assert email not in activities[activity]["participants"]

    # Signup
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")
    assert email in activities[activity]["participants"]

    # Duplicate signup should fail
    resp_dup = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp_dup.status_code == 400

    # Unregister
    resp_del = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp_del.status_code == 200
    assert email not in activities[activity]["participants"]


def test_signup_nonexistent_activity():
    client = TestClient(app)
    resp = client.post("/activities/NoSuchActivity/signup?email=x@y.z")
    assert resp.status_code == 404
