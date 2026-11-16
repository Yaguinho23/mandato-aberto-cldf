/**
 * Converte um valor em texto para centavos inteiros, sem passar por ponto flutuante.
 *
 * Aceita os formatos que a CLDF publica: "1.234,56", "R$ 1.234,56", "-150,00",
 * "500.0" (ponto decimal), "4400" (sem centavos) e "R$ 5,500,00" (vírgula como milhar).
 * A regra: o último separador, seguido de 1 ou 2 dígitos, marca os centavos; antes dele
 * só são aceitos dígitos corridos ou grupos de 3 dígitos com um mesmo separador.
 *
 * Devolve null quando o texto está vazio ou não é um valor inequívoco. Nunca arredonda.
 */
export function parseValorBR(texto: string): number | null {
  let s = texto.replace(/\s/g, "");
  if (s === "") return null;

  let negativo = false;
  if (s.startsWith("-")) {
    negativo = true;
    s = s.slice(1);
  }
  if (/^R\$/i.test(s)) s = s.slice(2);
  if (s.startsWith("-")) {
    if (negativo) return null;
    negativo = true;
    s = s.slice(1);
  }
  if (!/^\d[\d.,]*$/.test(s)) return null;

  let inteiro = s;
  let centavos = "00";
  const ultimo = Math.max(s.lastIndexOf(","), s.lastIndexOf("."));
  if (ultimo !== -1) {
    const depois = s.slice(ultimo + 1);
    if (depois.length !== 1 && depois.length !== 2) return null;
    inteiro = s.slice(0, ultimo);
    centavos = depois.padEnd(2, "0");
  }

  const corrido = /^\d+$/.test(inteiro);
  const agrupado = /^\d{1,3}(\.\d{3})+$/.test(inteiro) || /^\d{1,3}(,\d{3})+$/.test(inteiro);
  if (!corrido && !agrupado) return null;

  const reais = Number(inteiro.replace(/[.,]/g, ""));
  const total = reais * 100 + Number(centavos);
  if (!Number.isSafeInteger(total)) return null;
  return negativo ? -total : total;
}

const formatoBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Centavos inteiros → "R$ 1.234,56". */
export function formatarBRL(centavos: number): string {
  return formatoBRL.format(centavos / 100).replace(/[  ]/g, " ");
}

const formatoDataBrasilia = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** "2026-03-05" → "05/03/2026". Data com hora é convertida para o horário de Brasília. */
export function formatarData(iso: string): string {
  const soData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (soData) return `${soData[3]}/${soData[2]}/${soData[1]}`;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return formatoDataBrasilia.format(data);
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function nomeMes(mes: number): string {
  return MESES[mes - 1] ?? "";
}
