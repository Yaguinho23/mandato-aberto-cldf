"use client";
import { useState, type ReactNode } from "react";
import type { ResumoVerba } from "@/lib/dados";
import type { TipoProposicao } from "@/lib/types";
import { formatarBRL } from "@/lib/formato";
import { BlocoResumo } from "./BlocoResumo";
import { GraficoGastos } from "./GraficoGastos";
import { SemRegistros } from "./SemRegistros";

export interface DadosDoAno {
  ano: number;
  proposicoes: number;
  porTipo: Record<TipoProposicao, number>;
  verba: ResumoVerba | null;
}

export function PainelAno({ anos, anoInicial, fonteProposicoes, fonteVerba }: { anos: DadosDoAno[]; anoInicial: number; fonteProposicoes: ReactNode; fonteVerba: ReactNode }) {
  const [ano, setAno] = useState(anoInicial);
  const dados = anos.find((a) => a.ano === ano) ?? anos[0];
  const tipos = Object.entries(dados.porTipo).filter(([, n]) => n > 0);
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="ano" className="mr-2 text-sm font-medium">Ano</label>
        <select id="ano" value={ano} onChange={(e) => setAno(Number(e.target.value))} className="rounded-lg border border-[var(--cor-borda)] bg-white px-2 py-1">
          {anos.map((a) => <option key={a.ano} value={a.ano}>{a.ano}</option>)}
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BlocoResumo titulo={`Proposições em ${dados.ano}`}>
          {dados.proposicoes === 0 ? (
            <SemRegistros />
          ) : (
            <>
              <p className="text-3xl font-bold text-[var(--cor-primaria)]">{dados.proposicoes}</p>
              <p className="text-sm">{tipos.map(([t, n]) => `${n} ${t}`).join(" · ")}</p>
            </>
          )}
          {fonteProposicoes}
        </BlocoResumo>
        <BlocoResumo titulo={`Verba indenizatória em ${dados.ano}`}>
          {dados.verba === null ? (
            <SemRegistros />
          ) : (
            <>
              <p className="text-3xl font-bold text-[var(--cor-primaria)]">{formatarBRL(dados.verba.totalCentavos)}</p>
              <p className="mb-4 text-sm">em comprovantes publicados em dados abertos (pode não incluir todos os lançamentos do painel oficial da CLDF)</p>
              <GraficoGastos {...dados.verba} />
            </>
          )}
          {fonteVerba}
        </BlocoResumo>
      </div>
    </div>
  );
}