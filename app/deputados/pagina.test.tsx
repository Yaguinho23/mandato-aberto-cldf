// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Deputado, Metadados } from "@/lib/types";

const fulano: Deputado = { slug: "fulano", nome: "Fulano de Tal", partido: "PX", fotoUrl: "https://www.cl.df.gov.br/f.jpg", legislatura: "2023-2026", emExercicio: true, fonteUrl: "https://www.cl.df.gov.br/fulano" };
const meta: Metadados = {
  geradoEm: "2026-11-16T00:00:00.000Z",
  fontes: (["deputados", "proposicoes", "verba"] as const).map((id) => ({ id, nome: "Fonte " + id, url: "https://x.gov.br/" + id, coletadoEm: "2026-11-15T00:00:00.000Z", registros: 1, ok: true })),
};
const porTipo = { PL: 0, PLC: 0, PDL: 0, PR: 0, IND: 0, MO: 0, RQ: 0, OUTRO: 0 };
let verba: unknown;

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/lib/dados", () => ({
  listarDeputados: () => [fulano],
  obterDeputado: (s: string) => (s === "fulano" ? fulano : undefined),
  proposicoesDe: () => [],
  anosComVerba: () => [],
  resumoDeputado: () => ({ proposicoes: 0, porTipo, verba }),
  obterMetadados: () => meta,
}));
import Pagina, { generateStaticParams } from "./[slug]/page";

const abrir = async (slug: string) => render(await Pagina({ params: Promise.resolve({ slug }) } as never));

describe("página do deputado", () => {
  beforeEach(() => {
    verba = null;
  });

  it("sem registros de verba: mostra o aviso e nunca R$ 0,00", async () => {
    await abrir("fulano");
    expect(screen.getAllByText("Nenhum registro publicado no período").length).toBeGreaterThan(0);
    expect(screen.queryByText(/R\$\s*0,00/)).not.toBeInTheDocument();
  });

  it("com verba: mostra o total rotulado como comprovantes publicados", async () => {
    verba = { totalCentavos: 12345, porMes: [{ mes: 2, centavos: 12345 }], semMes: { lancamentos: 0, centavos: 0 }, porCategoria: [{ categoria: "Locação", centavos: 12345 }] };
    await abrir("fulano");
    expect(screen.getAllByText(/R\$\s*123,45/).length).toBeGreaterThan(0);
    expect(screen.getByText(/comprovantes publicados em dados abertos/i)).toBeInTheDocument();
  });

  it("presença aparece como lacuna com link para as sessões", async () => {
    await abrir("fulano");
    expect(screen.getByText(/Presença: publicada pela CLDF apenas em PDF/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sessões plenárias/i })).toHaveAttribute("href", "https://www.cl.df.gov.br/sessoes-plenarias");
  });

  it("foto com alt e link para reportar erro com o nome no assunto", async () => {
    await abrir("fulano");
    expect(screen.getByAltText("Foto de Fulano de Tal")).toBeInTheDocument();
    const href = screen.getByRole("link", { name: /Encontrou um erro\?/ }).getAttribute("href")!;
    expect(href).toMatch(/^mailto:contato@mandatoaberto\.org\?subject=/);
    expect(decodeURIComponent(href)).toContain("Fulano de Tal");
  });

  it("slug inexistente chama notFound()", async () => {
    await expect(abrir("ninguem")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateStaticParams devolve um slug por deputado", () => {
    expect(generateStaticParams()).toEqual([{ slug: "fulano" }]);
  });
});