import type { Imovel, LeadStatus } from "@/lib/types";

export function brl(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: n % 1 ? 2 : 0,
  });
}

export const precoEfetivo = (i: Pick<Imovel, "preco" | "preco_promocional">) => i.preco_promocional || i.preco;

export function descontoPct(i: Pick<Imovel, "preco" | "preco_promocional">): number {
  if (!i.preco_promocional) return 0;
  return Math.round((1 - i.preco_promocional / i.preco) * 100);
}

export const TIPO_LABEL: Record<string, string> = { casa: "Casa", apartamento: "Apartamento" };

export const AMENIDADES: Record<string, string> = {
  KITCHEN: "Cozinha",
  LAUNDRY_ROOM_BR: "Área de serviço",
  LAUNDRY_ROOM: "Lavanderia",
  BALCONY: "Sacada",
  GOURMET_BALCONY: "Varanda gourmet",
  VERANDA: "Varanda",
  SWIMMING_POOL: "Piscina",
  BARBECUE_GRILL: "Churrasqueira",
  ELEVATOR: "Elevador",
  SAUNA: "Sauna",
  COASTAL: "Próximo à praia",
  SEA_VIEW: "Vista para o mar",
  GATED_COMMUNITY: "Condomínio fechado",
  HALFBATH: "Lavabo",
  SPORTS_COURT: "Quadra poliesportiva",
  FURNISHED: "Mobiliado",
  BACKYARD: "Quintal",
  CABINET_KITCHEN: "Armários na cozinha",
  CABINET_BEDROOM: "Armários no quarto",
  CABINET_BATHROOM: "Armários no banheiro",
  CABINET_LAUNDRY_ROOM: "Armários na lavanderia",
  SOLAR_HEATING: "Aquecimento solar",
  INTERPHONE: "Interfone",
  ELECTRIC_GATE: "Portão eletrônico",
  PET_FRIENDLY: "Aceita pets",
};

export const amenidadesVisiveis = (list: string[]) => list.filter((a) => AMENIDADES[a]);

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  visita: "Visita agendada",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

/** wa.me link; returns null when no number is configured yet. */
export function waLink(numero: string, texto: string): string | null {
  let d = onlyDigits(numero);
  if (d.length < 10) return null;
  if (!d.startsWith("55")) d = "55" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
}

export function mensagemImovel(i: Pick<Imovel, "codigo" | "bairro" | "preco" | "preco_promocional">, nome?: string) {
  const base = `Olá! Tenho interesse no imóvel ${i.codigo} no bairro ${i.bairro} (${brl(precoEfetivo(i))}/mês).`;
  return nome ? `${base} Meu nome é ${nome}.` : base;
}

export function maskPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function specsLine(i: Pick<Imovel, "quartos" | "banheiros" | "vagas" | "area">): string {
  const p: string[] = [];
  if (i.quartos) p.push(`${i.quartos} quarto${i.quartos > 1 ? "s" : ""}`);
  if (i.banheiros) p.push(`${i.banheiros} banheiro${i.banheiros > 1 ? "s" : ""}`);
  if (i.vagas) p.push(`${i.vagas} vaga${i.vagas > 1 ? "s" : ""}`);
  if (i.area) p.push(`${i.area.toLocaleString("pt-BR")} m²`);
  return p.join(" · ");
}

export function dataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
