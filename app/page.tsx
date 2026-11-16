import { BuscaDeputados } from "@/components/BuscaDeputados";
import { Fonte } from "@/components/Fonte";
import { IconeDocumento, IconeEscudo, IconeMoeda, IconePessoas, IconeSeta } from "@/components/Icones";
import { listarDeputados, obterMetadados } from "@/lib/dados";
import type { IdFonte } from "@/lib/types";
import Link from "next/link";

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function Inicio() {
  const deputados = listarDeputados();
  const registros = (id: IdFonte) => obterMetadados().fontes.find((f) => f.id === id)?.registros ?? 0;
  const numeros = [
    { id: "deputados" as IdFonte, valor: deputados.length, rotulo: "deputados distritais na legislatura 2023–2026", Icone: IconePessoas },
    { id: "proposicoes" as IdFonte, valor: registros("proposicoes"), rotulo: "proposições registradas no sistema da CLDF", Icone: IconeDocumento },
    { id: "verba" as IdFonte, valor: registros("verba"), rotulo: "comprovantes de verba indenizatória publicados em dados abertos", Icone: IconeMoeda },
  ];
  return (
    <div className="space-y-14">
      <section className="fundo-hero -mx-4 -mt-8 px-4 py-14 text-center sm:py-20">
        <span className="selo"><IconeEscudo tamanho={16} /> Dados públicos, com a fonte de cada número</span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-[var(--cor-primaria)] sm:text-6xl">
          Acompanhe o que os <span className="titulo-destaque">deputados distritais</span> fazem
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--cor-texto-suave)]">
          Proposições e verba indenizatória de cada deputado da Câmara Legislativa do DF, reunidas em um só lugar. Cada número tem link para a fonte e a data da coleta.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#deputados" className="botao">Ver deputados <IconeSeta tamanho={18} /></a>
          <Link href="/dados" className="botao-contorno">Sobre os dados</Link>
        </div>
      </section>

      <section aria-label="Números gerais" className="grid gap-4 sm:grid-cols-3">
        {numeros.map(({ id, valor, rotulo, Icone }) => (
          <div key={id} className="cartao p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--cor-fundo-suave)] text-[var(--cor-primaria)]"><Icone tamanho={22} /></span>
            <p className="mt-3 text-3xl font-extrabold text-[var(--cor-primaria)]">{fmt(valor)}</p>
            <p className="text-sm">{rotulo}</p>
            <Fonte id={id} />
          </div>
        ))}
      </section>

      <section id="deputados" aria-labelledby="titulo-deputados">
        <h2 id="titulo-deputados" className="mb-1 text-3xl font-bold text-[var(--cor-primaria)]">Deputados</h2>
        <p className="mb-5 text-[var(--cor-texto-suave)]">Escolha um deputado para ver proposições e comprovantes de verba por ano.</p>
        <BuscaDeputados deputados={deputados} />
      </section>
    </div>
  );
}