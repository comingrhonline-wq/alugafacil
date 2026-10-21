// Hand-written mirrors of backend/models/imovel.py — keep in sync.
export type TipoImovel = "casa" | "apartamento";
export type LeadStatus = "novo" | "contatado" | "visita" | "fechado" | "perdido";

export interface ImovelBase {
  codigo: string;
  titulo: string;
  tipo: TipoImovel;
  bairro: string;
  cidade: string;
  estado: string;
  preco: number;
  preco_promocional: number | null;
  destaque: boolean;
  ativo: boolean;
  area: number;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  comodidades: string[];
  descricao: string;
  fotos: string[];
  video_url: string;
}

export type ImovelCreate = ImovelBase;

export interface Imovel extends ImovelBase {
  id: string;
  criado_em: string;
}

export interface ImovelUpdate extends Partial<ImovelBase> {
  remover_promocao?: boolean;
}

export interface Bairro {
  nome: string;
  total: number;
  menor_preco: number;
}

export interface LeadCreate {
  nome: string;
  telefone: string;
  mensagem: string;
  imovel_codigo: string | null;
}

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  mensagem: string;
  imovel_codigo: string | null;
  imovel_titulo: string | null;
  imovel_preco: number | null;
  status: LeadStatus;
  criado_em: string;
}

export interface Settings {
  nome_exibicao: string;
  whatsapp: string;
  creci: string;
  email: string;
  instagram: string;
}

export interface AuthState {
  authenticated: boolean;
}

export interface BairroCount {
  bairro: string;
  total: number;
}

export interface AdminStats {
  imoveis_total: number;
  imoveis_ativos: number;
  promocoes: number;
  destaques: number;
  leads_total: number;
  leads_novos: number;
  preco_medio: number;
  top_bairros: BairroCount[];
  leads_por_imovel: BairroCount[];
}
