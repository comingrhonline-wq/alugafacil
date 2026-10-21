import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
}

/** Labeled select with an "all" sentinel; value "" means no filter. */
export default function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel,
  testId,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  allLabel?: string;
  testId: string;
  className?: string;
}) {
  const ALL = "__all__";
  const labels: Record<string, string> = { [ALL]: allLabel ?? "Todos" };
  options.forEach((o) => (labels[o.value] = o.label));
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <Select value={value || (allLabel ? ALL : options[0]?.value)} onValueChange={(v: string) => onChange(v === ALL ? "" : v)}>
        <SelectTrigger className="h-11 w-full bg-white" data-testid={testId}>
          <SelectValue>{(v) => labels[v as string] ?? (v as string)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} data-testid={`${testId}-option-${o.value}`}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const TIPO_OPTIONS: Option[] = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "kitnet", label: "Kitnet" },
];

export const PRECO_OPTIONS: Option[] = [1500, 2000, 2500, 3000, 4000, 5000, 8000].map((v) => ({
  value: String(v),
  label: `Até ${v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}`,
}));

export const PRECO_VENDA_OPTIONS: Option[] = [200000, 300000, 400000, 500000, 700000, 1000000, 1500000].map((v) => ({
  value: String(v),
  label: `Até ${v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}`,
}));

export const precoOptions = (finalidade: string) => (finalidade === "venda" ? PRECO_VENDA_OPTIONS : PRECO_OPTIONS);

export const QUARTOS_OPTIONS: Option[] = [1, 2, 3, 4].map((v) => ({ value: String(v), label: `${v}+ quarto${v > 1 ? "s" : ""}` }));

export const ORDENAR_OPTIONS: Option[] = [
  { value: "menor-valor", label: "Menor valor" },
  { value: "maior-valor", label: "Maior valor" },
  { value: "maior-area", label: "Maior área" },
];
