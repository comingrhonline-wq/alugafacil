import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/SiteHeader";
import { useBairros, useSettings } from "@/lib/queries";
import { waLink } from "@/lib/format";

export default function SiteFooter() {
  const s = useSettings();
  const bairros = useBairros();
  const wa = waLink(s.whatsapp, "Olá! Vim pelo site Aluga Fácil.");
  return (
    <footer className="bg-navy-dark text-slate-300" data-testid="site-footer">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="space-y-5">
          <Logo light />
          <p className="max-w-sm text-sm leading-relaxed text-slate-400">
            Casas e apartamentos para alugar em Praia Grande/SP, com fotos reais, valores claros e atendimento direto.
          </p>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2.5">
              <MapPin className="size-4 text-pink" /> Praia Grande · SP
            </li>
            {s.email && (
              <li className="flex items-center gap-2.5" data-testid="footer-email">
                <Mail className="size-4 text-pink" />
                <a href={`mailto:${s.email}`} className="hover:text-white">
                  {s.email}
                </a>
              </li>
            )}
            {wa && (
              <li className="flex items-center gap-2.5" data-testid="footer-whatsapp">
                <MessageCircle className="size-4 text-pink" />
                <a href={wa} target="_blank" rel="noreferrer" className="hover:text-white">
                  {s.whatsapp}
                </a>
              </li>
            )}
            {s.creci && (
              <li className="flex items-center gap-2.5" data-testid="footer-creci">
                <ShieldCheck className="size-4 text-pink" /> CRECI {s.creci}
              </li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white">Navegação</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/imoveis" className="hover:text-white" data-testid="footer-link-imoveis">Todos os imóveis</Link></li>
            <li><Link to="/imoveis?tipo=casa" className="hover:text-white" data-testid="footer-link-casas">Casas para alugar</Link></li>
            <li><Link to="/imoveis?tipo=apartamento" className="hover:text-white" data-testid="footer-link-aptos">Apartamentos para alugar</Link></li>
            <li><Link to="/imoveis?finalidade=venda" className="hover:text-white" data-testid="footer-link-venda">Imóveis à venda</Link></li>
            <li><Link to="/imoveis?tipo=kitnet" className="hover:text-white" data-testid="footer-link-kitnets">Kitnets</Link></li>
            <li><Link to="/imoveis?promocao=1" className="hover:text-white" data-testid="footer-link-promocoes">Promoções</Link></li>
            <li><Link to="/privacidade" className="hover:text-white" data-testid="footer-link-privacidade">Política de Privacidade</Link></li>
            <li><Link to="/admin" className="hover:text-white" data-testid="footer-link-admin">Área do corretor</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white">Bairros</h4>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            {(bairros.isError ? [] : bairros.data ?? []).slice(0, 10).map((b) => (
              <li key={b.nome}>
                <Link to={`/imoveis?bairro=${encodeURIComponent(b.nome)}`} className="hover:text-white">
                  {b.nome}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {s.nome_exibicao}. Todos os direitos reservados.</p>
          <p>
            Valores e disponibilidade sujeitos a confirmação no momento do contato ·{" "}
            <Link to="/privacidade" className="underline-offset-2 hover:text-white hover:underline">Privacidade</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
