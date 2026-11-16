import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { carregarDeputados, conferirComRelacaoNominal, validarDeputados } from "./deputados";

const relacao = readFileSync(new URL("../__fixtures__/relacao-nominal-amostra.csv", import.meta.url), "utf8");

describe("carregarDeputados", () => {
  it("devolve os 24 deputados com slugs únicos", async () => {
    const deps = await carregarDeputados();
    expect(deps).toHaveLength(24);
    expect(new Set(deps.map((d) => d.slug)).size).toBe(24);
  });

  it("devolve em ordem alfabética pelo nome", async () => {
    const deps = await carregarDeputados();
    const nomes = deps.map((d) => d.nome);
    expect(nomes).toEqual([...nomes].sort((a, b) => a.localeCompare(b, "pt-BR")));
  });

  it("todo deputado tem legislatura, fonte e lista de aliases", async () => {
    const deps = await carregarDeputados();
    for (const d of deps) {
      expect(d.legislatura).toBe("2023-2026");
      expect(d.fonteUrl).toMatch(/^https:\/\/www\.cl\.df\.gov\.br\//);
      expect(Array.isArray(d.aliases)).toBe(true);
    }
  });
});

describe("validarDeputados", () => {
  const base = { nome: "Fulano de Tal", partido: "PX", fotoUrl: null, legislatura: "2023-2026", emExercicio: true, fonteUrl: "https://www.cl.df.gov.br/x", aliases: [] };

  it("lança erro quando há slug repetido", () => {
    expect(() => validarDeputados([{ ...base, slug: "fulano" }, { ...base, slug: "fulano", nome: "Outro" }])).toThrow(/slug repetido.*fulano/i);
  });

  it("lança erro quando um item não passa no schema", () => {
    expect(() => validarDeputados([{ ...base, slug: "Fulano Inválido" }])).toThrow();
  });

  it("lança erro quando duas pessoas têm o mesmo nome ou alias", () => {
    expect(() =>
      validarDeputados([
        { ...base, slug: "fulano", aliases: ["Fulano Completo"] },
        { ...base, slug: "beltrano", nome: "Beltrano", aliases: ["FULANO COMPLETO"] },
      ]),
    ).toThrow(/fulano completo/i);
  });
});

describe("conferirComRelacaoNominal", () => {
  it("não gera aviso quando o seed bate com a relação oficial", async () => {
    const deps = await carregarDeputados();
    expect(conferirComRelacaoNominal(deps, relacao)).toEqual([]);
  });

  it("avisa quando a relação oficial lista um deputado ausente do seed", async () => {
    const deps = (await carregarDeputados()).filter((d) => d.slug !== "chico-vigilante");
    const avisos = conferirComRelacaoNominal(deps, relacao);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatch(/CHICO VIGILANTE/);
  });

  it("avisa quando o seed tem um deputado que não está na relação oficial", async () => {
    const deps = await carregarDeputados();
    const semChico = relacao.split("\n").filter((l) => !l.includes("CHICO VIGILANTE")).join("\n");
    const avisos = conferirComRelacaoNominal(deps, semChico);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatch(/Chico Vigilante/);
  });

  it("ignora as linhas de servidores", async () => {
    const deps = await carregarDeputados();
    expect(conferirComRelacaoNominal(deps, relacao).join(" ")).not.toMatch(/SERVIDOR EXEMPLO/);
  });
});
