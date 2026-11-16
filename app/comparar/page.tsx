import { Fonte } from "@/components/Fonte";
import { SeletorDeputados } from "@/components/SeletorDeputados";
import { TabelaComparacao } from "@/components/TabelaComparacao";
import { listarDeputados, normalizarSelecao, obterDeputado, resumoDeputado } from "@/lib/dados";

const ANOS = [2023, 2024, 2025, 2026];

export default async function Comparar({ searchParams }: PageProps<"/comparar">) {
  const q = await searchParams;
  const anoBruto = Number(Array.isArray(q.ano) ? q.ano[0] : q.ano);
  const ano = ANOS.includes(anoBruto) ? anoBruto : 2026;
  const slugs = normalizarSelecao(q.d);
  const deputados = listarDeputados();
  const colunas = slugs.map((slug) => ({ deputado: { slug, nome: obterDeputado(slug)!.nome }, resumo: resumoDeputado(slug, ano) }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[var(--cor-primaria)]">Comparar deputados</h1>
      <p>Escolha de dois a quatro deputados. As colunas ficam na ordem em que você escolheu; não há ranking.</p>
      <SeletorDeputados deputados={deputados.map((d) => ({ slug: d.slug, nome: d.nome }))} escolhidos={slugs} anos={ANOS} ano={ano} />
      <TabelaComparacao colunas={colunas} ano={ano} />
      <Fonte id="proposicoes" />
      <Fonte id="verba" />
    </div>
  );
}