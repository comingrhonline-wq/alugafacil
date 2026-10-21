import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiGet, apiPut } from "@/lib/api";
import { DEFAULT_SETTINGS } from "@/lib/queries";
import { maskPhone } from "@/lib/format";
import type { Settings } from "@/lib/types";

const FIELDS: { k: keyof Settings; label: string; hint: string; placeholder: string }[] = [
  { k: "nome_exibicao", label: "Nome exibido no site", hint: "Aparece no rodapé e nas mensagens.", placeholder: "Aluga Fácil" },
  { k: "whatsapp", label: "WhatsApp de atendimento", hint: "Os botões de WhatsApp só aparecem no site depois que este número for preenchido.", placeholder: "(13) 99999-9999" },
  { k: "creci", label: "CRECI", hint: "Exibido no rodapé e nas páginas dos imóveis.", placeholder: "000000-F" },
  { k: "email", label: "E-mail de contato", hint: "Exibido no rodapé.", placeholder: "contato@seudominio.com.br" },
  { k: "instagram", label: "Instagram", hint: "Opcional.", placeholder: "@alugafacil" },
];

export default function AdminSettings() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["settings"], queryFn: () => apiGet<Settings>("/settings") });
  const [f, setF] = useState<Settings>(DEFAULT_SETTINGS);
  useEffect(() => {
    if (q.data) setF(q.data);
  }, [q.data]);

  const save = useMutation({
    mutationFn: () => apiPut<Settings>("/admin/settings", f),
    onSuccess: (s) => {
      qc.setQueryData(["settings"], s);
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Configurações salvas", { description: "O site já está usando os novos dados." });
    },
    onError: () => toast.error("Não foi possível salvar"),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Configurações</h1>
        <p className="text-slate-500">Dados de contato exibidos no site. As alterações valem na hora.</p>
      </div>
      <form
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        data-testid="admin-settings-form"
      >
        {FIELDS.map((fd) => (
          <div key={fd.k} className="space-y-1.5">
            <Label htmlFor={`st-${fd.k}`} className="text-xs font-semibold uppercase tracking-wider text-slate-600">{fd.label}</Label>
            <Input
              id={`st-${fd.k}`}
              value={f[fd.k]}
              placeholder={fd.placeholder}
              onChange={(e) => setF({ ...f, [fd.k]: fd.k === "whatsapp" ? maskPhone(e.target.value) : e.target.value })}
              className="h-11"
              data-testid={`settings-${fd.k}-input`}
            />
            <p className="text-xs text-slate-500">{fd.hint}</p>
          </div>
        ))}
        <button type="submit" disabled={save.isPending} className="flex h-11 items-center gap-2 rounded-xl bg-navy px-6 font-bold text-white transition-colors hover:bg-navy-light disabled:opacity-50" data-testid="settings-save-button">
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar configurações
        </button>
      </form>
    </div>
  );
}
