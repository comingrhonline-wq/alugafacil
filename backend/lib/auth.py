import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request

COOKIE = "af_admin"
ALGO = "HS256"


def make_token() -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=7)
    return jwt.encode({"sub": "admin", "exp": exp}, os.environ["JWT_SECRET"], algorithm=ALGO)


def is_admin(request: Request) -> bool:
    token = request.cookies.get(COOKIE)
    if not token:
        return False
    try:
        jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[ALGO])
        return True
    except jwt.PyJWTError:
        return False


async def require_admin(request: Request) -> None:
    if not is_admin(request):
        raise HTTPException(status_code=401, detail="Não autorizado")
