from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import Category, User
from app.schemas import CategoryCreate, CategoryResponse
from app.rate_limiter import limiter_general

router = APIRouter(
    prefix="/categories",
    tags=["categories"],
    dependencies=[Depends(limiter_general)]
)


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CategoryResponse]:
    """
    Retrieve all item/asset categories.

    Returns a list of all defined categories, sorted alphabetically by name.
    Requires active user authentication.
    """
    return db.query(Category).order_by(Category.name).all()


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryResponse:
    """
    Create a new inventory category.

    Registers a unique product/asset category with an optional description.
    Raises a 400 Bad Request if a category with the same name already exists.
    Requires active user authentication.
    """
    existing = db.query(Category).filter_by(name=payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists",
        )
    cat = Category(name=payload.name, description=payload.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryResponse:
    """
    Retrieve a specific category by its ID.

    Fetches the details of a single category.
    Raises a 404 Not Found if the category does not exist.
    Requires active user authentication.
    """
    cat = db.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return cat
