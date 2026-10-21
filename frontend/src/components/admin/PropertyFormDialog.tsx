import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import FilterSelect, { TIPO_OPTIONS } from "@/components/FilterSelect";
import { useInvalidateImoveis } from "@/components/admin/AdminImoveis";
import { apiPatch, apiPost, ApiError } from "@/lib/api";
import { AMENIDADES } from "@/lib/format";
import type { Finalidade, Imovel, ImovelCreate, ImovelUpdate, TipoImovel } from "@/lib/types";

interface FormState {
  codigo: string;
  titulo: string;
  tipo: TipoImovel;
  finalidade: Finalidade;
  bairro: string;
  preco: string;
  preco_promocional: string;
  area: string;
  quartos: string;
  suites: string;
  banheiros: string;
  vagas: string;
  descricao: string;
  fotos: string;
  video_url: string;
  comodidades: string[];
  ativo: boolean;
  destaque: boolean;
}

const EMPTY: FormState = {
  codigo: "", titulo: "", tipo: "apartamento", finalidade: "aluguel", bairro: "", preco: "", preco_promocional: "", area: "", quartos: "", suites: "",
  banheiros: "", vagas: "", descricao: "", fotos: "", video_url: "", comodidades: [], ativo: true, destaque: false,
};

function fromImovel(i: Imovel): FormState {
  return {
    codigo: i.codigo, titulo: i.titulo, tipo: i.tipo, finalidade: i.finalidade ?? "aluguel", bairro: i.bairro, preco: String(i.preco),
    preco_promocional: i.preco_promocional ? String(i.preco_promocional) : "", area: String(i.area || ""),
    quartos: String(i.quartos), suites: String(i.suites), banheiros: String(i.banheiros), vagas: String(i.vagas),
    descricao: i.descricao, fotos: i.fotos.join("\n"), video_url: i.video_url, comodidades: i.comodidades, ativo: i.ativo, destaque: i.destaque,
  };
}

const num = (s: string) => Number(String(s).replace(",", ".")) || 0;

