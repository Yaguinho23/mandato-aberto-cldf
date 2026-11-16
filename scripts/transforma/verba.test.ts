import { readFileSync } from "node:fs";
import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { DespesaVerbaSchema } from "../../lib/schemas";
import type { DeputadoComAliases } from "../../lib/types";
import { carregarDeputados } from "../coleta/deputados";
import { lerCsv, lerPlanilha } from "./planilha";
import { transformarVerba } from "./verba";

const URL_FONTE = "https://dados.cl.df.gov.br/dataset/x/resource/y/download/verba.csv";
const ler = (nome: string) => readFileSync(new URL(`../__fixtures__/${nome}`, import.meta.url), "utf8");
// conta registros, não linhas de texto: o arquivo de 2024 tem campos entre aspas com quebra de linha
const linhasDeDados = (csv: string) => lerCsv(csv).length - 1;

function dep(nome: string, slug: string, aliases: string[] = []): DeputadoComAliases {
  return { slug, nome, partido: null, fotoUrl: null, legislatura: "2023-2026", emExercicio: true, fonteUrl: "https://www.cl.df.gov.br/x", aliases };
}
const deps = [dep("Fulano de Tal", "fulano-de-tal", ["Fulano Completo de Tal"]), dep("Beltrana Souza", "beltrana-souza")];

const CABECALHO = "NOME_PARLAMENTAR;CPF_PARLAMENTAR;NOME_PRESTADOR;CNPJ_PRESTADOR;CPF_PRESTADOR;NR_COMPROVANTE;DATA_COMPROVANTE;VALOR_DESPESA;CLASSIFICACAO;OBSERVACOES";
const linha = (c: { nome?: string; data?: string; valor?: string; cat?: string; prestador?: string }) =>
  `${c.nome ?? "Deputado Fulano de Tal"};111.222.333-44;${c.prestador ?? "Posto X"};12.345.678/0001-00;;55;${c.data ?? "28/01/2026 00:00"};${c.valor ?? "R$ 100,00"};${c.cat ?? "Combustível"};`;
const csv = (...linhas: string[]) => [CABECALHO, ...linhas].join("\n") + "\n";
const um = (c: Parameters<typeof linha>[0], ano = 2026) => transformarVerba(csv(linha(c)), deps, URL_FONTE, ano);

describe("transformarVerba: amostras reais", async () => {
  const reais = await carregarDeputados();

  it.each([
    ["verba-amostra.csv", 2026],
    ["verba-2023-amostra.csv", 2023],
    ["verba-2024-amostra.csv", 2024],
  ])("%s: nenhuma linha some sem registro", (arquivo, ano) => {
    const texto = ler(arquivo);
    const { despesas, rejeitadas } = transformarVerba(texto, reais, URL_FONTE, ano);
    expect(despesas.length + rejeitadas.length).toBe(linhasDeDados(texto));
    expect(despesas.length).toBeGreaterThan(50);
    for (const d of despesas) expect(DespesaVerbaSchema.safeParse(d).success, JSON.stringify(d)).toBe(true);
    expect(despesas.every((d) => Number.isInteger(d.valorCentavos))).toBe(true);
    expect(despesas.every((d) => d.mes === null || (d.mes >= 1 && d.mes <= 12))).toBe(true);
    expect(despesas.every((d) => d.ano === ano && d.legislatura === "2023-2026" && d.fonteUrl === URL_FONTE)).toBe(true);
  });

  it("2023 (datas ISO): tem mês todo lançamento com data de 2023", () => {
    const texto = ler("verba-2023-amostra.csv");
    const { despesas, rejeitadas } = transformarVerba(texto, reais, URL_FONTE, 2023);
    const foraDe2023 = lerCsv(texto).slice(1).filter((l) => !l[6].startsWith("2023-")).length;
    expect(rejeitadas).toEqual([]);
    expect(foraDe2023).toBeGreaterThan(0); // a amostra tem datas de 2022 e datas vazias
    expect(despesas.filter((d) => d.mes === null)).toHaveLength(foraDe2023);
    expect(despesas[0]).toMatchObject({ deputadoSlug: "joaquim-roriz-neto", mes: 5, valorCentavos: 50000, categoria: "Serviços Online" });
  });

  it("2024: registro com quebra de linha dentro de aspas é lido inteiro", () => {
    const { despesas } = transformarVerba(ler("verba-2024-amostra.csv"), reais, URL_FONTE, 2024);
    expect(despesas.some((d) => d.fornecedor === "Posto Ceilândia" && d.valorCentavos === 4000)).toBe(true);
    expect(despesas.some((d) => d.fornecedor === 'NeNe"s Posto')).toBe(true);
  });

  it.each(["verba-amostra.csv", "verba-2023-amostra.csv", "verba-2024-amostra.csv"])("%s: todo nome de deputado da amostra é reconhecido", (arquivo) => {
    const { rejeitadas } = transformarVerba(ler(arquivo), reais, URL_FONTE, 2026);
    expect(rejeitadas.filter((r) => /não reconhecido/i.test(r.motivo))).toEqual([]);
  });
  it("2026: lê o valor com vírgula de milhar (R$ 5,500,00)", () => {
    const { despesas } = transformarVerba(ler("verba-amostra.csv"), reais, URL_FONTE, 2026);
    expect(despesas.some((d) => d.valorCentavos === 550000)).toBe(true);
  });

  it("não carrega CPF para a saída", () => {
    const { despesas, rejeitadas } = transformarVerba(ler("verba-amostra.csv"), reais, URL_FONTE, 2026);
    expect(JSON.stringify([despesas, rejeitadas])).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
  });
});

