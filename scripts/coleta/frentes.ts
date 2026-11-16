import type { DeputadoComAliases, Frente } from "../../lib/types";
import { buscar as buscarPadrao, type Buscar } from "../http";
import { transformarFrentes } from "../transforma/frentes";

export const URL_FRENTES = "https://www.cl.df.gov.br/frentes-parlamentares";

/** Frentes parlamentares da legislatura, lidas da tabela pública da CLDF. */
export async function coletarFrentes(deputados: DeputadoComAliases[], opcoes: { buscar?: Buscar } = {}): Promise<Frente[]> {
  const buscar = opcoes.buscar ?? buscarPadrao;
  const resposta = await buscar(URL_FRENTES);
  return transformarFrentes(await resposta.text(), deputados, URL_FRENTES);
}