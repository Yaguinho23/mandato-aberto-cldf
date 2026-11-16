import { describe, expect, it } from "vitest";
import { TEMAS, temasDe } from "./temas";

describe("temasDe", () => {
  it("reconhece mobilidade pela ementa, ignorando acentos e caixa", () => {
    expect(temasDe("Dispõe sobre o TRANSPORTE público coletivo e a circulação de ônibus.")).toContain("mobilidade");
  });
  it("uma proposição pode ter mais de um tema", () => {
    const t = temasDe("Institui campanha de vacinação nas escolas públicas do DF.");
    expect(t).toContain("saude");
    expect(t).toContain("educacao");
  });
  it("sem palavra reconhecida, nenhum tema", () => {
    expect(temasDe("Concede o título de cidadão honorário a Fulano.")).toEqual([]);
  });
  it("palavra curta só vale inteira: 'sustentável' não é saúde (SUS)", () => {
    expect(temasDe("Dispõe sobre o consumo sustentável de sacolas.")).not.toContain("saude");
    expect(temasDe("Garante atendimento no SUS a pacientes.")).toContain("saude");
  });
  it("cobre segurança pública", () => {
    expect(temasDe("Cria programa de combate à violência e reforço do policiamento.")).toContain("seguranca");
  });
  it("ids são únicos e todos têm nome", () => {
    expect(new Set(TEMAS.map((t) => t.id)).size).toBe(TEMAS.length);
    for (const t of TEMAS) expect(t.nome.length).toBeGreaterThan(2);
  });
});