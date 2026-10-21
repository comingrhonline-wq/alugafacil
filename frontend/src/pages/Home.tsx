import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search, ShieldCheck, Camera, MessageCircle, KeyRound, MapPin, Sparkles } from "lucide-react";
import PropertyCard, { PropertyCardSkeleton } from "@/components/PropertyCard";
import PromoHighlight from "@/components/PromoHighlight";
import InterestForm from "@/components/InterestForm";
import FilterSelect, { precoOptions, QUARTOS_OPTIONS, TIPO_OPTIONS } from "@/components/FilterSelect";
import { useBairros, useImoveis, useResumo, useSettings } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { brl } from "@/lib/format";

const HERO_IMG = "https://images.pexels.com/photos/34775542/pexels-photo-34775542.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1600";
const CITY_IMG = "https://images.pexels.com/photos/35683829/pexels-photo-35683829.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const STEPS = [
  { icon: Search, title: "Encontre", text: "Filtre por bairro, tipo, valor e quartos. Todos os anúncios têm fotos reais e valores atualizados." },
  { icon: MessageCircle, title: "Fale com a gente", text: "Gostou? Envie seu interesse em segundos e continue a conversa direto pelo WhatsApp." },
  { icon: KeyRound, title: "Visite e alugue", text: "Agendamos a visita, tiramos suas dúvidas sobre garantias e documentação e você recebe as chaves." },
];