describe("transformarVerba: valor", () => {
  it("linha com valor vazio é rejeitada, não vira zero", () => {
    const r = um({ valor: "" });
    expect(r.despesas).toEqual([]);
    expect(r.rejeitadas[0].motivo).toMatch(/valor/i);
    expect(r.rejeitadas[0].linha).toBe(2);
  });
  it("valor ilegível é rejeitado com o texto original no motivo", () => {
    expect(um({ valor: "cem reais" }).rejeitadas[0].motivo).toMatch(/cem reais/);
  });
  it("valor negativo (estorno) é mantido", () => {
    expect(um({ valor: "-R$ 150,00" }).despesas[0].valorCentavos).toBe(-15000);
  });
  it("valor zero publicado na fonte é mantido como zero", () => {
    expect(um({ valor: "R$ 0,00" }).despesas[0].valorCentavos).toBe(0);
  });
});

describe("transformarVerba: deputado", () => {
  it("linha de deputado não reconhecido é rejeitada com o nome no motivo", () => {
    const r = um({ nome: "Nome Estranho" });
    expect(r.despesas).toEqual([]);
    expect(r.rejeitadas[0].motivo).toMatch(/Nome Estranho/);
  });
  it("linha sem nome de deputado é rejeitada", () => {
    expect(um({ nome: "  " }).rejeitadas[0].motivo).toMatch(/sem nome de deputado/i);
  });
  it("não atribui por aproximação", () => {
    expect(um({ nome: "Fulano de Tao" }).despesas).toEqual([]);
    expect(um({ nome: "Fulano" }).despesas).toEqual([]);
  });
  it("reconhece prefixo, maiúsculas e alias", () => {
    expect(um({ nome: "FULANO DE TAL " }).despesas[0].deputadoSlug).toBe("fulano-de-tal");
    expect(um({ nome: "Dep. Fulano de Tal" }).despesas[0].deputadoSlug).toBe("fulano-de-tal");
    expect(um({ nome: "Fulano Completo de Tal" }).despesas[0].deputadoSlug).toBe("fulano-de-tal");
  });
});

describe("transformarVerba: mês só quando a data é inequívoca", () => {
  const mes = (data: string, ano = 2026) => um({ data }, ano).despesas[0].mes;
  it("data ISO", () => {
    expect(mes("2023-05-02 00:00:00", 2023)).toBe(5);
    expect(mes("2024-01-10", 2024)).toBe(1);
  });
  it("dia/mês com dia maior que 12", () => expect(mes("28/01/2026 00:00")).toBe(1));
  it("mês/dia com dia maior que 12", () => expect(mes("1/20/2026")).toBe(1));
  it("dia e mês iguais", () => expect(mes("02/02/2026 00:00")).toBe(2));
  it("os dois números até 12 e diferentes: sem mês", () => expect(mes("05/01/2026 00:00")).toBeNull());
  it("sem data: sem mês, mas o lançamento continua valendo", () => {
    const r = um({ data: "" });
    expect(r.despesas).toHaveLength(1);
    expect(r.despesas[0].mes).toBeNull();
    expect(r.despesas[0].ano).toBe(2026);
  });
  it("data de outro ano: sem mês, conta no ano do arquivo", () => {
    const r = um({ data: "28/12/2025 00:00" });
    expect(r.despesas[0]).toMatchObject({ ano: 2026, mes: null });
  });
  it("data impossível: sem mês", () => expect(mes("40/40/2026")).toBeNull());
});

