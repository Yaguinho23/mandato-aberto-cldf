import { formatarData } from "@/lib/formato";
import type { Proposicao } from "@/lib/types";

export function ListaProposicoes({ itens, limite }: { itens: Proposicao[]; limite?: number }) {
  const visiveis = limite === undefined ? itens : itens.slice(0, limite);
  return (
    <ul className="space-y-3">
      {visiveis.map((p) => (
        <li key={p.id} className="rounded-lg border border-[var(--cor-borda)] bg-white p-3">
          <p className="font-medium text-[var(--cor-primaria)]">
            {p.tipo} {p.numero}/{p.ano}
          </p>
          <p className="mt-1 text-sm">{p.ementa}</p>
          <p className="mt-1 text-xs text-[var(--cor-texto-suave)]">
            {p.situacao ?? "Situação não informada"}
            {p.dataApresentacao ? ` · Apresentada em ${formatarData(p.dataApresentacao)}` : ""}
            {" · "}
            <a className="underline" href={p.urlFonte} target="_blank" rel="noopener noreferrer">
              Ver no site da CLDF
            </a>
          </p>
        </li>
      ))}
    </ul>
  );
}