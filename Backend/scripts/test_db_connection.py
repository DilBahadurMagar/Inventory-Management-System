"""Quick check that DATABASE_URL reaches Supabase.

Run from Backend/:
  .venv/Scripts/python.exe scripts/test_db_connection.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text

from app.config import settings
from app.database import engine


def main() -> None:
    host = settings.resolved_database_url.split("@")[-1].split("/")[0].split(":")[0]
    print(f"Connecting to host: {host}")

    try:
        with engine.connect() as conn:
            version = conn.execute(text("SELECT version()")).scalar_one()
    except Exception as exc:
        message = str(exc).lower()
        if "@@" in str(exc) and "socket" in message:
            print(
                "\nMalformed DATABASE_URL: '@' in your password must be encoded as %40.\n"
                "There should be exactly ONE '@' between password and host.\n"
                "Example: ...:my%40pass@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
            )
        elif "password authentication failed" in message:
            print(
                "\nConnected to Supabase, but the password was rejected.\n"
                "In Supabase -> Project Settings -> Database, reset the database password,\n"
                "then set DB_PASSWORD in Backend/.env (plain text is fine with Option A).\n"
                "User must be: postgres.<project-ref>  (Session pooler, port 5432)."
            )
        elif "could not translate host name" in message or "getaddrinfo" in message:
            print(
                "\nDNS lookup failed. Supabase direct hosts (db.*.supabase.co) are "
                "often IPv6-only; many Windows setups cannot reach them.\n"
                "Fix: In Supabase -> Project Settings -> Database -> Connection string,\n"
                "  choose URI + Session mode (pooler, port 5432), not Direct.\n"
                "  Host looks like: aws-0-<region>.pooler.supabase.com\n"
                "  User looks like: postgres.<project-ref>\n"
                "Update DATABASE_URL in Backend/.env and run this script again."
            )
        raise

    print("Connected successfully.")
    print(version)


if __name__ == "__main__":
    main()
