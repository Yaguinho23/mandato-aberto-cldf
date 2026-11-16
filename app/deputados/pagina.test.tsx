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
let comissoesDoDeputado: unknown[] = [];
let frentesDoDeputado: unknown[] = [];
let porTema: { tema: string; quantidade: number }[] = [];

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/lib/dados", () => ({
  listarDeputados: () => [fulano],
  obterDeputado: (s: string) => (s === "fulano" ? fulano : undefined),
  proposicoesDe: () => [],
  comissoesDe: () => comissoesDoDeputado,
  frentesDe: () => frentesDoDeputado,
  anosComVerba: () => [],
  resumoDeputado: () => ({ proposicoes: porTema.length > 0 ? 8 : 0, porTipo, verba, porTema, semTema: 0 }),
  obterMetadados: () => meta,
}));
import Pagina, { generateStaticParams } from "./[slug]/page";

const abrir = async (slug: string) => render(await Pagina({ params: Promise.resolve({ slug }) } as never));

describe("página do deputado", () => {
  beforeEach(() => {
    verba = null;
    porTema = [];
    comissoesDoDeputado = [];
    frentesDoDeputado = [];
  });

  it("mostra as comissões e frentes do deputado, com o papel e link para a página geral", async () => {
    comissoesDoDeputado = [{ comissao: { id: "ccj", sigla: "CCJ", nome: "Comissão de Constituição e Justiça" }, papel: "Presidente", suplente: false }];
    frentesDoDeputado = [{ frente: { id: "02-2023", nome: "Frente Parlamentar de Turismo" }, papel: "Autor" }];
    await abrir("fulano");
    expect(screen.getByRole("heading", { name: "Comissões e frentes parlamentares" })).toBeInTheDocument();
    const ccj = screen.getByRole("link", { name: /Comissão de Constituição e Justiça/ });
    expect(ccj).toHaveAttribute("href", "/comissoes-e-frentes#ccj");
    expect(ccj.closest("li")).toHaveTextContent("Presidente");
    const frente = screen.getByRole("link", { name: /Frente Parlamentar de Turismo/ });
    expect(frente).toHaveAttribute("href", "/comissoes-e-frentes#frente-02-2023");
    expect(frente.closest("li")).toHaveTextContent("Autor");
  });

  it("sem comissões nem frentes, diz que não há registro", async () => {
    await abrir("fulano");
    expect(screen.getByText("Nenhuma comissão na composição atual.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma frente parlamentar registrada.")).toBeInTheDocument();
  });

  it("mostra a recorrência de temas das proposições, com link para a lista filtrada", async () => {
    porTema = [{ tema: "saude", quantidade: 6 }, { tema: "mobilidade", quantidade: 2 }];
    await abrir("fulano");
    const saude = screen.getByRole("link", { name: /Saúde/ });
    expect(saude).toHaveTextContent("6 proposições");
    expect(saude.getAttribute("href")).toBe("/proposicoes?autor=fulano&ano=2026&tema=saude");
    expect(screen.getByRole("link", { name: /Mobilidade e trânsito/ })).toHaveTextContent("2 proposições");
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

  it("os títulos seguem a ordem sem pular nível (acessibilidade)", async () => {
    verba = { totalCentavos: 100, porMes: [{ mes: 2, centavos: 100 }], semMes: { lancamentos: 0, centavos: 0 }, porCategoria: [{ categoria: "Locação", centavos: 100 }] };
    porTema = [{ tema: "saude", quantidade: 2 }];
    comissoesDoDeputado = [{ comissao: { id: "ccj", sigla: "CCJ", nome: "Comissão X" }, papel: "Membro", suplente: false }];
    const { container } = await abrir("fulano");
    const niveis = [...container.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1]));
    expect(niveis[0]).toBe(1);
    niveis.forEach((n, i) => { if (i > 0) expect(n).toBeLessThanOrEqual(niveis[i - 1] + 1); });
  });

  it("slug inexistente chama notFound()", async () => {
    await expect(abrir("ninguem")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateStaticParams devolve um slug por deputado", () => {
    expect(generateStaticParams()).toEqual([{ slug: "fulano" }]);
  });
});