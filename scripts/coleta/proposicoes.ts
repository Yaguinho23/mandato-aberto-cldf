import type { DeputadoComAliases, Proposicao } from "../../lib/types";
import { buscar as buscarPadrao, type Buscar } from "../http";
import { transformarProposicoes } from "../transforma/proposicoes";
import { carregarDeputados } from "./deputados";

export const URL_API_PLE = "https://ple.cl.df.gov.br/pleservico/api/public/proposicao/filter";
export const URL_PUBLICA_PLE = "https://ple.cl.df.gov.br/";

const ANO_INICIAL = 2023;
const ANO_FINAL = 2026; // fim da legislatura 2023–2026
const TAMANHO_PAGINA = 1000;

interface Pagina {
  content: unknown[];
  totalElements: number;
  last: boolean;
}

/** Baixa todas as proposições de 2023 em diante, um ano por vez, todas as páginas. */
export async function coletarProposicoes(
  deputados: DeputadoComAliases[],
  opcoes: { buscar?: Buscar; agora?: () => Date } = {},
): Promise<Proposicao[]> {
  const buscar = opcoes.buscar ?? buscarPadrao;
  const anoAtual = (opcoes.agora?.() ?? new Date()).getUTCFullYear();
  const porId = new Map<string, Proposicao>();

  for (let ano = ANO_INICIAL; ano <= Math.min(anoAtual, ANO_FINAL); ano++) {
    let recebidos = 0;
    for (let pagina = 0; ; pagina++) {
      const resposta = await buscar(`${URL_API_PLE}?page=${pagina}&size=${TAMANHO_PAGINA}&sort=id,asc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano }),
      });
      const dados = (await resposta.json()) as Pagina;
      if (!Array.isArray(dados.content)) throw new Error(`PLe: resposta sem "content" (ano ${ano}, página ${pagina})`);
      recebidos += dados.content.length;
      for (const p of transformarProposicoes(dados.content, deputados, ano)) porId.set(p.id, p);
      if (dados.last || dados.content.length === 0) {
        if (recebidos !== dados.totalElements) {
          throw new Error(`PLe: ano ${ano} devolveu ${recebidos} registros, mas informa ${dados.totalElements}`);
        }
        break;
      }
    }
  }

  return [...porId.values()].sort((a, b) => Number(a.id) - Number(b.id));
}

// Execução direta: `npx tsx scripts/coleta/proposicoes.ts` mostra um resumo para conferência.
async function resumo(): Promise<void> {
  const deputados = await carregarDeputados();
  const ps = await coletarProposicoes(deputados);
  const contar = (chave: (p: Proposicao) => string) => {
    const c = new Map<string, number>();
    for (const p of ps) c.set(chave(p), (c.get(chave(p)) ?? 0) + 1);
    return Object.fromEntries([...c].sort());
  };
  const semAutor = ps.filter((p) => p.autores.length === 0);
  console.log("total:", ps.length);
  console.log("por tipo:", contar((p) => p.tipo));
  console.log("por ano:", contar((p) => String(p.ano)));
  console.log(`sem autor reconhecido: ${semAutor.length} (${((100 * semAutor.length) / ps.length).toFixed(1)}%)`);
  const textos = new Map<string, number>();
  for (const p of semAutor) textos.set(p.autoresTexto, (textos.get(p.autoresTexto) ?? 0) + 1);
  console.log("autores não reconhecidos mais comuns:", [...textos].sort((a, b) => b[1] - a[1]).slice(0, 40));
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/coleta/proposicoes.ts")) {
  resumo().catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
}
