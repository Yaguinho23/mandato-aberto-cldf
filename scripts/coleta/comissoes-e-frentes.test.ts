import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { coletarComissoes, URL_COMISSOES } from "./comissoes";
import { coletarFrentes, URL_FRENTES } from "./frentes";
import { carregarDeputados } from "./deputados";

const resposta = (arquivo: string) => async (url: string) => {
  expect(url).toBeTypeOf("string");
  return new Response(readFileSync(`scripts/__fixtures__/${arquivo}`, "utf8"), { status: 200 });
};
const deputados = await carregarDeputados();

describe("coletores de comissões e frentes", () => {
  it("coletarComissoes baixa a página pública das comissões permanentes", async () => {
    const urls: string[] = [];
    const comissoes = await coletarComissoes(deputados, { buscar: async (u) => (urls.push(u), resposta("comissoes-amostra.html")(u)) });
    expect(urls).toEqual([URL_COMISSOES]);
    expect(comissoes.map((c) => c.sigla).sort()).toEqual(["CCJ", "CFGTC"]);
    expect(comissoes[0].fonteUrl).toBe(URL_COMISSOES);
  });
  it("coletarFrentes baixa a página pública das frentes", async () => {
    const urls: string[] = [];
    const frentes = await coletarFrentes(deputados, { buscar: async (u) => (urls.push(u), resposta("frentes-amostra.html")(u)) });
    expect(urls).toEqual([URL_FRENTES]);
    expect(frentes).toHaveLength(4);
  });
});