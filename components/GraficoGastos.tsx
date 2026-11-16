import { formatarBRL, nomeMes } from "@/lib/formato";
const mesExtenso = (m: number) => { const n = nomeMes(m); return n.charAt(0).toUpperCase() + n.slice(1); };
import type { ResumoVerba } from "@/lib/dados";

type Props = Pick<ResumoVerba, "porMes" | "porCategoria" | "semMes" | "totalCentavos">;

export function GraficoGastos({ porMes, porCategoria, semMes, totalCentavos }: Props) {
  // Quando a maior parte do valor não tem mês na fonte, um gráfico mensal mostraria uma parte pequena como se fosse o todo.
  const mensalConfiavel = semMes.centavos * 2 <= totalCentavos;
  const maximo = Math.max(1, ...porMes.map((m) => Math.abs(m.centavos)));
  const totalCategorias = porCategoria.reduce((s, c) => s + Math.abs(c.centavos), 0) || 1;

  return (
    <div className="space-y-6">
      {mensalConfiavel ? (
        <div>
          <div className="flex items-end gap-2" aria-hidden>
            {porMes.map((m) => (
              <div key={m.mes} className="flex flex-1 flex-col items-center justify-end">
                <div data-testid="barra-mes" className="w-full rounded-t bg-[var(--cor-primaria)]" style={{ height: `${Math.max(2, Math.round((Math.abs(m.centavos) / maximo) * 96))}px` }} />
                <span className="mt-1 text-xs">{nomeMes(m.mes).slice(0, 3)}</span>
              </div>
            ))}
          </div>
          <table className="mt-3 w-full text-sm">
            <caption className="mb-1 text-left font-medium">Comprovantes por mês</caption>
            <tbody>
              {porMes.map((m) => (
                <tr key={m.mes} className="border-t border-[var(--cor-borda)]">
                  <th scope="row" className="py-1 text-left font-normal">{mesExtenso(m.mes)}</th>
                  <td className="py-1 text-right">{formatarBRL(m.centavos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg bg-[var(--cor-fundo-suave)] p-3 text-sm">
          A maior parte dos lançamentos não informa o mês na fonte, então não mostramos a divisão mensal.
        </p>
      )}
      {mensalConfiavel && semMes.lancamentos > 0 ? (
        <p className="text-sm text-[var(--cor-texto-suave)]">
          {semMes.lancamentos} {semMes.lancamentos === 1 ? "lançamento sem mês definido na fonte" : "lançamentos sem mês definido na fonte"} ({formatarBRL(semMes.centavos)}), incluídos no total.
        </p>
      ) : null}

      <div>
        <h4 className="mb-2 font-medium">Por categoria, do maior para o menor valor</h4>
        <ul className="space-y-2">
          {porCategoria.map((c) => (
            <li key={c.categoria} data-testid="categoria" className="text-sm">
              <div className="flex justify-between gap-2">
                <span>{c.categoria}</span>
                <span>{formatarBRL(c.centavos)}</span>
              </div>
              <div aria-hidden className="mt-1 h-2 rounded bg-[var(--cor-fundo-suave)]">
                <div className="h-2 rounded bg-[var(--cor-detalhe)]" style={{ width: `${Math.min(100, (Math.abs(c.centavos) / totalCategorias) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}