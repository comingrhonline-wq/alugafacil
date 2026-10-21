import { Link } from "react-router-dom";
import { ArrowRight, BedDouble, Car, Flame, MapPin, Maximize2, Bath } from "lucide-react";
import type { Imovel } from "@/lib/types";
import { brl, descontoPct } from "@/lib/format";

export default function PromoHighlight({ imovel: i }: { imovel: Imovel }) {
  const economia = i.preco - (i.preco_promocional || i.preco);
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" data-testid="promo-highlight">
      <div className="relative grid overflow-hidden rounded-[2rem] border-2 border-pink bg-gradient-to-br from-white via-pink-subtle to-white shadow-2xl shadow-pink/15 lg:grid-cols-[1.15fr_1fr]">
        <Link to={`/imovel/${i.codigo}`} className="group relative min-h-[300px] overflow-hidden" data-testid="promo-highlight-photo-link">
          {i.fotos[0] && (
            <img src={i.fotos[0]} alt={i.titulo} referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent" />
          <div className="absolute left-5 top-5 flex items-center gap-2 overflow-hidden rounded-full bg-pink px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-white shadow-lg">
            <Flame className="size-4" /> Super oferta exclusiva
            <span className="pointer-events-none absolute inset-y-0 left-0 w-8 animate-shine bg-white/40" />
          </div>
          <div className="absolute bottom-5 left-5 grid size-24 animate-float-soft place-items-center rounded-full bg-white text-center shadow-xl">
            <span className="font-heading text-2xl font-black leading-none text-pink">−{descontoPct(i)}%</span>
          </div>
        </Link>
        <div className="flex flex-col justify-center gap-6 p-7 sm:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink">Promoção do mês · {i.codigo}</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-navy sm:text-3xl lg:text-4xl">{i.titulo}</h2>
            <p className="mt-2 flex items-center gap-1.5 text-slate-600">
              <MapPin className="size-4 text-pink" /> {i.bairro} · Praia Grande/SP
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
            {i.quartos > 0 && <span className="flex items-center gap-1.5"><BedDouble className="size-4 text-navy" />{i.quartos} quartos</span>}
            {i.banheiros > 0 && <span className="flex items-center gap-1.5"><Bath className="size-4 text-navy" />{i.banheiros} banheiro{i.banheiros > 1 ? "s" : ""}</span>}
            {i.vagas > 0 && <span className="flex items-center gap-1.5"><Car className="size-4 text-navy" />{i.vagas} vaga{i.vagas > 1 ? "s" : ""}</span>}
            {i.area > 0 && <span className="flex items-center gap-1.5"><Maximize2 className="size-4 text-navy" />{i.area.toLocaleString("pt-BR")} m²</span>}
          </div>
          <div className="rounded-2xl border border-pink/20 bg-white/80 p-5 backdrop-blur">
            <p className="text-sm text-slate-500">
              De <span className="font-mono line-through" data-testid="promo-original-price">{brl(i.preco)}</span> por apenas
            </p>
            <p className="mt-1 font-mono text-5xl font-bold tracking-tight text-pink-hover" data-testid="promo-price">
              {brl(i.preco_promocional || i.preco)}
              <span className="ml-1 font-sans text-lg font-medium text-slate-500">/mês</span>
            </p>
            <p className="mt-2 text-sm font-semibold text-emerald-700">Economia de {brl(economia)} todo mês</p>
          </div>
          <Link
            to={`/imovel/${i.codigo}`}
            data-testid="promo-highlight-cta"
            className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-navy px-6 py-4 font-bold text-white shadow-lg transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-navy-light"
          >
            Quero aproveitar esta oferta
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
