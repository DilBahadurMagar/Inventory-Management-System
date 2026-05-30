from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import Location, User
from app.schemas import LocationCreate, LocationResponse
from app.rate_limiter import limiter_general

router = APIRouter(
    prefix="/locations",
    tags=["locations"],
    dependencies=[Depends(limiter_general)]
)


@router.get("", response_model=list[LocationResponse])
def list_locations(
    active_only: bool = True,
    db: Session = Depends(get_db),
) -> list[LocationResponse]:
    query = db.query(Location)
    if active_only:
        query = query.filter_by(is_active=True)
    return query.order_by(Location.name).all()


@router.get("/{location_id}", response_model=LocationResponse)
def get_location(location_id: int, db: Session = Depends(get_db)) -> LocationResponse:
    loc = db.get(Location, location_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    return loc


@router.post(
    "",
    response_model=LocationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_location(
    payload: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LocationResponse:
    existing = db.query(Location).filter_by(name=payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location with this name already exists",
        )
    loc = Location(name=payload.name, address=payload.address, is_active=payload.is_active)
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.put("/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: int,
    payload: LocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LocationResponse:
    loc = db.get(Location, location_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    loc.name = payload.name
    loc.address = payload.address
    loc.is_active = payload.is_active
    db.commit()
    db.refresh(loc)
    return loc


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    loc = db.get(Location, location_id)
    if not loc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    loc.is_active = False  # Soft delete
    db.commit()
