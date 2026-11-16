"use client";
import { useId, useState, type ReactNode } from "react";
import { GLOSSARIO } from "@/lib/glossario";

export function Termo({ id, children }: { id: string; children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const idDescricao = useId();
  const entrada = GLOSSARIO[id];
  if (!entrada) return <>{children}</>;
  return (
    <span className="relative inline">
      <button
        type="button"
        aria-expanded={aberto}
        aria-describedby={aberto ? idDescricao : undefined}
        onClick={() => setAberto(!aberto)}
        onBlur={() => setAberto(false)}
        className="border-b border-dotted border-[var(--cor-primaria)] font-medium"
      >
        {children}
      </button>
      {aberto ? (
        <span id={idDescricao} role="note" className="mt-1 block rounded-lg border border-[var(--cor-borda)] bg-[var(--cor-fundo-suave)] p-2 text-sm font-normal">
          {entrada.explicacao}
        </span>
      ) : null}
    </span>
  );
}