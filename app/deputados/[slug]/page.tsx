import { notFound } from "next/navigation";
import { BlocoResumo } from "@/components/BlocoResumo";
import { Fonte } from "@/components/Fonte";
import { ListaProposicoes } from "@/components/ListaProposicoes";
import { PainelAno } from "@/components/PainelAno";
import { listarDeputados, obterDeputado, proposicoesDe, resumoDeputado } from "@/lib/dados";

const ANOS = [2023, 2024, 2025, 2026];

export function generateStaticParams() {
  return listarDeputados().map((d) => ({ slug: d.slug }));
}

export default async function PaginaDeputado({ params }: PageProps<"/deputados/[slug]">) {
  const { slug } = await params;
  const deputado = obterDeputado(slug);
  if (!deputado) notFound();

  const anos = ANOS.map((ano) => ({ ano, ...resumoDeputado(slug, ano) }));
  const assunto = encodeURIComponent(`Erro nos dados de ${deputado.nome}`);

  return (
    <div className="space-y-8">
      <header className="cartao flex items-center gap-4 p-5">
        {deputado.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deputado.fotoUrl} alt={`Foto de ${deputado.nome}`} width={96} height={96} className="h-24 w-24 rounded-full object-cover ring-4 ring-[var(--cor-detalhe)]" />
        ) : null}
        <div>
          <h1 className="text-3xl font-bold text-[var(--cor-primaria)]">{deputado.nome}</h1>
          <p>{deputado.partido ?? "Sem partido informado"} · Legislatura {deputado.legislatura}</p>
          <p className="text-sm">
            <a className="underline" href={deputado.fonteUrl} target="_blank" rel="noopener noreferrer">Perfil no site da CLDF</a>
          </p>
        </div>
      </header>

      <PainelAno slug={slug} anos={anos} anoInicial={2026} fonteProposicoes={<Fonte id="proposicoes" />} fonteVerba={<Fonte id="verba" />} />

      <BlocoResumo titulo="Presença">
        <p>
          Presença: publicada pela CLDF apenas em PDF. Consulte as{" "}
          <a className="underline" href="https://www.cl.df.gov.br/sessoes-plenarias" target="_blank" rel="noopener noreferrer">sessões plenárias</a>.
        </p>
      </BlocoResumo>

      <section>
        <h2 className="mb-3 text-2xl font-bold text-[var(--cor-primaria)]">Últimas proposições</h2>
        <ListaProposicoes itens={proposicoesDe(slug)} limite={10} />
        <p className="mt-3">
          <a className="underline" href={`/proposicoes?autor=${slug}`}>Ver todas</a>
        </p>
        <Fonte id="proposicoes" />
      </section>

      <p className="text-sm">
        <a className="underline" href={`mailto:contato@mandatoaberto.org?subject=${assunto}`}>Encontrou um erro?</a>
      </p>
    </div>
  );
}