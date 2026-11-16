import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { carregarDeputados } from "../coleta/deputados";
import { lerLiteralJs, transformarComissoes } from "./comissoes";

const html = readFileSync("scripts/__fixtures__/comissoes-amostra.html", "utf8");
const deputados = await carregarDeputados();
const URL = "https://www.cl.df.gov.br/comissoes-permanentes";

describe("lerLiteralJs", () => {
  it("lê chaves sem aspas e escapes \\x sem executar código", () => {
    expect(lerLiteralJs('[{a:"x\\x3dy",b:[1,{c:"ç"}]}]')).toEqual([{ a: "x=y", b: [1, { c: "ç" }] }]);
  });
  it("não avalia expressões", () => {
    expect(() => lerLiteralJs("[alert(1)]")).toThrow();
  });
});

describe("transformarComissoes", () => {
  const comissoes = transformarComissoes(html, deputados, URL);

  it("fica só com composições vigentes (sem data de fim)", () => {
    expect(comissoes.map((c) => c.sigla).sort()).toEqual(["CCJ", "CFGTC"]);
  });
  it("mapeia nome, sigla, desde quando e fonte", () => {
    const ccj = comissoes.find((c) => c.sigla === "CCJ")!;
    expect(ccj).toMatchObject({ id: "ccj", nome: "Comissão de Constituição e Justiça", vigenteDesde: "2025-01-06", fonteUrl: URL, legislatura: "2023-2026" });
  });
  it("traz cinco membros com papel e suplente, por slug", () => {
    const ccj = comissoes.find((c) => c.sigla === "CCJ")!;
    expect(ccj.membros).toHaveLength(5);
    const presidente = ccj.membros.find((m) => m.papel === "Presidente")!;
    expect(presidente).toMatchObject({ deputadoSlug: "thiago-manzoni", suplenteSlug: "joaquim-roriz-neto" });
    expect(ccj.membros.filter((m) => m.papel === "Vice-Presidente")).toHaveLength(1);
  });
  it("sem nenhum membro reconhecido, falha em vez de gravar dado errado", () => {
    expect(() => transformarComissoes(html.replaceAll("Deputado ", "Fulano "), deputados, URL)).toThrow(/reconhec/i);
  });
  it("página sem a lista de composições dá erro claro", () => {
    expect(() => transformarComissoes("<html></html>", deputados, URL)).toThrow(/composi/i);
  });
});