"""One-time import of residential rentals (casa + apartamento) from Prime Imóveis PG.
Writes backend/data/imoveis.json, consumed by seed.py.
Run: cd /app/backend && python scripts/scrape_prime.py
"""
import json
import re
import time
from pathlib import Path

import requests

BASE = "https://www.primeimoveispg.com.br"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"}
OUT = Path(__file__).resolve().parent.parent / "data" / "imoveis.json"
CUT_MARKERS = ["Sobre a Prime", "SOBRE A PRIME", "Prime Imóveis", "PRIME IMÓVEIS", "Por que escolher Praia Grande"]


SLUGS = ["casa", "sobrado", "apartamento", "apartamento-duplex", "apartamento-garden", "apartamento-triplex", "cobertura", "kitnet"]


def sitemap_urls() -> list[tuple[str, str]]:
    """(url, finalidade) — rentals first so a listing offered both ways is kept as aluguel."""
    urls: list[tuple[str, str]] = []
    seen: set[str] = set()
    for fin, path in (("aluguel", "para-alugar"), ("venda", "a-venda")):
        for t in SLUGS:
            xml = requests.get(f"{BASE}/sitemap/imoveis/{path}/{t}/praia-grande.xml", headers=UA, timeout=30).text
            for u in re.findall(r"<loc>([^<]+)</loc>", xml):
                code = u.rsplit("/", 1)[-1]
                if "/imovel/" in u and code not in seen:
                    seen.add(code)
                    urls.append((u, fin))
    return urls


def tipo_de(pt: str) -> str:
    if "STUDIO" in pt or "KITNET" in pt:
        return "kitnet"
    if "HOUSE" in pt or "TOWNHOUSE" in pt or "SOBRADO" in pt:
        return "casa"
    return "apartamento"


def clean_description(text: str) -> str:
    text = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    for m in CUT_MARKERS:
        i = text.find(m)
        if i > 0:
            text = text[:i]
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def first(v):
    if isinstance(v, list):
        return v[0] if v else 0
    return v or 0


def parse(html: str, url: str, finalidade: str) -> dict | None:
    i = html.find('"listing":[{')
    if i == -1:
        return None
    arr, _ = json.JSONDecoder().raw_decode(html[i + 10:])
    o = arr[0]
    purpose = "FOR_RENT" if finalidade == "aluguel" else "FOR_SALE"
    if purpose not in (o.get("property_purposes") or []):
        return None
    photos = [p.get("picture_full") for p in o.get("photos") or [] if p.get("picture_full") and p.get("media_type", "IMAGE") in ("IMAGE", None, "")]
    if not photos:
        photos = [p.get("picture_full") for p in o.get("photos") or [] if p.get("picture_full")]
    return {
        "codigo": o.get("property_reference"),
        "tipo": tipo_de(o.get("property_type") or ""),
        "finalidade": finalidade,
        "property_type": o.get("property_type"),
        "bairro": o.get("neighborhood_display") or o.get("neighborhood") or "",
        "cidade": o.get("city") or "Praia Grande",
        "estado": o.get("state") or "SP",
        "preco": float(first(o.get("rent_price") if finalidade == "aluguel" else o.get("sale_price"))),
        "total_aluguel": float(o.get("total_rent") or 0),
        "area": float(first(o.get("usable_floor_area")) or first(o.get("area")) or 0),
        "quartos": int(first(o.get("bedrooms"))),
        "suites": int(first(o.get("suites"))),
        "banheiros": int(first(o.get("bathrooms"))),
        "vagas": int(first(o.get("garages"))),
        "comodidades": [a for a in o.get("amenities") or [] if not a.startswith("TAG_") and a != "PICTURES"],
        "descricao": clean_description(o.get("listing_description") or ""),
        "fotos": photos,
        "video_url": o.get("video_url") or "",
        "origem_url": url,
        "atualizado_em": o.get("updated_at"),
    }


def fetch(item: tuple[str, str]) -> tuple[str, dict | None]:
    url, fin = item
    for _ in range(3):
        try:
            r = requests.get(url, headers=UA, timeout=40)
            rec = parse(r.text, url, fin)
            time.sleep(0.4)
            return url, rec
        except Exception:  # noqa: BLE001
            time.sleep(2)
    return url, None


def main():
    from concurrent.futures import ThreadPoolExecutor

    urls = sitemap_urls()
    print(f"{len(urls)} urls", flush=True)
    out, failed = [], []
    with ThreadPoolExecutor(max_workers=4) as ex:
        for n, (url, rec) in enumerate(ex.map(fetch, urls), 1):
            if rec and rec["preco"] > 0 and rec["fotos"]:
                out.append(rec)
            else:
                failed.append(url)
            if n % 50 == 0:
                print(n, len(out), flush=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"saved {len(out)} / failed {len(failed)}", failed)


if __name__ == "__main__":
    main()
