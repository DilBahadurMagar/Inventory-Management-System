"""Automated Security and Input Validation Tests.

Run from Backend/ directory:
  uv run python scripts/test_security.py

Strategy:
  - CORS + Rate Limiting: tested via FastAPI TestClient with DB mocked out.
  - Input Validation: tested via direct Pydantic model_validate() — no DB needed.
"""

import sys
from pathlib import Path
from decimal import Decimal
from unittest.mock import MagicMock, patch

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding="utf-8")

# Add project root to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from pydantic import ValidationError

PASS = "[PASS]"
FAIL = "[FAIL]"


# ─────────────────────────────────────────────────────────────────────────────
# 1. CORS SECURITY
# ─────────────────────────────────────────────────────────────────────────────

def test_cors() -> bool:
    print("\n[1] Testing CORS Security...")

    # Mock DB so TestClient does not try to connect to Supabase
    mock_session = MagicMock()
    mock_session.query.return_value.order_by.return_value.all.return_value = []

    with patch("app.database.SessionLocal", return_value=mock_session):
        from fastapi.testclient import TestClient
        from app.main import app
        client = TestClient(app)

        # Trusted origin
        response = client.options(
            "/categories",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            }
        )
        cors_header = response.headers.get("access-control-allow-origin")
        if cors_header == "http://localhost:3000":
            print(f"  {PASS} Trusted Origin 'http://localhost:3000' allowed.")
        else:
            print(f"  {FAIL} Trusted Origin failed! Got: {cors_header}")
            return False

        # Untrusted origin
        response = client.options(
            "/categories",
            headers={
                "Origin": "http://malicious.com",
                "Access-Control-Request-Method": "GET",
            }
        )
        cors_header = response.headers.get("access-control-allow-origin")
        if cors_header is None or cors_header == "null":
            print(f"  {PASS} Untrusted Origin 'http://malicious.com' correctly denied.")
        else:
            print(f"  {FAIL} Untrusted Origin was allowed! Got: {cors_header}")
            return False

    return True


# ─────────────────────────────────────────────────────────────────────────────
# 2. RATE LIMITING
# ─────────────────────────────────────────────────────────────────────────────

def test_rate_limiting() -> bool:
    print("\n[2] Testing Rate Limiting...")

    mock_session = MagicMock()
    mock_session.query.return_value.order_by.return_value.all.return_value = []

    with patch("app.database.SessionLocal", return_value=mock_session):
        from fastapi.testclient import TestClient
        from app.main import app
        from app.rate_limiter import limiter_general, limiter_auth

        client = TestClient(app)

        # ── General limiter (set to 3 for rapid testing) ─────────────────────
        limiter_general.times = 3
        limiter_general.seconds = 5
        limiter_general.history.clear()

        print("  Testing general rate limiter on /categories (limit=3)...")
        for i in range(1, 5):
            resp = client.get("/categories")
            code = resp.status_code
            print(f"    Call {i}: HTTP {code}")
            if i <= 3 and code != 200:
                print(f"    {FAIL} Expected 200 on call {i}, got {code}")
                return False
            if i == 4:
                if code == 429:
                    retry_after = resp.headers.get("Retry-After")
                    rl_limit = resp.headers.get("X-RateLimit-Limit")
                    rl_remaining = resp.headers.get("X-RateLimit-Remaining")
                    print(f"    {PASS} 4th call throttled (429 Too Many Requests).")
                    print(f"         Retry-After={retry_after}s | X-RateLimit-Limit={rl_limit} | X-RateLimit-Remaining={rl_remaining}")
                    if not retry_after or rl_limit != "3" or rl_remaining != "0":
                        print(f"    {FAIL} Rate-limit response headers incorrect!")
                        return False
                else:
                    print(f"    {FAIL} 4th call NOT throttled! Got HTTP {code}")
                    return False

        # ── Health endpoint exempt ────────────────────────────────────────────
        print("  Testing /health exemption from rate limiting...")
        limiter_general.history.clear()
        for i in range(1, 10):
            resp = client.get("/health")
            if resp.status_code != 200:
                print(f"    {FAIL} /health failed at call {i}: HTTP {resp.status_code}")
                return False
        print(f"    {PASS} /health exempt from rate limits (9 consecutive calls OK).")

        # ── Auth limiter (set to 2 for rapid testing) ─────────────────────────
        limiter_auth.times = 2
        limiter_auth.seconds = 5
        limiter_auth.history.clear()

        print("  Testing auth rate limiter on /users/login (limit=2)...")
        for i in range(1, 4):
            # Bad payload -> Pydantic 422; rate limiter records the hit regardless
            resp = client.post("/users/login", json={"email": "bad", "password": ""})
            code = resp.status_code
            print(f"    Call {i}: HTTP {code}")
            if i <= 2 and code != 422:
                print(f"    {FAIL} Expected Pydantic 422 on call {i}, got {code}")
                return False
            if i == 3:
                if code == 429:
                    print(f"    {PASS} 3rd login attempt throttled correctly (429).")
                else:
                    print(f"    {FAIL} 3rd login attempt NOT throttled! Got HTTP {code}")
                    return False

        # Restore production limits
        limiter_general.times = 100
        limiter_general.seconds = 60
        limiter_general.history.clear()
        limiter_auth.times = 5
        limiter_auth.seconds = 60
        limiter_auth.history.clear()

    return True


