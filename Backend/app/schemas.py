from datetime import date, datetime
from decimal import Decimal
import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class CategoryBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    category_id: int


class LocationBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(..., min_length=1, max_length=100)
    address: str | None = None
    is_active: bool = True


class LocationCreate(LocationBase):
    pass


class LocationResponse(LocationBase):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    location_id: int


# --- Item schemas ---

class ItemCreate(BaseModel):
    """Payload for creating an item + its first asset + inventory record."""
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(..., min_length=1, max_length=200)
    sku: str = Field(..., min_length=1, max_length=50, pattern=r"^[A-Za-z0-9_-]+$")  # alphanumeric + dash/underscore
    category_name: str | None = None           # matched by name to categories table
    quantity: int = Field(default=1, ge=0)
    status: str = Field(default="Active")      # Asset status
    location_id: int | None = None
    serial_number: str | None = Field(default=None, max_length=100)
    purchase_date: date | None = None
    unit_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    reorder_level: int = Field(default=10, ge=0)
    notes: str | None = None
    assigned_to: str | None = None
    image_url: str | None = None


class ItemUpdate(BaseModel):
    """Payload for updating an item."""
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1)
    sku: str | None = Field(default=None, min_length=1, pattern=r"^[A-Za-z0-9_-]+$")
    category_name: str | None = None
    quantity: int | None = Field(default=None, ge=0)
    status: str | None = None
    location_id: int | None = None
    serial_number: str | None = Field(default=None, max_length=100)
    purchase_date: date | None = None
    unit_price: Decimal | None = Field(default=None, ge=0)
    reorder_level: int | None = Field(default=None, ge=0)
    notes: str | None = None
    assigned_to: str | None = None
    image_url: str | None = None


class ItemFull(BaseModel):
    """Denormalized item response for the frontend InventoryItem shape."""
    item_id: int
    name: str
    sku: str
    category_name: str | None
    category_id: int | None
    total_quantity: int
    asset_status: str
    location_id: int | None
    location_name: str | None
    last_updated: datetime | None
    serial_number: str | None
    purchase_date: date | None
    unit_price: float
    reorder_level: int
    notes: str | None
    assigned_to: str | None
    image_url: str | None


class ItemFullList(BaseModel):
    items: list[ItemFull]
    total: int


# Keep legacy schemas for backwards compat
class ItemBase(BaseModel):
    category_id: int | None = None
    name: str = Field(..., max_length=200)
    sku: str = Field(..., max_length=50)
    reorder_level: int = Field(default=10, ge=0)
    unit_price: Decimal = Field(default=Decimal("0.00"), ge=0)


class ItemResponse(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    item_id: int


class RoleSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role_id: int
    role_name: str
    description: str | None = None


class UserBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    role_id: int | None = None
    username: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    full_name: str | None = Field(default=None, max_length=100)
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;':\",./<>?]", v):
            raise ValueError("Password must contain at least one special character.")
        return v


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    user_id: int
    last_login: datetime | None = None
    created_at: datetime
    role: RoleSummary | None = None


class UserLogin(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
