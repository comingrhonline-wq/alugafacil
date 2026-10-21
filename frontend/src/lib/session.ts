import { apiPost } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { AuthState } from "@/lib/types";

export async function beginSession() {
  queryClient.removeQueries({ queryKey: ["admin"] });
  await queryClient.invalidateQueries({ queryKey: ["auth"] });
}

export async function endSession() {
  await apiPost<AuthState>("/auth/logout").catch(() => null);
  queryClient.removeQueries({ queryKey: ["admin"] });
  queryClient.setQueryData<AuthState>(["auth"], { authenticated: false });
}
