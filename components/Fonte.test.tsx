// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Metadados } from "@/lib/types";

let meta: Metadados;
vi.mock("@/lib/dados", () => ({ obterMetadados: () => meta }));
import { Fonte } from "./Fonte";

const base: Metadados = {
  geradoEm: "2026-11-16T09:00:00.000Z",
  fontes: [{ id: "verba", nome: "Verbas indenizatórias (dados abertos da CLDF)", url: "https://dados.cl.df.gov.br/dataset/verbas-indenizatorias", coletadoEm: "2026-11-15T09:17:00.000Z", registros: 10, ok: true }],
};

describe("Fonte", () => {
  beforeEach(() => {
    meta = base;
  });

  it("mostra o link da fonte e a data da coleta", () => {
    render(<Fonte id="verba" />);
    const link = screen.getByRole("link", { name: /Verbas indenizatórias/ });
    expect(link).toHaveAttribute("href", "https://dados.cl.df.gov.br/dataset/verbas-indenizatorias");
    expect(screen.getByText(/Dados de 15\/11\/2026/)).toBeInTheDocument();
    expect(screen.queryByText(/falhou/)).not.toBeInTheDocument();
  });

  it("avisa quando a atualização mais recente falhou", () => {
    meta = { ...base, fontes: [{ ...base.fontes[0], ok: false, erro: "fora do ar" }] };
    render(<Fonte id="verba" />);
    expect(screen.getByText(/atualização mais recente falhou/)).toBeInTheDocument();
    expect(screen.getByText(/Dados de 15\/11\/2026/)).toBeInTheDocument();
  });
});