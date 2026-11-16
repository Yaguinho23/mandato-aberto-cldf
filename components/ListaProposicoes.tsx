import Link from "next/link";
import { obterDeputado } from "@/lib/dados";
import { formatarData } from "@/lib/formato";
import type { Proposicao } from "@/lib/types";
import { Termo } from "./Termo";

export function ListaProposicoes({ itens, limite, vazio = "Nenhuma proposição encontrada com esses filtros" }: { itens: Proposicao[]; limite?: number; vazio?: string }) {
  const visiveis = limite === undefined ? itens : itens.slice(0, limite);
  if (visiveis.length === 0) return <p className="text-[var(--cor-texto-suave)]">{vazio}</p>;
  return (
    <ul className="space-y-3">
      {visiveis.map((p) => {
        const reconhecidos = p.autores.map((s) => obterDeputado(s)).filter((d) => d !== undefined);
        const partes = p.autoresTexto.split(",").filter((s) => s.trim() !== "").length;
        return (
          <li key={p.id} className="rounded-lg border border-[var(--cor-borda)] bg-white p-3">
            <p className="font-medium text-[var(--cor-primaria)]">
              <Termo id={p.tipo}>{p.tipo}</Termo> {p.numero}/{p.ano}
            </p>
            <p className="mt-1 text-sm">{p.ementa}</p>
            <p className="mt-1 text-xs">
              Autoria:{" "}
              {reconhecidos.map((d, i) => (
                <span key={d.slug}>
                  {i > 0 ? ", " : ""}
                  <Link className="underline" href={`/deputados/${d.slug}`}>{d.nome}</Link>
                </span>
              ))}
              {reconhecidos.length === 0 ? (p.autoresTexto.trim() || "não informada na fonte") : partes > reconhecidos.length ? ` · texto original: ${p.autoresTexto}` : ""}
            </p>
            <p className="mt-1 text-xs text-[var(--cor-texto-suave)]">
              {p.situacao ?? "Situação não informada"}
              {p.dataApresentacao ? ` · Apresentada em ${formatarData(p.dataApresentacao)}` : ""}
              {" · "}
              <a className="underline" href={p.urlFonte} target="_blank" rel="noopener noreferrer">Ver no site da CLDF</a>
            </p>
          </li>
        );
      })}
    </ul>
  );
}