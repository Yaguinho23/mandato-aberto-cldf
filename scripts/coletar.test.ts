import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DeputadoComAliases, DespesaVerba, Metadados, Proposicao } from "../lib/types";
import { executarColeta, type Coletores } from "./coletar";

const dep = (slug: string, nome: string): DeputadoComAliases => ({
  slug, nome, partido: "PX", fotoUrl: null, legislatura: "2023-2026", emExercicio: true, fonteUrl: "https://www.cl.df.gov.br/x", aliases: ["Nome Civil " + nome],
});
const prop = (id: number): Proposicao => ({
  id: String(id), tipo: "PL", numero: String(id), ano: 2026, ementa: "Ementa " + id, situacao: null, dataApresentacao: "2026-03-05",
  autoresTexto: "Deputado Fulano", autores: ["fulano"], urlFonte: `https://ple.cl.df.gov.br/#/proposicao/${id}/consultar`, legislatura: "2023-2026",
});
const desp = (centavos: number, mes: number | null = 3): DespesaVerba => ({
  deputadoSlug: "fulano", ano: 2026, mes, categoria: "Combustível", fornecedor: "Posto", valorCentavos: centavos, fonteUrl: "https://dados.cl.df.gov.br/x.csv", legislatura: "2023-2026",
});

const DEPS = [dep("zeca", "Zeca"), dep("fulano", "Fulano")];
function coletores(parcial: Partial<Coletores> = {}): Coletores {
  return {
    deputados: async () => DEPS,
    proposicoes: async () => [prop(3), prop(1), prop(2)],
    verba: async () => ({ despesas: [desp(200), desp(100)], rejeitadas: [{ arquivo: "https://dados.cl.df.gov.br/x.csv", linha: 9, motivo: "Linha sem valor" }] }),
    ...parcial,
  };
}

const DIA1 = new Date("2026-11-15T09:17:00.000Z");
const DIA2 = new Date("2026-11-16T09:17:00.000Z");

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "coleta-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const ler = (nome: string) => readFile(join(dir, nome), "utf8");
const lerJson = async <T>(nome: string) => JSON.parse(await ler(nome)) as T;
const fonte = (m: Metadados, id: string) => m.fontes.find((f) => f.id === id)!;

