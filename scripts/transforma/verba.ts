import { parseValorBR } from "../../lib/formato";
import { LEGISLATURA_ATUAL } from "../../lib/types";
import type { DeputadoComAliases, DespesaVerba } from "../../lib/types";
import { normalizarNome } from "./nomes";
import { lerCsv, type Tabela } from "./planilha";

export interface LinhaRejeitada {
  linha: number; // número da linha no arquivo (o cabeçalho é a linha 1)
  motivo: string;
}

export const SEM_CLASSIFICACAO = "Sem classificação na fonte";

// Títulos de coluna vistos nos arquivos de 2023 a 2026 (docs/fontes.md), já normalizados.
const COLUNAS = {
  nome: ["nome_parlamentar", "nome do(a) deputado(a)"],
  fornecedor: ["nome_prestador", "nome do estabelecimento"],
  data: ["data_comprovante", "data do recibo/nf"],
  valor: ["valor_despesa", "valor"],
  categoria: ["classificacao"],
} as const;

function acharColunas(cabecalho: string[]) {
  const titulos = cabecalho.map((t) => normalizarNome(t));
  const achar = (nomes: readonly string[]) => titulos.findIndex((t) => nomes.includes(t));
  const col = {
    nome: achar(COLUNAS.nome),
    fornecedor: achar(COLUNAS.fornecedor),
    data: achar(COLUNAS.data),
    valor: achar(COLUNAS.valor),
    categoria: achar(COLUNAS.categoria),
  };
  const faltando = Object.entries(col).filter(([, i]) => i === -1).map(([k]) => k);
  if (faltando.length > 0) {
    throw new Error(`Verba: coluna não encontrada (${faltando.join(", ")}). Cabeçalho: ${cabecalho.join(" | ").slice(0, 200)}`);
  }
  return col;
}

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})/;
const DATA_BARRAS = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/;
const DATA_EXCEL = /^\d{5}(\.\d+)?$/;

/**
 * Mês do lançamento, só quando a data é inequívoca e do ano do arquivo.
 * Datas com barras em que os dois primeiros números são <= 12 e diferentes podem ser
 * dia/mês ou mês/dia (os arquivos misturam os dois), então ficam sem mês.
 */
function mesDaData(texto: string, ano: number, excelConfiavel: boolean): number | null {
  const s = texto.trim();
  let m: RegExpExecArray | null;

  if ((m = DATA_ISO.exec(s))) {
    const mes = Number(m[2]);
    return Number(m[1]) === ano && mes >= 1 && mes <= 12 ? mes : null;
  }

  if ((m = DATA_BARRAS.exec(s))) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (Number(m[3]) !== ano) return null;
    const diaMes = a >= 1 && a <= 31 && b >= 1 && b <= 12;
    const mesDia = a >= 1 && a <= 12 && b >= 1 && b <= 31;
    if (diaMes && mesDia) return a === b ? a : null;
    if (diaMes) return b;
    if (mesDia) return a;
    return null;
  }

  if (DATA_EXCEL.test(s)) {
    const data = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(s)) * 86_400_000);
    if (data.getUTCFullYear() !== ano) return null;
    const [dia, mes] = [data.getUTCDate(), data.getUTCMonth() + 1];
    return excelConfiavel || dia === mes ? mes : null;
  }

  return null;
}

function ehData(texto: string): boolean {
  return DATA_ISO.test(texto) || DATA_BARRAS.test(texto) || DATA_EXCEL.test(texto);
}

function limparCategoria(texto: string): string {
  const s = texto.replace(/\s+/g, " ").trim().replace(/^[IVX]+\s*-\s*/, "").trim();
  return s === "" ? SEM_CLASSIFICACAO : s;
}

/**
 * Planilha de verba indenizatória (um comprovante por linha) → despesas e linhas rejeitadas.
 * Toda linha de dados termina em uma das duas listas. Linha sem valor legível ou sem
 * deputado reconhecido (casamento exato) é rejeitada com o motivo; nunca vira zero.
 * `ano` é o ano do arquivo. CPF e CNPJ não são lidos.
 */
export function transformarVerba(
  entrada: string | Tabela,
  deputados: DeputadoComAliases[],
  fonteUrl: string,
  ano: number,
): { despesas: DespesaVerba[]; rejeitadas: LinhaRejeitada[] } {
  const tabela = typeof entrada === "string" ? lerCsv(entrada) : entrada;
  if (tabela.length === 0) throw new Error("Verba: arquivo vazio");
  const col = acharColunas(tabela[0]);

  const slugPorNome = new Map<string, string>();
  for (const d of deputados) {
    for (const nome of [d.nome, ...d.aliases]) slugPorNome.set(normalizarNome(nome), d.slug);
  }

  const dados = tabela.slice(1);
  // Datas do Excel só são confiáveis quando o arquivo não mistura datas em texto com barras:
  // a mistura é sinal de conversão automática com dia e mês trocados.
  const excelConfiavel = !dados.some((l) => DATA_BARRAS.test((l[col.data] ?? "").trim()));

  const despesas: DespesaVerba[] = [];
  const rejeitadas: LinhaRejeitada[] = [];

  dados.forEach((celulas, i) => {
    const linha = i + 2;
    const cel = (indice: number) => (celulas[indice] ?? "").trim();

    const nome = cel(col.nome);
    if (nome === "") return void rejeitadas.push({ linha, motivo: "Linha sem nome de deputado" });
    const slug = slugPorNome.get(normalizarNome(nome));
    if (!slug) return void rejeitadas.push({ linha, motivo: `Deputado não reconhecido: "${nome}"` });

    // Linha deslocada uma coluna para a esquerda (bloco do arquivo de 2025 sem a coluna "CPF"):
    // a coluna de valor traz o texto da classificação, e a vizinha da esquerda traz o valor
    // logo depois de uma data. Só então data, valor e classificação são lidos uma coluna antes.
    const noLugar = cel(col.valor);
    const deslocada =
      /[a-zà-ú]{3}/i.test(noLugar) &&
      parseValorBR(noLugar) === null &&
      parseValorBR(cel(col.valor - 1)) !== null &&
      ehData(cel(col.data - 1));
    const desvio = deslocada ? -1 : 0;

    const valorTexto = cel(col.valor + desvio);
    if (valorTexto === "") return void rejeitadas.push({ linha, motivo: "Linha sem valor" });
    const valorCentavos = parseValorBR(valorTexto);
    if (valorCentavos === null) return void rejeitadas.push({ linha, motivo: `Valor ilegível: "${valorTexto}"` });

    const fornecedor = cel(col.fornecedor).replace(/\s+/g, " ");
    despesas.push({
      deputadoSlug: slug,
      ano,
      mes: mesDaData(cel(col.data + desvio), ano, excelConfiavel),
      categoria: limparCategoria(cel(col.categoria + desvio)),
      fornecedor: fornecedor === "" ? null : fornecedor,
      valorCentavos,
      fonteUrl,
      legislatura: LEGISLATURA_ATUAL,
    });
  });

  return { despesas, rejeitadas };
}