describe("transformarVerba: categoria e fornecedor", () => {
  it("tira o numeral romano do início e os espaços sobrando", () => {
    expect(um({ cat: "VIII - Divulgação de atividade parlamentar" }).despesas[0].categoria).toBe("Divulgação de atividade parlamentar");
    expect(um({ cat: "I- Locação e Manutenção de Imóveis " }).despesas[0].categoria).toBe("Locação e Manutenção de Imóveis");
    expect(um({ cat: "INTERNET" }).despesas[0].categoria).toBe("INTERNET");
    expect(um({ cat: "Internet" }).despesas[0].categoria).toBe("Internet");
  });
  it("categoria vazia recebe rótulo explícito", () => {
    expect(um({ cat: "" }).despesas[0].categoria).toBe("Sem classificação na fonte");
  });
  it("fornecedor vazio vira null", () => {
    expect(um({ prestador: " " }).despesas[0].fornecedor).toBeNull();
    expect(um({ prestador: " Posto Y " }).despesas[0].fornecedor).toBe("Posto Y");
  });
});

describe("transformarVerba: formato", () => {
  it("lança erro quando falta a coluna de valor ou de nome", () => {
    expect(() => transformarVerba("A;B;C\n1;2;3\n", deps, URL_FONTE, 2026)).toThrow(/coluna/i);
  });
  it("lança erro em arquivo vazio", () => {
    expect(() => transformarVerba("", deps, URL_FONTE, 2026)).toThrow();
  });
  it("aceita o CSV de 2026, com BOM e coluna ID_REGISTRO na frente", () => {
    const texto = `﻿ID_REGISTRO;${CABECALHO}\n7;${linha({})}\n`;
    const r = transformarVerba(texto, deps, URL_FONTE, 2026);
    expect(r.despesas[0]).toMatchObject({ deputadoSlug: "fulano-de-tal", valorCentavos: 10000, fornecedor: "Posto X" });
  });
});

// ---------- XLSX ----------

