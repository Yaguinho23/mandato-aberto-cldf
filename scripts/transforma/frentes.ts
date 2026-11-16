import { LEGISLATURA_ATUAL } from "../../lib/types";
import type { DeputadoComAliases, Frente } from "../../lib/types";
import { normalizarNome } from "./nomes";

const ENTIDADES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" };
const texto = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&[#\w]+;/g, (e) => ENTIDADES[e] ?? e)
    .replace(/\s+/g, " ")
    .trim();

/** Tabela de frentes parlamentares (uma por linha) → frentes com autor e signatários por slug. */
export function transformarFrentes(html: string, deputados: DeputadoComAliases[], fonteUrl: string): Frente[] {
  const tabela = /<table[\s\S]*?<\/table>/.exec(html);
  if (!tabela) throw new Error("Frentes: tabela não encontrada na página");

  const slugPorNome = new Map<string, string>();
  for (const d of deputados) for (const n of [d.nome, ...d.aliases]) slugPorNome.set(normalizarNome(n), d.slug);

  const frentes: Frente[] = [];
  for (const linha of tabela[0].split("</tr>")) {
    const celulas = [...linha.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (celulas.length < 4) continue;
    const requerimento = texto(celulas[0]);
    if (!/^\d+\/\d{4}$/.test(requerimento)) continue; // cabeçalho ou linha estranha
    const href = /href="([^"]+)"/.exec(celulas[0])?.[1] ?? null;

    const autorTexto = texto(celulas[2]);
    const autorSlug = slugPorNome.get(normalizarNome(autorTexto)) ?? null;

    const signatarios: string[] = [];
    const naoReconhecidos: string[] = autorTexto !== "" && autorSlug === null ? [autorTexto] : [];
    for (const parte of celulas[3].split(/<br\s*\/?>/)) {
      const nome = texto(parte);
      if (nome === "") continue;
      const slug = slugPorNome.get(normalizarNome(nome));
      if (!slug) naoReconhecidos.push(nome);
      else if (slug !== autorSlug && !signatarios.includes(slug)) signatarios.push(slug);
    }

    const nome = texto(celulas[1]);
    let id = requerimento.replace("/", "-");
    if (frentes.some((f) => f.id === id && f.nome === nome)) continue; // a fonte repete algumas linhas idênticas
    // Mesmo requerimento com frentes diferentes: ids distintos, nada é descartado.
    for (let n = 2; frentes.some((f) => f.id === id); n++) id = `${requerimento.replace("/", "-")}-${n}`;
    frentes.push({
      id,
      requerimento,
      nome,
      autorSlug,
      signatarios,
      naoReconhecidos,
      urlRequerimento: href,
      fonteUrl,
      legislatura: LEGISLATURA_ATUAL,
    });
  }
  if (frentes.length === 0) throw new Error("Frentes: nenhuma linha lida da tabela");
  return frentes;
}