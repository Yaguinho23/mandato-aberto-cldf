import { z } from "zod";
import { TIPOS_PROPOSICAO } from "./types";

const LegislaturaSchema = z.literal("2023-2026");
const SlugSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const UrlSchema = z.string().regex(/^https:\/\/\S+$/);
const DataSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const DeputadoSchema = z.object({
  slug: SlugSchema,
  nome: z.string().min(1),
  partido: z.string().min(1).nullable(),
  fotoUrl: UrlSchema.nullable(),
  legislatura: LegislaturaSchema,
  emExercicio: z.boolean(),
  fonteUrl: UrlSchema,
});

export const DeputadoComAliasesSchema = DeputadoSchema.extend({
  aliases: z.array(z.string().min(1)),
});

export const ProposicaoSchema = z.object({
  id: z.string().min(1),
  tipo: z.enum(TIPOS_PROPOSICAO),
  numero: z.string(),
  ano: z.number().int().min(1990).max(2100),
  ementa: z.string(),
  situacao: z.string().nullable(),
  dataApresentacao: DataSchema.nullable(),
  autoresTexto: z.string(),
  autores: z.array(SlugSchema),
  urlFonte: UrlSchema,
  legislatura: LegislaturaSchema,
  resumoSimples: z.string().optional(),
});

export const DespesaVerbaSchema = z.object({
  deputadoSlug: SlugSchema,
  ano: z.number().int().min(2023).max(2100),
  mes: z.number().int().min(1).max(12).nullable(),
  categoria: z.string().min(1),
  fornecedor: z.string().min(1).nullable(),
  valorCentavos: z.number().int(),
  fonteUrl: UrlSchema,
  legislatura: LegislaturaSchema,
});

export const FonteMetaSchema = z.object({
  id: z.enum(["deputados", "proposicoes", "verba", "comissoes", "frentes"]),
  nome: z.string().min(1),
  url: UrlSchema,
  coletadoEm: z.string().min(1),
  registros: z.number().int().min(0),
  ok: z.boolean(),
  erro: z.string().optional(),
  rejeitados: z.number().int().min(0).optional(),
});

export const MetadadosSchema = z.object({
  geradoEm: z.string().min(1),
  fontes: z.array(FonteMetaSchema),
});

export const ComissaoSchema = z.object({
  id: z.string().min(1),
  sigla: z.string().min(1),
  nome: z.string().min(1),
  vigenteDesde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  membros: z.array(z.object({ deputadoSlug: z.string().min(1), papel: z.enum(["Presidente", "Vice-Presidente", "Membro"]), suplenteSlug: z.string().nullable() })).min(1),
  fonteUrl: z.string().url(),
  legislatura: z.literal("2023-2026"),
});

export const FrenteSchema = z.object({
  id: z.string().min(1),
  requerimento: z.string().min(1),
  nome: z.string().min(1),
  autorSlug: z.string().nullable(),
  signatarios: z.array(z.string().min(1)),
  naoReconhecidos: z.array(z.string()),
  urlRequerimento: z.string().url().nullable(),
  fonteUrl: z.string().url(),
  legislatura: z.literal("2023-2026"),
});