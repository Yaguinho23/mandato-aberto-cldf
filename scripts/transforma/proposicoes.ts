import { LEGISLATURA_ATUAL } from "../../lib/types";
import type { DeputadoComAliases, Proposicao, TipoProposicao } from "../../lib/types";
import { normalizarNome } from "./nomes";

// Nomes por extenso que a API do PLe devolve em `tipoProposicao` (docs/fontes.md).
const TIPO_POR_NOME: Record<string, TipoProposicao> = {
  "projeto de lei": "PL",
  "projeto de lei complementar": "PLC",
  "projeto de decreto legislativo": "PDL",
  "projeto de resolucao": "PR",
  "indicacao": "IND",
  "mocao": "MO",
  "requerimento": "RQ",
};

const indices = new WeakMap<DeputadoComAliases[], Map<string, string>>();

function indiceDeNomes(deputados: DeputadoComAliases[]): Map<string, string> {
  let indice = indices.get(deputados);
  if (!indice) {
    indice = new Map();
    for (const d of deputados) {
      for (const nome of [d.nome, ...d.aliases]) indice.set(normalizarNome(nome), d.slug);
    }
    indices.set(deputados, indice);
  }
  return indice;
}

/**
 * Slugs dos deputados citados no texto de autoria, em ordem alfabética e sem repetição.
 * Casamento exato por nome normalizado ou alias; nunca por aproximação.
 * Coautores vêm separados por vírgula na fonte.
 */
export function identificarAutores(autoresTexto: string, deputados: DeputadoComAliases[]): string[] {
  const indice = indiceDeNomes(deputados);
  const slugs = new Set<string>();
  for (const parte of autoresTexto.split(",")) {
    const chave = normalizarNome(parte);
    if (chave === "") continue;
    const slug = indice.get(chave);
    if (slug) slugs.add(slug);
  }
  return [...slugs].sort();
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

/**
 * Registros brutos da API do PLe → Proposicao[]. Nenhum registro é descartado:
 * autor não reconhecido fica com `autores: []` e o texto original em `autoresTexto`.
 * Lança erro em registro sem id ou sem ano (a coleta inteira é então tratada como falha).
 */
export function transformarProposicoes(
  bruto: unknown[],
  deputados: DeputadoComAliases[],
  anoDaConsulta?: number,
): Proposicao[] {
  return bruto.map((item, i) => {
    const r = (item ?? {}) as Record<string, unknown>;
    if (typeof r.id !== "number" && !(typeof r.id === "string" && r.id.trim() !== "")) {
      throw new Error(`Proposição na posição ${i} veio sem id`);
    }
    const id = String(r.id).trim();

    const sigla = texto(r.siglaNumeroAno);
    const partes = /^\S+\s+(.+?)(?:\/(\d{4}))?$/.exec(sigla);
    const numero = partes ? partes[1].trim() : "";

    const dataLeitura = texto(r.dataLeitura);
    const dataApresentacao = /^\d{4}-\d{2}-\d{2}$/.test(dataLeitura) ? dataLeitura : null;

    const ano = partes?.[2] ? Number(partes[2]) : dataApresentacao ? Number(dataApresentacao.slice(0, 4)) : anoDaConsulta;
    if (!ano) throw new Error(`Proposição ${id} veio sem ano identificável ("${sigla}")`);

    const autoresTexto = texto(r.autoria);
    const etapa = texto(r.etapa);

    return {
      id,
      tipo: TIPO_POR_NOME[normalizarNome(texto(r.tipoProposicao))] ?? "OUTRO",
      numero,
      ano,
      ementa: texto(r.ementa),
      situacao: etapa === "" ? null : etapa,
      dataApresentacao,
      autoresTexto,
      autores: identificarAutores(autoresTexto, deputados),
      urlFonte: `https://ple.cl.df.gov.br/#/proposicao/${id}/consultar`,
      legislatura: LEGISLATURA_ATUAL,
    };
  });
}
