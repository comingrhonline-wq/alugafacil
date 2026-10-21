import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Bath, BedDouble, Car, Check, ChevronRight, MapPin, Maximize2, MessageCircle, Share2, ShieldCheck, Sparkles, BedSingle } from "lucide-react";
import { toast } from "sonner";
import PhotoGallery from "@/components/PhotoGallery";
import InterestForm from "@/components/InterestForm";
import PropertyCard from "@/components/PropertyCard";
import { useImovel, useSettings, useSimilares } from "@/lib/queries";
import { AMENIDADES, amenidadesVisiveis, brl, descontoPct, mensagemImovel, sufixo, TIPO_LABEL, waLink } from "@/lib/format";

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export default function ImovelDetalhe() {
  const { codigo = "" } = useParams();
  const q = useImovel(codigo.toUpperCase());
  const sim = useSimilares(codigo.toUpperCase());
  const settings = useSettings();
  const i = q.isError ? undefined : q.data;

  if (q.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-[420px] animate-pulse rounded-3xl bg-slate-200" />
      </div>
    );
  }

  if (!i) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-28 text-center" data-testid="property-not-found">
        <p className="font-mono text-sm text-pink">{codigo.toUpperCase()}</p>
        <h1 className="text-3xl font-bold text-navy">Este imóvel não está mais disponível</h1>
        <p className="text-slate-500">Ele pode ter sido alugado recentemente. Veja outras opções parecidas.</p>
        <Link to="/imoveis" className="mt-2 rounded-xl bg-pink px-6 py-3 font-bold text-white" data-testid="not-found-back-button">Ver imóveis disponíveis</Link>
      </div>
    );
  }

  const promo = !!i.preco_promocional;
  const wa = waLink(settings.whatsapp, mensagemImovel(i));
  const vid = i.video_url ? youtubeId(i.video_url) : null;
  const comods = amenidadesVisiveis(i.comodidades);
  const specs = [
    { icon: BedDouble, label: "Quartos", value: i.quartos },
    { icon: BedSingle, label: "Suítes", value: i.suites },
    { icon: Bath, label: "Banheiros", value: i.banheiros },
    { icon: Car, label: "Vagas", value: i.vagas },
    { icon: Maximize2, label: "Área útil", value: i.area ? `${i.area.toLocaleString("pt-BR")} m²` : 0 },
  ].filter((s) => s.value);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: i.titulo, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" data-testid="property-detail">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-slate-500" aria-label="Navegação estrutural">
        <Link to="/" className="hover:text-navy">Início</Link>
        <ChevronRight className="size-3.5" />
        <Link to={i.finalidade === "venda" ? "/imoveis?finalidade=venda" : "/imoveis"} className="hover:text-navy" data-testid="breadcrumb-imoveis">{i.finalidade === "venda" ? "Comprar" : "Alugar"}</Link>
        <ChevronRight className="size-3.5" />
        <Link to={`/imoveis?${i.finalidade === "venda" ? "finalidade=venda&" : ""}bairro=${encodeURIComponent(i.bairro)}`} className="hover:text-navy">{i.bairro}</Link>
        <ChevronRight className="size-3.5" />
        <span className="font-mono text-navy">{i.codigo}</span>
      </nav>

      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {promo && <span className="rounded-full bg-pink px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">Super oferta −{descontoPct(i)}%</span>}
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${i.finalidade === "venda" ? "bg-emerald-600 text-white" : "bg-navy text-white"}`} data-testid="property-finalidade">{i.finalidade === "venda" ? "À venda" : "Para alugar"}</span>
            <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy">{TIPO_LABEL[i.tipo]}</span>
            <span className="rounded-full bg-navy/5 px-3 py-1 font-mono text-xs font-semibold text-navy" data-testid="property-code">Cód. {i.codigo}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl" data-testid="property-title">{i.titulo}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-slate-600"><MapPin className="size-4 text-pink" />{i.bairro} · {i.cidade}/{i.estado}</p>
        </div>
        <div className="flex gap-2">
          <Link to={i.finalidade === "venda" ? "/imoveis?finalidade=venda" : "/imoveis"} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" data-testid="back-to-list-button"><ArrowLeft className="size-4" /> Voltar</Link>
          <button type="button" onClick={share} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" data-testid="share-button"><Share2 className="size-4" /> Compartilhar</button>
        </div>
      </div>

      <PhotoGallery fotos={i.fotos} titulo={i.titulo} />

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5" data-testid="property-specs">
            {specs.map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <s.icon className="size-5 text-pink" />
                <p className="mt-3 font-heading text-xl font-bold text-navy">{s.value}</p>
                <p className="text-xs uppercase tracking-wider text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          <section>
            <h2 className="text-xl font-bold text-navy">Sobre o imóvel</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-700" data-testid="property-description">{i.descricao || "Descrição em breve."}</p>
          </section>

          {comods.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-navy">Comodidades</h2>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="property-amenities">
                {comods.map((c) => (
                  <li key={c} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm text-slate-700 ring-1 ring-slate-200">
                    <Check className="size-4 text-emerald-600" /> {AMENIDADES[c]}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {vid && (
            <section>
              <h2 className="text-xl font-bold text-navy">Vídeo do imóvel</h2>
              <div className="mt-4 aspect-video overflow-hidden rounded-2xl bg-black">
                <iframe className="size-full" src={`https://www.youtube-nocookie.com/embed/${vid}`} title={`Vídeo — ${i.titulo}`} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen data-testid="property-video" />
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className={`overflow-hidden rounded-3xl border bg-white shadow-xl ${promo ? "border-pink shadow-pink/10" : "border-slate-200 shadow-slate-200/60"}`} data-testid="price-box">
            <div className={promo ? "bg-pink-subtle p-6" : "bg-sand p-6"}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{i.finalidade === "venda" ? "Valor de venda" : "Aluguel mensal"}</p>
              {promo && <p className="mt-2 font-mono text-slate-400 line-through" data-testid="price-box-original">{brl(i.preco)}</p>}
              <p className={`font-mono text-4xl font-bold tracking-tight ${promo ? "text-pink-hover" : "text-navy"}`} data-testid="price-box-price">
                {brl(i.preco_promocional || i.preco)}{sufixo(i) && <span className="ml-1 font-sans text-base font-medium text-slate-500">{sufixo(i)}</span>}
              </p>
              {promo && <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><Sparkles className="size-4" />Você economiza {brl(i.preco - (i.preco_promocional || 0))}{i.finalidade === "venda" ? "" : " por mês"}</p>}
              {i.finalidade === "venda" && i.area > 0 && <p className="mt-2 text-sm text-slate-500" data-testid="price-per-m2">{brl(Math.round(i.preco / i.area))} por m²</p>}
            </div>
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-navy">Gostou? Fale com a gente</h3>
              <InterestForm imovel={i} testPrefix="property-lead" />
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="mt-3 flex h-12 items-center justify-center gap-2 rounded-xl bg-whatsapp font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 active:scale-95" data-testid="property-whatsapp-button">
                  <MessageCircle className="size-5" /> Chamar no WhatsApp
                </a>
              )}
              <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-navy" />
                Valores e disponibilidade confirmados no atendimento{settings.creci ? ` · CRECI ${settings.creci}` : ""}.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {!sim.isError && (sim.data?.length ?? 0) > 0 && (
        <section className="mt-20" data-testid="similar-section">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-navy">Imóveis semelhantes</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sim.data?.map((s, n) => <PropertyCard key={s.id} imovel={s} index={n} />)}
          </div>
        </section>
      )}
    </div>
  );
}
