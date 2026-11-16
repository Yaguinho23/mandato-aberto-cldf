import { formatarBRL } from "../../lib/formato";
import type { DeputadoComAliases, DespesaVerba } from "../../lib/types";
import { buscar as buscarPadrao, type Buscar } from "../http";
import { lerPlanilha } from "../transforma/planilha";
import { transformarVerba, type LinhaRejeitada } from "../transforma/verba";
import { carregarDeputados } from "./deputados";

export const URL_CATALOGO_VERBA = "https://dados.cl.df.gov.br/api/3/action/package_show?id=verbas-indenizatorias";
export const URL_PUBLICA_VERBA = "https://dados.cl.df.gov.br/dataset/verbas-indenizatorias";

const ANO_INICIAL = 2023;
const ANO_FINAL = 2026;

interface Recurso {
  name: string;
  created: string;
  url: string;
}

export interface RejeitadaNoArquivo extends LinhaRejeitada {
  arquivo: string;
}

/**
 * Descobre os arquivos de verba no catálogo do portal de dados abertos e, para cada ano
 * da legislatura, lê o arquivo criado por último (o mais completo).
 */
export async function coletarVerba(
  deputados: DeputadoComAliases[],
  opcoes: { buscar?: Buscar } = {},
): Promise<{ despesas: DespesaVerba[]; rejeitadas: RejeitadaNoArquivo[] }> {
  const buscar = opcoes.buscar ?? buscarPadrao;
  const catalogo = (await (await buscar(URL_CATALOGO_VERBA)).json()) as { result?: { resources?: Recurso[] } };
  const recursos = catalogo.result?.resources;
  if (!Array.isArray(recursos)) throw new Error("Verba: catálogo sem lista de arquivos");

  const porAno = new Map<number, Recurso>();
  for (const r of recursos) {
    const ano = Number(/\b(20\d{2})\b/.exec(r.name ?? "")?.[1]);
    if (!(ano >= ANO_INICIAL && ano <= ANO_FINAL) || typeof r.url !== "string") continue;
    const atual = porAno.get(ano);
    if (!atual || String(r.created) > String(atual.created)) porAno.set(ano, r);
  }
  if (porAno.size === 0) throw new Error("Verba: nenhum arquivo da legislatura 2023-2026 no catálogo");

  const despesas: DespesaVerba[] = [];
  const rejeitadas: RejeitadaNoArquivo[] = [];
  for (const ano of [...porAno.keys()].sort()) {
    const url = porAno.get(ano)!.url.replace(/^http:/, "https:");
    const bytes = new Uint8Array(await (await buscar(url)).arrayBuffer());
    const r = transformarVerba(lerPlanilha(bytes), deputados, url, ano);
    despesas.push(...r.despesas);
    rejeitadas.push(...r.rejeitadas.map((x) => ({ arquivo: url, ...x })));
  }
  return { despesas, rejeitadas };
}

// Execução direta: `npx tsx scripts/coleta/verba.ts` mostra um resumo para conferência.
async function resumo(): Promise<void> {
  const deputados = await carregarDeputados();
  const { despesas, rejeitadas } = await coletarVerba(deputados);
  for (const ano of [2023, 2024, 2025, 2026]) {
    const doAno = despesas.filter((d) => d.ano === ano);
    const total = doAno.reduce((s, d) => s + d.valorCentavos, 0);
    const semMes = doAno.filter((d) => d.mes === null).length;
    const deps = new Set(doAno.map((d) => d.deputadoSlug)).size;
    console.log(`${ano}: ${doAno.length} lançamentos, ${deps} deputados, ${formatarBRL(total)}, ${semMes} sem mês`);
  }
  console.log(`rejeitadas: ${rejeitadas.length}`);
  const motivos = new Map<string, number>();
  for (const r of rejeitadas) {
    const chave = `${r.arquivo.split("/").pop()} | ${r.motivo}`;
    motivos.set(chave, (motivos.get(chave) ?? 0) + 1);
  }
  console.log([...motivos].sort((a, b) => b[1] - a[1]));
  const alvo = process.argv[2];
  if (alvo) {
    const [slug, ano] = alvo.split(":");
    const linhas = despesas.filter((d) => d.deputadoSlug === slug && d.ano === Number(ano));
    console.log(`${slug} em ${ano}: ${linhas.length} lançamentos, ${formatarBRL(linhas.reduce((s, d) => s + d.valorCentavos, 0))}`);
    const porMes = new Map<string, number>();
    for (const d of linhas) porMes.set(String(d.mes), (porMes.get(String(d.mes)) ?? 0) + d.valorCentavos);
    console.log([...porMes].map(([m, v]) => `mês ${m}: ${formatarBRL(v)}`));
  }
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/coleta/verba.ts")) {
  resumo().catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
}
