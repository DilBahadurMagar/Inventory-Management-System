from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import Asset, Category, Inventory, Item, Location, User
from app.schemas import ItemCreate, ItemFull, ItemFullList, ItemUpdate
from app.rate_limiter import limiter_general

router = APIRouter(
    prefix="/items",
    tags=["items"],
    dependencies=[Depends(limiter_general)]
)

ASSET_STATUS_MAP = {
    "active": "Active",
    "inactive": "Inactive",
    "maintenance": "Maintenance",
    "retired": "Retired",
    "low_stock": "Active",  # low_stock is derived from quantity; status stays Active
}


def _build_item_full(item: Item) -> ItemFull:
    """Build a denormalized ItemFull from an ORM Item with its relationships loaded."""
    # Aggregate inventory quantity across all locations
    total_qty = sum(inv.quantity_on_hand for inv in item.inventory_records)

    # Take first asset for serial number, purchase info, and location
    first_asset: Asset | None = item.assets[0] if item.assets else None
    first_inv: Inventory | None = item.inventory_records[0] if item.inventory_records else None

    # Derive status
    if first_asset:
        raw_status = first_asset.status or "Active"
    else:
        raw_status = "Active"

    # Determine location from first inventory or first asset
    location: Location | None = None
    if first_inv:
        location = first_inv.location
    elif first_asset and first_asset.location:
        location = first_asset.location

    # Last updated from inventory
    last_updated = first_inv.last_updated if first_inv else None

    # Derive image from asset metadata (stored in notes for now, else placeholder)
    image_url = None
    if first_asset:
        image_url = None  # We'll store this on the frontend side

    return ItemFull(
        item_id=item.item_id,
        name=item.name,
        sku=item.sku,
        category_name=item.category.name if item.category else None,
        category_id=item.category_id,
        total_quantity=total_qty,
        asset_status=raw_status,
        location_id=location.location_id if location else None,
        location_name=location.name if location else None,
        last_updated=last_updated,
        serial_number=first_asset.serial_number if first_asset else None,
        purchase_date=first_asset.purchase_date if first_asset else None,
        unit_price=float(item.unit_price),
        reorder_level=item.reorder_level,
        notes=item.sku,  # We'll use the notes field from the Item — currently sku placeholder
        assigned_to=None,
        image_url=None,
    )


@router.get("", response_model=ItemFullList)
def list_items(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    category: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    sort_key: str = Query(default="name"),
    sort_dir: str = Query(default="asc"),
    db: Session = Depends(get_db),
) -> ItemFullList:
    query = db.query(Item)

    # Filter by category name
    if category:
        query = query.join(Category, Item.category_id == Category.category_id).filter(
            Category.name == category
        )

    # Filter by name or sku search
    if search:
        q = f"%{search.lower()}%"
        query = query.filter(
            (Item.name.ilike(q)) | (Item.sku.ilike(q))
        )

    items = query.all()

    # Build full responses and filter by status client-side
    full_items = [_build_item_full(i) for i in items]

    if status:
        # Map frontend status to backend asset status values
        status_filter = status.lower()
        if status_filter == "low_stock":
            full_items = [f for f in full_items if f.total_quantity <= f.reorder_level]
        else:
            asset_status = ASSET_STATUS_MAP.get(status_filter, status_filter.capitalize())
            full_items = [
                f for f in full_items
                if f.asset_status.lower() == asset_status.lower()
            ]

    total = len(full_items)

    # Sort
    sort_key_map = {
        "name": lambda x: x.name.lower(),
        "assetId": lambda x: x.sku.lower(),
        "category": lambda x: (x.category_name or "").lower(),
        "quantity": lambda x: x.total_quantity,
        "status": lambda x: x.asset_status.lower(),
        "locationName": lambda x: (x.location_name or "").lower(),
        "lastUpdated": lambda x: x.last_updated or datetime.min,
    }
    sort_fn = sort_key_map.get(sort_key, lambda x: x.name.lower())
    full_items.sort(key=sort_fn, reverse=(sort_dir == "desc"))

    # Paginate
    start = (page - 1) * page_size
    full_items = full_items[start: start + page_size]

    return ItemFullList(items=full_items, total=total)


@router.get("/{item_id}", response_model=ItemFull)
def get_item(item_id: int, db: Session = Depends(get_db)) -> ItemFull:
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return _build_item_full(item)


@router.post("", response_model=ItemFull, status_code=status.HTTP_201_CREATED)
def create_item(
    payload: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ItemFull:
    # Check SKU uniqueness
    if db.query(Item).filter_by(sku=payload.sku).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An item with this SKU/Asset ID already exists",
        )

    # Resolve category
    category_id = None
    if payload.category_name:
        cat = db.query(Category).filter(Category.name.ilike(payload.category_name)).first()
        if not cat:
            cat = Category(name=payload.category_name)
            db.add(cat)
            db.flush()
        category_id = cat.category_id

    # Resolve location
    location_id = payload.location_id
    if location_id:
        loc = db.get(Location, location_id)
        if not loc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Location not found")

    # Create Item
    item = Item(
        category_id=category_id,
        name=payload.name,
        sku=payload.sku,
        reorder_level=payload.reorder_level,
        unit_price=payload.unit_price,
    )
    db.add(item)
    db.flush()  # get item_id

    # Create Inventory record
    if location_id:
        inv = Inventory(
            item_id=item.item_id,
            location_id=location_id,
            quantity_on_hand=payload.quantity,
            last_updated=datetime.now(timezone.utc),
        )
        db.add(inv)

    # Create Asset record
    asset_status = ASSET_STATUS_MAP.get(payload.status.lower(), "Active")
    asset = Asset(
        item_id=item.item_id,
        serial_number=payload.serial_number if payload.serial_number else None,
        location_id=location_id,
        status=asset_status,
        purchase_date=payload.purchase_date,
        created_at=datetime.now(timezone.utc),
    )
    db.add(asset)

    db.commit()
    db.refresh(item)
    return _build_item_full(item)


@router.put("/{item_id}", response_model=ItemFull)
def update_item(
    item_id: int,
    payload: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ItemFull:
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    if payload.name is not None:
        item.name = payload.name
    if payload.sku is not None:
        item.sku = payload.sku
    if payload.unit_price is not None:
        item.unit_price = payload.unit_price
    if payload.reorder_level is not None:
        item.reorder_level = payload.reorder_level

    # Update category
    if payload.category_name is not None:
        cat = db.query(Category).filter(Category.name.ilike(payload.category_name)).first()
        if not cat:
            cat = Category(name=payload.category_name)
            db.add(cat)
            db.flush()
        item.category_id = cat.category_id

    # Update first asset
    first_asset = item.assets[0] if item.assets else None
    if first_asset:
        if payload.serial_number is not None:
            first_asset.serial_number = payload.serial_number
        if payload.purchase_date is not None:
            first_asset.purchase_date = payload.purchase_date
        if payload.status is not None:
            first_asset.status = ASSET_STATUS_MAP.get(payload.status.lower(), "Active")
        if payload.location_id is not None:
            first_asset.location_id = payload.location_id

    # Update inventory
    if payload.quantity is not None and item.inventory_records:
        first_inv = item.inventory_records[0]
        first_inv.quantity_on_hand = payload.quantity
        first_inv.last_updated = datetime.now(timezone.utc)
        if payload.location_id is not None:
            first_inv.location_id = payload.location_id

    db.commit()
    db.refresh(item)
    return _build_item_full(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    db.delete(item)
    db.commit()
