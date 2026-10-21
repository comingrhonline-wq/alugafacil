import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { AdminStats, AuthState, Bairro, Imovel, ImovelCard, ImovelPage, Lead, Resumo, Settings } from "@/lib/types";

export const DEFAULT_SETTINGS: Settings = { nome_exibicao: "Aluga Fácil", whatsapp: "", creci: "", email: "", instagram: "" };

export function useSettings() {
  const q = useQuery({ queryKey: ["settings"], queryFn: () => apiGet<Settings>("/settings"), staleTime: 60_000 });
  return q.data && !q.isError ? q.data : DEFAULT_SETTINGS;
}

export const useBairros = (finalidade = "") =>
  useQuery({
    queryKey: ["bairros", finalidade],
    queryFn: () => apiGet<Bairro[]>(`/bairros${finalidade ? `?finalidade=${finalidade}` : ""}`),
    staleTime: 60_000,
  });

export const useResumo = () => useQuery({ queryKey: ["resumo"], queryFn: () => apiGet<Resumo>("/resumo"), staleTime: 60_000 });

export function useImoveis(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && qs.set(k, v));
  const s = qs.toString();
  return useQuery({
    queryKey: ["imoveis", s],
    queryFn: () => apiGet<ImovelPage>(`/imoveis${s ? `?${s}` : ""}`),
    placeholderData: (prev) => prev,
  });
}

export const useImovel = (codigo: string) =>
  useQuery({ queryKey: ["imovel", codigo], queryFn: () => apiGet<Imovel>(`/imoveis/${codigo}`), retry: false });

export const useSimilares = (codigo: string) =>
  useQuery({ queryKey: ["similares", codigo], queryFn: () => apiGet<ImovelCard[]>(`/imoveis/${codigo}/semelhantes`) });

export const useAuth = () =>
  useQuery({ queryKey: ["auth"], queryFn: () => apiGet<AuthState>("/auth/me"), retry: false });

export const useAdminImoveis = () =>
  useQuery({ queryKey: ["admin", "imoveis"], queryFn: () => apiGet<Imovel[]>("/admin/imoveis") });

export const useAdminLeads = () => useQuery({ queryKey: ["admin", "leads"], queryFn: () => apiGet<Lead[]>("/admin/leads") });

export const useAdminStats = () =>
  useQuery({ queryKey: ["admin", "stats"], queryFn: () => apiGet<AdminStats>("/admin/stats") });
