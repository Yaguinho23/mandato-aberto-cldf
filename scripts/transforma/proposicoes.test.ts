import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ProposicaoSchema } from "../../lib/schemas";
import type { DeputadoComAliases } from "../../lib/types";
import { carregarDeputados } from "../coleta/deputados";
import { identificarAutores, transformarProposicoes } from "./proposicoes";

const fixture: Record<string, unknown>[] = JSON.parse(
  readFileSync(new URL("../__fixtures__/ple-proposicoes.json", import.meta.url), "utf8"),
);

function dep(nome: string, slug: string, aliases: string[] = []): DeputadoComAliases {
  return { slug, nome, partido: null, fotoUrl: null, legislatura: "2023-2026", emExercicio: true, fonteUrl: "https://www.cl.df.gov.br/x", aliases };
}
const deps = [
  dep("Fulano de Tal", "fulano-de-tal", ["Fulano Completo de Tal"]),
  dep("Beltrana Souza", "beltrana-souza"),
  dep("José", "jose"),
];

describe("identificarAutores", () => {
  it("casa pelo nome parlamentar, com ou sem prefixo", () => {
    expect(identificarAutores("Deputado Fulano de Tal", deps)).toEqual(["fulano-de-tal"]);
    expect(identificarAutores("Deputada Beltrana Souza ", deps)).toEqual(["beltrana-souza"]);
    expect(identificarAutores("FULANO DE TAL", deps)).toEqual(["fulano-de-tal"]);
  });

  it("casa por alias", () => {
    expect(identificarAutores("Fulano Completo de Tal", deps)).toEqual(["fulano-de-tal"]);
  });

  it("devolve coautores em ordem alfabética e sem repetição", () => {
    expect(identificarAutores("Fulano de Tal, Beltrana Souza", deps)).toEqual(["beltrana-souza", "fulano-de-tal"]);
    expect(identificarAutores("Deputado Fulano de Tal, Deputado Fulano de Tal", deps)).toEqual(["fulano-de-tal"]);
  });

  it("não atribui a ninguém quando o autor não é deputado", () => {
    expect(identificarAutores("Poder Executivo", deps)).toEqual([]);
    expect(identificarAutores("Mesa Diretora", deps)).toEqual([]);
    expect(identificarAutores("Comissão de Economia, Orçamento e Finanças", deps)).toEqual([]);
    expect(identificarAutores("", deps)).toEqual([]);
  });

  it("não atribui por aproximação", () => {
    expect(identificarAutores("Fulano de Tao", deps)).toEqual([]); // grafia diferente
    expect(identificarAutores("Fulano", deps)).toEqual([]); // nome parcial
    expect(identificarAutores("Deputado José Maria", deps)).toEqual([]); // contém o nome de outro
    expect(identificarAutores("Fulano de Tal Júnior", deps)).toEqual([]);
  });

  it("reconhece os deputados entre coautores que não são deputados", () => {
    expect(identificarAutores("Mesa Diretora, Deputado Fulano de Tal", deps)).toEqual(["fulano-de-tal"]);
  });
});

describe("transformarProposicoes (amostra real do PLe)", async () => {
  const reais = await carregarDeputados();
  const ps = transformarProposicoes(fixture, reais);

  it("não descarta nenhuma proposição", () => {
    expect(ps.length).toBe(fixture.length);
    expect(ps.length).toBeGreaterThan(40);
  });

  it("todo item passa no schema, com legislatura e URL https", () => {
    for (const p of ps) expect(ProposicaoSchema.safeParse(p).success, JSON.stringify(p)).toBe(true);
    expect(ps.every((p) => p.legislatura === "2023-2026")).toBe(true);
    expect(ps.every((p) => p.urlFonte === `https://ple.cl.df.gov.br/#/proposicao/${p.id}/consultar`)).toBe(true);
  });

  it("preserva o texto original de quem não é deputado", () => {
    const semAutor = ps.filter((p) => p.autores.length === 0);
    expect(semAutor.length).toBeGreaterThan(0);
    expect(semAutor.every((p) => p.autoresTexto.length > 0)).toBe(true);
    expect(semAutor.map((p) => p.autoresTexto)).toContain("Poder Executivo");
    expect(semAutor.map((p) => p.autoresTexto)).toContain("Mesa Diretora");
  });

  it("atribui coautoria a todos os deputados citados", () => {
    const bruto = fixture.find((f) => String(f.autoria).split(",").length >= 3 && String(f.autoria).startsWith("Deputad"))!;
    const p = ps.find((x) => x.id === String(bruto.id))!;
    expect(p.autores.length).toBeGreaterThanOrEqual(3);
    expect(p.autores).toEqual([...p.autores].sort());
  });

  it("extrai tipo, número e ano de siglaNumeroAno", () => {
    const bruto = fixture.find((f) => f.tipoProposicao === "Requerimento")!;
    const p = ps.find((x) => x.id === String(bruto.id))!;
    const m = /^REQ (\d+)\/(\d{4})$/.exec(String(bruto.siglaNumeroAno))!;
    expect(p.tipo).toBe("RQ");
    expect(p.numero).toBe(m[1]);
    expect(p.ano).toBe(Number(m[2]));
    expect(p.dataApresentacao).toBe(bruto.dataLeitura);
    expect(p.situacao).toBe(bruto.etapa);
    expect(p.ementa).toBe(String(bruto.ementa).trim());
  });

  it("mapeia cada nome de tipo para a sigla certa", () => {
    const esperado: Record<string, string> = {
      "Projeto de Lei": "PL",
      "Projeto de Lei Complementar": "PLC",
      "Projeto de Decreto Legislativo": "PDL",
      "Projeto de Resolução": "PR",
      "Indicação": "IND",
      "Moção": "MO",
      "Requerimento": "RQ",
      "Questão de Ordem": "OUTRO",
    };
    for (const f of fixture) {
      const p = ps.find((x) => x.id === String(f.id))!;
      expect(p.tipo, String(f.tipoProposicao)).toBe(esperado[String(f.tipoProposicao)]);
    }
  });

  it("tipo desconhecido vira OUTRO, não erro", () => {
    expect(transformarProposicoes([{ ...fixture[0], tipoProposicao: "XYZ" }], reais)[0].tipo).toBe("OUTRO");
  });

  it("não preenche resumoSimples na v1", () => {
    expect(ps.every((p) => p.resumoSimples === undefined)).toBe(true);
  });

  it("lança erro em registro sem id ou sem ano identificável", () => {
    expect(() => transformarProposicoes([{ ...fixture[0], id: null }], reais)).toThrow(/id/);
    expect(() => transformarProposicoes([{ ...fixture[0], siglaNumeroAno: "REQ 1387*", dataLeitura: null }], reais)).toThrow(/ano/);
  });

  it("usa o ano da consulta quando nem a sigla nem a data trazem ano", () => {
    const p = transformarProposicoes([{ ...fixture[0], siglaNumeroAno: "REQ 1387*", dataLeitura: null }], reais, 2024)[0];
    expect(p.ano).toBe(2024);
    expect(p.dataApresentacao).toBeNull();
  });

  it("usa o ano da data de leitura quando a sigla não traz ano", () => {
    const p = transformarProposicoes([{ ...fixture[0], siglaNumeroAno: "REQ 1387*", dataLeitura: "2023-03-11" }], reais)[0];
    expect(p.ano).toBe(2023);
    expect(p.numero).toBe("1387*");
  });
});
