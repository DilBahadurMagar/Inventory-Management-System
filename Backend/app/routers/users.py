from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import User
from app.schemas import UserCreate, UserResponse, UserLogin, TokenResponse
from app.security import get_password_hash, verify_password, create_access_token
from app.rate_limiter import limiter_general, limiter_auth

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse], dependencies=[Depends(limiter_general)])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protect this endpoint
) -> list[UserResponse]:
    """
    List all registered users.

    Retrieves a list of all user profiles including names, emails, roles, and status.
    Requires active user authentication.
    """
    return db.query(User).all()


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(limiter_auth)],
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
) -> UserResponse:
    """
    Register a new user account.

    Creates a new user profile with standard VIEWER permissions.
    Validates password strength (requires at least 8 characters, one uppercase, one lowercase, one digit, and one special character).
    Raises 400 Bad Request if username or email already exists.
    """
    # check email and username duplicates
    existing_user = db.query(User).filter(
        (User.email == payload.email) | (User.username == payload.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    # Force VIEWER role for self-registration to prevent privilege escalation.
    # Admins should update role_id directly in the database or via a separate
    # admin-only endpoint.
    safe_role_id = 3  # VIEWER

    hashed_password = get_password_hash(payload.password)
    new_user = User(
        role_id=safe_role_id,
        username=payload.username,
        email=payload.email,
        password_hash=hashed_password,
        full_name=payload.full_name,
        is_active=payload.is_active,
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(limiter_auth)])
def login(
    payload: UserLogin,
    db: Session = Depends(get_db)
) -> TokenResponse:
    """
    Authenticate user and issue JWT token.

    Verifies the email and password.
    Updates the 'last_login' timestamp on success.
    Returns a JWT Bearer access token and basic user profile information.
    Raises 401 Unauthorized for incorrect credentials and 400 Bad Request if the account is inactive.
    """
    user = db.query(User).filter_by(email=payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive"
        )
        
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(data={"sub": user.email})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )


@router.get("/me", response_model=UserResponse, dependencies=[Depends(limiter_general)])
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """
    Get current logged-in user's profile.

    Decodes the session JWT token and returns the current user's details.
    Requires active user authentication.
    """
    return current_user
