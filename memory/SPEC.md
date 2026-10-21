# Aluga Fácil — SPEC

Rental real-estate site for Praia Grande/SP (pt-BR). Public site + password-protected admin.

## Data
- Listings imported once from primeimoveispg.com.br (residential rentals: casa + apartamento) via
  `backend/scripts/scrape_prime.py` → `backend/data/imoveis.json` → `python seed.py` (idempotent, by `codigo`).
- Seed: 57 imóveis (44 apartamentos, 13 casas), ~14 bairros (Ocian has 19). Photos hotlinked from img.kenlo.io
  (requires no-referrer — set via `<meta name="referrer">` + `referrerPolicy` on img).
- Promo: **CA0331** (Casa com 2 quartos em Balneário Esmeralda) preco 1750 → preco_promocional 900 (−49%), destaque.
  5 other imóveis marked destaque.
- Settings default: nome_exibicao "Aluga Fácil", whatsapp/creci/email/instagram EMPTY (user decides tomorrow).
  WhatsApp buttons are hidden until whatsapp is set; leads are always saved.

## Collections
- `imoveis`: id, codigo (unique, upper), titulo, tipo (casa|apartamento), bairro, cidade, estado, preco, preco_promocional|null,
  destaque, ativo, area, quartos, suites, banheiros, vagas, comodidades[], descricao, fotos[], video_url, criado_em
- `leads`: id, nome, telefone, mensagem, imovel_codigo, imovel_titulo, imovel_preco, status (novo|contatado|visita|fechado|perdido), criado_em
- `settings`: single doc id="site"

## API (all under /api)
Public: GET /imoveis (bairro, tipo, preco_max, quartos_min, promocao, destaque, q, ordenar=menor-valor|maior-valor|maior-area),
GET /imoveis/{codigo}, GET /imoveis/{codigo}/semelhantes, GET /bairros, GET /settings, POST /leads.
Auth: POST /auth/login {password} (sets httpOnly cookie af_admin, JWT 7d), POST /auth/logout, GET /auth/me.
Admin (cookie required, else 401): GET/POST /admin/imoveis, PATCH/DELETE /admin/imoveis/{id} (remover_promocao flag),
GET /admin/leads, PATCH/DELETE /admin/leads/{id}, PUT /admin/settings, GET /admin/stats.

## Frontend routes
/ (hero search, promo CA0331, destaques, bairros, como funciona, contato form) · /imoveis (filters in URL) ·
/imovel/:codigo (gallery+lightbox, specs, lead form, similares) · /admin/login · /admin (tabs: Visão geral, Imóveis, Interessados, Configurações)

## Auth
Single admin password from backend/.env ADMIN_PASSWORD — see memory/test_credentials.md.