# ─────────────────────────────────────────────────────────────────────────────
# 3. INPUT VALIDATION  (Pydantic only — no DB needed)
# ─────────────────────────────────────────────────────────────────────────────

def test_input_validation() -> bool:
    print("\n[3] Testing Input Validation (Pydantic schema layer)...")

    from app.schemas import (
        CategoryCreate,
        LocationCreate,
        ItemCreate,
        ItemUpdate,
        UserCreate,
    )

    errors: list[str] = []

    # ── CategoryCreate ────────────────────────────────────────────────────────
    print("  CategoryCreate...")

    # Valid
    cat = CategoryCreate.model_validate({"name": "  Electronics  "})
    assert cat.name == "Electronics", f"Expected 'Electronics', got '{cat.name}'"
    print(f"    {PASS} Whitespace stripped: '  Electronics  ' -> '{cat.name}'")

    # Whitespace-only rejected
    try:
        CategoryCreate.model_validate({"name": "    "})
        errors.append("CategoryCreate: accepted whitespace-only name")
        print(f"    {FAIL} Accepted whitespace-only name!")
    except ValidationError:
        print(f"    {PASS} Whitespace-only name rejected (ValidationError).")

    # Empty string rejected
    try:
        CategoryCreate.model_validate({"name": ""})
        errors.append("CategoryCreate: accepted empty name")
        print(f"    {FAIL} Accepted empty name!")
    except ValidationError:
        print(f"    {PASS} Empty name rejected (ValidationError).")

    # ── LocationCreate ────────────────────────────────────────────────────────
    print("  LocationCreate...")

    loc = LocationCreate.model_validate({"name": "  Warehouse A  "})
    assert loc.name == "Warehouse A", f"Expected 'Warehouse A', got '{loc.name}'"
    print(f"    {PASS} Whitespace stripped: '  Warehouse A  ' -> '{loc.name}'")

    try:
        LocationCreate.model_validate({"name": ""})
        errors.append("LocationCreate: accepted empty name")
        print(f"    {FAIL} Accepted empty name!")
    except ValidationError:
        print(f"    {PASS} Empty name rejected (ValidationError).")

    # ── ItemCreate ────────────────────────────────────────────────────────────
    print("  ItemCreate...")

    # Valid SKU
    item = ItemCreate.model_validate({"name": "Laptop", "sku": "LAPTOP-001"})
    print(f"    {PASS} Valid SKU 'LAPTOP-001' accepted.")

    # Invalid SKU with spaces / special chars
    invalid_skus = ["INVALID SKU!", "SKU@123", "sku#test", "bad sku"]
    for bad_sku in invalid_skus:
        try:
            ItemCreate.model_validate({"name": "Test", "sku": bad_sku})
            errors.append(f"ItemCreate: accepted invalid SKU '{bad_sku}'")
            print(f"    {FAIL} Accepted invalid SKU '{bad_sku}'!")
        except ValidationError:
            print(f"    {PASS} Invalid SKU '{bad_sku}' rejected.")

    # Negative quantity
    try:
        ItemCreate.model_validate({"name": "Test", "sku": "OK-SKU", "quantity": -5})
        errors.append("ItemCreate: accepted negative quantity")
        print(f"    {FAIL} Accepted negative quantity!")
    except ValidationError:
        print(f"    {PASS} Negative quantity rejected.")

    # Negative unit_price
    try:
        ItemCreate.model_validate({"name": "Test", "sku": "OK-SKU", "unit_price": Decimal("-1.50")})
        errors.append("ItemCreate: accepted negative unit_price")
        print(f"    {FAIL} Accepted negative unit_price!")
    except ValidationError:
        print(f"    {PASS} Negative unit_price rejected.")

    # Negative reorder_level
    try:
        ItemCreate.model_validate({"name": "Test", "sku": "OK-SKU", "reorder_level": -10})
        errors.append("ItemCreate: accepted negative reorder_level")
        print(f"    {FAIL} Accepted negative reorder_level!")
    except ValidationError:
        print(f"    {PASS} Negative reorder_level rejected.")

    # ── ItemUpdate ────────────────────────────────────────────────────────────
    print("  ItemUpdate...")

    # Invalid SKU pattern in update
    try:
        ItemUpdate.model_validate({"sku": "BAD SKU!"})
        errors.append("ItemUpdate: accepted invalid SKU")
        print(f"    {FAIL} Accepted invalid SKU 'BAD SKU!' in update!")
    except ValidationError:
        print(f"    {PASS} Invalid SKU in update rejected.")

    # Negative quantity in update
    try:
        ItemUpdate.model_validate({"quantity": -1})
        errors.append("ItemUpdate: accepted negative quantity")
        print(f"    {FAIL} Accepted negative quantity in update!")
    except ValidationError:
        print(f"    {PASS} Negative quantity in update rejected.")

    # ── UserCreate (password complexity) ──────────────────────────────────────
    print("  UserCreate (password complexity)...")

    BASE = {"username": "testuser", "email": "test@example.com"}
    weak_passwords = [
        ("abc",             "too short"),
        ("alllowercase1!",  "no uppercase"),
        ("ALLUPPERCASE1!",  "no lowercase"),
        ("NoDigitsHere!",   "no digit"),
        ("NoSpecialChar1",  "no special character"),
    ]
    for pwd, reason in weak_passwords:
        try:
            UserCreate.model_validate({**BASE, "password": pwd})
            errors.append(f"UserCreate: accepted weak password '{pwd}' ({reason})")
            print(f"    {FAIL} Accepted weak password '{pwd}' ({reason})!")
        except ValidationError:
            print(f"    {PASS} Weak password '{pwd}' ({reason}) rejected.")

    # Strong password passes
    try:
        u = UserCreate.model_validate({**BASE, "password": "StrongPass1!"})
        print(f"    {PASS} Strong password 'StrongPass1!' accepted for user '{u.username}'.")
    except ValidationError as e:
        errors.append(f"UserCreate: rejected valid strong password: {e}")
        print(f"    {FAIL} Valid strong password rejected! Error: {e}")

    if errors:
        print(f"\n  Summary of failures:")
        for err in errors:
            print(f"    - {err}")
        return False

    return True


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print("SECURITY & INPUT VALIDATION TEST SUITE")
    print("=" * 60)

    results = {
        "CORS Security":    test_cors(),
        "Rate Limiting":    test_rate_limiting(),
        "Input Validation": test_input_validation(),
    }

    print("\n" + "=" * 60)
    print("RESULTS SUMMARY")
    print("=" * 60)
    all_pass = True
    for name, result in results.items():
        tag = PASS if result else FAIL
        print(f"  {tag} {name}")
        if not result:
            all_pass = False

    print("=" * 60)
    if all_pass:
        print("ALL SECURITY TESTS PASSED SUCCESSFULLY!")
    else:
        print("SOME TESTS FAILED. Review logs above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
