"""Smoke-test FastAPI routes without starting uvicorn. Run from Backend/:

  .venv/Scripts/python.exe scripts/test_api.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_current_user
from app.models import User

# Bypass auth for smoke testing
app.dependency_overrides[get_current_user] = lambda: User(email="test@example.com")
client = TestClient(app)

ENDPOINTS = [
    ("GET", "/health"),
    ("GET", "/categories"),
    ("POST", "/categories", {"name": "Test Category", "description": "API smoke test"}),
    ("GET", "/items"),
    ("POST", "/items", {
        "name": "Test Item",
        "sku": "TEST-SKU-001",
        "reorder_level": 5,
        "unit_price": "19.99",
    }),
    ("GET", "/users"),
    ("POST", "/users", {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPass123!",
        "full_name": "Test User",
    }),
]


def main() -> None:
    print("API smoke tests\n" + "=" * 50)
    for entry in ENDPOINTS:
        method = entry[0]
        path = entry[1]
        body = entry[2] if len(entry) > 2 else None

        if method == "GET":
            response = client.get(path)
        else:
            response = client.post(path, json=body)

        status = response.status_code
        ok = "OK" if status < 400 else "FAIL"
        print(f"{ok}  {method:4} {path}  ->  {status}")
        if status >= 400:
            print(f"      body: {response.text[:200]}")
        elif method == "GET" and path != "/health":
            data = response.json()
            print(f"      returned {len(data)} record(s)")
        elif method == "POST":
            print(f"      body: {response.json()}")

    print("=" * 50)
    print("Done. Open http://127.0.0.1:8000/docs when server is running.")


if __name__ == "__main__":
    main()