describe("executarColeta: tudo certo", () => {
  it("grava os 4 arquivos, todas as fontes ok e geradoEm = agora()", async () => {
    const meta = await executarColeta({ coletores: coletores(), dirSaida: dir, agora: () => DIA1 });
    expect((await readdir(dir)).sort()).toEqual(["deputados.json", "metadados.json", "proposicoes.json", "verba.json"]);
    expect(meta.geradoEm).toBe(DIA1.toISOString());
    expect(meta.fontes.map((f) => [f.id, f.ok, f.registros, f.coletadoEm])).toEqual([
      ["deputados", true, 2, DIA1.toISOString()],
      ["proposicoes", true, 3, DIA1.toISOString()],
      ["verba", true, 2, DIA1.toISOString()],
    ]);
    expect(await lerJson<Metadados>("metadados.json")).toEqual(meta);
    for (const f of meta.fontes) expect(f.url).toMatch(/^https:\/\//);
  });

  it("grava em ordem estável, um registro por linha", async () => {
    await executarColeta({ coletores: coletores(), dirSaida: dir, agora: () => DIA1 });
    const primeira = await ler("proposicoes.json");
    expect((await lerJson<Proposicao[]>("proposicoes.json")).map((p) => p.id)).toEqual(["1", "2", "3"]);
    expect((await lerJson<DespesaVerba[]>("verba.json")).map((d) => d.valorCentavos)).toEqual([100, 200]);
    expect((await lerJson<{ nome: string }[]>("deputados.json")).map((d) => d.nome)).toEqual(["Fulano", "Zeca"]);
    expect(primeira.split("\n").length).toBe(3 + 3); // "[", 3 registros, "]", linha final

    // mesma coleta em outra ordem → mesmo arquivo, byte a byte
    await executarColeta({ coletores: coletores({ proposicoes: async () => [prop(2), prop(3), prop(1)] }), dirSaida: dir, agora: () => DIA2 });
    expect(await ler("proposicoes.json")).toBe(primeira);
  });

  it("não publica os aliases (nomes civis) em deputados.json", async () => {
    await executarColeta({ coletores: coletores(), dirSaida: dir, agora: () => DIA1 });
    expect(await ler("deputados.json")).not.toMatch(/aliases|Nome Civil/);
  });

  it("registra quantas linhas de verba foram rejeitadas", async () => {
    const meta = await executarColeta({ coletores: coletores(), dirSaida: dir, agora: () => DIA1 });
    expect(fonte(meta, "verba").rejeitados).toBe(1);
  });
});

describe("executarColeta: falha em uma fonte", () => {
  async function comFalhaNaVerba(verba: Coletores["verba"]) {
    await executarColeta({ coletores: coletores(), dirSaida: dir, agora: () => DIA1 });
    const antes = await ler("verba.json");
    const meta = await executarColeta({
      coletores: coletores({ verba, proposicoes: async () => [prop(1), prop(2), prop(3), prop(4)] }),
      dirSaida: dir,
      agora: () => DIA2,
    });
    return { antes, meta };
  }

  it("coletor lança erro → arquivo antigo permanece byte a byte e a data antiga é mantida", async () => {
    const { antes, meta } = await comFalhaNaVerba(async () => {
      throw new Error("portal fora do ar");
    });
    expect(await ler("verba.json")).toBe(antes);
    expect(fonte(meta, "verba")).toMatchObject({ ok: false, erro: "portal fora do ar", coletadoEm: DIA1.toISOString(), registros: 2 });
  });

  it("as outras fontes são atualizadas normalmente na mesma execução", async () => {
    const { meta } = await comFalhaNaVerba(async () => {
      throw new Error("portal fora do ar");
    });
    expect(await lerJson<Proposicao[]>("proposicoes.json")).toHaveLength(4);
    expect(fonte(meta, "proposicoes")).toMatchObject({ ok: true, registros: 4, coletadoEm: DIA2.toISOString() });
    expect(meta.geradoEm).toBe(DIA2.toISOString());
  });

  it("coletor devolve lista vazia → falha, não grava lista vazia", async () => {
    const { antes, meta } = await comFalhaNaVerba(async () => ({ despesas: [], rejeitadas: [] }));
    expect(await ler("verba.json")).toBe(antes);
    expect(fonte(meta, "verba").ok).toBe(false);
    expect(fonte(meta, "verba").erro).toMatch(/vazi/i);
  });

  it("item que não passa no schema → falha", async () => {
    const { antes, meta } = await comFalhaNaVerba(async () => ({ despesas: [desp(100), desp(10.5)], rejeitadas: [] }));
    expect(await ler("verba.json")).toBe(antes);
    expect(fonte(meta, "verba").ok).toBe(false);
    expect(fonte(meta, "verba").erro).toMatch(/inválido/i);
  });

  it("queda de mais de 30% nos registros → falha", async () => {
    await executarColeta({ coletores: coletores({ proposicoes: async () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(prop) }), dirSaida: dir, agora: () => DIA1 });
    const antes = await ler("proposicoes.json");
    const meta = await executarColeta({ coletores: coletores({ proposicoes: async () => [1, 2, 3, 4, 5, 6].map(prop) }), dirSaida: dir, agora: () => DIA2 });
    expect(await ler("proposicoes.json")).toBe(antes);
    expect(fonte(meta, "proposicoes")).toMatchObject({ ok: false, registros: 10, coletadoEm: DIA1.toISOString() });
    expect(fonte(meta, "proposicoes").erro).toMatch(/queda/i);
  });

  it("queda de até 30% é aceita", async () => {
    await executarColeta({ coletores: coletores({ proposicoes: async () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(prop) }), dirSaida: dir, agora: () => DIA1 });
    const meta = await executarColeta({ coletores: coletores({ proposicoes: async () => [1, 2, 3, 4, 5, 6, 7].map(prop) }), dirSaida: dir, agora: () => DIA2 });
    expect(fonte(meta, "proposicoes")).toMatchObject({ ok: true, registros: 7 });
  });

  it("depois de uma falha, a comparação de queda continua usando a última coleta boa", async () => {
    await executarColeta({ coletores: coletores({ proposicoes: async () => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(prop) }), dirSaida: dir, agora: () => DIA1 });
    const falha = { proposicoes: async () => [1, 2].map(prop) };
    await executarColeta({ coletores: coletores(falha), dirSaida: dir, agora: () => DIA2 });
    const meta = await executarColeta({ coletores: coletores(falha), dirSaida: dir, agora: () => DIA2 });
    expect(fonte(meta, "proposicoes")).toMatchObject({ ok: false, registros: 10, coletadoEm: DIA1.toISOString() });
  });

  it("primeira execução com falha: não cria o arquivo e registra a falha", async () => {
    const meta = await executarColeta({
      coletores: coletores({ verba: async () => { throw new Error("fora do ar"); } }),
      dirSaida: dir,
      agora: () => DIA1,
    });
    expect((await readdir(dir)).sort()).toEqual(["deputados.json", "metadados.json", "proposicoes.json"]);
    expect(fonte(meta, "verba")).toMatchObject({ ok: false, registros: 0, erro: "fora do ar" });
  });

  it("não deixa arquivo temporário para trás", async () => {
    await comFalhaNaVerba(async () => ({ despesas: [desp(10.5)], rejeitadas: [] }));
    expect((await readdir(dir)).filter((n) => !n.endsWith(".json"))).toEqual([]);
  });

  it("falha na lista de deputados derruba as três fontes sem tocar nos arquivos", async () => {
    await executarColeta({ coletores: coletores(), dirSaida: dir, agora: () => DIA1 });
    const antes = await Promise.all(["deputados.json", "proposicoes.json", "verba.json"].map(ler));
    const meta = await executarColeta({ coletores: coletores({ deputados: async () => { throw new Error("seed inválido"); } }), dirSaida: dir, agora: () => DIA2 });
    expect(meta.fontes.every((f) => !f.ok)).toBe(true);
    expect(await Promise.all(["deputados.json", "proposicoes.json", "verba.json"].map(ler))).toEqual(antes);
  });
});
