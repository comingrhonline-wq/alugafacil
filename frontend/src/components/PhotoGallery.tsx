import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function PhotoGallery({ fotos, titulo }: { fotos: string[]; titulo: string }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const n = fotos.length;
  const go = (d: number) => setIdx((i) => (i + d + n) % n);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % n);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + n) % n);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, n]);

  if (!n) return <div className="grid aspect-[16/7] place-items-center rounded-3xl bg-slate-100 text-slate-400">Sem fotos</div>;

  const openAt = (i: number) => {
    setIdx(i);
    setOpen(true);
  };

  return (
    <>
      <div className="grid gap-2 overflow-hidden rounded-3xl md:grid-cols-4 md:grid-rows-2 md:h-[480px]" data-testid="photo-gallery">
        {fotos.slice(0, 5).map((f, i) => (
          <button
            key={f}
            type="button"
            onClick={() => openAt(i)}
            data-testid={`gallery-photo-${i}`}
            className={cn(
              "group relative overflow-hidden bg-slate-100",
              i === 0 ? "aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto" : "hidden md:block",
            )}
          >
            <img src={f} alt={`${titulo} — foto ${i + 1}`} referrerPolicy="no-referrer" loading={i ? "lazy" : "eager"} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {i === 4 && n > 5 && (
              <span className="absolute inset-0 grid place-items-center bg-navy/60 text-lg font-bold text-white backdrop-blur-[2px]">+{n - 5} fotos</span>
            )}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => openAt(0)}
        data-testid="gallery-open-all-button"
        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-slate-50"
      >
        <Expand className="size-4" /> Ver todas as {n} fotos
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] gap-3 border-0 bg-navy-dark p-3 text-white sm:max-w-5xl" data-testid="gallery-lightbox">
          <DialogTitle className="sr-only">{titulo} — fotos</DialogTitle>
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-black sm:aspect-[16/10]">
            <img key={idx} src={fotos[idx]} alt={`${titulo} — foto ${idx + 1}`} referrerPolicy="no-referrer" className="max-h-full max-w-full animate-in fade-in object-contain duration-300" />
            <button type="button" aria-label="Foto anterior" onClick={() => go(-1)} data-testid="lightbox-prev-button" className="absolute left-3 grid size-11 place-items-center rounded-full bg-white/15 backdrop-blur transition-colors hover:bg-white/30">
              <ChevronLeft className="size-6" />
            </button>
            <button type="button" aria-label="Próxima foto" onClick={() => go(1)} data-testid="lightbox-next-button" className="absolute right-3 grid size-11 place-items-center rounded-full bg-white/15 backdrop-blur transition-colors hover:bg-white/30">
              <ChevronRight className="size-6" />
            </button>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-xs" data-testid="lightbox-counter">
              {idx + 1} / {n}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {fotos.map((f, i) => (
              <button key={f} type="button" onClick={() => setIdx(i)} aria-label={`Foto ${i + 1}`} className={cn("h-14 w-20 shrink-0 overflow-hidden rounded-md opacity-50 ring-2 ring-transparent transition-[opacity,box-shadow]", i === idx && "opacity-100 ring-pink")}>
                <img src={f} alt="" referrerPolicy="no-referrer" loading="lazy" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
