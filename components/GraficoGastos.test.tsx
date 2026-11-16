// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GraficoGastos } from "./GraficoGastos";

describe("GraficoGastos", () => {
  const props = {
    totalCentavos: 9200,
    porMes: [{ mes: 1, centavos: 6000 }, { mes: 3, centavos: 2500 }],
    semMes: { lancamentos: 1, centavos: 700 },
    porCategoria: [{ categoria: "Locação", centavos: 5700 }, { categoria: "Combustível", centavos: 3500 }],
  };

  it("traz uma tabela com os mesmos valores do gráfico", () => {
    render(<GraficoGastos {...props} />);
    const tabela = screen.getByRole("table", { name: /por mês/i });
    expect(within(tabela).getByText("Janeiro")).toBeInTheDocument();
    expect(within(tabela).getByText(/R\$\s*60,00/)).toBeInTheDocument();
    expect(within(tabela).getByText(/R\$\s*25,00/)).toBeInTheDocument();
  });

  it("as barras mensais são proporcionais ao valor", () => {
    render(<GraficoGastos {...props} />);
    const [a, b] = screen.getAllByTestId("barra-mes").map((e) => parseFloat((e as HTMLElement).style.height));
    expect(a).toBeGreaterThan(b);
    expect(a / b).toBeCloseTo(6000 / 2500, 0);
  });

  it("lista categorias do maior para o menor valor", () => {
    render(<GraficoGastos {...props} />);
    const itens = screen.getAllByTestId("categoria").map((e) => e.textContent);
    expect(itens[0]).toMatch(/Locação/);
    expect(itens[1]).toMatch(/Combustível/);
  });

  it("explica os lançamentos sem mês definido", () => {
    render(<GraficoGastos {...props} />);
    expect(screen.getByText(/1 lançamento sem mês definido na fonte/)).toBeInTheDocument();
  });

  it("oculta o gráfico mensal quando a maior parte do valor não tem mês", () => {
    render(<GraficoGastos {...props} porMes={[{ mes: 1, centavos: 100 }]} semMes={{ lancamentos: 40, centavos: 9000 }} />);
    expect(screen.queryByRole("table", { name: /por mês/i })).not.toBeInTheDocument();
    expect(screen.getByText(/maior parte dos lançamentos não informa o mês/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("categoria").length).toBe(2);
  });
});