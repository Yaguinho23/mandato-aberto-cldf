import type { Metadata } from "next";
import { listarProposicoes, obterMetadados } from "@/lib/dados";
import { formatarData } from "@/lib/formato";

export const metadata: Metadata = { title: "Sobre os dados · Mandato Aberto · CLDF" };

export default function PaginaDados() {
  const meta = obterMetadados();
  const proposicoes = listarProposicoes();
  const semAutor = proposicoes.filter((p) => p.autores.length === 0).length;
  const pct = proposicoes.length === 0 ? "0,0" : ((semAutor / proposicoes.length) * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const th = "px-3 py-2 text-left";
  const td = "border-t border-[var(--cor-borda)] px-3 py-2 align-top";

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold text-[var(--cor-primaria)]">Sobre os dados</h1>

      <section>
        <h2 className="mb-2 text-xl font-bold text-[var(--cor-primaria)]">De onde vêm os números</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className={th}>Fonte</th>
                <th scope="col" className={th}>Última coleta</th>
                <th scope="col" className={th}>Registros</th>
                <th scope="col" className={th}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {meta.fontes.map((f) => (
                <tr key={f.id}>
                  <td className={td}><a className="underline" href={f.url} target="_blank" rel="noopener noreferrer">{f.nome}</a></td>
                  <td className={td}>{formatarData(f.coletadoEm)}</td>
                  <td className={td}>{f.registros.toLocaleString("pt-BR")}</td>
                  <td className={td}>{f.ok ? "Atualizada" : "Última atualização falhou"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm">A coleta roda uma vez por dia. Se uma fonte falha, o site mantém os últimos dados bons e mostra a data em que foram coletados.</p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-[var(--cor-primaria)]">O que ainda falta e por quê</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Presença em sessões: a CLDF publica apenas em PDF, sem dados abertos que possamos ler com segurança.</li>
          <li>Votações nominais: também publicadas apenas em PDF.</li>
          <li>Emendas: não confirmamos uma fonte aberta com autoria por deputado.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-[var(--cor-primaria)]">Como tratamos os dados</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>A autoria de uma proposição só é atribuída a um deputado quando o nome na fonte corresponde exatamente ao nome dele ou a uma grafia conhecida. Nada é adivinhado.</li>
          <li>
            Hoje, {semAutor.toLocaleString("pt-BR")} de {proposicoes.length.toLocaleString("pt-BR")} proposições ({pct}%) não têm autor reconhecido e aparecem com o texto original da fonte.
          </li>
          <li>Valores de verba são guardados em centavos inteiros, exatamente como publicados. Estornos aparecem como valores negativos e entram na soma.</li>
          <li>
            Os arquivos de verba indenizatória em dados abertos podem estar incompletos em relação ao painel que a CLDF publica. Por isso mostramos a soma como “comprovantes publicados em dados abertos”, e não como total gasto.
          </li>
          <li>Em vários arquivos a data do comprovante é ausente ou ambígua. Nesses casos o lançamento entra no total, mas não é atribuído a nenhum mês.</li>
          <li>Nada é estimado, ordenado por desempenho ou classificado. Listas de deputados seguem a ordem alfabética.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-[var(--cor-primaria)]">Encontrou um erro?</h2>
        <p>
          Escreva para{" "}
          <a className="underline" href="mailto:contato@mandatoaberto.org">contato@mandatoaberto.org</a>, com o link da página e o que está diferente da fonte.
        </p>
      </section>
    </div>
  );
}