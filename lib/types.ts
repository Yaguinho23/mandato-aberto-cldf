export type Legislatura = "2023-2026";
export const LEGISLATURA_ATUAL: Legislatura = "2023-2026";

export const TIPOS_PROPOSICAO = ["PL", "PLC", "PDL", "PR", "IND", "MO", "RQ", "OUTRO"] as const;
export type TipoProposicao = (typeof TIPOS_PROPOSICAO)[number];

export interface Deputado {
  slug: string; // "fulano-de-tal"
  nome: string; // nome parlamentar
  partido: string | null;
  fotoUrl: string | null;
  legislatura: Legislatura;
  emExercicio: boolean;
  fonteUrl: string;
}

/** Deputado do arquivo curado, com as grafias que as fontes usam para ele. */
export interface DeputadoComAliases extends Deputado {
  aliases: string[];
}

export interface Proposicao {
  id: string; // id da fonte
  tipo: TipoProposicao;
  numero: string;
  ano: number;
  ementa: string;
  situacao: string | null;
  dataApresentacao: string | null; // "AAAA-MM-DD"
  autoresTexto: string; // texto original da fonte
  autores: string[]; // slugs de deputados reconhecidos; pode ser []
  urlFonte: string;
  legislatura: Legislatura;
  resumoSimples?: string; // reservado; não preencher na v1
}

export interface DespesaVerba {
  deputadoSlug: string;
  ano: number;
  /** 1–12, ou null quando a data na fonte está ausente ou é ambígua (ver docs/fontes.md). */
  mes: number | null;
  categoria: string;
  fornecedor: string | null;
  valorCentavos: number; // pode ser negativo (glosa/estorno)
  fonteUrl: string;
  legislatura: Legislatura;
}

export type PapelComissao = "Presidente" | "Vice-Presidente" | "Membro";

export interface MembroComissao {
  deputadoSlug: string;
  papel: PapelComissao;
  /** Suplente do membro, quando a fonte informa e o nome é reconhecido. */
  suplenteSlug: string | null;
}

export interface Comissao {
  id: string; // sigla em minúsculas
  sigla: string;
  nome: string;
  vigenteDesde: string; // "AAAA-MM-DD"
  membros: MembroComissao[];
  fonteUrl: string;
  legislatura: Legislatura;
}

export interface Frente {
  id: string; // "02-2023"
  requerimento: string; // "02/2023"
  nome: string;
  autorSlug: string | null;
  signatarios: string[]; // slugs, sem o autor
  /** Nomes da fonte que não casaram exatamente com nenhum deputado. */
  naoReconhecidos: string[];
  urlRequerimento: string | null;
  fonteUrl: string;
  legislatura: Legislatura;
}

export type IdFonte = "deputados" | "proposicoes" | "verba" | "comissoes" | "frentes";

export interface FonteMeta {
  id: IdFonte;
  nome: string;
  url: string;
  coletadoEm: string; // ISO 8601
  registros: number;
  ok: boolean;
  erro?: string;
  /** Linhas da fonte que não puderam ser lidas (só verba). */
  rejeitados?: number;
}

export interface Metadados {
  geradoEm: string;
  fontes: FonteMeta[];
}
