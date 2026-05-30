from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

_resolved_url = settings.resolved_database_url.lower()
_connect_args: dict = {}
if "supabase" in _resolved_url and "sslmode=" not in _resolved_url:
    _connect_args["sslmode"] = "require"

engine = create_engine(
    settings.sqlalchemy_database_url,
    pool_pre_ping=True,
    connect_args=_connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