export default function PropertyFormDialog({ open, onOpenChange, imovel }: { open: boolean; onOpenChange: (o: boolean) => void; imovel: Imovel | null }) {
  const [f, setF] = useState<FormState>(EMPTY);
  const invalidate = useInvalidateImoveis();
  useEffect(() => {
    if (open) setF(imovel ? fromImovel(imovel) : EMPTY);
  }, [open, imovel]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const promo = num(f.preco_promocional);
      const body: ImovelCreate = {
        codigo: f.codigo.trim().toUpperCase(), titulo: f.titulo.trim(), tipo: f.tipo, finalidade: f.finalidade, bairro: f.bairro.trim(), cidade: "Praia Grande", estado: "SP",
        preco: num(f.preco), preco_promocional: promo > 0 ? promo : null, destaque: f.destaque, ativo: f.ativo,
        area: num(f.area), quartos: num(f.quartos), suites: num(f.suites), banheiros: num(f.banheiros), vagas: num(f.vagas),
        comodidades: f.comodidades, descricao: f.descricao, fotos: f.fotos.split(/\n+/).map((s) => s.trim()).filter(Boolean), video_url: f.video_url.trim(),
      };
      if (imovel) {
        const upd: ImovelUpdate = { ...body, remover_promocao: !(promo > 0) };
        return apiPatch<Imovel>(`/admin/imoveis/${imovel.id}`, upd);
      }
      return apiPost<Imovel>("/admin/imoveis", body);
    },
    onSuccess: (i) => {
      toast.success(imovel ? `${i.codigo} atualizado` : `${i.codigo} cadastrado`);
      invalidate();
      onOpenChange(false);
    },
    onError: (e) => {
      const detail = e instanceof ApiError && e.body && typeof e.body === "object" && "detail" in e.body && typeof (e.body as { detail: unknown }).detail === "string"
        ? (e.body as { detail: string }).detail
        : "Confira os campos obrigatórios.";
      toast.error("Não foi possível salvar", { description: detail });
    },
  });

  const promoInvalid = num(f.preco_promocional) > 0 && num(f.preco_promocional) >= num(f.preco);
  const valid = f.codigo.trim() && f.titulo.trim() && f.bairro.trim() && num(f.preco) > 0 && !promoInvalid;

  const field = (k: keyof FormState, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`pf-${k}`} className="text-xs font-semibold uppercase tracking-wider text-slate-600">{label}</Label>
      <Input id={`pf-${k}`} value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} className="h-10" data-testid={`property-form-${k}-input`} {...props} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl" data-testid="property-form-dialog">
        <DialogHeader>
          <DialogTitle className="text-xl">{imovel ? `Editar ${imovel.codigo}` : "Novo imóvel"}</DialogTitle>
          <DialogDescription>Campos com * são obrigatórios. Para criar uma promoção, informe o preço promocional.</DialogDescription>
        </DialogHeader>
        <form
          id="property-form"
          className="min-w-0 space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) save.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {field("codigo", "Código *", { placeholder: "AP1234" })}
            <div className="sm:col-span-2">{field("titulo", "Título *", { placeholder: "Apartamento com 2 quartos no Ocian" })}</div>
            <FilterSelect label="Negócio *" value={f.finalidade} onChange={(v) => set("finalidade", v as Finalidade)} options={[{ value: "aluguel", label: "Aluguel" }, { value: "venda", label: "Venda" }]} testId="property-form-finalidade" />
            <FilterSelect label="Tipo *" value={f.tipo} onChange={(v) => set("tipo", v as TipoImovel)} options={TIPO_OPTIONS} testId="property-form-tipo" />
            {field("bairro", "Bairro *", { placeholder: "Ocian" })}
            {field("area", "Área (m²)", { inputMode: "decimal" })}
          </div>

          <div className="grid gap-4 rounded-2xl bg-pink-subtle/60 p-4 sm:grid-cols-2">
            {field("preco", f.finalidade === "venda" ? "Valor de venda (R$) *" : "Aluguel mensal (R$) *", { inputMode: "decimal" })}
            <div>
              {field("preco_promocional", "Preço promocional (R$)", { inputMode: "decimal", placeholder: "Deixe vazio para sem promoção" })}
              {promoInvalid && <p className="mt-1 text-xs text-destructive">O preço promocional deve ser menor que o valor normal.</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {field("quartos", "Quartos", { inputMode: "numeric" })}
            {field("suites", "Suítes", { inputMode: "numeric" })}
            {field("banheiros", "Banheiros", { inputMode: "numeric" })}
            {field("vagas", "Vagas", { inputMode: "numeric" })}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-descricao" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Descrição</Label>
            <Textarea id="pf-descricao" rows={5} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} data-testid="property-form-descricao-input" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-fotos" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Fotos (uma URL por linha — a primeira é a capa)</Label>
            <Textarea id="pf-fotos" rows={4} value={f.fotos} onChange={(e) => set("fotos", e.target.value)} className="font-mono text-xs" data-testid="property-form-fotos-input" />
          </div>

          {field("video_url", "Vídeo (link do YouTube)")}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">Comodidades</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(AMENIDADES).map(([k, label]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <Checkbox
                    checked={f.comodidades.includes(k)}
                    onCheckedChange={(c) => set("comodidades", c ? [...f.comodidades, k] : f.comodidades.filter((x) => x !== k))}
                    data-testid={`property-form-amenity-${k}`}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={f.ativo} onCheckedChange={(c) => set("ativo", !!c)} data-testid="property-form-ativo-checkbox" /> Ativo (visível no site)</label>
            <label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={f.destaque} onCheckedChange={(c) => set("destaque", !!c)} data-testid="property-form-destaque-checkbox" /> Destaque na página inicial</label>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="property-form-cancel-button">Cancelar</Button>
          <Button type="submit" form="property-form" disabled={!valid || save.isPending} className="bg-pink hover:bg-pink-hover" data-testid="property-form-submit-button">
            {save.isPending && <Loader2 className="size-4 animate-spin" />} {imovel ? "Salvar alterações" : "Cadastrar imóvel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
