// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ResumoVerba } from "@/lib/dados";
import { TabelaComparacao, type Coluna } from "./TabelaComparacao";

const porTipo = { PL: 0, PLC: 0, PDL: 0, PR: 0, IND: 0, MO: 0, RQ: 0, OUTRO: 0 };
const verba = (total: number, categorias: [string, number][]): ResumoVerba => ({
  totalCentavos: total, porMes: [], semMes: { lancamentos: 0, centavos: 0 }, porCategoria: categorias.map(([categoria, centavos]) => ({ categoria, centavos })),
});
const col = (slug: string, nome: string, proposicoes: number, v: ResumoVerba | null): Coluna => ({ deputado: { slug, nome }, resumo: { proposicoes, porTipo: { ...porTipo, PL: proposicoes }, verba: v } });

const colunas = [
  col("zeca", "Zeca", 1, verba(1000, [["Locação", 1000]])),
  col("ana", "Ana", 90, verba(900000, [["Combustível", 900000]])),
  col("beto", "Beto", 5, null),
];

describe("TabelaComparacao", () => {
  it("mantém as colunas na ordem escolhida, sem reordenar por valor", () => {
    render(<TabelaComparacao colunas={colunas} ano={2026} />);
    const cabecalhos = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(cabecalhos.slice(-3)).toEqual(["Zeca", "Ana", "Beto"]);
  });

  it("não destaca maior nem menor valor", () => {
    const { container } = render(<TabelaComparacao colunas={colunas} ano={2026} />);
    expect(container.querySelector("[data-destaque]")).toBeNull();
    expect(container.innerHTML).not.toMatch(/maior|menor|melhor|pior/i);
  });

  it("deputado sem verba mostra o aviso na célula", () => {
    render(<TabelaComparacao colunas={colunas} ano={2026} />);
    const linha = screen.getByRole("row", { name: /Verba indenizatória/ });
    expect(within(linha).getAllByRole("cell")[2]).toHaveTextContent("Nenhum registro publicado no período");
    expect(screen.queryByText(/R\$\s*0,00/)).not.toBeInTheDocument();
  });

  it("com menos de dois deputados pede a escolha", () => {
    render(<TabelaComparacao colunas={colunas.slice(0, 1)} ano={2026} />);
    expect(screen.getByText("Escolha pelo menos dois deputados")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});