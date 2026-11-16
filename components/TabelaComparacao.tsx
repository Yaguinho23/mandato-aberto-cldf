import Link from "next/link";
import type { ResumoVerba } from "@/lib/dados";
import { formatarBRL } from "@/lib/formato";
import { TIPOS_PROPOSICAO, type TipoProposicao } from "@/lib/types";

export interface Coluna {
  deputado: { slug: string; nome: string };
  resumo: { proposicoes: number; porTipo: Record<TipoProposicao, number>; verba: ResumoVerba | null };
}

const SEM = "Nenhum registro publicado no período";
const cel = "border-t border-[var(--cor-borda)] px-3 py-2 align-top";

export function TabelaComparacao({ colunas, ano }: { colunas: Coluna[]; ano: number }) {
  if (colunas.length < 2) return <p>Escolha pelo menos dois deputados</p>;

  const tipos = TIPOS_PROPOSICAO.filter((t) => colunas.some((c) => c.resumo.porTipo[t] > 0));
  // Categorias em ordem alfabética: a ordem nunca indica "mais" ou "menos".
  const categorias = [...new Set(colunas.flatMap((c) => c.resumo.verba?.porCategoria.map((x) => x.categoria) ?? []))].sort((a, b) => a.localeCompare(b, "pt-BR"));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <caption className="mb-2 text-left font-medium">Comparação em {ano}, na ordem escolhida</caption>
        <thead>
          <tr>
            <th scope="col" className="sticky left-0 bg-white px-3 py-2 text-left"><span className="sr-only">Item</span></th>
            {colunas.map((c) => (
              <th key={c.deputado.slug} scope="col" className="px-3 py-2 text-left">
                <Link className="underline" href={`/deputados/${c.deputado.slug}`}>{c.deputado.nome}</Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row" className={`${cel} sticky left-0 bg-white text-left`}>Proposições</th>
            {colunas.map((c) => <td key={c.deputado.slug} className={cel}>{c.resumo.proposicoes}</td>)}
          </tr>
          {tipos.map((t) => (
            <tr key={t}>
              <th scope="row" className={`${cel} sticky left-0 bg-white pl-6 text-left font-normal`}>{t}</th>
              {colunas.map((c) => <td key={c.deputado.slug} className={cel}>{c.resumo.porTipo[t]}</td>)}
            </tr>
          ))}
          <tr>
            <th scope="row" className={`${cel} sticky left-0 bg-white text-left`}>Verba indenizatória (comprovantes publicados em dados abertos)</th>
            {colunas.map((c) => <td key={c.deputado.slug} className={cel}>{c.resumo.verba ? formatarBRL(c.resumo.verba.totalCentavos) : SEM}</td>)}
          </tr>
          {categorias.map((cat) => (
            <tr key={cat}>
              <th scope="row" className={`${cel} sticky left-0 bg-white pl-6 text-left font-normal`}>{cat}</th>
              {colunas.map((c) => {
                const v = c.resumo.verba?.porCategoria.find((x) => x.categoria === cat);
                return <td key={c.deputado.slug} className={cel}>{v ? formatarBRL(v.centavos) : "—"}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}