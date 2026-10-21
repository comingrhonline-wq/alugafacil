import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field

TipoImovel = Literal["casa", "apartamento"]
LeadStatus = Literal["novo", "contatado", "visita", "fechado", "perdido"]


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class ImovelBase(BaseModel):
    codigo: str = Field(min_length=1, max_length=20)
    titulo: str = Field(min_length=1, max_length=160)
    tipo: TipoImovel
    bairro: str = Field(min_length=1)
    cidade: str = "Praia Grande"
    estado: str = "SP"
    preco: float = Field(gt=0)
    preco_promocional: Optional[float] = None
    destaque: bool = False
    ativo: bool = True
    area: float = 0
    quartos: int = 0
    suites: int = 0
    banheiros: int = 0
    vagas: int = 0
    comodidades: list[str] = []
    descricao: str = ""
    fotos: list[str] = []
    video_url: str = ""


class ImovelCreate(ImovelBase):
    pass


class ImovelUpdate(BaseModel):
    codigo: Optional[str] = None
    titulo: Optional[str] = None
    tipo: Optional[TipoImovel] = None
    bairro: Optional[str] = None
    preco: Optional[float] = Field(default=None, gt=0)
    preco_promocional: Optional[float] = None
    destaque: Optional[bool] = None
    ativo: Optional[bool] = None
    area: Optional[float] = None
    quartos: Optional[int] = None
    suites: Optional[int] = None
    banheiros: Optional[int] = None
    vagas: Optional[int] = None
    comodidades: Optional[list[str]] = None
    descricao: Optional[str] = None
    fotos: Optional[list[str]] = None
    video_url: Optional[str] = None
    # explicit flag so the admin can clear a promo (None alone means "not sent")
    remover_promocao: bool = False


class Imovel(ImovelBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    criado_em: datetime = Field(default_factory=now_utc)


class Bairro(BaseModel):
    nome: str
    total: int
    menor_preco: float


class LeadCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=100)
    telefone: str = Field(min_length=8, max_length=30)
    mensagem: str = Field(default="", max_length=1000)
    imovel_codigo: Optional[str] = None


class Lead(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    telefone: str
    mensagem: str = ""
    imovel_codigo: Optional[str] = None
    imovel_titulo: Optional[str] = None
    imovel_preco: Optional[float] = None
    status: LeadStatus = "novo"
    criado_em: datetime = Field(default_factory=now_utc)


class LeadStatusUpdate(BaseModel):
    status: LeadStatus


class Settings(BaseModel):
    nome_exibicao: str = "Aluga Fácil"
    whatsapp: str = ""
    creci: str = ""
    email: str = ""
    instagram: str = ""


class LoginRequest(BaseModel):
    password: str


class AuthState(BaseModel):
    authenticated: bool


class BairroCount(BaseModel):
    bairro: str
    total: int


class AdminStats(BaseModel):
    imoveis_total: int
    imoveis_ativos: int
    promocoes: int
    destaques: int
    leads_total: int
    leads_novos: int
    preco_medio: float
    top_bairros: list[BairroCount]
    leads_por_imovel: list[BairroCount]
