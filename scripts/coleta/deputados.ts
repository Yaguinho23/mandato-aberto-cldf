import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { DeputadoComAliasesSchema } from "../../lib/schemas";
import type { DeputadoComAliases } from "../../lib/types";
import { normalizarNome } from "../transforma/nomes";

const SEED = fileURLToPath(new URL("../../data/curado/deputados.json", import.meta.url));

/** Valida a lista curada. Lança erro em item inválido, slug repetido ou nome/alias de duas pessoas. */
export function validarDeputados(bruto: unknown[]): DeputadoComAliases[] {
  const deputados = bruto.map((item, i) => {
    const r = DeputadoComAliasesSchema.safeParse(item);
    if (!r.success) throw new Error(`Deputado inválido na posição ${i}: ${r.error.message}`);
    return r.data;
  });

  const slugs = new Set<string>();
  const donoDoNome = new Map<string, string>();
  for (const d of deputados) {
    if (slugs.has(d.slug)) throw new Error(`Slug repetido na lista de deputados: ${d.slug}`);
    slugs.add(d.slug);
    for (const nome of [d.nome, ...d.aliases]) {
      const chave = normalizarNome(nome);
      const dono = donoDoNome.get(chave);
      if (dono && dono !== d.slug) {
        throw new Error(`Nome ou alias "${chave}" aparece em dois deputados: ${dono} e ${d.slug}`);
      }
      donoDoNome.set(chave, d.slug);
    }
  }

  return deputados.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Lê `data/curado/deputados.json` (mantido à mão) e devolve em ordem alfabética. */
export async function carregarDeputados(caminho: string = SEED): Promise<DeputadoComAliases[]> {
  const bruto: unknown = JSON.parse(await readFile(caminho, "utf8"));
  if (!Array.isArray(bruto)) throw new Error("data/curado/deputados.json deve ser uma lista");
  return validarDeputados(bruto);
}

/**
 * Compara a lista curada com o CSV oficial "Relação nominal de deputados e servidores".
 * Devolve avisos em texto; lista vazia quando as duas batem. Não lança erro.
 *
 * No CSV o nome parlamentar está em `Lotacao` ("GABINETE DO DEPUTADO CHICO VIGILANTE")
 * e `Nome` traz o nome civil.
 */
export function conferirComRelacaoNominal(deputados: DeputadoComAliases[], csv: string): string[] {
  const linhas = csv.split(/\r?\n/).filter((l) => l.trim() !== "");
  const cabecalho = (linhas.shift() ?? "").split(",");
  const iCargo = cabecalho.indexOf("CargoFuncao");
  const iLotacao = cabecalho.indexOf("Lotacao");
  if (iCargo === -1 || iLotacao === -1) {
    return ["Relação nominal: colunas CargoFuncao/Lotacao não encontradas; conferência não realizada."];
  }

  const oficiais = linhas
    .map((l) => l.split(","))
    .filter((c) => c[iCargo] === "DEPUTADO DISTRITAL")
    .map((c) => c[iLotacao].replace(/^GABINETE D[OA] /, ""));

  const chaveDe = new Map<string, string>();
  for (const d of deputados) {
    for (const nome of [d.nome, ...d.aliases]) chaveDe.set(normalizarNome(nome), d.slug);
  }

  const avisos: string[] = [];
  const vistos = new Set<string>();
  for (const nomeOficial of oficiais) {
    const slug = chaveDe.get(normalizarNome(nomeOficial));
    if (slug) vistos.add(slug);
    else avisos.push(`Relação oficial lista ${nomeOficial}, ausente da lista curada.`);
  }
  for (const d of deputados) {
    if (d.emExercicio && !vistos.has(d.slug)) {
      avisos.push(`Lista curada tem ${d.nome}, ausente da relação oficial.`);
    }
  }
  return avisos;
}
