"""Idempotent seed: imports backend/data/imoveis.json (Prime Imóveis rentals) and the CA0331 promo.
Existing imóveis (matched by codigo) are left untouched so admin edits survive re-runs.
Run: cd /app/backend && python seed.py
"""
import asyncio
import json
from pathlib import Path

from lib.db import db, ensure_indexes
from models.imovel import Imovel, Settings

DATA = Path(__file__).parent / "data" / "imoveis.json"
PROMOS = {"CA0331": 900.0}

LABEL_TIPO = {"casa": "Casa", "apartamento": "Apartamento"}


def titulo(r: dict) -> str:
    t = LABEL_TIPO[r["tipo"]]
    pt = r.get("property_type") or ""
    if "DUPLEX" in pt:
        t = "Apartamento duplex"
    elif "KITNET" in pt or "STUDIO" in pt:
        t = "Kitnet"
    elif "TOWNHOUSE" in pt or "SOBRADO" in pt:
        t = "Sobrado"
    q = r["quartos"]
    partes = [t]
    if q:
        partes.append(f"com {q} quarto{'s' if q > 1 else ''}")
    partes.append(f"no {r['bairro']}" if not r["bairro"].lower().startswith(("vila", "balne", "jardim", "cidade")) else f"em {r['bairro']}")
    return " ".join(partes)


async def main():
    await ensure_indexes()
    rows = json.loads(DATA.read_text(encoding="utf-8"))
    inserted = 0
    for r in rows:
        codigo = r["codigo"].upper()
        if await db.imoveis.find_one({"codigo": codigo}):
            continue
        im = Imovel(
            codigo=codigo,
            titulo=titulo(r),
            tipo=r["tipo"],
            bairro=r["bairro"],
            cidade=r.get("cidade") or "Praia Grande",
            estado=r.get("estado") or "SP",
            preco=r["preco"],
            preco_promocional=PROMOS.get(codigo),
            destaque=codigo in PROMOS,
            area=r.get("area") or 0,
            quartos=r.get("quartos") or 0,
            suites=r.get("suites") or 0,
            banheiros=r.get("banheiros") or 0,
            vagas=r.get("vagas") or 0,
            comodidades=r.get("comodidades") or [],
            descricao=r.get("descricao") or "",
            fotos=r.get("fotos") or [],
            video_url=r.get("video_url") or "",
        )
        await db.imoveis.insert_one(im.model_dump())
        inserted += 1
    # mark a few well-photographed, mid-priced listings as destaque if none yet (besides promo)
    if await db.imoveis.count_documents({"destaque": True}) <= len(PROMOS):
        cands = await db.imoveis.find({"ativo": True, "preco_promocional": None}, {"_id": 0}).to_list(1000)
        cands = [c for c in cands if len(c["fotos"]) >= 8 and 1800 <= c["preco"] <= 4500]
        cands.sort(key=lambda c: -len(c["fotos"]))
        for c in cands[:5]:
            await db.imoveis.update_one({"id": c["id"]}, {"$set": {"destaque": True}})
    if not await db.settings.find_one({"id": "site"}):
        await db.settings.insert_one({**Settings().model_dump(), "id": "site"})
    total = await db.imoveis.count_documents({})
    print(f"inserted {inserted}, total {total}")


if __name__ == "__main__":
    asyncio.run(main())
