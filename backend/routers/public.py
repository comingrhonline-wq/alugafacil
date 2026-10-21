from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from lib.db import db
from models.imovel import Bairro, Imovel, Lead, LeadCreate, Settings

router = APIRouter()


def preco_efetivo(i: dict) -> float:
    p = i.get("preco_promocional")
    return p if p else i["preco"]


async def load_settings() -> Settings:
    doc = await db.settings.find_one({"id": "site"}, {"_id": 0})
    return Settings(**(doc or {}))


@router.get("/imoveis", response_model=list[Imovel])
async def list_imoveis(
    bairro: Optional[str] = None,
    tipo: Optional[str] = None,
    preco_max: Optional[float] = None,
    quartos_min: Optional[int] = None,
    vagas_min: Optional[int] = None,
    promocao: Optional[bool] = None,
    destaque: Optional[bool] = None,
    q: Optional[str] = None,
    ordenar: str = "menor-valor",
    limit: int = Query(default=500, le=500),
):
    filt: dict = {"ativo": True}
    if bairro:
        filt["bairro"] = bairro
    if tipo:
        filt["tipo"] = tipo
    if quartos_min:
        filt["quartos"] = {"$gte": quartos_min}
    if vagas_min:
        filt["vagas"] = {"$gte": vagas_min}
    if promocao:
        filt["preco_promocional"] = {"$gt": 0}
    if destaque:
        filt["destaque"] = True
    if q:
        rx = {"$regex": q.strip(), "$options": "i"}
        filt["$or"] = [{"codigo": rx}, {"bairro": rx}, {"titulo": rx}]
    docs = await db.imoveis.find(filt, {"_id": 0}).to_list(1000)
    if preco_max:
        docs = [d for d in docs if preco_efetivo(d) <= preco_max]
    if ordenar == "maior-valor":
        docs.sort(key=preco_efetivo, reverse=True)
    elif ordenar == "maior-area":
        docs.sort(key=lambda d: d.get("area") or 0, reverse=True)
    elif ordenar == "recentes":
        docs.sort(key=lambda d: d.get("criado_em"), reverse=True)
    else:
        docs.sort(key=preco_efetivo)
    # promos always surface first on the default sort
    if ordenar == "menor-valor":
        docs.sort(key=lambda d: 0 if d.get("preco_promocional") else 1)
    return [Imovel(**d) for d in docs[:limit]]


@router.get("/imoveis/{codigo}", response_model=Imovel)
async def get_imovel(codigo: str):
    doc = await db.imoveis.find_one({"codigo": codigo.upper(), "ativo": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return Imovel(**doc)


@router.get("/imoveis/{codigo}/semelhantes", response_model=list[Imovel])
async def similares(codigo: str):
    base = await db.imoveis.find_one({"codigo": codigo.upper()}, {"_id": 0})
    if not base:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    docs = await db.imoveis.find(
        {"ativo": True, "codigo": {"$ne": base["codigo"]}, "tipo": base["tipo"]}, {"_id": 0}
    ).to_list(1000)
    ref = preco_efetivo(base)
    docs.sort(key=lambda d: (0 if d["bairro"] == base["bairro"] else 1, abs(preco_efetivo(d) - ref)))
    return [Imovel(**d) for d in docs[:3]]


@router.get("/bairros", response_model=list[Bairro])
async def bairros():
    docs = await db.imoveis.find({"ativo": True}, {"_id": 0, "bairro": 1, "preco": 1, "preco_promocional": 1}).to_list(2000)
    agg: dict[str, Bairro] = {}
    for d in docs:
        p = preco_efetivo(d)
        b = agg.get(d["bairro"])
        if b:
            b.total += 1
            b.menor_preco = min(b.menor_preco, p)
        else:
            agg[d["bairro"]] = Bairro(nome=d["bairro"], total=1, menor_preco=p)
    return sorted(agg.values(), key=lambda b: (-b.total, b.nome))


@router.get("/settings", response_model=Settings)
async def get_settings():
    return await load_settings()


@router.post("/leads", response_model=Lead, status_code=201)
async def create_lead(body: LeadCreate):
    lead = Lead(**body.model_dump())
    if body.imovel_codigo:
        im = await db.imoveis.find_one({"codigo": body.imovel_codigo.upper()}, {"_id": 0})
        if not im:
            raise HTTPException(status_code=404, detail="Imóvel não encontrado")
        lead.imovel_codigo = im["codigo"]
        lead.imovel_titulo = im["titulo"]
        lead.imovel_preco = preco_efetivo(im)
    await db.leads.insert_one(lead.model_dump())
    return lead
