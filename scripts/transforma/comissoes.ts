import { LEGISLATURA_ATUAL } from "../../lib/types";
import type { Comissao, DeputadoComAliases, MembroComissao, PapelComissao } from "../../lib/types";
import { normalizarNome } from "./nomes";

/**
 * Lê o literal JavaScript que o site da CLDF embute na página (chaves sem aspas, escapes \xNN),
 * sem executá-lo: só aceita objetos, listas, textos, números, true/false/null.
 */
export function lerLiteralJs(fonte: string): unknown {
  let json = "";
  let i = 0;
  while (i < fonte.length) {
    const c = fonte[i];
    if (c === '"') {
      let j = i + 1;
      let texto = '"';
      while (j < fonte.length && fonte[j] !== '"') {
        if (fonte[j] === "\\") {
          if (fonte[j + 1] === "x") {
            texto += "\\u00" + fonte.slice(j + 2, j + 4);
            j += 4;
            continue;
          }
          texto += fonte[j] + fonte[j + 1];
          j += 2;
          continue;
        }
        texto += fonte[j++];
      }
      json += texto + '"';
      i = j + 1;
    } else if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < fonte.length && /[\w$]/.test(fonte[j])) j++;
      const palavra = fonte.slice(i, j);
      if (fonte[j] === ":") json += `"${palavra}"`;
      else if (["true", "false", "null"].includes(palavra)) json += palavra;
      else throw new Error(`Literal inesperado: ${palavra}`);
      i = j;
    } else {
      json += c;
      i++;
    }
  }
  return JSON.parse(json);
}

interface MembroBruto {
  tipoMembro?: { nome?: string };
  autor?: { nome?: string };
  autorSuplente?: { nome?: string };
}
interface ComposicaoBruta {
  comissaoNome: string;
  comissaoSigla: string;
  dataInicio: string;
  dataFim: string;
  membros: MembroBruto[];
}

function extrairLista(html: string): ComposicaoBruta[] {
  const marca = "var composicoesFlat=";
  const inicio = html.indexOf(marca);
  if (inicio === -1) throw new Error("Comissões: lista de composições não encontrada na página");
  const s = inicio + marca.length;
  let profundidade = 0;
  let e = s;
  for (; e < html.length; e++) {
    const c = html[e];
    if (c === "[") profundidade++;
    else if (c === "]") {
      profundidade--;
      if (profundidade === 0) {
        e++;
        break;
      }
    } else if (c === '"') {
      e++;
      while (e < html.length && html[e] !== '"') {
        if (html[e] === "\\") e++;
        e++;
      }
    }
  }
  const lista = lerLiteralJs(html.slice(s, e));
  if (!Array.isArray(lista)) throw new Error("Comissões: composições em formato inesperado");
  return lista as ComposicaoBruta[];
}

const PAPEIS: PapelComissao[] = ["Presidente", "Vice-Presidente", "Membro"];

/** Composições vigentes (sem data de fim) das comissões permanentes. Nomes só casam de forma exata. */
export function transformarComissoes(html: string, deputados: DeputadoComAliases[], fonteUrl: string): Comissao[] {
  const slugPorNome = new Map<string, string>();
  for (const d of deputados) for (const n of [d.nome, ...d.aliases]) slugPorNome.set(normalizarNome(n), d.slug);

  const comissoes: Comissao[] = [];
  for (const c of extrairLista(html)) {
    if (c.dataFim && c.dataFim.trim() !== "") continue;
    const membros: MembroComissao[] = [];
    for (const m of c.membros) {
      const slug = slugPorNome.get(normalizarNome(m.autor?.nome ?? ""));
      if (!slug) continue;
      const papel = PAPEIS.find((p) => p === m.tipoMembro?.nome) ?? "Membro";
      const suplenteSlug = slugPorNome.get(normalizarNome(m.autorSuplente?.nome ?? "")) ?? null;
      membros.push({ deputadoSlug: slug, papel, suplenteSlug });
    }
    if (membros.length === 0) throw new Error(`Comissões: nenhum membro reconhecido em ${c.comissaoSigla}`);
    comissoes.push({
      id: c.comissaoSigla.toLowerCase(),
      sigla: c.comissaoSigla,
      nome: c.comissaoNome.trim(),
      vigenteDesde: c.dataInicio,
      membros,
      fonteUrl,
      legislatura: LEGISLATURA_ATUAL,
    });
  }
  return comissoes;
}