"use client";
import { useState, type ReactNode } from "react";
import type { ResumoVerba } from "@/lib/dados";
import type { TipoProposicao } from "@/lib/types";
import { formatarBRL } from "@/lib/formato";
import { nomeDoTema } from "@/lib/temas";
import { BlocoResumo } from "./BlocoResumo";
import { IconeEtiqueta } from "./Icones";
import { GraficoGastos } from "./GraficoGastos";
import { SemRegistros } from "./SemRegistros";

export interface DadosDoAno {
  ano: number;
  proposicoes: number;
  porTipo: Record<TipoProposicao, number>;
  verba: ResumoVerba | null;
  porTema: { tema: string; quantidade: number }[];
  semTema: number;
}

export function PainelAno({ slug, anos, anoInicial, fonteProposicoes, fonteVerba }: { slug: string; anos: DadosDoAno[]; anoInicial: number; fonteProposicoes: ReactNode; fonteVerba: ReactNode }) {
  const [ano, setAno] = useState(anoInicial);
  const dados = anos.find((a) => a.ano === ano) ?? anos[0];
  const tipos = Object.entries(dados.porTipo).filter(([, n]) => n > 0);
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="ano" className="mr-2 text-sm font-medium">Ano</label>
        <select id="ano" value={ano} onChange={(e) => setAno(Number(e.target.value))} className="campo w-auto">
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
              {dados.porTema.length > 0 ? (
                <div className="mt-5">
                  <h3 className="mb-2 flex items-center gap-2 font-semibold text-[var(--cor-primaria)]"><IconeEtiqueta tamanho={18} /> Temas das proposições</h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {dados.porTema.map((t) => (
                      <li key={t.tema}>
                        <a
                          href={`/proposicoes?autor=${slug}&ano=${dados.ano}&tema=${t.tema}`}
                          className="cartao flex min-h-11 flex-col items-center px-3 py-3 text-center"
                        >
                          <span className="text-sm font-semibold">{nomeDoTema(t.tema)}</span>
                          <span className="text-sm text-[var(--cor-texto-suave)]">{t.quantidade} {t.quantidade === 1 ? "proposição" : "proposições"}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-[var(--cor-texto-suave)]">
                    Temas identificados por palavras na ementa; uma proposição pode ter mais de um tema.
                    {dados.semTema > 0 ? ` ${dados.semTema} ${dados.semTema === 1 ? "proposição não tem" : "proposições não têm"} tema identificado.` : ""}
                  </p>
                </div>
              ) : null}
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