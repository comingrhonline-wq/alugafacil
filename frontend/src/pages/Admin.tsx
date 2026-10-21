import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Building2, ExternalLink, LayoutDashboard, LogOut, Settings as SettingsIcon, Users } from "lucide-react";
import { Logo } from "@/components/SiteHeader";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminImoveis from "@/components/admin/AdminImoveis";
import AdminLeads from "@/components/admin/AdminLeads";
import AdminSettings from "@/components/admin/AdminSettings";
import { useAdminStats, useAuth } from "@/lib/queries";
import { endSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export type AdminTab = "overview" | "imoveis" | "leads" | "settings";

const NAV: { id: AdminTab; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "imoveis", label: "Imóveis", icon: Building2 },
  { id: "leads", label: "Interessados", icon: Users },
  { id: "settings", label: "Configurações", icon: SettingsIcon },
];

function AdminShell() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const stats = useAdminStats();
  const novos = stats.data?.leads_novos ?? 0;

  return (
    <div className="min-h-screen bg-sand lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="flex flex-col bg-navy-dark text-slate-300 lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between px-6 py-6">
          <Logo light />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:pb-0">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setTab(n.id)}
              data-testid={`admin-nav-${n.id}`}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200",
                tab === n.id ? "bg-pink text-white shadow-lg shadow-pink/20" : "hover:bg-white/5 hover:text-white",
              )}
            >
              <n.icon className="size-4" />
              {n.label}
              {n.id === "leads" && novos > 0 && (
                <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold", tab === n.id ? "bg-white text-pink" : "bg-pink text-white")} data-testid="admin-nav-leads-badge">
                  {novos}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="hidden space-y-1 border-t border-white/10 p-3 lg:block">
          <Link to="/" target="_blank" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-white/5 hover:text-white" data-testid="admin-view-site-link">
            <ExternalLink className="size-4" /> Ver site
          </Link>
          <button type="button" onClick={() => endSession()} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-white/5 hover:text-white" data-testid="admin-logout-button">
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">
        <div className="mb-4 flex justify-end lg:hidden">
          <button type="button" onClick={() => endSession()} className="flex items-center gap-2 text-sm text-slate-600" data-testid="admin-logout-button-mobile">
            <LogOut className="size-4" /> Sair
          </button>
        </div>
        {tab === "overview" && <AdminOverview goTo={setTab} />}
        {tab === "imoveis" && <AdminImoveis />}
        {tab === "leads" && <AdminLeads />}
        {tab === "settings" && <AdminSettings />}
      </main>
    </div>
  );
}

export default function Admin() {
  const auth = useAuth();
  if (auth.isLoading) return <div className="grid min-h-screen place-items-center text-slate-400">Carregando…</div>;
  if (!auth.data?.authenticated || auth.isError) return <Navigate to="/admin/login" replace />;
  return <AdminShell />;
}
