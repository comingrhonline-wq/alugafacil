import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, MessageCircle, Home as HomeIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { useSettings } from "@/lib/queries";
import { waLink } from "@/lib/format";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Início", id: "home" },
  { to: "/imoveis", label: "Alugar", id: "imoveis" },
  { to: "/imoveis?finalidade=venda", label: "Comprar", id: "comprar" },
  { to: "/imoveis?promocao=1", label: "Promoções", id: "promocoes" },
  { to: "/#bairros", label: "Bairros", id: "bairros" },
  { to: "/#como-funciona", label: "Como funciona", id: "como-funciona" },
  { to: "/#contato", label: "Contato", id: "contato" },
];

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-10 place-items-center rounded-xl bg-pink shadow-lg shadow-pink/30">
        <HomeIcon className="size-5 text-white" strokeWidth={2.5} />
      </span>
      <span className={cn("font-heading text-xl font-extrabold tracking-tight", light ? "text-white" : "text-navy")}>
        Aluga<span className="text-pink">Fácil</span>
      </span>
    </span>
  );
}

export default function SiteHeader() {
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const wa = waLink(settings.whatsapp, "Olá! Vim pelo site Aluga Fácil e gostaria de mais informações sobre imóveis para alugar.");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl" data-testid="site-header">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" data-testid="header-logo-link" aria-label="Aluga Fácil — início">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {LINKS.map((l) => (
            <NavLink
              key={l.id}
              to={l.to}
              end={l.to === "/"}
              data-testid={`nav-link-${l.id}`}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-navy",
                  isActive && l.id === "home" && "text-navy font-semibold",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              data-testid="header-whatsapp-button"
              className="hidden items-center gap-2 rounded-xl bg-whatsapp px-4 py-2.5 text-sm font-bold text-white shadow-md transition-transform duration-200 hover:-translate-y-0.5 active:scale-95 sm:flex"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          ) : (
            <Link
              to="/imoveis"
              data-testid="header-cta-button"
              className="hidden rounded-xl bg-pink px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-pink/25 transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-pink-hover sm:block"
            >
              Ver imóveis
            </Link>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")}
              aria-label="Abrir menu"
              data-testid="mobile-menu-button"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="px-4 pt-4">
                <Logo />
              </SheetTitle>
              <nav className="flex flex-col gap-1 p-4">
                {LINKS.map((l) => (
                  <Link
                    key={l.id}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    data-testid={`mobile-nav-link-${l.id}`}
                    className="rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
