import { formatarData } from "@/lib/formato";
import { obterMetadados } from "@/lib/dados";
import type { IdFonte } from "@/lib/types";

export function Fonte({ id }: { id: IdFonte }) {
  const fonte = obterMetadados().fontes.find((f) => f.id === id);
  if (!fonte) return null;
  return (
    <p className="mt-2 text-xs text-[var(--cor-texto-suave)]">
      Fonte:{" "}
      <a className="underline underline-offset-2" href={fonte.url} target="_blank" rel="noopener noreferrer">
        {fonte.nome}
      </a>{" "}
      · Dados de {formatarData(fonte.coletadoEm)}
      {fonte.ok ? null : " · atualização mais recente falhou"}
    </p>
  );
}