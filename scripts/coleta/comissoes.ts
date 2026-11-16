import type { Comissao, DeputadoComAliases } from "../../lib/types";
import { buscar as buscarPadrao, type Buscar } from "../http";
import { transformarComissoes } from "../transforma/comissoes";

export const URL_COMISSOES = "https://www.cl.df.gov.br/comissoes-permanentes";

/** Composição atual das comissões permanentes, lida da página pública da CLDF. */
export async function coletarComissoes(deputados: DeputadoComAliases[], opcoes: { buscar?: Buscar } = {}): Promise<Comissao[]> {
  const buscar = opcoes.buscar ?? buscarPadrao;
  const resposta = await buscar(URL_COMISSOES);
  return transformarComissoes(await resposta.text(), deputados, URL_COMISSOES);
}