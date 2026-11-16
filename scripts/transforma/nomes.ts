function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** "José Antônio D'Ávila" → "jose-antonio-davila" */
export function slugificar(nome: string): string {
  return semAcento(nome)
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Forma de comparação de nomes: minúsculas, sem acento, sem os prefixos
 * "deputado", "deputada" e "dep.", espaços colapsados.
 * Só é usada para casamento exato; nunca para aproximação.
 */
export function normalizarNome(nome: string): string {
  return semAcento(nome)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(deputado|deputada|dep\.)(\s+|$)/, "")
    .trim();
}
