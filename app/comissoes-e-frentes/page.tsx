import type { Metadata } from "next";
import Link from "next/link";
import { Fonte } from "@/components/Fonte";
import { listarComissoes, listarFrentes, obterDeputado } from "@/lib/dados";
import { formatarData } from "@/lib/formato";
import { GLOSSARIO } from "@/lib/glossario";

export const metadata: Metadata = { title: "Comissões e frentes parlamentares · Mandato Aberto · CLDF" };

function Deputado({ slug }: { slug: string }) {
  const d = obterDeputado(slug);
  return d ? <Link className="underline" href={`/deputados/${slug}`}>{d.nome}</Link> : <span>{slug}</span>;
}

function Lista({ slugs }: { slugs: string[] }) {
  return (
    <>
      {slugs.map((s, i) => (
        <span key={s}>
          {i > 0 ? ", " : ""}
          <Deputado slug={s} />
        </span>
      ))}
    </>
  );
}

export default function ComissoesEFrentes() {
  const comissoes = listarComissoes();
  const frentes = listarFrentes();
  return (
    <div className="max-w-3xl space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-[var(--cor-primaria)]">Comissões e frentes parlamentares</h1>
        <p className="mt-2 text-[var(--cor-texto-suave)]">Onde os deputados distritais se reúnem para estudar temas e propostas, e quem participa de cada grupo.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2" aria-label="Explicações">
        <div className="cartao p-5">
          <h2 className="text-lg font-bold text-[var(--cor-primaria)]">O que são as comissões</h2>
          <p className="mt-2 text-sm">{GLOSSARIO["comissao"].explicacao}</p>
        </div>
        <div className="cartao p-5">
          <h2 className="text-lg font-bold text-[var(--cor-primaria)]">O que são as frentes parlamentares</h2>
          <p className="mt-2 text-sm">{GLOSSARIO["frente-parlamentar"].explicacao}</p>
        </div>
      </section>

      <section aria-labelledby="titulo-comissoes">
        <h2 id="titulo-comissoes" className="mb-1 text-2xl font-bold text-[var(--cor-primaria)]">Comissões permanentes</h2>
        <p className="mb-4 text-sm text-[var(--cor-texto-suave)]">Composição atual, em ordem alfabética. As comissões temporárias não estão incluídas.</p>
        <div className="space-y-4">
          {comissoes.map((c) => {
            const titulo = `${c.nome} (${c.sigla})`;
            const presidente = c.membros.filter((m) => m.papel === "Presidente");
            const vice = c.membros.filter((m) => m.papel === "Vice-Presidente");
            const demais = c.membros.filter((m) => m.papel === "Membro");
            const suplentes = [...new Set(c.membros.map((m) => m.suplenteSlug).filter((s): s is string => s !== null))];
            return (
              <article key={c.id} id={c.id} aria-label={titulo} className="cartao scroll-mt-24 p-5">
                <h3 className="font-bold text-[var(--cor-primaria)]">{titulo}</h3>
                <dl className="mt-2 space-y-1 text-sm">
                  {presidente.length > 0 ? <div><dt className="inline font-semibold">Presidente: </dt><dd className="inline"><Lista slugs={presidente.map((m) => m.deputadoSlug)} /></dd></div> : null}
                  {vice.length > 0 ? <div><dt className="inline font-semibold">Vice-presidente: </dt><dd className="inline"><Lista slugs={vice.map((m) => m.deputadoSlug)} /></dd></div> : null}
                  {demais.length > 0 ? <div><dt className="inline font-semibold">Membros: </dt><dd className="inline"><Lista slugs={demais.map((m) => m.deputadoSlug)} /></dd></div> : null}
                  {suplentes.length > 0 ? <div><dt className="inline font-semibold">Suplentes: </dt><dd className="inline"><Lista slugs={suplentes} /></dd></div> : null}
                </dl>
                <p className="mt-2 text-xs text-[var(--cor-texto-suave)]">Composição em vigor desde {formatarData(c.vigenteDesde)}.</p>
              </article>
            );
          })}
        </div>
        <Fonte id="comissoes" />
      </section>

      <section aria-labelledby="titulo-frentes">
        <h2 id="titulo-frentes" className="mb-1 text-2xl font-bold text-[var(--cor-primaria)]">Frentes parlamentares</h2>
        <p className="mb-4 text-sm text-[var(--cor-texto-suave)]">{frentes.length} frentes da legislatura 2023–2026, em ordem alfabética. Toque em uma frente para ver quem a assina.</p>
        <div className="space-y-2">
          {frentes.map((f) => (
            <details key={f.id} id={`frente-${f.id}`} className="cartao scroll-mt-24 p-4" aria-label={f.nome}>
              <summary className="cursor-pointer font-medium text-[var(--cor-primaria)]">{f.nome}</summary>
              <div className="mt-3 space-y-1 text-sm">
                {f.autorSlug ? <p><span className="font-semibold">Autor (1º signatário): </span><Deputado slug={f.autorSlug} /></p> : null}
                {f.signatarios.length > 0 ? <p><span className="font-semibold">Signatários: </span><Lista slugs={f.signatarios} /></p> : null}
                {f.naoReconhecidos.length > 0 ? <p className="text-[var(--cor-texto-suave)]">Nomes na fonte sem correspondência exata com um deputado: {f.naoReconhecidos.join("; ")}.</p> : null}
                {f.urlRequerimento ? (
                  <p>
                    <a className="underline" href={f.urlRequerimento} target="_blank" rel="noopener noreferrer">Ver requerimento {f.requerimento} no site da CLDF</a>
                  </p>
                ) : null}
              </div>
            </details>
          ))}
        </div>
        <Fonte id="frentes" />
      </section>
    </div>
  );
}