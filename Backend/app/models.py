from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Role(Base):
    __tablename__ = "roles"

    role_id: Mapped[int] = mapped_column(primary_key=True)
    role_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    users: Mapped[list["User"]] = relationship(back_populates="role")


class Category(Base):
    __tablename__ = "categories"

    category_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    items: Mapped[list["Item"]] = relationship(back_populates="category")


class Location(Base):
    __tablename__ = "locations"

    location_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    inventory_records: Mapped[list["Inventory"]] = relationship(
        back_populates="location"
    )
    assets: Mapped[list["Asset"]] = relationship(back_populates="location")
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="location"
    )


class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id: Mapped[int] = mapped_column(primary_key=True)
    company_name: Mapped[str] = mapped_column(String(150), nullable=False)
    contact_name: Mapped[str | None] = mapped_column(String(100))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(20))

    assets: Mapped[list["Asset"]] = relationship(back_populates="supplier")


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(primary_key=True)
    role_id: Mapped[int | None] = mapped_column(
        ForeignKey("roles.role_id", ondelete="SET NULL")
    )
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    role: Mapped[Role | None] = relationship(back_populates="users")
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="user"
    )


class Item(Base):
    __tablename__ = "items"

    item_id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.category_id", ondelete="SET NULL")
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sku: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    reorder_level: Mapped[int] = mapped_column(Integer, default=10)
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), default=Decimal("0.00")
    )

    category: Mapped[Category | None] = relationship(back_populates="items")
    inventory_records: Mapped[list["Inventory"]] = relationship(
        back_populates="item"
    )
    assets: Mapped[list["Asset"]] = relationship(back_populates="item")
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="item"
    )


class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(
        ForeignKey("items.item_id", ondelete="CASCADE"), nullable=False
    )
    location_id: Mapped[int] = mapped_column(
        ForeignKey("locations.location_id", ondelete="CASCADE"), nullable=False
    )
    quantity_on_hand: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    item: Mapped[Item] = relationship(back_populates="inventory_records")
    location: Mapped[Location] = relationship(back_populates="inventory_records")


class Asset(Base):
    __tablename__ = "assets"

    asset_id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(
        ForeignKey("items.item_id", ondelete="CASCADE"), nullable=False
    )
    serial_number: Mapped[str | None] = mapped_column(String(100), unique=True)
    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("locations.location_id", ondelete="SET NULL")
    )
    supplier_id: Mapped[int | None] = mapped_column(
        ForeignKey("suppliers.supplier_id", ondelete="SET NULL")
    )
    status: Mapped[str] = mapped_column(String(50), default="In Stock")
    purchase_date: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    item: Mapped[Item] = relationship(back_populates="assets")
    location: Mapped[Location | None] = relationship(back_populates="assets")
    supplier: Mapped[Supplier | None] = relationship(back_populates="assets")


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int | None] = mapped_column(
        ForeignKey("items.item_id", ondelete="SET NULL")
    )
    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("locations.location_id", ondelete="SET NULL")
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL")
    )
    transaction_type: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    item: Mapped[Item | None] = relationship(back_populates="transactions")
    location: Mapped[Location | None] = relationship(back_populates="transactions")
    user: Mapped[User | None] = relationship(back_populates="transactions")
