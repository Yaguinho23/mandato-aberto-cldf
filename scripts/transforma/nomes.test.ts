import { describe, expect, it } from "vitest";
import { normalizarNome, slugificar } from "./nomes";

describe("slugificar", () => {
  it("tira acentos, apóstrofos e espaços", () => {
    expect(slugificar("José Antônio D'Ávila")).toBe("jose-antonio-davila");
    expect(slugificar("Rogério Morro da Cruz")).toBe("rogerio-morro-da-cruz");
    expect(slugificar("  Pepa ")).toBe("pepa");
  });
});

describe("normalizarNome", () => {
  it("põe em minúsculas, sem acento e com espaços colapsados", () => {
    expect(normalizarNome("Deputada  MARIA da Silva")).toBe("maria da silva");
    expect(normalizarNome("CHICO VIGILANTE")).toBe("chico vigilante");
    expect(normalizarNome("Martins Machado ")).toBe("martins machado");
  });

  it("remove os prefixos deputado, deputada e dep.", () => {
    expect(normalizarNome("Dep. João")).toBe("joao");
    expect(normalizarNome("Dep. PEPA")).toBe("pepa");
    expect(normalizarNome("Deputado Fábio Félix")).toBe("fabio felix");
  });

  it("não remove 'dep' que faz parte do nome", () => {
    expect(normalizarNome("Deputado Depaula")).toBe("depaula");
  });

  it("devolve vazio para texto só com prefixo ou espaços", () => {
    expect(normalizarNome("   ")).toBe("");
    expect(normalizarNome("Deputado")).toBe("");
  });
});