type Celula = string | number;
const letra = (i: number) => String.fromCharCode(65 + i);
function xlsx(linhas: Celula[][]): Uint8Array {
  const strings: string[] = [];
  const sheet = linhas
    .map((cs, r) => {
      const cels = cs
        .map((c, i) => {
          const ref = `${letra(i)}${r + 1}`;
          if (c === "") return "";
          if (typeof c === "number") return `<c r="${ref}" s="1"><v>${c}</v></c>`;
          let idx = strings.indexOf(c);
          if (idx === -1) idx = strings.push(c) - 1;
          return `<c r="${ref}" t="s"><v>${idx}</v></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cels}</row>`;
    })
    .join("");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return zipSync({
    "[Content_Types].xml": strToU8("<Types/>"),
    "xl/workbook.xml": strToU8('<workbook><sheets><sheet name="Planilha1" sheetId="1"/></sheets></workbook>'),
    "xl/sharedStrings.xml": strToU8(`<sst>${strings.map((s) => `<si><t xml:space="preserve">${esc(s)}</t></si>`).join("")}</sst>`),
    "xl/worksheets/sheet1.xml": strToU8(`<worksheet><sheetData>${sheet}</sheetData></worksheet>`),
  });
}

const CAB_2025 = ["Nome do(a) Deputado(a)", "CPF do(a) Deputado(a)", "Nome do Estabelecimento", "CNPJ", "CPF", "N°  do Recibo ou Nota Fiscal", "Data do Recibo/NF", "Valor", "Classificação", "Observação"];

describe("lerPlanilha", () => {
  it("lê XLSX com textos compartilhados, números e células vazias no meio", () => {
    const t = lerPlanilha(xlsx([["A & B", "", "c"], ["x", 12.5, ""]]));
    expect(t[0]).toEqual(["A & B", "", "c"]);
    expect(t[1].slice(0, 2)).toEqual(["x", "12.5"]);
  });
  it("lê CSV em bytes, com BOM e ponto e vírgula", () => {
    const t = lerPlanilha(strToU8("﻿A;B\n1;2\n"));
    expect(t).toEqual([["A", "B"], ["1", "2"]]);
  });
  it("respeita aspas no CSV", () => {
    expect(lerPlanilha(strToU8('A;B\n"x; y";"diz ""oi"""\n'))[1]).toEqual(["x; y", 'diz "oi"']);
  });
  it("número do Excel com ruído de ponto flutuante volta ao valor exato", () => {
    const t = lerPlanilha(xlsx([["v"], ["x"]]).slice(0)); // garante que o leitor aceita cópia dos bytes
    expect(t[0]).toEqual(["v"]);
    const bruto = zipSync({
      "xl/worksheets/sheet1.xml": strToU8('<worksheet><sheetData><row r="1"><c r="A1"><v>293.79000000000002</v></c><c r="B1"><v>163.66999999999999</v></c><c r="C1"><v>7.7105026E7</v></c><c r="D1"><v>4400</v></c></row></sheetData></worksheet>'),
    });
    expect(lerPlanilha(bruto)[0]).toEqual(["293.79", "163.67", "77105026", "4400"]);
  });
});

describe("transformarVerba: linha deslocada uma coluna para a esquerda (2025)", () => {
  // No arquivo de 2025 um bloco inteiro veio sem a coluna "CPF": recibo, data, valor e
  // classificação estão uma coluna antes do lugar, e a observação caiu em "Classificação".
  const deslocada = ["Deputado Fulano de Tal", "111.222.333-44", "Senna Locadora", "42.902.121/0001-79", "Demonstrativo 08", 45688, 4500, "II - Locação de bens móveis", "Valor a ser ressarcido R$ 4.000,00", ""];
  const normal = ["Deputado Fulano de Tal", "111.222.333-44", "Posto", "", "", 7, 45688, 50, "Combustível", ""];

  it("lê valor e classificação da coluna certa", () => {
    const r = transformarVerba(lerPlanilha(xlsx([CAB_2025, deslocada, normal])), deps, URL_FONTE, 2025);
    expect(r.rejeitadas).toEqual([]);
    expect(r.despesas[0]).toMatchObject({ valorCentavos: 450000, categoria: "Locação de bens móveis", fornecedor: "Senna Locadora" });
    expect(r.despesas[1]).toMatchObject({ valorCentavos: 5000, categoria: "Combustível" });
  });

  it("não usa o valor citado na observação", () => {
    const r = transformarVerba(lerPlanilha(xlsx([CAB_2025, deslocada])), deps, URL_FONTE, 2025);
    expect(r.despesas[0].valorCentavos).toBe(450000);
  });

  it("continua rejeitando texto na coluna de valor quando a vizinha não é um valor", () => {
    const estranha = ["Deputado Fulano de Tal", "", "Posto", "", "", "abc", "1/16/2025", "a combinar", "Combustível", ""];
    const r = transformarVerba(lerPlanilha(xlsx([CAB_2025, estranha])), deps, URL_FONTE, 2025);
    expect(r.despesas).toEqual([]);
    expect(r.rejeitadas[0].motivo).toMatch(/a combinar/);
  });
});

describe("transformarVerba: XLSX", () => {
  it("2025: cabeçalho por extenso, valor numérico, data em texto mês/dia/ano", () => {
    const tabela = lerPlanilha(xlsx([CAB_2025, ["Fulano de Tal ", "111.222.333-44", "POSTO TOP", "37.189.518/0001-25", "", 19562, "1/16/2025", 219.95, "Combustível ", ""]]));
    const r = transformarVerba(tabela, deps, URL_FONTE, 2025);
    expect(r.rejeitadas).toEqual([]);
    expect(r.despesas[0]).toMatchObject({ deputadoSlug: "fulano-de-tal", ano: 2025, mes: 1, valorCentavos: 21995, categoria: "Combustível", fornecedor: "POSTO TOP" });
  });

  it("data do Excel misturada com datas em texto não é confiável: sem mês", () => {
    const tabela = lerPlanilha(xlsx([
      CAB_2025,
      ["Fulano de Tal", "", "P1", "", "", 1, "1/16/2025", 10, "X", ""],
      ["Fulano de Tal", "", "P2", "", "", 2, 45748, 20, "X", ""], // 01/04/2025 ou 04/01/2025?
      ["Fulano de Tal", "", "P3", "", "", 3, 45690, 30, "X", ""], // 02/02/2025: dia = mês
    ]));
    const r = transformarVerba(tabela, deps, URL_FONTE, 2025);
    expect(r.despesas.map((d) => d.mes)).toEqual([1, null, 2]);
    expect(r.despesas.map((d) => d.valorCentavos)).toEqual([1000, 2000, 3000]);
  });

  it("arquivo só com datas do Excel (2024): mês vem da data", () => {
    const tabela = lerPlanilha(xlsx([
      CABECALHO.split(";"),
      ["Deputado Fulano de Tal", "", "P1", "", "", 67791, 45301, 173.07, "Combustíveis e Lubrificantes", ""], // 10/01/2024
      ["Deputado Fulano de Tal", "", "P2", "", "", 195, 45323, 5500, "Locação de Veículos", ""], // 01/02/2024
    ]));
    const r = transformarVerba(tabela, deps, URL_FONTE, 2024);
    expect(r.despesas.map((d) => [d.mes, d.valorCentavos])).toEqual([[1, 17307], [2, 550000]]);
  });

  it("ignora linhas totalmente vazias no fim da planilha", () => {
    const tabela = lerPlanilha(xlsx([CAB_2025, ["Fulano de Tal", "", "P1", "", "", 1, "1/16/2025", 10, "X", ""], ["", "", "", "", "", "", "", "", "", ""]]));
    const r = transformarVerba(tabela, deps, URL_FONTE, 2025);
    expect(r.despesas).toHaveLength(1);
    expect(r.rejeitadas).toEqual([]);
  });
});
