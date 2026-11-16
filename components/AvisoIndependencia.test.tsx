// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AvisoIndependencia } from "./AvisoIndependencia";

describe("AvisoIndependencia", () => {
  it("mostra o texto exato exigido", () => {
    render(<AvisoIndependencia />);
    expect(screen.getByText("Iniciativa independente. Não é um site oficial da CLDF.")).toBeInTheDocument();
  });
});