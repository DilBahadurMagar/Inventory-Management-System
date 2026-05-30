from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models import User, Role
from app.schemas import UserCreate, UserResponse, UserLogin, TokenResponse
from app.security import get_password_hash, verify_password, create_access_token
from app.rate_limiter import limiter_general, limiter_auth

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse], dependencies=[Depends(limiter_general)])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protect this endpoint
) -> list[UserResponse]:
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
    # check email and username duplicates
    existing_user = db.query(User).filter(
        (User.email == payload.email) | (User.username == payload.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    # check role
    if payload.role_id:
        role = db.get(Role, payload.role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role_id"
            )
            
    hashed_password = get_password_hash(payload.password)
    new_user = User(
        role_id=payload.role_id,
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
    return current_user
