import { describe, expect, it } from "vitest";
import { formatarBRL, formatarData, nomeMes, parseValorBR } from "./formato";

describe("parseValorBR", () => {
  it("lê valores no formato brasileiro", () => {
    expect(parseValorBR("1.234,56")).toBe(123456);
    expect(parseValorBR("R$ 1.234,56")).toBe(123456);
    expect(parseValorBR("0,10")).toBe(10);
    expect(parseValorBR("18.742,91")).toBe(1874291);
    expect(parseValorBR("R$ 5.600,00")).toBe(560000);
  });

  it("mantém o sinal de glosas e estornos", () => {
    expect(parseValorBR("-150,00")).toBe(-15000);
    expect(parseValorBR("-R$ 150,00")).toBe(-15000);
    expect(parseValorBR("R$ -150,00")).toBe(-15000);
  });

  it("devolve null para vazio ou texto que não é valor", () => {
    expect(parseValorBR("")).toBeNull();
    expect(parseValorBR("   ")).toBeNull();
    expect(parseValorBR("abc")).toBeNull();
    expect(parseValorBR("12,3,4")).toBeNull();
    expect(parseValorBR("1.2.3")).toBeNull();
  });

  it("lê os formatos reais dos arquivos da CLDF", () => {
    expect(parseValorBR("500.0")).toBe(50000); // 2023: ponto decimal
    expect(parseValorBR("183.59")).toBe(18359);
    expect(parseValorBR("173,07")).toBe(17307); // 2024
    expect(parseValorBR("649,0")).toBe(64900);
    expect(parseValorBR("4400")).toBe(440000); // 2025: número do Excel
    expect(parseValorBR("203.7")).toBe(20370);
    expect(parseValorBR("R$ 5,500,00")).toBe(550000); // 2026: vírgula como milhar
  });

  it("não perde centavos por arredondamento", () => {
    expect(parseValorBR("0,29")).toBe(29);
    expect(parseValorBR("1,15")).toBe(115);
    expect(parseValorBR("4.35")).toBe(435);
    expect(parseValorBR("1.005,00")).toBe(100500);
  });

  it("rejeita mais de duas casas decimais em vez de arredondar", () => {
    expect(parseValorBR("1,234")).toBeNull();
    expect(parseValorBR("10.5678")).toBeNull();
  });
});

describe("formatarBRL", () => {
  it("formata centavos como reais", () => {
    expect(formatarBRL(123456)).toBe("R$ 1.234,56");
    expect(formatarBRL(-15000)).toBe("-R$ 150,00");
    expect(formatarBRL(0)).toBe("R$ 0,00");
  });
});

describe("datas", () => {
  it("formata data ISO como dia/mês/ano", () => {
    expect(formatarData("2026-03-05")).toBe("05/03/2026");
    expect(formatarData("2026-11-16T09:17:00.000Z")).toBe("16/11/2026");
  });

  it("dá o nome do mês", () => {
    expect(nomeMes(3)).toBe("março");
    expect(nomeMes(1)).toBe("janeiro");
    expect(nomeMes(12)).toBe("dezembro");
  });
});
