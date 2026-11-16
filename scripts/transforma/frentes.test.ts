import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { carregarDeputados } from "../coleta/deputados";
import { transformarFrentes } from "./frentes";

const html = readFileSync("scripts/__fixtures__/frentes-amostra.html", "utf8");
const deputados = await carregarDeputados();
const URL = "https://www.cl.df.gov.br/frentes-parlamentares";

describe("transformarFrentes", () => {
  const frentes = transformarFrentes(html, deputados, URL);

  it("lê uma frente por linha da tabela", () => {
    expect(frentes).toHaveLength(4);
    expect(frentes[0]).toMatchObject({
      id: "02-2023",
      requerimento: "02/2023",
      nome: "Frente Parlamentar de Tecnologia da Informação no DF",
      autorSlug: "roosevelt-vilela",
      urlRequerimento: "https://ple.cl.df.gov.br/#/proposicao/9996/consultar?buscar=true",
      fonteUrl: URL,
      legislatura: "2023-2026",
    });
  });
  it("reconhece signatários, inclusive por grafias conhecidas", () => {
    expect(frentes[0].signatarios).toContain("hermeto"); // "João Hermeto"
    expect(frentes[0].signatarios).toContain("paula-belmonte"); // "Paulo Belmonte" na fonte
    expect(frentes[0].signatarios).toHaveLength(9);
    expect(frentes[0].naoReconhecidos).toEqual([]);
  });
  it("não repete o autor entre os signatários", () => {
    for (const f of frentes) if (f.autorSlug) expect(f.signatarios).not.toContain(f.autorSlug);
  });
  it("guarda o texto de quem não foi reconhecido, sem adivinhar", () => {
    const alterado = html.replace("Iolando<br />", "Fulano de Tal<br />");
    const f = transformarFrentes(alterado, deputados, URL)[0];
    expect(f.naoReconhecidos).toEqual(["Fulano de Tal"]);
    expect(f.signatarios).not.toContain("iolando");
  });
  it("tabela ausente dá erro claro", () => {
    expect(() => transformarFrentes("<html></html>", deputados, URL)).toThrow(/tabela/i);
  });
});