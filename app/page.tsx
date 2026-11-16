import { BuscaDeputados } from "@/components/BuscaDeputados";
import { Fonte } from "@/components/Fonte";
import { listarDeputados, obterMetadados } from "@/lib/dados";
import type { IdFonte } from "@/lib/types";

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function Inicio() {
  const deputados = listarDeputados();
  const registros = (id: IdFonte) => obterMetadados().fontes.find((f) => f.id === id)?.registros ?? 0;
  const numeros: { id: IdFonte; valor: number; rotulo: string }[] = [
    { id: "deputados", valor: deputados.length, rotulo: "deputados distritais na legislatura 2023–2026" },
    { id: "proposicoes", valor: registros("proposicoes"), rotulo: "proposições registradas no sistema da CLDF" },
    { id: "verba", valor: registros("verba"), rotulo: "comprovantes de verba indenizatória publicados em dados abertos" },
  ];
  return (
    <div className="space-y-12">
      <section>
        <span className="inline-block rounded-full bg-[var(--cor-fundo-suave)] px-3 py-1 text-sm font-medium text-[var(--cor-primaria)]">
          Dados públicos, com a fonte de cada número
        </span>
        <h1 className="mt-4 text-3xl font-bold text-[var(--cor-primaria)] sm:text-5xl">Mandato Aberto · CLDF</h1>
        <p className="mt-4 max-w-2xl text-lg">
          Reunimos em um só lugar o que cada deputado distrital apresentou e o que consta nos comprovantes de verba indenizatória, para você consultar sem
          depender de planilhas e sistemas separados. Cada número tem link para a fonte e a data da coleta.
        </p>
      </section>

      <section aria-label="Números gerais" className="grid gap-4 sm:grid-cols-3">
        {numeros.map((n) => (
          <div key={n.id} className="rounded-lg border border-[var(--cor-borda)] bg-white p-4">
            <p className="text-3xl font-bold text-[var(--cor-primaria)]">{fmt(n.valor)}</p>
            <p className="text-sm">{n.rotulo}</p>
            <Fonte id={n.id} />
          </div>
        ))}
      </section>

      <section id="deputados" aria-labelledby="titulo-deputados">
        <h2 id="titulo-deputados" className="mb-4 text-2xl font-bold text-[var(--cor-primaria)]">
          Deputados
        </h2>
        <BuscaDeputados deputados={deputados} />
      </section>
    </div>
  );
}