import { describe, expect, it, vi } from "vitest";
import type { DeputadoComAliases } from "../../lib/types";
import { coletarVerba } from "./verba";

const deps: DeputadoComAliases[] = [
  { slug: "fulano-de-tal", nome: "Fulano de Tal", partido: null, fotoUrl: null, legislatura: "2023-2026", emExercicio: true, fonteUrl: "https://www.cl.df.gov.br/x", aliases: [] },
];
const CAB = "NOME_PARLAMENTAR;CPF_PARLAMENTAR;NOME_PRESTADOR;CNPJ_PRESTADOR;CPF_PRESTADOR;NR_COMPROVANTE;DATA_COMPROVANTE;VALOR_DESPESA;CLASSIFICACAO;OBSERVACOES";
const arquivo = (valor: string, ano: number) => `${CAB}\nDeputado Fulano de Tal;;Posto;;;1;${ano}-03-10;${valor};Combustível;\n`;

function buscarFalso(recursos: { name: string; created: string; url: string }[], arquivos: Record<string, string>) {
  return vi.fn(async (url: string) => {
    if (url.includes("package_show")) return new Response(JSON.stringify({ success: true, result: { resources: recursos } }));
    if (url in arquivos) return new Response(arquivos[url]);
    throw new Error(`URL inesperada: ${url}`);
  });
}

describe("coletarVerba", () => {
  it("usa, para cada ano da legislatura, o arquivo criado por último", async () => {
    const buscar = buscarFalso(
      [
        { name: "Verbas Indenizatorias - 2022", created: "2024-08-14T12:24:15", url: "https://d.example/2022.csv" },
        { name: "Verbas Indenizatorias - 2023", created: "2024-08-14T12:24:11", url: "https://d.example/2023.csv" },
        { name: "Verbas Indenizatorias - 2024 (Até maio)", created: "2024-08-14T19:21:05", url: "https://d.example/2024-maio.csv" },
        { name: "Verbas Indenizatorias - 2024", created: "2025-01-22T17:56:30", url: "https://d.example/2024.csv" },
      ],
      {
        "https://d.example/2023.csv": arquivo("100.0", 2023),
        "https://d.example/2024.csv": arquivo("200,00", 2024),
      },
    );
    const { despesas, rejeitadas } = await coletarVerba(deps, { buscar });
    expect(rejeitadas).toEqual([]);
    expect(despesas.map((d) => [d.ano, d.mes, d.valorCentavos, d.fonteUrl])).toEqual([
      [2023, 3, 10000, "https://d.example/2023.csv"],
      [2024, 3, 20000, "https://d.example/2024.csv"],
    ]);
    const urls = buscar.mock.calls.map((c) => c[0]);
    expect(urls).not.toContain("https://d.example/2022.csv");
    expect(urls).not.toContain("https://d.example/2024-maio.csv");
  });

  it("lança erro quando o catálogo não tem nenhum arquivo da legislatura", async () => {
    const buscar = buscarFalso([{ name: "Verbas Indenizatorias - 2019", created: "2024-01-01", url: "https://d.example/2019.csv" }], {});
    await expect(coletarVerba(deps, { buscar })).rejects.toThrow(/nenhum arquivo/i);
  });

  it("lança erro quando um arquivo mudou de formato", async () => {
    const buscar = buscarFalso(
      [{ name: "Verbas Indenizatorias - 2023", created: "2024-08-14", url: "https://d.example/2023.csv" }],
      { "https://d.example/2023.csv": "<html>manutenção</html>" },
    );
    await expect(coletarVerba(deps, { buscar })).rejects.toThrow(/coluna/i);
  });

  it("informa em que arquivo cada linha foi rejeitada", async () => {
    const buscar = buscarFalso(
      [{ name: "Verbas Indenizatorias - 2023", created: "2024-08-14", url: "https://d.example/2023.csv" }],
      { "https://d.example/2023.csv": `${CAB}\nNome Estranho;;Posto;;;1;2023-03-10;10.0;X;\n` },
    );
    const { rejeitadas } = await coletarVerba(deps, { buscar });
    expect(rejeitadas).toEqual([{ arquivo: "https://d.example/2023.csv", linha: 2, motivo: expect.stringMatching(/Nome Estranho/) }]);
  });
});
