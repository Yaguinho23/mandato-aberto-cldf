import Link from "next/link";
import type { Deputado } from "@/lib/types";

export function CartaoDeputado({ deputado }: { deputado: Deputado }) {
  const iniciais = deputado.nome.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return (
    <Link
      href={`/deputados/${deputado.slug}`}
      className="flex items-center gap-3 rounded-lg border border-[var(--cor-borda)] bg-white p-3 hover:border-[var(--cor-acao)]"
    >
      {deputado.fotoUrl ? (
        // Foto servida pela CLDF; <img> evita configurar domínio externo no otimizador de imagens.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={deputado.fotoUrl} alt={`Foto de ${deputado.nome}`} width={56} height={56} loading="lazy" className="h-14 w-14 rounded-full object-cover" />
      ) : (
        <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--cor-fundo-suave)] font-semibold text-[var(--cor-primaria)]">
          {iniciais}
        </span>
      )}
      <span>
        <span className="block font-semibold text-[var(--cor-primaria)]">{deputado.nome}</span>
        <span className="block text-sm text-[var(--cor-texto-suave)]">{deputado.partido ?? "Sem partido informado"}</span>
      </span>
    </Link>
  );
}