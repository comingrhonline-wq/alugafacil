import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PropertyFormDialog from "@/components/admin/PropertyFormDialog";
import { apiDelete, apiPatch } from "@/lib/api";
import { useAdminImoveis } from "@/lib/queries";
import { brl, FINALIDADE_LABEL, TIPO_LABEL } from "@/lib/format";
import FilterSelect from "@/components/FilterSelect";
import type { Imovel, ImovelUpdate } from "@/lib/types";

export function useInvalidateImoveis() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["imoveis"] });
    qc.invalidateQueries({ queryKey: ["imovel"] });
    qc.invalidateQueries({ queryKey: ["bairros"] });
  };
}

export default function AdminImoveis() {
  const q = useAdminImoveis();
  const invalidate = useInvalidateImoveis();
  const [busca, setBusca] = useState("");
  const [fin, setFin] = useState("");
  const [limite, setLimite] = useState(60);
  const [editing, setEditing] = useState<Imovel | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Imovel | null>(null);

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ImovelUpdate }) => apiPatch<Imovel>(`/admin/imoveis/${id}`, body),
    onSuccess: () => invalidate(),
    onError: () => toast.error("Não foi possível salvar a alteração"),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/admin/imoveis/${id}`),
    onSuccess: () => {
      toast.success("Imóvel excluído");
      setDeleting(null);
      invalidate();
    },
  });

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    const all = (q.data ?? []).filter((i) => !fin || (i.finalidade ?? "aluguel") === fin);
    return t ? all.filter((i) => `${i.codigo} ${i.titulo} ${i.bairro}`.toLowerCase().includes(t)) : all;
  }, [q.data, busca, fin]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Imóveis</h1>
          <p className="text-slate-500">{q.data?.length ?? 0} cadastrados · ative, destaque e crie promoções.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-pink px-5 py-3 text-sm font-bold text-white shadow-md shadow-pink/25 transition-colors hover:bg-pink-hover"
          data-testid="admin-new-property-button"
        >
          <Plus className="size-4" /> Novo imóvel
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={busca} onChange={(e) => { setBusca(e.target.value); setLimite(60); }} placeholder="Buscar por código, título ou bairro" className="h-11 bg-white pl-9" data-testid="admin-property-search-input" />
        </div>
        <FilterSelect label="" value={fin} onChange={(v) => { setFin(v); setLimite(60); }} allLabel="Aluguel e venda" options={[{ value: "aluguel", label: "Somente aluguel" }, { value: "venda", label: "Somente venda" }]} testId="admin-property-finalidade-filter" className="w-48 [&>span]:hidden" />
        <span className="pb-3 text-sm text-slate-500" data-testid="admin-property-count">{lista.length} resultado{lista.length === 1 ? "" : "s"}</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Imóvel</TableHead>
              <TableHead>Bairro</TableHead>
              <TableHead className="text-right">Aluguel</TableHead>
              <TableHead className="text-center">Ativo</TableHead>
              <TableHead className="text-center">Destaque</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.slice(0, limite).map((i) => (
              <TableRow key={i.id} data-testid={`admin-property-row-${i.codigo}`} className={i.ativo ? "" : "opacity-55"}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {i.fotos[0] && <img src={i.fotos[0]} alt="" referrerPolicy="no-referrer" loading="lazy" className="size-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-pink">{i.codigo}</p>
                      <p className="max-w-[260px] truncate font-medium text-slate-900">{i.titulo}</p>
                      <p className="text-xs text-slate-500">{FINALIDADE_LABEL[i.finalidade ?? "aluguel"]} · {TIPO_LABEL[i.tipo]} · {i.quartos} qts · {i.area} m²</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">{i.bairro}</TableCell>
                <TableCell className="text-right">
                  {i.preco_promocional ? (
                    <div>
                      <p className="font-mono text-xs text-slate-400 line-through">{brl(i.preco)}</p>
                      <p className="font-mono font-bold text-pink-hover">{brl(i.preco_promocional)}</p>
                    </div>
                  ) : (
                    <p className="font-mono font-semibold text-navy">{brl(i.preco)}</p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={i.ativo} onCheckedChange={(c) => patch.mutate({ id: i.id, body: { ativo: !!c } })} aria-label="Ativo" data-testid={`admin-toggle-ativo-${i.codigo}`} />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={i.destaque} onCheckedChange={(c) => patch.mutate({ id: i.id, body: { destaque: !!c } })} aria-label="Destaque" data-testid={`admin-toggle-destaque-${i.codigo}`} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Link to={`/imovel/${i.codigo}`} target="_blank" className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Ver no site" data-testid={`admin-view-${i.codigo}`}>
                      <ExternalLink className="size-4" />
                    </Link>
                    <button type="button" onClick={() => { setEditing(i); setFormOpen(true); }} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-navy" aria-label="Editar" data-testid={`admin-edit-${i.codigo}`}>
                      <Pencil className="size-4" />
                    </button>
                    <button type="button" onClick={() => setDeleting(i)} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Excluir" data-testid={`admin-delete-${i.codigo}`}>
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!q.isLoading && !lista.length && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-400">Nenhum imóvel encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {lista.length > limite && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setLimite((l) => l + 60)} data-testid="admin-property-load-more">Mostrar mais ({lista.length - limite} restantes)</Button>
        </div>
      )}

      <PropertyFormDialog open={formOpen} onOpenChange={setFormOpen} imovel={editing} />

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {deleting?.codigo}?</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita. Se quiser apenas tirar do ar, desmarque “Ativo”.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} data-testid="admin-delete-cancel-button">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleting && del.mutate(deleting.id)} data-testid="admin-delete-confirm-button">Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
