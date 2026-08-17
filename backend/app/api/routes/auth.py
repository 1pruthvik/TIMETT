from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.user import User
from app.models.institution import Institution
from app.models.department import Department
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_or_create_user_tenant(user: User, db: Session):
    inst_name = f"{user.name}'s Workspace (ID {user.id})"
    inst = db.query(Institution).filter(Institution.name == inst_name).first()
    if not inst:
        inst = Institution(name=inst_name)
        db.add(inst)
        db.commit()
        db.refresh(inst)

    dept = db.query(Department).filter(Department.institution_id == inst.id).first()
    if not dept:
        dept = Department(name="Computer Science & Engineering", institution_id=inst.id)
        db.add(dept)
        db.commit()
        db.refresh(dept)

    return inst.id, dept.id


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="user",
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    inst_id, dept_id = get_or_create_user_tenant(user, db)
    token = create_access_token(user.id)

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            institution_id=inst_id,
            department_id=dept_id,
        ),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is disabled.",
        )

    inst_id, dept_id = get_or_create_user_tenant(user, db)
    token = create_access_token(user.id)

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            institution_id=inst_id,
            department_id=dept_id,
        ),
    )