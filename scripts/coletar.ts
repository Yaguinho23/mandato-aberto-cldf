import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { z } from "zod";
import { ComissaoSchema, DeputadoSchema, DespesaVerbaSchema, FrenteSchema, MetadadosSchema, ProposicaoSchema } from "../lib/schemas";
import type { Comissao, Deputado, DeputadoComAliases, DespesaVerba, FonteMeta, Frente, IdFonte, Metadados, Proposicao } from "../lib/types";
import { carregarDeputados } from "./coleta/deputados";
import { coletarComissoes, URL_COMISSOES } from "./coleta/comissoes";
import { coletarFrentes, URL_FRENTES } from "./coleta/frentes";
import { coletarProposicoes, URL_PUBLICA_PLE } from "./coleta/proposicoes";
import { coletarVerba, URL_PUBLICA_VERBA } from "./coleta/verba";

export interface Coletores {
  deputados: () => Promise<DeputadoComAliases[]>;
  proposicoes: (deputados: DeputadoComAliases[]) => Promise<Proposicao[]>;
  verba: (deputados: DeputadoComAliases[]) => Promise<{ despesas: DespesaVerba[]; rejeitadas: unknown[] }>;
  comissoes: (deputados: DeputadoComAliases[]) => Promise<Comissao[]>;
  frentes: (deputados: DeputadoComAliases[]) => Promise<Frente[]>;
}

const FONTES: Record<IdFonte, { nome: string; url: string; arquivo: string }> = {
  deputados: { nome: "Deputados da legislatura 2023–2026 (site da CLDF)", url: "https://www.cl.df.gov.br/deputados-2023-2026", arquivo: "deputados.json" },
  proposicoes: { nome: "Proposições (sistema PLe da CLDF)", url: URL_PUBLICA_PLE, arquivo: "proposicoes.json" },
  verba: { nome: "Verbas indenizatórias (dados abertos da CLDF)", url: URL_PUBLICA_VERBA, arquivo: "verba.json" },
  comissoes: { nome: "Comissões permanentes (site da CLDF)", url: URL_COMISSOES, arquivo: "comissoes.json" },
  frentes: { nome: "Frentes parlamentares (site da CLDF)", url: URL_FRENTES, arquivo: "frentes.json" },
};

/** Queda maior que esta, em relação à última coleta boa, é tratada como falha da fonte. */
const QUEDA_MAXIMA = 0.3;

const mensagem = (erro: unknown) => (erro instanceof Error ? erro.message : String(erro));

/** Um registro por linha: o commit diário mostra só o que mudou. */
function serializar(itens: unknown[]): string {
  return itens.length === 0 ? "[]\n" : `[\n${itens.map((i) => JSON.stringify(i)).join(",\n")}\n]\n`;
}

async function gravarAtomico(caminho: string, conteudo: string): Promise<void> {
  const temporario = `${caminho}.tmp`;
  try {
    await writeFile(temporario, conteudo, "utf8");
    await rename(temporario, caminho);
  } finally {
    await rm(temporario, { force: true });
  }
}

