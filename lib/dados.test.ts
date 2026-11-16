import { describe, expect, it } from "vitest";
import type { Deputado, DespesaVerba, Proposicao } from "./types";
import { criarDados } from "./dados";

const dep = (slug: string, nome: string): Deputado => ({ slug, nome, partido: "PX", fotoUrl: null, legislatura: "2023-2026", emExercicio: true, fonteUrl: "https://www.cl.df.gov.br/x" });
const prop = (id: string, tipo: Proposicao["tipo"], ano: number, autores: string[], data: string | null = null): Proposicao => ({
  id, tipo, numero: id, ano, ementa: "E" + id, situacao: null, dataApresentacao: data, autoresTexto: "x", autores, urlFonte: "https://ple.cl.df.gov.br/x", legislatura: "2023-2026",
});
const desp = (slug: string, ano: number, mes: number | null, categoria: string, centavos: number): DespesaVerba => ({
  deputadoSlug: slug, ano, mes, categoria, fornecedor: null, valorCentavos: centavos, fonteUrl: "https://dados.cl.df.gov.br/x", legislatura: "2023-2026",
});

const dados = criarDados({
  deputados: ["zeca", "fulano", "com-estorno", "sem-registros", "a", "b", "c", "d", "e"].map((s) => dep(s, s === "zeca" ? "Zeca" : s)),
  proposicoes: [
    prop("1", "PL", 2025, ["fulano"], "2025-03-01"),
    prop("2", "RQ", 2026, ["fulano", "zeca"], "2026-02-01"),
    prop("3", "PL", 2026, ["zeca"], "2026-05-01"),
    prop("4", "PL", 2026, [], "2026-06-01"),
  ],
  verba: [
    desp("fulano", 2026, 1, "Combustível", 1000),
    desp("fulano", 2026, 1, "Locação", 5000),
    desp("fulano", 2026, 3, "Combustível", 2500),
    desp("fulano", 2026, null, "Locação", 700),
    desp("fulano", 2025, 5, "Combustível", 300),
    desp("com-estorno", 2026, 2, "Combustível", 10000),
    desp("com-estorno", 2026, 2, "Combustível", -4000),
  ],
  metadados: { geradoEm: "2026-11-16T00:00:00.000Z", fontes: [] },
});

describe("camada de dados", () => {
  it("lista deputados em ordem alfabética", () => {
    expect(dados.listarDeputados().map((d) => d.slug).slice(0, 3)).toEqual(["a", "b", "c"]);
    expect(dados.listarDeputados().at(-1)!.slug).toBe("zeca");
    expect(dados.obterDeputado("fulano")?.nome).toBe("fulano");
    expect(dados.obterDeputado("nao-existe")).toBeUndefined();
  });

  it("resumoVerba é null sem registros, nunca zero", () => {
    expect(dados.resumoVerba("sem-registros", 2026)).toBeNull();
    expect(dados.resumoVerba("fulano", 2024)).toBeNull();
  });

  it("soma, agrupa por mês e categoria, e separa o que não tem mês", () => {
    const r = dados.resumoVerba("fulano", 2026)!;
    expect(r.totalCentavos).toBe(1000 + 5000 + 2500 + 700);
    expect(r.porMes).toEqual([{ mes: 1, centavos: 6000 }, { mes: 3, centavos: 2500 }]);
    expect(r.semMes).toEqual({ lancamentos: 1, centavos: 700 });
    expect(r.porCategoria).toEqual([{ categoria: "Locação", centavos: 5700 }, { categoria: "Combustível", centavos: 3500 }]);
  });

  it("estorno negativo entra na soma", () => {
    expect(dados.resumoVerba("com-estorno", 2026)!.totalCentavos).toBe(6000);
  });

  it("anosComVerba em ordem crescente", () => {
    expect(dados.anosComVerba("fulano")).toEqual([2025, 2026]);
    expect(dados.anosComVerba("sem-registros")).toEqual([]);
  });

  it("coautoria conta para ambos; mais recentes primeiro", () => {
    expect(dados.proposicoesDe("fulano").map((p) => p.id)).toEqual(["2", "1"]);
    expect(dados.proposicoesDe("zeca").map((p) => p.id)).toEqual(["3", "2"]);
  });

  it("listarProposicoes filtra por tipo, ano e autor", () => {
    expect(dados.listarProposicoes({ autor: "fulano", tipo: "PL" }).map((p) => p.id)).toEqual(["1"]);
    expect(dados.listarProposicoes({ ano: 2026 }).map((p) => p.id)).toEqual(["4", "3", "2"]);
    expect(dados.listarProposicoes().length).toBe(4);
  });

  it("listarProposicoes filtra por tema pela ementa", () => {
    const comTema = criarDados({
      deputados: [dep("a", "A")],
      proposicoes: [{ ...prop("1", "PL", 2026, ["a"], "2026-01-01"), ementa: "Amplia o transporte público" }, { ...prop("2", "PL", 2026, ["a"], "2026-01-02"), ementa: "Concede título honorário" }],
      verba: [],
      metadados: { geradoEm: "2026-11-16T00:00:00.000Z", fontes: [] },
    });
    expect(comTema.listarProposicoes({ tema: "mobilidade" }).map((p) => p.id)).toEqual(["1"]);
  });

  it("resumoDeputado conta proposições do ano por tipo", () => {
    const r = dados.resumoDeputado("fulano", 2026);
    expect(r.proposicoes).toBe(1);
    expect(r.porTipo.RQ).toBe(1);
    expect(r.porTipo.PL).toBe(0);
    expect(r.verba?.totalCentavos).toBe(9200);
    expect(dados.resumoDeputado("sem-registros", 2026).verba).toBeNull();
  });

  it("resumoDeputado conta os temas das proposições do ano, do mais ao menos frequente", () => {
    const d = criarDados({
      deputados: [dep("a", "A")],
      proposicoes: [
        { ...prop("1", "PL", 2026, ["a"], "2026-01-01"), ementa: "Amplia o transporte público e a segurança pública" },
        { ...prop("2", "PL", 2026, ["a"], "2026-01-02"), ementa: "Cria linha de ônibus noturna" },
        { ...prop("3", "PL", 2026, ["a"], "2026-01-03"), ementa: "Concede título honorário" },
        { ...prop("4", "PL", 2025, ["a"], "2025-01-03"), ementa: "Amplia vacinação" },
      ],
      verba: [],
      metadados: { geradoEm: "2026-11-16T00:00:00.000Z", fontes: [] },
    });
    const r = d.resumoDeputado("a", 2026);
    expect(r.porTema).toEqual([{ tema: "mobilidade", quantidade: 2 }, { tema: "seguranca", quantidade: 1 }]);
    expect(r.semTema).toBe(1);
  });

  it("normalizarSelecao: dedup, só existentes, máximo 4", () => {
    expect(dados.normalizarSelecao("a,inexistente,a,b,c,d,e")).toEqual(["a", "b", "c", "d"]);
    expect(dados.normalizarSelecao(["a,b", "c"])).toEqual(["a", "b", "c"]);
    expect(dados.normalizarSelecao(undefined)).toEqual([]);
  });

  it("obterMetadados devolve o que foi injetado", () => {
    expect(dados.obterMetadados().geradoEm).toBe("2026-11-16T00:00:00.000Z");
  });
});