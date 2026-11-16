import type { TipoProposicao } from "./types";

export const GLOSSARIO: Record<string, { termo: string; explicacao: string }> = {
  PL: { termo: "PL", explicacao: "Projeto de Lei: proposta de nova lei ou de mudança em uma lei do DF." },
  PLC: { termo: "PLC", explicacao: "Projeto de Lei Complementar: detalha pontos da Lei Orgânica do DF; exige mais votos para ser aprovado." },
  PDL: { termo: "PDL", explicacao: "Projeto de Decreto Legislativo: decisão que cabe só à Câmara Legislativa, sem sanção do governador." },
  PR: { termo: "PR", explicacao: "Projeto de Resolução: trata de regras internas da própria Câmara." },
  IND: { termo: "IND", explicacao: "Indicação: pedido para que o governo faça algo, como uma obra ou um serviço. Não obriga o governo." },
  MO: { termo: "MO", explicacao: "Moção: manifestação de apoio, aplauso ou repúdio. Não cria regra." },
  RQ: { termo: "RQ", explicacao: "Requerimento: pedido formal, como informações a um órgão ou a realização de uma audiência." },
  OUTRO: { termo: "OUTRO", explicacao: "Outro tipo de documento legislativo." },
  "verba-indenizatoria": {
    termo: "verba indenizatória",
    explicacao: "Dinheiro que a Câmara devolve ao deputado por despesas do gabinete, como aluguel, combustível e consultorias, depois que ele comprova o gasto.",
  },
  comissao: {
    termo: "comissão",
    explicacao:
      "Comissões são pequenos grupos de deputados que estudam cada proposta antes de ela ir à votação de todos no plenário. Cada comissão cuida de um assunto, como saúde, educação ou segurança, e emite um parecer, que é a opinião técnica sobre a proposta. Elas também fiscalizam o governo e fazem audiências públicas para ouvir a população. As comissões permanentes têm cinco deputados titulares, com seus suplentes, e a composição é renovada a cada dois anos.",
  },
  "frente-parlamentar": {
    termo: "frente parlamentar",
    explicacao:
      "Frente parlamentar é um grupo de deputados de partidos diferentes que se une em torno de um tema, como turismo, tecnologia ou combate ao câncer. Para existir, precisa da assinatura de pelo menos um terço dos deputados distritais. A frente não vota nem aprova leis: serve para discutir o assunto, ouvir a sociedade e propor melhorias na legislação.",
  },
  ementa: { termo: "ementa", explicacao: "Resumo oficial, de uma frase, do que a proposição trata." },
};

export const explicarTipo = (tipo: TipoProposicao): string => GLOSSARIO[tipo].explicacao;

export const TAMANHO_PAGINA = 50;

export function paginar<T>(itens: T[], pagina: number, tamanho = TAMANHO_PAGINA) {
  const totalPaginas = Math.max(1, Math.ceil(itens.length / tamanho));
  const atual = Math.min(totalPaginas, Math.max(1, Math.floor(pagina) || 1));
  return { pagina: atual, totalPaginas, itens: itens.slice((atual - 1) * tamanho, atual * tamanho) };
}