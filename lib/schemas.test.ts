import { describe, expect, it } from "vitest";
import { DeputadoSchema, DespesaVerbaSchema, MetadadosSchema, ProposicaoSchema } from "./schemas";

const despesa = {
  deputadoSlug: "fulano-de-tal",
  ano: 2026,
  mes: 3,
  categoria: "Combustível",
  fornecedor: "Posto X",
  valorCentavos: 12345,
  fonteUrl: "https://dados.cl.df.gov.br/x.csv",
  legislatura: "2023-2026",
};

const proposicao = {
  id: "159566",
  tipo: "MO",
  numero: "2213",
  ano: 2026,
  ementa: "Concede Moção de Louvor.",
  situacao: "Apresentação",
  dataApresentacao: "2026-11-16",
  autoresTexto: "Poder Executivo",
  autores: [],
  urlFonte: "https://ple.cl.df.gov.br/#/proposicao/159566/consultar",
  legislatura: "2023-2026",
};

describe("DespesaVerbaSchema", () => {
  it("aceita uma despesa válida", () => {
    expect(DespesaVerbaSchema.safeParse(despesa).success).toBe(true);
  });
  it("rejeita mês 13", () => {
    expect(DespesaVerbaSchema.safeParse({ ...despesa, mes: 13 }).success).toBe(false);
  });
  it("rejeita centavos fracionados", () => {
    expect(DespesaVerbaSchema.safeParse({ ...despesa, valorCentavos: 10.5 }).success).toBe(false);
  });
  it("aceita valor negativo (glosa ou estorno)", () => {
    expect(DespesaVerbaSchema.safeParse({ ...despesa, valorCentavos: -15000 }).success).toBe(true);
  });
  it("aceita mês nulo quando a data da fonte é ambígua", () => {
    expect(DespesaVerbaSchema.safeParse({ ...despesa, mes: null }).success).toBe(true);
  });
  it("exige legislatura", () => {
    const { legislatura: _omit, ...sem } = despesa;
    expect(DespesaVerbaSchema.safeParse(sem).success).toBe(false);
  });
});

describe("ProposicaoSchema", () => {
  it("aceita proposição sem autor reconhecido", () => {
    expect(ProposicaoSchema.safeParse(proposicao).success).toBe(true);
  });
  it("rejeita tipo fora da lista", () => {
    expect(ProposicaoSchema.safeParse({ ...proposicao, tipo: "XYZ" }).success).toBe(false);
  });
  it("rejeita data fora do formato AAAA-MM-DD", () => {
    expect(ProposicaoSchema.safeParse({ ...proposicao, dataApresentacao: "16/11/2026" }).success).toBe(false);
  });
});

describe("DeputadoSchema", () => {
  it("aceita deputado sem partido e sem foto", () => {
    const d = { slug: "fulano-de-tal", nome: "Fulano de Tal", partido: null, fotoUrl: null, legislatura: "2023-2026", emExercicio: true, fonteUrl: "https://www.cl.df.gov.br/deputados-2023-2026" };
    expect(DeputadoSchema.safeParse(d).success).toBe(true);
  });
  it("rejeita slug com maiúscula ou espaço", () => {
    const d = { slug: "Fulano de Tal", nome: "Fulano de Tal", partido: null, fotoUrl: null, legislatura: "2023-2026", emExercicio: true, fonteUrl: "https://x.y" };
    expect(DeputadoSchema.safeParse(d).success).toBe(false);
  });
});

describe("MetadadosSchema", () => {
  it("aceita fonte com falha registrada", () => {
    const m = { geradoEm: "2026-11-16T09:17:00.000Z", fontes: [{ id: "verba", nome: "Verbas Indenizatórias", url: "https://dados.cl.df.gov.br/dataset/verbas-indenizatorias", coletadoEm: "2026-11-15T09:17:00.000Z", registros: 10, ok: false, erro: "fora do ar" }] };
    expect(MetadadosSchema.safeParse(m).success).toBe(true);
  });
});
