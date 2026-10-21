import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, LockKeyhole } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/SiteHeader";
import { apiPost, ApiError } from "@/lib/api";
import { beginSession } from "@/lib/session";
import { useAuth } from "@/lib/queries";
import type { AuthState } from "@/lib/types";

const IMG = "https://images.pexels.com/photos/35683788/pexels-photo-35683788.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=900";

export default function AdminLogin() {
  const nav = useNavigate();
  const auth = useAuth();
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const m = useMutation({
    mutationFn: () => apiPost<AuthState>("/auth/login", { password }),
    onSuccess: async () => {
      await beginSession();
      nav("/admin", { replace: true });
    },
    onError: (e) => setErro(e instanceof ApiError && e.status === 401 ? "Senha incorreta. Tente novamente." : "Erro ao entrar. Tente novamente."),
  });

  if (auth.data?.authenticated && !auth.isError) return <Navigate to="/admin" replace />;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy lg:block">
        <img src={IMG} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-dark/95 via-navy/80 to-navy/40" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo light />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink">Área do corretor</p>
            <h1 className="mt-3 max-w-md text-4xl font-bold leading-tight">Gerencie imóveis, promoções e interessados em um só lugar.</h1>
          </div>
          <p className="text-sm text-slate-400">Aluga Fácil · Praia Grande/SP</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-sand px-4 py-16">
        <form
          className="w-full max-w-sm space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"
          onSubmit={(e) => {
            e.preventDefault();
            setErro("");
            m.mutate();
          }}
          data-testid="admin-login-form"
        >
          <div className="lg:hidden"><Logo /></div>
          <div>
            <span className="grid size-12 place-items-center rounded-2xl bg-pink-subtle text-pink"><LockKeyhole className="size-5" /></span>
            <h2 className="mt-4 text-2xl font-bold text-navy">Acesso restrito</h2>
            <p className="mt-1 text-sm text-slate-500">Digite a senha do painel administrativo.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Senha</Label>
            <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" autoFocus data-testid="admin-password-input" />
            {erro && <p className="text-sm text-destructive" data-testid="admin-login-error">{erro}</p>}
          </div>
          <button type="submit" disabled={!password || m.isPending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy font-bold text-white transition-colors hover:bg-navy-light disabled:opacity-50" data-testid="admin-login-submit-button">
            {m.isPending && <Loader2 className="size-4 animate-spin" />} Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
