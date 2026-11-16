import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TIPOS_PROPOSICAO } from "./types";
import type { Deputado, DespesaVerba, Metadados, Proposicao, TipoProposicao } from "./types";

export interface ConjuntoDeDados {
  deputados: Deputado[];
  proposicoes: Proposicao[];
  verba: DespesaVerba[];
  metadados: Metadados;
}

export interface ResumoVerba {
  totalCentavos: number;
  /** Só meses com registro. */
  porMes: { mes: number; centavos: number }[];
  /** Lançamentos cuja data na fonte é ausente ou ambígua: entram no total, mas não em porMes. */
  semMes: { lancamentos: number; centavos: number };
  /** Maior → menor. */
  porCategoria: { categoria: string; centavos: number }[];
}

export const MAXIMO_COMPARAR = 4;

export function criarDados(c: ConjuntoDeDados) {
  const deputados = [...c.deputados].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const slugs = new Set(deputados.map((d) => d.slug));

  const recentesPrimeiro = (a: Proposicao, b: Proposicao) =>
    (b.dataApresentacao ?? "").localeCompare(a.dataApresentacao ?? "") || Number(b.id) - Number(a.id);
  const proposicoes = [...c.proposicoes].sort(recentesPrimeiro);

  const listarDeputados = () => deputados;
  const obterDeputado = (slug: string) => deputados.find((d) => d.slug === slug);

  const proposicoesDe = (slug: string) => proposicoes.filter((p) => p.autores.includes(slug));

  function listarProposicoes(f: { tipo?: TipoProposicao; ano?: number; autor?: string } = {}): Proposicao[] {
    return proposicoes.filter(
      (p) => (f.tipo === undefined || p.tipo === f.tipo) && (f.ano === undefined || p.ano === f.ano) && (f.autor === undefined || p.autores.includes(f.autor)),
    );
  }

  function resumoVerba(slug: string, ano: number): ResumoVerba | null {
    const linhas = c.verba.filter((d) => d.deputadoSlug === slug && d.ano === ano);
    if (linhas.length === 0) return null;
    const meses = new Map<number, number>();
    const categorias = new Map<string, number>();
    const semMes = { lancamentos: 0, centavos: 0 };
    let total = 0;
    for (const l of linhas) {
      total += l.valorCentavos;
      categorias.set(l.categoria, (categorias.get(l.categoria) ?? 0) + l.valorCentavos);
      if (l.mes === null) {
        semMes.lancamentos++;
        semMes.centavos += l.valorCentavos;
      } else meses.set(l.mes, (meses.get(l.mes) ?? 0) + l.valorCentavos);
    }
    return {
      totalCentavos: total,
      porMes: [...meses].map(([mes, centavos]) => ({ mes, centavos })).sort((a, b) => a.mes - b.mes),
      semMes,
      porCategoria: [...categorias].map(([categoria, centavos]) => ({ categoria, centavos })).sort((a, b) => b.centavos - a.centavos || a.categoria.localeCompare(b.categoria, "pt-BR")),
    };
  }

  const anosComVerba = (slug: string) => [...new Set(c.verba.filter((d) => d.deputadoSlug === slug).map((d) => d.ano))].sort((a, b) => a - b);

  function resumoDeputado(slug: string, ano: number) {
    const porTipo = Object.fromEntries(TIPOS_PROPOSICAO.map((t) => [t, 0])) as Record<TipoProposicao, number>;
    const doAno = proposicoesDe(slug).filter((p) => p.ano === ano);
    for (const p of doAno) porTipo[p.tipo]++;
    return { proposicoes: doAno.length, porTipo, verba: resumoVerba(slug, ano) };
  }

  const obterMetadados = () => c.metadados;

  function normalizarSelecao(param: string | string[] | undefined): string[] {
    const itens = (Array.isArray(param) ? param : param === undefined ? [] : [param]).flatMap((p) => p.split(","));
    const unicos: string[] = [];
    for (const i of itens.map((s) => s.trim())) if (slugs.has(i) && !unicos.includes(i)) unicos.push(i);
    return unicos.slice(0, MAXIMO_COMPARAR);
  }

  return { listarDeputados, obterDeputado, proposicoesDe, listarProposicoes, resumoVerba, anosComVerba, resumoDeputado, obterMetadados, normalizarSelecao };
}

const lerJson = <T>(nome: string): T => JSON.parse(readFileSync(join(process.cwd(), "data", nome), "utf8")) as T;

let padrao: ReturnType<typeof criarDados> | undefined;
function reais() {
  padrao ??= criarDados({
    deputados: lerJson<Deputado[]>("deputados.json"),
    proposicoes: lerJson<Proposicao[]>("proposicoes.json"),
    verba: lerJson<DespesaVerba[]>("verba.json"),
    metadados: lerJson<Metadados>("metadados.json"),
  });
  return padrao;
}

export const listarDeputados: ReturnType<typeof criarDados>["listarDeputados"] = () => reais().listarDeputados();
export const obterDeputado: ReturnType<typeof criarDados>["obterDeputado"] = (s) => reais().obterDeputado(s);
export const proposicoesDe: ReturnType<typeof criarDados>["proposicoesDe"] = (s) => reais().proposicoesDe(s);
export const listarProposicoes: ReturnType<typeof criarDados>["listarProposicoes"] = (f) => reais().listarProposicoes(f);
export const resumoVerba: ReturnType<typeof criarDados>["resumoVerba"] = (s, a) => reais().resumoVerba(s, a);
export const anosComVerba: ReturnType<typeof criarDados>["anosComVerba"] = (s) => reais().anosComVerba(s);
export const resumoDeputado: ReturnType<typeof criarDados>["resumoDeputado"] = (s, a) => reais().resumoDeputado(s, a);
export const obterMetadados: ReturnType<typeof criarDados>["obterMetadados"] = () => reais().obterMetadados();
export const normalizarSelecao: ReturnType<typeof criarDados>["normalizarSelecao"] = (p) => reais().normalizarSelecao(p);