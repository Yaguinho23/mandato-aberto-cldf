import { describe, expect, it } from "vitest";
import { explicarTipo, GLOSSARIO, paginar } from "./glossario";
import { TIPOS_PROPOSICAO } from "./types";

describe("glossário", () => {
  it("explicarTipo cobre todos os valores de TipoProposicao", () => {
    for (const t of TIPOS_PROPOSICAO) expect(explicarTipo(t).length).toBeGreaterThan(10);
  });
  it("usa os textos exatos do plano", () => {
    expect(explicarTipo("PL")).toBe("Projeto de Lei: proposta de nova lei ou de mudança em uma lei do DF.");
    expect(GLOSSARIO["ementa"].explicacao).toBe("Resumo oficial, de uma frase, do que a proposição trata.");
    expect(GLOSSARIO["verba-indenizatoria"].explicacao).toMatch(/^Dinheiro que a Câmara devolve ao deputado/);
  });
});

describe("verbetes de comissões e frentes", () => {
  it("explicam o que são, em linguagem simples, com a regra do terço para as frentes", () => {
    expect(GLOSSARIO["comissao"].explicacao).toMatch(/parecer/);
    expect(GLOSSARIO["comissao"].explicacao).toMatch(/cinco deputados/);
    expect(GLOSSARIO["frente-parlamentar"].explicacao).toMatch(/um terço/);
    expect(GLOSSARIO["frente-parlamentar"].explicacao).toMatch(/não vota/i);
  });
});

describe("paginar", () => {
  const itens = Array.from({ length: 120 }, (_, i) => i);
  it("pagina de 50 em 50", () => {
    expect(paginar(itens, 1)).toMatchObject({ pagina: 1, totalPaginas: 3, itens: itens.slice(0, 50) });
    expect(paginar(itens, 3).itens).toEqual(itens.slice(100));
  });
  it("página inválida cai nos limites", () => {
    expect(paginar(itens, 99).pagina).toBe(3);
    expect(paginar(itens, 0).pagina).toBe(1);
    expect(paginar([], 1)).toMatchObject({ pagina: 1, totalPaginas: 1, itens: [] });
  });
});