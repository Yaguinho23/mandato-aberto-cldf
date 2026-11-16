import type { TipoProposicao } from "@/lib/types";
import { TIPOS_PROPOSICAO } from "@/lib/types";

export interface FiltrosAtuais {
  tipo?: TipoProposicao;
  ano?: number;
  autor?: string;
}

const campo = "w-full rounded-lg border border-[var(--cor-borda)] bg-white px-2 py-1";

export function FiltrosProposicoes({ deputados, anos, atual }: { deputados: { slug: string; nome: string }[]; anos: number[]; atual: FiltrosAtuais }) {
  return (
    <form method="get" action="/proposicoes" className="grid gap-3 sm:grid-cols-4 sm:items-end">
      <div>
        <label htmlFor="f-tipo" className="block text-sm font-medium">Tipo</label>
        <select id="f-tipo" name="tipo" defaultValue={atual.tipo ?? ""} className={campo}>
          <option value="">Todos</option>
          {TIPOS_PROPOSICAO.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-ano" className="block text-sm font-medium">Ano</label>
        <select id="f-ano" name="ano" defaultValue={atual.ano === undefined ? "" : String(atual.ano)} className={campo}>
          <option value="">Todos</option>
          {anos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="f-autor" className="block text-sm font-medium">Autor</label>
        <select id="f-autor" name="autor" defaultValue={atual.autor ?? ""} className={campo}>
          <option value="">Todos</option>
          {deputados.map((d) => <option key={d.slug} value={d.slug}>{d.nome}</option>)}
        </select>
      </div>
      <button type="submit" className="rounded-full bg-[var(--cor-acao)] px-5 py-2 font-medium text-white">Filtrar</button>
    </form>
  );
}