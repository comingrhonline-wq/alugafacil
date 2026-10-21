import { ShieldCheck } from "lucide-react";
import { useSettings } from "@/lib/queries";

const ATUALIZADO = "outubro de 2026";

export default function Privacidade() {
  const s = useSettings();
  const contato = [s.email && `e-mail ${s.email}`, s.whatsapp && `WhatsApp ${s.whatsapp}`].filter(Boolean).join(" ou ") || "pelos canais de atendimento informados no site";

  const secoes: { t: string; p: string[] }[] = [
    {
      t: "1. Quem somos",
      p: [
        `${s.nome_exibicao} é um serviço de divulgação de imóveis para alugar e à venda em Praia Grande/SP${s.creci ? `, com atendimento por corretor inscrito no CRECI ${s.creci}` : ""}. Esta política explica como tratamos seus dados pessoais, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).`,
      ],
    },
    {
      t: "2. Quais dados coletamos",
      p: [
        "Apenas os dados que você informa nos formulários de contato: nome, número de WhatsApp/telefone, mensagem e o imóvel de interesse.",
        "Não pedimos CPF, documentos, dados bancários ou senhas pelo site. Não usamos cookies de rastreamento nem de publicidade. O único cookie existente é técnico e usado só na área restrita do corretor.",
      ],
    },
    {
      t: "3. Para que usamos seus dados",
      p: [
        "Para responder ao seu contato, confirmar a disponibilidade do imóvel, agendar visitas e enviar opções compatíveis com o que você procura.",
        "A base legal é o seu consentimento (art. 7º, I, da LGPD), dado ao marcar a caixa de aceite no formulário, e os procedimentos preliminares a um contrato de locação ou compra e venda solicitados por você (art. 7º, V).",
      ],
    },
    {
      t: "4. Compartilhamento",
      p: [
        "Não vendemos nem alugamos seus dados. Eles podem ser compartilhados apenas com o proprietário ou a imobiliária responsável pelo imóvel de interesse, quando necessário para dar andamento à visita ou à negociação, e com autoridades, quando exigido por lei.",
      ],
    },
    {
      t: "5. Por quanto tempo guardamos",
      p: [
        "Mantemos seus dados pelo tempo necessário ao atendimento e por até 12 meses após o último contato, salvo obrigação legal. Depois disso, eles são excluídos.",
      ],
    },
    {
      t: "6. Segurança",
      p: [
        "O site usa conexão criptografada (HTTPS). Os contatos ficam em uma área restrita, protegida por senha e com limite de tentativas de acesso. Também adotamos proteção contra robôs e envios em massa nos formulários.",
      ],
    },
    {
      t: "7. Seus direitos",
      p: [
        "Você pode, a qualquer momento e sem custo, pedir a confirmação de que tratamos seus dados, o acesso a eles, a correção, a exclusão ou a revogação do consentimento, além de outros direitos previstos no art. 18 da LGPD.",
        `Para isso, fale com a gente pelo ${contato}. Respondemos em até 15 dias.`,
      ],
    },
    {
      t: "8. Imóveis e informações",
      p: [
        "Fotos, valores e características dos imóveis são informativos e podem mudar sem aviso. Disponibilidade e condições são confirmadas no atendimento.",
      ],
    },
    {
      t: "9. Alterações desta política",
      p: ["Podemos atualizar esta política. A versão vigente estará sempre nesta página, com a data da última atualização."],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6" data-testid="privacy-page">
      <span className="grid size-12 place-items-center rounded-2xl bg-navy text-white"><ShieldCheck className="size-6" /></span>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-navy sm:text-4xl">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-slate-500">Última atualização: {ATUALIZADO}</p>
      <div className="mt-10 space-y-9">
        {secoes.map((sec) => (
          <section key={sec.t}>
            <h2 className="text-lg font-semibold text-navy">{sec.t}</h2>
            {sec.p.map((p) => (
              <p key={p} className="mt-3 leading-relaxed text-slate-700">{p}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
