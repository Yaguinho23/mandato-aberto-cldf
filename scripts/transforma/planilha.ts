import { strFromU8, unzipSync } from "fflate";

/** Tabela como linhas de células em texto. A primeira linha é o cabeçalho. */
export type Tabela = string[][];

/** Lê CSV em texto. Detecta `;` ou `,` pelo cabeçalho; respeita aspas. */
export function lerCsv(texto: string): Tabela {
  const s = texto.replace(/^﻿/, "");
  const primeira = s.split(/\r?\n/, 1)[0] ?? "";
  const sep = primeira.split(";").length >= primeira.split(",").length ? ";" : ",";

  const tabela: Tabela = [];
  let linha: string[] = [];
  let campo = "";
  let entreAspas = false;
  const fecharLinha = () => {
    linha.push(campo);
    campo = "";
    if (linha.some((c) => c.trim() !== "")) tabela.push(linha);
    linha = [];
  };

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (entreAspas) {
      if (c === '"' && s[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') entreAspas = false;
      else campo += c;
    } else if (c === '"' && campo === "") entreAspas = true;
    else if (c === sep) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n") fecharLinha();
    else if (c !== "\r") campo += c;
  }
  if (campo !== "" || linha.length > 0) fecharLinha();
  return tabela;
}

function decodificarXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}

function textosDe(xml: string): string {
  let t = "";
  for (const m of xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)) t += decodificarXml(m[1]);
  return t;
}

function indiceDaColuna(ref: string): number {
  let n = 0;
  for (const letra of ref.replace(/\d+$/, "")) n = n * 26 + (letra.charCodeAt(0) - 64);
  return n - 1;
}

/** Lê a primeira aba de um XLSX. Números e datas vêm como o Excel os guarda (texto do número). */
function lerXlsx(bytes: Uint8Array): Tabela {
  const arquivos = unzipSync(bytes);
  const nomeDaAba = Object.keys(arquivos)
    .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort((a, b) => Number(/\d+/.exec(a)![0]) - Number(/\d+/.exec(b)![0]))[0];
  if (!nomeDaAba) throw new Error("XLSX sem planilha");

  const compartilhados: string[] = [];
  const sst = arquivos["xl/sharedStrings.xml"];
  if (sst) {
    for (const m of strFromU8(sst).matchAll(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g)) {
      compartilhados.push(textosDe((m[1] ?? "").replace(/<rPh\b[\s\S]*?<\/rPh>/g, "")));
    }
  }

  const tabela: Tabela = [];
  for (const linha of strFromU8(arquivos[nomeDaAba]).matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const celulas: string[] = [];
    for (const c of (linha[1] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = /\br="([A-Z]+\d+)"/.exec(c[1])?.[1];
      const tipo = /\bt="([^"]+)"/.exec(c[1])?.[1];
      const corpo = c[2] ?? "";
      const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(corpo)?.[1];
      let valor = "";
      if (tipo === "s" && v !== undefined) valor = compartilhados[Number(v)] ?? "";
      else if (tipo === "inlineStr") valor = textosDe(corpo);
      else if (v !== undefined) {
        valor = decodificarXml(v);
        // O Excel grava números como double ("293.79000000000002"). String(Number(x)) devolve
        // a forma mais curta do mesmo double ("293.79"): mesmo número, sem o ruído.
        if (tipo !== "str" && /^-?\d+(\.\d+)?(E[+-]?\d+)?$/i.test(valor)) valor = String(Number(valor));
      }
      const i = ref ? indiceDaColuna(ref) : celulas.length;
      while (celulas.length < i) celulas.push("");
      celulas[i] = valor;
    }
    if (celulas.some((x) => x.trim() !== "")) tabela.push(celulas);
  }
  return tabela;
}

/**
 * Lê um arquivo baixado do portal de dados abertos. O formato é decidido pelos primeiros
 * bytes ("PK" = XLSX), porque o rótulo do catálogo nem sempre está certo.
 */
export function lerPlanilha(bytes: Uint8Array): Tabela {
  const ehZip = bytes.length > 3 && bytes[0] === 0x50 && bytes[1] === 0x4b;
  return ehZip ? lerXlsx(bytes) : lerCsv(new TextDecoder("utf-8").decode(bytes));
}