export default function Home() {
  const navigate = useNavigate();
  const settings = useSettings();
  const [fin, setFin] = useState<"aluguel" | "venda">("aluguel");
  const bairros = useBairros();
  const bairrosBusca = useBairros(fin);
  const resumoQ = useResumo();
  const promoQ = useImoveis({ promocao: "true", page_size: "1" });
  const destQ = useImoveis({ destaque: "true", page_size: "7" });
  const vendaQ = useImoveis({ finalidade: "venda", destaque: "true", page_size: "6" });
  const [f, setF] = useState({ bairro: "", tipo: "", preco_max: "", quartos_min: "" });

  const resumo = resumoQ.isError ? undefined : resumoQ.data;
  const total = resumo ? resumo.aluguel_total + resumo.venda_total : 0;
  const promo = promoQ.isError ? undefined : promoQ.data?.items[0];
  const vitrine = (destQ.isError ? [] : destQ.data?.items ?? []).filter((i) => !i.preco_promocional).slice(0, 6);
  const vendas = vendaQ.isError ? [] : vendaQ.data?.items ?? [];
  const bairrosList = bairros.isError ? [] : bairros.data ?? [];
  const bairrosBuscaList = bairrosBusca.isError ? [] : bairrosBusca.data ?? [];
  const menor = resumo?.menor_aluguel ?? 0;

  const buscar = () => {
    const qs = new URLSearchParams();
    if (fin === "venda") qs.set("finalidade", "venda");
    Object.entries(f).forEach(([k, v]) => v && qs.set(k, v));
    navigate(`/imoveis${qs.toString() ? `?${qs}` : ""}`);
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white" data-testid="hero-section">
        <img src={HERO_IMG} alt="Vista aérea da orla de Praia Grande" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(5,29,56,0.96)_0%,rgba(8,40,76,0.85)_45%,rgba(8,40,76,0.35)_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-28 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-32 lg:pt-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-pink-subtle backdrop-blur">
              <MapPin className="size-3.5 text-pink" /> Praia Grande · Litoral de SP
            </span>
            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Seu próximo endereço perto do mar, <span className="text-pink">sem complicação.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-200">
              Casas, apartamentos e kitnets para alugar ou comprar, com fotos reais, valores claros e atendimento direto. Escolha, fale com a gente e agende sua visita.
            </p>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/15 pt-6" data-testid="hero-metrics">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">Para alugar</dt>
                <dd className="mt-1 font-heading text-3xl font-extrabold" data-testid="hero-metric-aluguel">{resumo?.aluguel_total || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">À venda</dt>
                <dd className="mt-1 font-heading text-3xl font-extrabold" data-testid="hero-metric-venda">{resumo?.venda_total || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-400">A partir de</dt>
                <dd className="mt-1 font-heading text-3xl font-extrabold text-pink">{menor ? brl(menor) : "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="animate-fade-up self-center rounded-3xl border border-white/20 bg-white p-6 text-slate-900 shadow-2xl shadow-black/30 [animation-delay:120ms] sm:p-8" data-testid="hero-search-card">
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
              {(["aluguel", "venda"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={fin === v}
                  onClick={() => {
                    setFin(v);
                    setF({ ...f, bairro: "", preco_max: "" });
                  }}
                  data-testid={`hero-tab-${v}`}
                  className={cn("rounded-lg py-2.5 text-sm font-bold transition-[background-color,color,box-shadow] duration-200", fin === v ? "bg-white text-navy shadow" : "text-slate-500 hover:text-navy")}
                >
                  {v === "aluguel" ? "Alugar" : "Comprar"}
                </button>
              ))}
            </div>
            <h2 className="text-xl font-bold text-navy">Encontre o imóvel ideal</h2>
            <p className="mt-1 text-sm text-slate-500">Busque entre {total || "centenas de"} opções disponíveis agora.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <FilterSelect
                label="Bairro"
                value={f.bairro}
                onChange={(v) => setF({ ...f, bairro: v })}
                allLabel="Todos os bairros"
                options={bairrosBuscaList.map((b) => ({ value: b.nome, label: `${b.nome} (${b.total})` }))}
                testId="hero-filter-bairro"
              />
              <FilterSelect label="Tipo" value={f.tipo} onChange={(v) => setF({ ...f, tipo: v })} allLabel="Todos os tipos" options={TIPO_OPTIONS} testId="hero-filter-tipo" />
              <FilterSelect label="Aluguel máximo" value={f.preco_max} onChange={(v) => setF({ ...f, preco_max: v })} allLabel="Qualquer valor" options={precoOptions(fin)} testId="hero-filter-preco" />
              <FilterSelect label="Quartos" value={f.quartos_min} onChange={(v) => setF({ ...f, quartos_min: v })} allLabel="Qualquer" options={QUARTOS_OPTIONS} testId="hero-filter-quartos" />
            </div>
            <button
              type="button"
              onClick={buscar}
              data-testid="hero-search-button"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink font-bold text-white shadow-lg shadow-pink/30 transition-[background-color,transform] duration-200 hover:bg-pink-hover active:scale-[0.98]"
            >
              <Search className="size-4" /> Buscar imóveis
            </button>
          </div>
        </div>
      </section>

      {/* PROMO */}
      <div className="-mt-14 relative z-10">
        {promo ? <PromoHighlight imovel={promo} /> : <div className="h-14" />}
      </div>

      {/* DESTAQUES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" data-testid="featured-section">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink">Selecionados para você</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy sm:text-3xl lg:text-4xl">Destaques para alugar</h2>
          </div>
          <Link to="/imoveis" className="group inline-flex items-center gap-2 font-semibold text-navy hover:text-pink" data-testid="featured-see-all-link">
            Ver todos os {resumo?.aluguel_total || ""} para alugar <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {destQ.isLoading
            ? Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)
            : vitrine.map((i, n) => <PropertyCard key={i.id} imovel={i} index={n} />)}
          {!destQ.isLoading && !vitrine.length && (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">Os imóveis aparecerão aqui em instantes.</p>
          )}
        </div>
      </section>

      {/* VENDA */}
      {(vendaQ.isLoading || vendas.length > 0) && (
        <section className="border-y border-slate-200 bg-white py-20" data-testid="sale-section">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Realize o sonho da casa própria</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy sm:text-3xl lg:text-4xl">Imóveis à venda</h2>
                <p className="mt-2 max-w-xl text-slate-600">{resumo?.venda_total || "Centenas de"} casas, sobrados, apartamentos, coberturas e kitnets à venda em Praia Grande.</p>
              </div>
              <Link to="/imoveis?finalidade=venda" className="group inline-flex items-center gap-2 font-semibold text-navy hover:text-pink" data-testid="sale-see-all-link">
                Ver todos à venda <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {vendaQ.isLoading
                ? Array.from({ length: 3 }).map((_, i) => <PropertyCardSkeleton key={i} />)
                : vendas.map((i, n) => <PropertyCard key={i.id} imovel={i} index={n} />)}
            </div>
          </div>
        </section>
      )}

      {/* BAIRROS */}
      <section id="bairros" className="scroll-mt-24 bg-white py-20" data-testid="bairros-section">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div className="relative overflow-hidden rounded-3xl">
            <img src={CITY_IMG} alt="Orla de Praia Grande" className="h-full min-h-[280px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
            <div className="absolute bottom-0 p-7 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink">Explore a cidade</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Bairros de Praia Grande</h2>
              <p className="mt-2 max-w-sm text-sm text-slate-200">Do agito do Canto do Forte à tranquilidade do Ocian — escolha onde quer morar.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 content-start gap-3 sm:grid-cols-3">
            {bairrosList.map((b) => (
              <Link
                key={b.nome}
                to={`/imoveis?bairro=${encodeURIComponent(b.nome)}`}
                data-testid={`bairro-link-${b.nome.toLowerCase().replace(/\s+/g, "-")}`}
                className="group rounded-2xl border border-slate-200 bg-sand p-4 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-pink/50 hover:shadow-md"
              >
                <p className="font-semibold text-navy group-hover:text-pink">{b.nome}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {b.total} imóve{b.total > 1 ? "is" : "l"} · a partir de <span className="font-mono font-semibold text-slate-700">{brl(b.menor_preco)}</span>
                </p>
              </Link>
            ))}
            {bairros.isLoading && Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-[74px] animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" data-testid="how-it-works-section">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink">Como funciona</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-navy sm:text-3xl lg:text-4xl">Do anúncio às chaves em três passos</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, n) => (
            <div key={s.title} className="relative rounded-3xl border border-slate-200 bg-white p-8 transition-shadow duration-300 hover:shadow-lg">
              <span className="absolute right-6 top-5 font-heading text-6xl font-black text-slate-100">0{n + 1}</span>
              <span className="relative grid size-12 place-items-center rounded-2xl bg-navy text-white">
                <s.icon className="size-5" />
              </span>
              <h3 className="relative mt-6 text-xl font-semibold text-navy">{s.title}</h3>
              <p className="relative mt-2 leading-relaxed text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 rounded-3xl bg-navy px-8 py-8 text-white sm:grid-cols-3">
          <div className="flex items-center gap-3"><Camera className="size-6 text-pink" /><span className="text-sm">Fotos reais de todos os imóveis</span></div>
          <div className="flex items-center gap-3"><ShieldCheck className="size-6 text-pink" /><span className="text-sm">Atendimento por corretor credenciado{settings.creci ? ` · CRECI ${settings.creci}` : ""}</span></div>
          <div className="flex items-center gap-3"><Sparkles className="size-6 text-pink" /><span className="text-sm">Ofertas exclusivas toda semana</span></div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="scroll-mt-24 bg-navy-dark py-20 text-white" data-testid="contact-section">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink">Atendimento direto</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Não achou o que procura? A gente encontra pra você.</h2>
            <p className="mt-4 max-w-lg leading-relaxed text-slate-300">
              Conte o bairro, o número de quartos e quanto quer pagar. Avisamos assim que surgir um imóvel com o seu perfil — inclusive antes de ir para o site.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-pink" />Resposta rápida pelo WhatsApp</li>
              <li className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-pink" />Visitas agendadas no seu horário</li>
              <li className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-pink" />Orientação sobre fiador, seguro-fiança e caução</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:p-8">
            <InterestForm variant="dark" testPrefix="contact" />
          </div>
        </div>
      </section>
    </div>
  );
}