async function lerMetadadosAnteriores(dirSaida: string): Promise<Metadados | null> {
  try {
    const r = MetadadosSchema.safeParse(JSON.parse(await readFile(join(dirSaida, "metadados.json"), "utf8")));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

function validar<T>(itens: unknown[], schema: z.ZodType<T>, rotulo: string): T[] {
  return itens.map((item, i) => {
    const r = schema.safeParse(item);
    if (!r.success) throw new Error(`Registro inválido em ${rotulo} (posição ${i}): ${r.error.issues[0]?.path.join(".")} ${r.error.issues[0]?.message}`);
    return r.data;
  });
}

const texto = (v: string | null) => v ?? "";

function ordenarVerba(a: DespesaVerba, b: DespesaVerba): number {
  return (
    a.ano - b.ano ||
    a.deputadoSlug.localeCompare(b.deputadoSlug) ||
    (a.mes ?? 0) - (b.mes ?? 0) ||
    texto(a.fornecedor).localeCompare(texto(b.fornecedor)) ||
    a.valorCentavos - b.valorCentavos ||
    a.categoria.localeCompare(b.categoria)
  );
}

/**
 * Roda os coletores e grava `data/`. Cada fonte é independente: se uma falha, devolve vazio,
 * traz registro inválido ou encolhe mais de 30%, o arquivo bom anterior fica como está e
 * `metadados.json` registra `ok: false` com a data da última coleta boa.
 */
export async function executarColeta(deps: { coletores: Coletores; dirSaida: string; agora: () => Date }): Promise<Metadados> {
  const { coletores, dirSaida } = deps;
  const agora = deps.agora().toISOString();
  await mkdir(dirSaida, { recursive: true });
  const anteriores = await lerMetadadosAnteriores(dirSaida);

  async function fonte(id: IdFonte, coletar: () => Promise<{ itens: unknown[]; rejeitados?: number }>): Promise<FonteMeta> {
    const { nome, url, arquivo } = FONTES[id];
    const anterior = anteriores?.fontes.find((f) => f.id === id);
    try {
      const { itens, rejeitados } = await coletar();
      if (itens.length === 0) throw new Error("A coleta voltou vazia");
      if (anterior && anterior.registros > 0 && itens.length < anterior.registros * (1 - QUEDA_MAXIMA)) {
        throw new Error(`Queda de ${anterior.registros} para ${itens.length} registros (mais de 30%)`);
      }
      await gravarAtomico(join(dirSaida, arquivo), serializar(itens));
      return { id, nome, url, coletadoEm: agora, registros: itens.length, ok: true, ...(rejeitados === undefined ? {} : { rejeitados }) };
    } catch (erro) {
      return {
        id, nome, url,
        coletadoEm: anterior?.coletadoEm ?? agora,
        registros: anterior?.registros ?? 0,
        ok: false,
        erro: mensagem(erro),
        ...(anterior?.rejeitados === undefined ? {} : { rejeitados: anterior.rejeitados }),
      };
    }
  }

  let deputados: DeputadoComAliases[] | null = null;
  let erroDeputados: unknown = null;
  try {
    deputados = await coletores.deputados();
  } catch (erro) {
    erroDeputados = erro;
  }
  const exigirDeputados = () => {
    if (!deputados) throw new Error(`Lista de deputados indisponível: ${mensagem(erroDeputados)}`);
    return deputados;
  };

  const fontes: FonteMeta[] = [
    await fonte("deputados", async () => {
      const semAliases: Deputado[] = exigirDeputados().map(({ aliases: _aliases, ...d }) => d);
      const itens = validar(semAliases, DeputadoSchema, "deputados").sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      return { itens };
    }),
    await fonte("proposicoes", async () => {
      const itens = validar(await coletores.proposicoes(exigirDeputados()), ProposicaoSchema, "proposições");
      return { itens: itens.sort((a, b) => Number(a.id) - Number(b.id) || a.id.localeCompare(b.id)) };
    }),
    await fonte("verba", async () => {
      const { despesas, rejeitadas } = await coletores.verba(exigirDeputados());
      return { itens: validar(despesas, DespesaVerbaSchema, "verba").sort(ordenarVerba), rejeitados: rejeitadas.length };
    }),
    await fonte("comissoes", async () => {
      const itens = validar(await coletores.comissoes(exigirDeputados()), ComissaoSchema, "comissões");
      return { itens: itens.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")) };
    }),
    await fonte("frentes", async () => {
      const itens = validar(await coletores.frentes(exigirDeputados()), FrenteSchema, "frentes");
      return { itens: itens.sort((a, b) => a.id.split("-")[1].localeCompare(b.id.split("-")[1]) || Number(a.id.split("-")[0]) - Number(b.id.split("-")[0])) };
    }),
  ];

  const metadados: Metadados = { geradoEm: agora, fontes };
  await gravarAtomico(join(dirSaida, "metadados.json"), JSON.stringify(metadados, null, 2) + "\n");
  return metadados;
}

// `npm run coletar`: sai com código 1 só se todas as fontes falharem.
async function principal(): Promise<void> {
  const metadados = await executarColeta({
    coletores: { deputados: () => carregarDeputados(), proposicoes: (d) => coletarProposicoes(d), verba: (d) => coletarVerba(d), comissoes: (d) => coletarComissoes(d), frentes: (d) => coletarFrentes(d) },
    dirSaida: join(process.cwd(), "data"),
    agora: () => new Date(),
  });
  for (const f of metadados.fontes) {
    console.log(`${f.ok ? "ok   " : "FALHA"} ${f.id}: ${f.registros} registros${f.erro ? ` (${f.erro})` : ""}`);
  }
  if (metadados.fontes.every((f) => !f.ok)) process.exit(1);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/coletar.ts")) {
  principal().catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
}
