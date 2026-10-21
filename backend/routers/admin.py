import hmac
import os
from collections import Counter
from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from lib.auth import COOKIE, is_admin, make_token, require_admin
from lib.db import db
from lib.security import rate_limit, reset
from models.imovel import (
    AdminStats,
    AuthState,
    BairroCount,
    Imovel,
    ImovelCreate,
    ImovelUpdate,
    Lead,
    LeadStatusUpdate,
    LoginRequest,
    Settings,
)
from routers.public import load_settings, preco_efetivo

auth_router = APIRouter(prefix="/auth")
router = APIRouter(prefix="/admin", dependencies=[Depends(require_admin)])


def _aware(doc: dict) -> dict:
    dt = doc.get("criado_em")
    if dt is not None and dt.tzinfo is None:
        doc["criado_em"] = dt.replace(tzinfo=timezone.utc)
    return doc


# ---------- auth ----------
@auth_router.post("/login", response_model=AuthState)
async def login(body: LoginRequest, request: Request, response: Response):
    rate_limit(request, "login", limit=5, window_s=900)  # 5 tries / 15 min per IP
    if not hmac.compare_digest(body.password.encode(), os.environ["ADMIN_PASSWORD"].encode()):
        raise HTTPException(status_code=401, detail="Senha incorreta")
    reset(request, "login")
    response.set_cookie(
        COOKIE, make_token(), httponly=True, samesite="lax", secure=True, max_age=7 * 24 * 3600, path="/"
    )
    return AuthState(authenticated=True)


@auth_router.post("/logout", response_model=AuthState)
async def logout(response: Response):
    response.delete_cookie(COOKIE, path="/")
    return AuthState(authenticated=False)


@auth_router.get("/me", response_model=AuthState)
async def me(request: Request):
    return AuthState(authenticated=is_admin(request))


# ---------- imóveis ----------
@router.get("/imoveis", response_model=list[Imovel])
async def admin_list():
    docs = await db.imoveis.find({}, {"_id": 0}).sort("preco", 1).to_list(2000)
    return [Imovel(**_aware(d)) for d in docs]


@router.post("/imoveis", response_model=Imovel, status_code=201)
async def admin_create(body: ImovelCreate):
    body.codigo = body.codigo.strip().upper()
    if await db.imoveis.find_one({"codigo": body.codigo}):
        raise HTTPException(status_code=409, detail="Já existe um imóvel com este código")
    im = Imovel(**body.model_dump())
    await db.imoveis.insert_one(im.model_dump())
    return im


@router.patch("/imoveis/{id}", response_model=Imovel)
async def admin_update(id: str, body: ImovelUpdate):
    data = body.model_dump(exclude_unset=True, exclude={"remover_promocao"})
    if "codigo" in data and data["codigo"]:
        data["codigo"] = data["codigo"].strip().upper()
        clash = await db.imoveis.find_one({"codigo": data["codigo"], "id": {"$ne": id}})
        if clash:
            raise HTTPException(status_code=409, detail="Já existe um imóvel com este código")
    if body.remover_promocao:
        data["preco_promocional"] = None
    if data:
        await db.imoveis.update_one({"id": id}, {"$set": data})
    doc = await db.imoveis.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return Imovel(**_aware(doc))


@router.delete("/imoveis/{id}", status_code=204)
async def admin_delete(id: str):
    res = await db.imoveis.delete_one({"id": id})
    if not res.deleted_count:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")


# ---------- leads ----------
@router.get("/leads", response_model=list[Lead])
async def admin_leads():
    docs = await db.leads.find({}, {"_id": 0}).sort("criado_em", -1).to_list(5000)
    return [Lead(**_aware(d)) for d in docs]


@router.patch("/leads/{id}", response_model=Lead)
async def admin_lead_status(id: str, body: LeadStatusUpdate):
    await db.leads.update_one({"id": id}, {"$set": {"status": body.status}})
    doc = await db.leads.find_one({"id": id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    return Lead(**_aware(doc))


@router.delete("/leads/{id}", status_code=204)
async def admin_lead_delete(id: str):
    res = await db.leads.delete_one({"id": id})
    if not res.deleted_count:
        raise HTTPException(status_code=404, detail="Lead não encontrado")


# ---------- settings ----------
@router.put("/settings", response_model=Settings)
async def admin_settings(body: Settings):
    await db.settings.update_one({"id": "site"}, {"$set": {**body.model_dump(), "id": "site"}}, upsert=True)
    return await load_settings()


# ---------- stats ----------
@router.get("/stats", response_model=AdminStats)
async def admin_stats():
    ims = await db.imoveis.find({}, {"_id": 0}).to_list(5000)
    leads = await db.leads.find({}, {"_id": 0, "status": 1, "imovel_codigo": 1}).to_list(10000)
    ativos = [i for i in ims if i.get("ativo")]
    bairros = Counter(i["bairro"] for i in ativos)
    por_imovel = Counter(lead["imovel_codigo"] for lead in leads if lead.get("imovel_codigo"))
    return AdminStats(
        imoveis_total=len(ims),
        aluguel=sum(1 for i in ativos if i.get("finalidade", "aluguel") == "aluguel"),
        venda=sum(1 for i in ativos if i.get("finalidade") == "venda"),
        imoveis_ativos=len(ativos),
        promocoes=sum(1 for i in ativos if i.get("preco_promocional")),
        destaques=sum(1 for i in ativos if i.get("destaque")),
        leads_total=len(leads),
        leads_novos=sum(1 for lead in leads if lead.get("status") == "novo"),
        preco_medio=round(sum(preco_efetivo(i) for i in ativos) / len(ativos), 2) if ativos else 0,
        top_bairros=[BairroCount(bairro=b, total=n) for b, n in bairros.most_common(6)],
        leads_por_imovel=[BairroCount(bairro=c, total=n) for c, n in por_imovel.most_common(5)],
    )
