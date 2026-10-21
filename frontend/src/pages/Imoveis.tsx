import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, RotateCcw, Search, SearchX } from "lucide-react";
import PropertyCard, { PropertyCardSkeleton } from "@/components/PropertyCard";
import FilterSelect, { ORDENAR_OPTIONS, precoOptions, QUARTOS_OPTIONS, TIPO_OPTIONS } from "@/components/FilterSelect";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useBairros, useImoveis } from "@/lib/queries";
import { cn } from "@/lib/utils";

const KEYS = ["finalidade", "bairro", "tipo", "preco_max", "quartos_min", "promocao", "q", "ordenar", "page"] as const;
const FILTER_KEYS = ["bairro", "tipo", "preco_max", "quartos_min", "promocao", "q"] as const;
const TIPO_TITULO: Record<string, string> = { casa: "Casas", apartamento: "Apartamentos", kitnet: "Kitnets" };

function pageList(cur: number, pages: number): (number | "…")[] {
  const out: (number | "…")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - cur) <= 1) out.push(p);
    else if (out[out.length - 1] !== "…") out.push("…");
  }
  return out;
}

export default function Imoveis() {
  const [sp, setSp] = useSearchParams();
  const params = Object.fromEntries(KEYS.map((k) => [k, sp.get(k) ?? ""])) as Record<(typeof KEYS)[number], string>;
  const fin = params.finalidade === "venda" ? "venda" : "aluguel";
  const bairros = useBairros(fin);
  const q = useImoveis({ ...params, finalidade: fin, promocao: params.promocao ? "true" : "" });
  const data = q.isError ? undefined : q.data;
  const lista = data?.items ?? [];
  const page = data?.page ?? 1;
  const pages = data?.pages ?? 1;

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== "page") next.delete("page");
    setSp(next, { replace: k !== "page" });
    if (k === "page") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const setFin = (v: string) => {
    const next = new URLSearchParams();
    if (v === "venda") next.set("finalidade", "venda");
    if (params.tipo) next.set("tipo", params.tipo);
    setSp(next, { replace: true });
  };
  const clear = () => setSp(fin === "venda" ? new URLSearchParams({ finalidade: "venda" }) : new URLSearchParams(), { replace: true });
  const ativos = FILTER_KEYS.filter((k) => params[k]).length;

  const tipoTxt = TIPO_TITULO[params.tipo] ?? "Imóveis";
  const titulo = params.promocao ? "Imóveis em promoção" : `${tipoTxt} ${fin === "venda" ? "à venda" : "para alugar"}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink">Praia Grande · SP</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl" data-testid="listing-title">
            {titulo}
            {params.bairro && <span className="text-slate-400"> em {params.bairro}</span>}
          </h1>
        </div>
        <div className="grid w-full grid-cols-2 gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200 sm:w-72" role="tablist">
          {(["aluguel", "venda"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={fin === v}
              onClick={() => setFin(v)}
              data-testid={`listing-tab-${v}`}
              className={cn("rounded-lg py-2.5 text-sm font-bold transition-[background-color,color] duration-200", fin === v ? "bg-navy text-white" : "text-slate-500 hover:text-navy")}
            >
              {v === "aluguel" ? "Alugar" : "Comprar"}
            </button>
          ))}
        </div>
      </div>

      <div className="sticky top-[80px] z-30 mb-8 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur" data-testid="filter-bar">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
          <div className="col-span-2 min-w-0 space-y-1.5 md:col-span-3 lg:col-span-1">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Buscar</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={params.q} maxLength={60} onChange={(e) => set("q", e.target.value)} placeholder="Código ou bairro" className="h-11 bg-white pl-9" data-testid="filter-search-input" />
            </div>
          </div>
          <FilterSelect
            label="Bairro"
            value={params.bairro}
            onChange={(v) => set("bairro", v)}
            allLabel="Todos os bairros"
            options={(bairros.isError ? [] : bairros.data ?? []).map((b) => ({ value: b.nome, label: `${b.nome} (${b.total})` }))}
            testId="filter-bairro"
          />
          <FilterSelect label="Tipo" value={params.tipo} onChange={(v) => set("tipo", v)} allLabel="Todos os tipos" options={TIPO_OPTIONS} testId="filter-tipo" />
          <FilterSelect label={fin === "venda" ? "Valor máximo" : "Aluguel máximo"} value={params.preco_max} onChange={(v) => set("preco_max", v)} allLabel="Qualquer valor" options={precoOptions(fin)} testId="filter-preco" />
          <FilterSelect label="Quartos" value={params.quartos_min} onChange={(v) => set("quartos_min", v)} allLabel="Qualquer" options={QUARTOS_OPTIONS} testId="filter-quartos" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-4">
            {fin === "aluguel" && (
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                <Checkbox checked={!!params.promocao} onCheckedChange={(c) => set("promocao", c ? "1" : "")} data-testid="filter-promo-checkbox" />
                Somente promoções
              </label>
            )}
            {ativos > 0 && (
              <button type="button" onClick={clear} className="flex items-center gap-1.5 text-sm font-semibold text-pink hover:underline" data-testid="filter-clear-button">
                <RotateCcw className="size-3.5" /> Limpar filtros ({ativos})
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600" data-testid="listing-count">
              {q.isLoading ? "Carregando…" : `${data?.total ?? 0} imóve${data?.total === 1 ? "l" : "is"}`}
            </span>
            <FilterSelect label="" value={params.ordenar || "menor-valor"} onChange={(v) => set("ordenar", v === "menor-valor" ? "" : v)} options={ORDENAR_OPTIONS} testId="filter-ordenar" className="w-44 [&>span]:hidden" />
          </div>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 gap-6 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8", q.isFetching && !q.isLoading && "opacity-60")} data-testid="listing-grid">
        {q.isLoading
          ? Array.from({ length: 9 }).map((_, i) => <PropertyCardSkeleton key={i} />)
          : lista.map((i, n) => <PropertyCard key={i.id} imovel={i} index={n} />)}
      </div>

      {pages > 1 && (
        <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Paginação" data-testid="pagination">
          <button type="button" disabled={page <= 1} onClick={() => set("page", String(page - 1))} className="flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-navy hover:bg-slate-50 disabled:opacity-40" data-testid="pagination-prev">
            <ChevronLeft className="size-4" /> Anterior
          </button>
          {pageList(page, pages).map((p, n) =>
            p === "…" ? (
              <span key={`e${n}`} className="px-1 text-slate-400">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => set("page", String(p))}
                aria-current={p === page ? "page" : undefined}
                data-testid={`pagination-page-${p}`}
                className={cn("size-10 rounded-lg text-sm font-semibold transition-colors", p === page ? "bg-navy text-white" : "border border-slate-200 bg-white text-navy hover:bg-slate-50")}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" disabled={page >= pages} onClick={() => set("page", String(page + 1))} className="flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-navy hover:bg-slate-50 disabled:opacity-40" data-testid="pagination-next">
            Próxima <ChevronRight className="size-4" />
          </button>
        </nav>
      )}

      {!q.isLoading && !lista.length && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center" data-testid="listing-empty">
          <SearchX className="size-10 text-slate-300" />
          <p className="text-lg font-semibold text-navy">{q.isError ? "Não foi possível carregar os imóveis agora." : "Nenhum imóvel encontrado com esses filtros."}</p>
          <p className="text-sm text-slate-500">Tente ampliar o valor máximo ou escolher outro bairro.</p>
          {ativos > 0 && (
            <button type="button" onClick={clear} className="mt-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white" data-testid="listing-empty-clear-button">
              Ver todos os imóveis
            </button>
          )}
        </div>
      )}
    </div>
  );
}
