import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import SiteLayout from "@/components/SiteLayout";
import Home from "@/pages/Home";
import Imoveis from "@/pages/Imoveis";
import ImovelDetalhe from "@/pages/ImovelDetalhe";
import AdminLogin from "@/pages/AdminLogin";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/imoveis" element={<Imoveis />} />
          <Route path="/imovel/:codigo" element={<ImovelDetalhe />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Toaster richColors />
    </>
  );
}
