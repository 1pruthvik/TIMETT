from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
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
    OAuthRequest,
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


@router.post("/oauth", response_model=AuthResponse)
def oauth_authorize(
    data: OAuthRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if not user:
        user = User(
            name=data.name,
            email=data.email,
            password_hash=None,
            role="user",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update user name to Google name
        if data.name:
            user.name = data.name
            db.commit()
            db.refresh(user)

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


import os
import urllib.request
import json

class GitHubCallbackRequest(BaseModel):
    code: str

@router.post("/github/callback", response_model=AuthResponse)
def github_callback(
    data: GitHubCallbackRequest,
    db: Session = Depends(get_db),
):
    client_id = os.getenv("GITHUB_CLIENT_ID")
    client_secret = os.getenv("GITHUB_CLIENT_SECRET")

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not configured in backend/.env",
        )

    # 1. Exchange code for access token
    token_url = "https://github.com/login/oauth/access_token"
    payload = json.dumps({
        "client_id": client_id,
        "client_secret": client_secret,
        "code": data.code,
    }).encode("utf-8")

    req = urllib.request.Request(
        token_url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(req) as resp:
            token_data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to exchange GitHub code: {str(e)}")

    gh_access_token = token_data.get("access_token")
    if not gh_access_token:
        raise HTTPException(status_code=400, detail=token_data.get("error_description", "Invalid GitHub code"))

    # 2. Fetch GitHub User Profile
    user_req = urllib.request.Request(
        "https://api.github.com/user",
        headers={
            "Authorization": f"Bearer {gh_access_token}",
            "User-Agent": "TIMETT-App",
        },
    )
    with urllib.request.urlopen(user_req) as resp:
        gh_user = json.loads(resp.read().decode("utf-8"))

    gh_login = gh_user.get("login") or f"user_{gh_user.get('id', 'gh')}"
    github_name = gh_user.get("name") or gh_login

    # Provider-scoped account email ensures GitHub accounts are ALWAYS treated
    # as independent, separate user accounts from Google accounts.
    github_account_email = f"{gh_login.lower()}@github.com"

    # 3. Create or fetch separate GitHub user in database
    user = db.query(User).filter(User.email == github_account_email).first()
    if not user:
        user = User(
            name=github_name,
            email=github_account_email,
            password_hash=None,
            role="user",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if github_name and user.name != github_name:
            user.name = github_name
            db.commit()
            db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account is disabled.")

    inst_id, dept_id = get_or_create_user_tenant(user, db)
    app_token = create_access_token(user.id)

    return AuthResponse(
        access_token=app_token,
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