// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Comissao, Frente, Metadados } from "@/lib/types";

const comissao: Comissao = {
  id: "ccj", sigla: "CCJ", nome: "Comissão de Constituição e Justiça", vigenteDesde: "2025-01-06", fonteUrl: "https://www.cl.df.gov.br/comissoes-permanentes", legislatura: "2023-2026",
  membros: [{ deputadoSlug: "zeca", papel: "Presidente", suplenteSlug: "ana" }, { deputadoSlug: "fulano", papel: "Membro", suplenteSlug: null }],
};
const frente: Frente = {
  id: "02-2023", requerimento: "02/2023", nome: "Frente Parlamentar de Turismo", autorSlug: "fulano", signatarios: ["zeca"], naoReconhecidos: ["Fulano Desconhecido"],
  urlRequerimento: "https://ple.cl.df.gov.br/#/proposicao/1/consultar", fonteUrl: "https://www.cl.df.gov.br/frentes-parlamentares", legislatura: "2023-2026",
};
const nomes: Record<string, string> = { zeca: "Zeca Silva", fulano: "Fulano de Tal", ana: "Ana Souza" };
const meta: Metadados = {
  geradoEm: "2026-11-16T00:00:00.000Z",
  fontes: (["comissoes", "frentes"] as const).map((id) => ({ id, nome: "Fonte " + id, url: "https://x.gov.br/" + id, coletadoEm: "2026-11-15T00:00:00.000Z", registros: 1, ok: true })),
};
vi.mock("@/lib/dados", () => ({
  listarComissoes: () => [comissao],
  listarFrentes: () => [frente],
  obterDeputado: (s: string) => (nomes[s] ? { slug: s, nome: nomes[s] } : undefined),
  obterMetadados: () => meta,
}));
import Pagina from "./page";

describe("/comissoes-e-frentes", () => {
  it("explica o que são comissões e frentes parlamentares", () => {
    render(<Pagina />);
    expect(screen.getByRole("heading", { name: "O que são as comissões" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "O que são as frentes parlamentares" })).toBeInTheDocument();
    expect(screen.getByText(/parecer/)).toBeInTheDocument();
  });

  it("mostra a comissão com presidente, membros e suplente, com links para os perfis", () => {
    render(<Pagina />);
    const bloco = screen.getByRole("article", { name: /Comissão de Constituição e Justiça/ });
    expect(within(bloco).getByText(/Presidente/)).toBeInTheDocument();
    expect(within(bloco).getByRole("link", { name: "Zeca Silva" })).toHaveAttribute("href", "/deputados/zeca");
    expect(within(bloco).getByRole("link", { name: "Fulano de Tal" })).toHaveAttribute("href", "/deputados/fulano");
    expect(within(bloco).getByRole("link", { name: "Ana Souza" })).toHaveAttribute("href", "/deputados/ana");
  });

  it("mostra a frente com autor, signatários e o texto de quem não foi reconhecido", () => {
    render(<Pagina />);
    const bloco = screen.getByRole("group", { name: /Frente Parlamentar de Turismo/ });
    expect(within(bloco).getByRole("link", { name: "Fulano de Tal" })).toBeInTheDocument();
    expect(within(bloco).getByRole("link", { name: "Zeca Silva" })).toBeInTheDocument();
    expect(within(bloco).getByText(/Fulano Desconhecido/)).toBeInTheDocument();
    expect(within(bloco).getByRole("link", { name: /requerimento 02\/2023/i })).toBeInTheDocument();
  });

  it("não traz ranking nem destaque", () => {
    const { container } = render(<Pagina />);
    expect(container.innerHTML).not.toMatch(/ranking|\bmelhor\b|\bpior\b|mais atuante/i);
  });
});