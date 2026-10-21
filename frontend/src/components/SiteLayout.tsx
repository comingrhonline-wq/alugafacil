import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useSettings } from "@/lib/queries";
import { waLink } from "@/lib/format";

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

export default function SiteLayout() {
  const s = useSettings();
  const wa = waLink(s.whatsapp, "Olá! Vim pelo site Aluga Fácil e gostaria de ajuda para encontrar um imóvel.");
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollManager />
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          aria-label="Conversar no WhatsApp"
          data-testid="floating-whatsapp-button"
          className="fixed bottom-6 left-6 z-40 grid size-14 place-items-center rounded-full bg-whatsapp text-white shadow-xl shadow-black/20 transition-transform duration-200 hover:scale-110"
        >
          <MessageCircle className="size-7" />
        </a>
      )}
    </div>
  );
}
