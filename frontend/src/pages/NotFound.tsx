import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-28 text-center" data-testid="not-found-page">
      <p className="font-heading text-7xl font-black text-pink">404</p>
      <h1 className="text-2xl font-bold text-navy">Página não encontrada</h1>
      <p className="text-slate-500">O endereço que você acessou não existe ou foi movido.</p>
      <Link to="/imoveis" className="mt-2 rounded-xl bg-navy px-6 py-3 font-bold text-white" data-testid="not-found-home-button">Ver imóveis</Link>
    </div>
  );
}
