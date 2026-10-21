import { useState } from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiPost, ApiError } from "@/lib/api";
import type { Imovel, Lead, LeadCreate } from "@/lib/types";
import { maskPhone, mensagemImovel, onlyDigits, waLink } from "@/lib/format";
import { useSettings } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface Props {
  imovel?: Pick<Imovel, "codigo" | "bairro" | "preco" | "preco_promocional" | "finalidade"> | null;
  variant?: "light" | "dark";
  testPrefix?: string;
  onDone?: () => void;
}

export default function InterestForm({ imovel, variant = "light", testPrefix = "lead", onDone }: Props) {
  const settings = useSettings();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState(
    imovel ? "Gostaria de confirmar a disponibilidade e agendar uma visita." : "",
  );
  const [enviado, setEnviado] = useState(false);
  const [aceite, setAceite] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot

  const m = useMutation({
    mutationFn: (body: LeadCreate) => apiPost<Lead>("/leads", body),
    onSuccess: () => {
      setEnviado(true);
      const texto = imovel
        ? `${mensagemImovel(imovel, nome.trim())} Meu WhatsApp: ${telefone}. ${mensagem}`.trim()
        : `Olá! Meu nome é ${nome.trim()}. Meu WhatsApp: ${telefone}. ${mensagem}`.trim();
      const link = waLink(settings.whatsapp, texto);
      if (link) window.open(link, "_blank", "noopener");
      toast.success("Recebemos seu interesse!", {
        description: link ? "Abrimos o WhatsApp para você finalizar o contato." : "Entraremos em contato pelo seu WhatsApp em breve.",
      });
      onDone?.();
    },
    onError: (e) => {
      toast.error("Não foi possível enviar", {
        description:
          e instanceof ApiError && e.status === 429
            ? "Muitos envios seguidos. Aguarde alguns minutos."
            : e instanceof ApiError && e.status === 422
              ? "Confira seu nome, telefone e o aceite da Política de Privacidade."
              : "Tente novamente em instantes.",
      });
    },
  });

  const dark = variant === "dark";
  const valid = nome.trim().length >= 2 && onlyDigits(telefone).length >= 10 && aceite;

  if (enviado) {
    return (
      <div className={cn("flex flex-col items-center gap-3 py-6 text-center", dark && "text-white")} data-testid={`${testPrefix}-success`}>
        <CheckCircle2 className="size-12 text-emerald-500" />
        <p className="text-lg font-semibold">Contato enviado com sucesso!</p>
        <p className={cn("text-sm", dark ? "text-slate-300" : "text-slate-500")}>
          Retornaremos pelo WhatsApp {telefone} para confirmar disponibilidade e agendar a visita.
        </p>
        <button
          type="button"
          className="text-sm font-semibold text-pink hover:underline"
          onClick={() => {
            setEnviado(false);
            setNome("");
            setTelefone("");
          }}
          data-testid={`${testPrefix}-new-button`}
        >
          Enviar outro contato
        </button>
      </div>
    );
  }

  const labelCls = cn("text-xs font-semibold uppercase tracking-wider", dark ? "text-slate-300" : "text-slate-600");
  const inputCls = cn("h-11", dark && "border-white/15 bg-white/5 text-white placeholder:text-slate-400");

  return (
    <form
      className="relative space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        m.mutate({ nome: nome.trim(), telefone, mensagem: mensagem.trim(), imovel_codigo: imovel?.codigo ?? null, consentimento: aceite, website });
      }}
      data-testid={`${testPrefix}-form`}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`${testPrefix}-nome`} className={labelCls}>Seu nome</Label>
        <Input id={`${testPrefix}-nome`} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos te chamar?" className={inputCls} data-testid={`${testPrefix}-name-input`} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${testPrefix}-tel`} className={labelCls}>Seu WhatsApp</Label>
        <Input id={`${testPrefix}-tel`} value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))} placeholder="(13) 99999-9999" inputMode="tel" className={inputCls} data-testid={`${testPrefix}-phone-input`} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${testPrefix}-msg`} className={labelCls}>Mensagem</Label>
        <Textarea id={`${testPrefix}-msg`} value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={3} placeholder="Conte o que você procura (bairro, quartos, data de mudança…)" className={cn(dark && "border-white/15 bg-white/5 text-white placeholder:text-slate-400")} data-testid={`${testPrefix}-message-input`} />
      </div>
      <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <label className={cn("flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed", dark ? "text-slate-300" : "text-slate-600")}>
        <Checkbox checked={aceite} onCheckedChange={(c) => setAceite(!!c)} className="mt-0.5" data-testid={`${testPrefix}-consent-checkbox`} />
        <span>
          Concordo com a{" "}
          <Link to="/privacidade" target="_blank" className="font-semibold text-pink underline-offset-2 hover:underline" data-testid={`${testPrefix}-privacy-link`}>
            Política de Privacidade
          </Link>{" "}
          e autorizo o contato pelo WhatsApp informado.
        </span>
      </label>
      <button
        type="submit"
        disabled={!valid || m.isPending}
        data-testid={`${testPrefix}-submit-button`}
        className="relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-pink font-bold text-white shadow-lg shadow-pink/25 transition-[background-color,transform,opacity] duration-200 hover:bg-pink-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {m.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {imovel ? (imovel.finalidade === "venda" ? "Quero comprar este imóvel" : "Tenho interesse neste imóvel") : "Quero ser atendido"}
      </button>
      <p className={cn("text-center text-[11px]", dark ? "text-slate-400" : "text-slate-500")}>
        Seus dados são usados apenas para retornar o seu contato.
      </p>
    </form>
  );
}
