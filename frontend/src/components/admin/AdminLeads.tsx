import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, MessageCircle, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FilterSelect from "@/components/FilterSelect";
import { apiDelete, apiPatch } from "@/lib/api";
import { useAdminLeads } from "@/lib/queries";
import { brl, dataHora, LEAD_STATUS_LABEL, waLink } from "@/lib/format";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUS_OPTIONS = (Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((s) => ({ value: s, label: LEAD_STATUS_LABEL[s] }));

const STATUS_COLOR: Record<LeadStatus, string> = {
  novo: "bg-pink text-white",
  contatado: "bg-sky-100 text-sky-800",
  visita: "bg-amber-100 text-amber-800",
  fechado: "bg-emerald-100 text-emerald-800",
  perdido: "bg-slate-100 text-slate-500",
};

function exportCsv(leads: Lead[]) {
  const rows = [["Data", "Nome", "Telefone", "Imóvel", "Valor", "Status", "Mensagem"]];
  leads.forEach((l) => rows.push([dataHora(l.criado_em), l.nome, l.telefone, l.imovel_codigo ?? "", l.imovel_preco ? String(l.imovel_preco) : "", LEAD_STATUS_LABEL[l.status], l.mensagem]));
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `interessados-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function AdminLeads() {
  const q = useAdminLeads();
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const upd = useMutation({
    mutationFn: ({ id, s }: { id: string; s: LeadStatus }) => apiPatch<Lead>(`/admin/leads/${id}`, { status: s }),
    onSuccess: () => invalidate(),
  });
  const del = useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/admin/leads/${id}`),
    onSuccess: () => {
      toast.success("Contato removido");
      invalidate();
    },
  });

  const lista = useMemo(() => (q.data ?? []).filter((l) => !status || l.status === status), [q.data, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Interessados</h1>
          <p className="text-slate-500">Todos os contatos enviados pelo site, do mais recente ao mais antigo.</p>
        </div>
        <div className="flex items-end gap-3">
          <FilterSelect label="Status" value={status} onChange={setStatus} allLabel="Todos" options={STATUS_OPTIONS} testId="admin-leads-status-filter" className="w-44" />
          <button type="button" onClick={() => exportCsv(lista)} disabled={!lista.length} className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-navy hover:bg-slate-50 disabled:opacity-50" data-testid="admin-leads-export-button">
            <Download className="size-4" /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Data</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Imóvel</TableHead>
              <TableHead>Mensagem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((l) => {
              const wa = waLink(l.telefone, `Olá ${l.nome.split(" ")[0]}! Aqui é da Aluga Fácil. Recebemos seu interesse${l.imovel_codigo ? ` no imóvel ${l.imovel_codigo}` : ""}.`);
              return (
                <TableRow key={l.id} data-testid={`admin-lead-row-${l.id}`}>
                  <TableCell className="whitespace-nowrap text-xs text-slate-500">{dataHora(l.criado_em)}</TableCell>
                  <TableCell>
                    <p className="font-medium text-slate-900" data-testid="admin-lead-name">{l.nome}</p>
                    <p className="font-mono text-xs text-slate-500">{l.telefone}</p>
                  </TableCell>
                  <TableCell>
                    {l.imovel_codigo ? (
                      <Link to={`/imovel/${l.imovel_codigo}`} target="_blank" className="hover:underline">
                        <p className="font-mono text-xs font-semibold text-pink">{l.imovel_codigo}</p>
                        <p className="max-w-[180px] truncate text-xs text-slate-600">{l.imovel_titulo}{l.imovel_preco ? ` · ${brl(l.imovel_preco)}` : ""}</p>
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">Contato geral</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    <p className="line-clamp-2 whitespace-normal text-xs text-slate-600">{l.mensagem || "—"}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${STATUS_COLOR[l.status].split(" ")[0]}`} />
                      <FilterSelect label="" value={l.status} onChange={(v) => upd.mutate({ id: l.id, s: v as LeadStatus })} options={STATUS_OPTIONS} testId={`admin-lead-status-${l.id}`} className="w-40 [&>span]:hidden" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {wa && (
                        <a href={wa} target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-lg text-emerald-600 hover:bg-emerald-50" aria-label="Responder no WhatsApp" data-testid={`admin-lead-whatsapp-${l.id}`}>
                          <MessageCircle className="size-4" />
                        </a>
                      )}
                      <button type="button" onClick={() => del.mutate(l.id)} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Remover" data-testid={`admin-lead-delete-${l.id}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!q.isLoading && !lista.length && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-slate-400" data-testid="admin-leads-empty">Nenhum interessado {status ? "com este status" : "ainda"}.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
