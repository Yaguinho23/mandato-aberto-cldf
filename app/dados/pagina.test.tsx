// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Metadados } from "@/lib/types";

let meta: Metadados;
vi.mock("@/lib/dados", () => ({
  obterMetadados: () => meta,
  listarProposicoes: () => [{ autores: ["a"] }, { autores: [] }, { autores: ["a"] }, { autores: ["a"] }],
}));
import PaginaDados from "./page";

const fonte = (id: "deputados" | "proposicoes" | "verba", registros: number, ok = true) => ({
  id, nome: "Fonte " + id, url: "https://x.gov.br/" + id, coletadoEm: "2026-11-15T09:00:00.000Z", registros, ok,
});

describe("/dados", () => {
  beforeEach(() => {
    meta = { geradoEm: "2026-11-16T00:00:00.000Z", fontes: [fonte("deputados", 24), fonte("proposicoes", 19910), fonte("verba", 3139)] };
  });

  it("lista as três fontes com link, data e número de registros", () => {
    render(<PaginaDados />);
    const tabela = screen.getByRole("table");
    for (const id of ["deputados", "proposicoes", "verba"]) {
      expect(within(tabela).getByRole("link", { name: "Fonte " + id })).toHaveAttribute("href", "https://x.gov.br/" + id);
    }
    expect(within(tabela).getAllByText("15/11/2026").length).toBe(3);
    expect(within(tabela).getByText("19.910")).toBeInTheDocument();
  });

  it("marca a fonte cuja atualização falhou", () => {
    meta = { ...meta, fontes: [fonte("deputados", 24), fonte("proposicoes", 19910, false), fonte("verba", 3139)] };
    render(<PaginaDados />);
    expect(screen.getByText("Última atualização falhou")).toBeInTheDocument();
  });

  it("cita presença, votações nominais e emendas como lacunas", () => {
    render(<PaginaDados />);
    expect(screen.getByRole("heading", { name: "O que ainda falta e por quê" })).toBeInTheDocument();
    expect(screen.getByText(/Presença em sessões/)).toBeInTheDocument();
    expect(screen.getByText(/Votações nominais/)).toBeInTheDocument();
    expect(screen.getByText(/Emendas/)).toBeInTheDocument();
  });

  it("informa a proporção de proposições sem autor reconhecido", () => {
    render(<PaginaDados />);
    expect(screen.getByText(/1 de 4 proposições \(25,0%\)/)).toBeInTheDocument();
  });
});