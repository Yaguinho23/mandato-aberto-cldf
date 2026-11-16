// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FiltrosProposicoes } from "./FiltrosProposicoes";

const deputados = [{ slug: "fulano", nome: "Fulano" }, { slug: "zeca", nome: "Zeca" }];

describe("FiltrosProposicoes", () => {
  it("é um formulário GET com campos tipo, ano e autor", () => {
    const { container } = render(<FiltrosProposicoes deputados={deputados} anos={[2025, 2026]} atual={{}} />);
    const form = container.querySelector("form")!;
    expect(form.getAttribute("method")).toBe("get");
    expect(screen.getByLabelText("Tipo")).toHaveAttribute("name", "tipo");
    expect(screen.getByLabelText("Ano")).toHaveAttribute("name", "ano");
    expect(screen.getByLabelText("Autor")).toHaveAttribute("name", "autor");
  });
  it("mostra os filtros atuais selecionados", () => {
    render(<FiltrosProposicoes deputados={deputados} anos={[2025, 2026]} atual={{ tipo: "PL", ano: 2026, autor: "zeca" }} />);
    expect(screen.getByLabelText("Tipo")).toHaveValue("PL");
    expect(screen.getByLabelText("Ano")).toHaveValue("2026");
    expect(screen.getByLabelText("Autor")).toHaveValue("zeca");
  });
});