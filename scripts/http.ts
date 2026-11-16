export const USER_AGENT = "MandatoAbertoCLDF/1.0 (+https://mandatoaberto.org; contato@mandatoaberto.org)";

const INTERVALO_POR_HOST_MS = 1000;
const TENTATIVAS = 3;
const ESPERA_BASE_MS = 2000;

export type Buscar = (url: string, init?: RequestInit) => Promise<Response>;
type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const dormir = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Cria um `buscar` com as regras de coleta do projeto:
 * identifica-se no User-Agent, espera pelo menos 1 s entre chamadas ao mesmo host,
 * tenta até 3 vezes (falha de rede, 429 ou 5xx) com espera crescente e lança em status >= 400.
 */
export function criarBuscar(fetchImpl: FetchLike = fetch): Buscar {
  const proximoLivre = new Map<string, number>();

  async function aguardarVez(host: string): Promise<void> {
    const agora = Date.now();
    const vez = Math.max(agora, proximoLivre.get(host) ?? 0);
    proximoLivre.set(host, vez + INTERVALO_POR_HOST_MS);
    if (vez > agora) await dormir(vez - agora);
  }

  return async function buscar(url, init = {}) {
    const host = new URL(url).host;
    const headers = new Headers(init.headers);
    headers.set("User-Agent", USER_AGENT);

    let ultimoErro: Error = new Error(`Falha ao buscar ${url}`);
    for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
      if (tentativa > 1) await dormir(ESPERA_BASE_MS * 2 ** (tentativa - 2));
      await aguardarVez(host);
      try {
        const resposta = await fetchImpl(url, { ...init, headers });
        if (resposta.status < 400) return resposta;
        ultimoErro = new Error(`HTTP ${resposta.status} em ${url}`);
        const vale_insistir = resposta.status >= 500 || resposta.status === 429;
        if (!vale_insistir) throw ultimoErro;
      } catch (erro) {
        if (erro === ultimoErro) {
          if (!/HTTP (5\d\d|429)/.test(ultimoErro.message)) throw ultimoErro;
        } else {
          ultimoErro = new Error(`Falha de rede em ${url}: ${erro instanceof Error ? erro.message : String(erro)}`);
        }
      }
    }
    throw ultimoErro;
  };
}

export const buscar: Buscar = criarBuscar();
