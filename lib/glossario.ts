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
  ementa: { termo: "ementa", explicacao: "Resumo oficial, de uma frase, do que a proposição trata." },
};

export const explicarTipo = (tipo: TipoProposicao): string => GLOSSARIO[tipo].explicacao;

export const TAMANHO_PAGINA = 50;

export function paginar<T>(itens: T[], pagina: number, tamanho = TAMANHO_PAGINA) {
  const totalPaginas = Math.max(1, Math.ceil(itens.length / tamanho));
  const atual = Math.min(totalPaginas, Math.max(1, Math.floor(pagina) || 1));
  return { pagina: atual, totalPaginas, itens: itens.slice((atual - 1) * tamanho, atual * tamanho) };
}