import math
import re
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request

from lib.db import db
from lib.security import rate_limit
from models.imovel import Bairro, Imovel, ImovelCard, ImovelPage, Lead, LeadCreate, Resumo, Settings

router = APIRouter()

CARD_FIELDS = {
    "_id": 0, "id": 1, "codigo": 1, "titulo": 1, "tipo": 1, "finalidade": 1, "bairro": 1, "cidade": 1, "estado": 1,
    "preco": 1, "preco_promocional": 1, "destaque": 1, "area": 1, "quartos": 1, "banheiros": 1, "vagas": 1,
    "fotos": 1, "criado_em": 1,
}


def preco_efetivo(i: dict) -> float:
    p = i.get("preco_promocional")
    return p if p else i["preco"]


def to_card(d: dict) -> ImovelCard:
    fotos = d.get("fotos") or []
    return ImovelCard(**{k: v for k, v in d.items() if k != "fotos"}, foto=fotos[0] if fotos else "", total_fotos=len(fotos))


def fin_filter(finalidade: Optional[str]) -> dict:
    if finalidade == "venda":
        return {"finalidade": "venda"}
    if finalidade == "aluguel":
        return {"finalidade": {"$ne": "venda"}}  # legacy docs without the field are rentals
    return {}


async def load_settings() -> Settings:
    doc = await db.settings.find_one({"id": "site"}, {"_id": 0})
    return Settings(**(doc or {}))


@router.get("/imoveis", response_model=ImovelPage)
async def list_imoveis(
    finalidade: Optional[str] = "aluguel",
    bairro: Optional[str] = Query(default=None, max_length=80),
    tipo: Optional[str] = Query(default=None, max_length=20),
    preco_max: Optional[float] = None,
    quartos_min: Optional[int] = None,
    vagas_min: Optional[int] = None,
    promocao: Optional[bool] = None,
    destaque: Optional[bool] = None,
    q: Optional[str] = Query(default=None, max_length=60),
    ordenar: str = "menor-valor",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=60),
):
    filt: dict = {"ativo": True, **fin_filter(finalidade)}
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
    if q and q.strip():
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}  # escaped: no regex injection
        filt["$or"] = [{"codigo": rx}, {"bairro": rx}, {"titulo": rx}]
    docs = await db.imoveis.find(filt, CARD_FIELDS).to_list(5000)
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
        docs.sort(key=lambda d: 0 if d.get("preco_promocional") else 1)  # promos first
    total = len(docs)
    pages = max(1, math.ceil(total / page_size))
    start = (page - 1) * page_size
    return ImovelPage(items=[to_card(d) for d in docs[start:start + page_size]], total=total, page=page, pages=pages)


@router.get("/resumo", response_model=Resumo)
async def resumo():
    docs = await db.imoveis.find({"ativo": True}, {"_id": 0, "finalidade": 1, "bairro": 1, "preco": 1, "preco_promocional": 1}).to_list(10000)
    alug = [d for d in docs if d.get("finalidade", "aluguel") == "aluguel"]
    return Resumo(
        aluguel_total=len(alug),
        venda_total=len(docs) - len(alug),
        bairros=len({d["bairro"] for d in docs}),
        menor_aluguel=min((preco_efetivo(d) for d in alug), default=0),
    )


@router.get("/imoveis/{codigo}", response_model=Imovel)
async def get_imovel(codigo: str):
    doc = await db.imoveis.find_one({"codigo": codigo.upper()[:20], "ativo": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    return Imovel(**doc)


@router.get("/imoveis/{codigo}/semelhantes", response_model=list[ImovelCard])
async def similares(codigo: str):
    base = await db.imoveis.find_one({"codigo": codigo.upper()[:20]}, {"_id": 0})
    if not base:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado")
    docs = await db.imoveis.find(
        {"ativo": True, "codigo": {"$ne": base["codigo"]}, "tipo": base["tipo"], **fin_filter(base.get("finalidade", "aluguel"))},
        CARD_FIELDS,
    ).to_list(5000)
    ref = preco_efetivo(base)
    docs.sort(key=lambda d: (0 if d["bairro"] == base["bairro"] else 1, abs(preco_efetivo(d) - ref)))
    return [to_card(d) for d in docs[:3]]


@router.get("/bairros", response_model=list[Bairro])
async def bairros(finalidade: Optional[str] = None):
    docs = await db.imoveis.find(
        {"ativo": True, **fin_filter(finalidade)}, {"_id": 0, "bairro": 1, "preco": 1, "preco_promocional": 1}
    ).to_list(10000)
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
async def create_lead(body: LeadCreate, request: Request):
    rate_limit(request, "lead", limit=8, window_s=600)
    if not body.consentimento:
        raise HTTPException(status_code=422, detail="É preciso aceitar a Política de Privacidade.")
    lead = Lead(**body.model_dump(exclude={"website", "consentimento"}))
    if body.website:  # bot filled the honeypot: pretend success, store nothing
        return lead
    if body.imovel_codigo:
        im = await db.imoveis.find_one({"codigo": body.imovel_codigo.upper()}, {"_id": 0})
        if not im:
            raise HTTPException(status_code=404, detail="Imóvel não encontrado")
        lead.imovel_codigo = im["codigo"]
        lead.imovel_titulo = im["titulo"]
        lead.imovel_preco = preco_efetivo(im)
    await db.leads.insert_one(lead.model_dump())
    return lead
