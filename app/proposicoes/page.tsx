import Link from "next/link";
import { FiltrosProposicoes, type FiltrosAtuais } from "@/components/FiltrosProposicoes";
import { Fonte } from "@/components/Fonte";
import { ListaProposicoes } from "@/components/ListaProposicoes";
import { Termo } from "@/components/Termo";
import { listarDeputados, listarProposicoes } from "@/lib/dados";
import { paginar } from "@/lib/glossario";
import { TIPOS_PROPOSICAO, type TipoProposicao } from "@/lib/types";

const ANOS = [2023, 2024, 2025, 2026];
const primeiro = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Proposicoes({ searchParams }: PageProps<"/proposicoes">) {
  const q = await searchParams;
  const deputados = listarDeputados();
  const tipoBruto = primeiro(q.tipo);
  const anoBruto = Number(primeiro(q.ano));
  const autorBruto = primeiro(q.autor);
  const filtros: FiltrosAtuais = {
    tipo: TIPOS_PROPOSICAO.includes(tipoBruto as TipoProposicao) ? (tipoBruto as TipoProposicao) : undefined,
    ano: ANOS.includes(anoBruto) ? anoBruto : undefined,
    autor: deputados.some((d) => d.slug === autorBruto) ? autorBruto : undefined,
  };
  const todas = listarProposicoes(filtros);
  const pag = paginar(todas, Number(primeiro(q.pagina)));

  const consulta = (pagina: number) => {
    const p = new URLSearchParams();
    if (filtros.tipo) p.set("tipo", filtros.tipo);
    if (filtros.ano) p.set("ano", String(filtros.ano));
    if (filtros.autor) p.set("autor", filtros.autor);
    p.set("pagina", String(pagina));
    return `/proposicoes?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[var(--cor-primaria)]">Proposições</h1>
      <p>
        Cada item mostra a <Termo id="ementa">ementa</Termo> oficial e o tipo da proposição; toque no tipo para ver o que significa.
      </p>
      <FiltrosProposicoes deputados={deputados.map((d) => ({ slug: d.slug, nome: d.nome }))} anos={ANOS} atual={filtros} />
      <p className="text-sm" aria-live="polite">
        {todas.length.toLocaleString("pt-BR")} proposições · página {pag.pagina} de {pag.totalPaginas}
      </p>
      <ListaProposicoes itens={pag.itens} />
      <nav aria-label="Paginação" className="flex justify-between text-sm">
        {pag.pagina > 1 ? <Link className="underline" href={consulta(pag.pagina - 1)}>Anterior</Link> : <span />}
        {pag.pagina < pag.totalPaginas ? <Link className="underline" href={consulta(pag.pagina + 1)}>Próxima</Link> : <span />}
      </nav>
      <Fonte id="proposicoes" />
    </div>
  );
}