import type { ReactNode } from "react";

export function BlocoResumo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[var(--cor-borda)] bg-white p-4">
      <h3 className="mb-3 text-lg font-bold text-[var(--cor-primaria)]">{titulo}</h3>
      {children}
    </section>
  );
}