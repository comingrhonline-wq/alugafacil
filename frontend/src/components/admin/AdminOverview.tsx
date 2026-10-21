import { AlertTriangle, Building2, Flame, Star, Users, Wallet } from "lucide-react";
import { useAdminLeads, useAdminStats, useSettings } from "@/lib/queries";
import { brl, dataHora, LEAD_STATUS_LABEL } from "@/lib/format";
import type { AdminTab } from "@/pages/Admin";

function Stat({ icon: Icon, label, value, accent, testId }: { icon: typeof Users; label: string; value: string | number; accent?: boolean; testId: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-pink/30 bg-pink-subtle" : "border-slate-200 bg-white"}`} data-testid={testId}>
      <Icon className={`size-5 ${accent ? "text-pink" : "text-navy"}`} />
      <p className="mt-4 font-heading text-3xl font-extrabold text-navy">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}

export default function AdminOverview({ goTo }: { goTo: (t: AdminTab) => void }) {
  const stats = useAdminStats();
  const leads = useAdminLeads();
  const settings = useSettings();
  const s = stats.data;
  const max = Math.max(1, ...(s?.top_bairros.map((b) => b.total) ?? [1]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">Visão geral</h1>
        <p className="text-slate-500">Resumo do seu portfólio e dos contatos recebidos.</p>
      </div>

      {(!settings.whatsapp || !settings.creci) && (
        <button type="button" onClick={() => goTo("settings")} className="flex w-full items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left text-sm text-amber-900" data-testid="admin-settings-warning">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <span>
            <strong>Complete suas configurações:</strong> {!settings.whatsapp && "número de WhatsApp"}{!settings.whatsapp && !settings.creci && " e "}{!settings.creci && "CRECI"} ainda não {!settings.whatsapp && !settings.creci ? "foram cadastrados" : "foi cadastrado"}. Enquanto isso, os interessados ficam salvos aqui no painel. <u>Configurar agora</u>
          </span>
        </button>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat icon={Building2} label={s ? `Ativos · ${s.aluguel} aluguel · ${s.venda} venda` : "Imóveis ativos"} value={s ? `${s.imoveis_ativos}/${s.imoveis_total}` : "—"} testId="stat-imoveis" />
        <Stat icon={Flame} label="Promoções" value={s?.promocoes ?? "—"} accent testId="stat-promocoes" />
        <Stat icon={Star} label="Destaques" value={s?.destaques ?? "—"} testId="stat-destaques" />
        <Stat icon={Users} label="Novos interessados" value={s ? `${s.leads_novos}/${s.leads_total}` : "—"} accent testId="stat-leads" />
        <Stat icon={Wallet} label="Aluguel médio" value={s ? brl(Math.round(s.preco_medio)) : "—"} testId="stat-preco-medio" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-navy">Imóveis por bairro</h2>
          <ul className="mt-5 space-y-3">
            {s?.top_bairros.map((b) => (
              <li key={b.bairro} className="grid grid-cols-[120px_1fr_32px] items-center gap-3 text-sm">
                <span className="truncate text-slate-600">{b.bairro}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full bg-navy" style={{ width: `${(b.total / max) * 100}%` }} />
                </span>
                <span className="text-right font-mono font-semibold text-navy">{b.total}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy">Últimos interessados</h2>
            <button type="button" onClick={() => goTo("leads")} className="text-sm font-semibold text-pink hover:underline" data-testid="overview-see-leads">Ver todos</button>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {(leads.data ?? []).slice(0, 5).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{l.nome}</p>
                  <p className="truncate text-xs text-slate-500">{l.imovel_codigo ? `${l.imovel_codigo} · ` : "Contato geral · "}{dataHora(l.criado_em)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{LEAD_STATUS_LABEL[l.status]}</span>
              </li>
            ))}
            {leads.data && !leads.data.length && <li className="py-6 text-center text-sm text-slate-400">Nenhum interessado ainda.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
