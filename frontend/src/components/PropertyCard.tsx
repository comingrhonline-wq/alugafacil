import { Link } from "react-router-dom";
import { BedDouble, Bath, Car, Maximize2, MapPin, Images } from "lucide-react";
import type { Imovel } from "@/lib/types";
import { brl, descontoPct, TIPO_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Spec({ icon: Icon, value, label }: { icon: typeof BedDouble; value: string | number; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-slate-600" title={label}>
      <Icon className="size-4 text-slate-400" />
      {value}
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default function PropertyCard({ imovel: i, index = 0 }: { imovel: Imovel; index?: number }) {
  const promo = !!i.preco_promocional;
  return (
    <Link
      to={`/imovel/${i.codigo}`}
      data-testid={`property-card-${i.codigo}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className={cn(
        "group flex animate-fade-up flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-xl",
        promo ? "border-pink/60 shadow-pink/10 ring-1 ring-pink/30" : "border-slate-200/80",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {i.fotos[0] ? (
          <img
            src={i.fotos[0]}
            alt={i.titulo}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-slate-400">Sem foto</div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-1.5">
            {promo && (
              <span className="rounded-full bg-pink px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow" data-testid={`property-card-promo-badge-${i.codigo}`}>
                Promoção −{descontoPct(i)}%
              </span>
            )}
            {i.destaque && !promo && (
              <span className="rounded-full bg-navy px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow">
                Destaque
              </span>
            )}
          </div>
          <span className="rounded-full bg-white/90 px-2.5 py-1 font-mono text-[11px] font-medium text-navy backdrop-blur">{i.codigo}</span>
        </div>
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] text-white backdrop-blur">
          <Images className="size-3" /> {i.fotos.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline gap-2">
          <span className={cn("font-mono text-2xl font-bold tracking-tight", promo ? "text-pink-hover" : "text-navy")} data-testid={`property-card-price-${i.codigo}`}>
            {brl(i.preco_promocional || i.preco)}
          </span>
          <span className="text-sm text-slate-500">/mês</span>
          {promo && <span className="font-mono text-sm text-slate-400 line-through">{brl(i.preco)}</span>}
        </div>
        <div>
          <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{i.titulo}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="size-3.5 text-pink" /> {i.bairro} · {i.cidade}/{i.estado}
            <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{TIPO_LABEL[i.tipo]}</span>
          </p>
        </div>
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
          {i.quartos > 0 && <Spec icon={BedDouble} value={i.quartos} label="quartos" />}
          {i.banheiros > 0 && <Spec icon={Bath} value={i.banheiros} label="banheiros" />}
          {i.vagas > 0 && <Spec icon={Car} value={i.vagas} label="vagas" />}
          {i.area > 0 && <Spec icon={Maximize2} value={`${i.area.toLocaleString("pt-BR")} m²`} label="área" />}
        </div>
      </div>
    </Link>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-7 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
