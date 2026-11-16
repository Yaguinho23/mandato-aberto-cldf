import Link from "next/link";
import type { Deputado } from "@/lib/types";

export function CartaoDeputado({ deputado }: { deputado: Deputado }) {
  const iniciais = deputado.nome.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return (
    <Link
      href={`/deputados/${deputado.slug}`}
      className="cartao flex min-h-16 items-center gap-3 p-3"
    >
      {deputado.fotoUrl ? (
        // Foto servida pela CLDF; <img> evita configurar domínio externo no otimizador de imagens.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={deputado.fotoUrl} alt={`Foto de ${deputado.nome}`} width={56} height={56} loading="lazy" className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--cor-detalhe)]" />
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