const campo = "w-full rounded-lg border border-[var(--cor-borda)] bg-white px-2 py-1";

export function SeletorDeputados({ deputados, escolhidos, anos, ano }: { deputados: { slug: string; nome: string }[]; escolhidos: string[]; anos: number[]; ano: number }) {
  return (
    <form method="get" action="/comparar" className="grid gap-3 sm:grid-cols-5 sm:items-end">
      {[0, 1, 2, 3].map((i) => (
        <div key={i}>
          <label htmlFor={`d-${i}`} className="block text-sm font-medium">Deputado {i + 1}{i < 2 ? "" : " (opcional)"}</label>
          <select id={`d-${i}`} name="d" defaultValue={escolhidos[i] ?? ""} className={campo}>
            <option value="">—</option>
            {deputados.map((d) => <option key={d.slug} value={d.slug}>{d.nome}</option>)}
          </select>
        </div>
      ))}
      <div>
        <label htmlFor="ano" className="block text-sm font-medium">Ano</label>
        <select id="ano" name="ano" defaultValue={String(ano)} className={campo}>
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <button type="submit" className="rounded-full bg-[var(--cor-acao)] px-5 py-2 font-medium text-white sm:col-span-5 sm:justify-self-start">Comparar</button>
    </form>
  );
}