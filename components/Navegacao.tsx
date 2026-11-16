"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/#deputados", rotulo: "Deputados", raiz: "/deputados" },
  { href: "/proposicoes", rotulo: "Proposições", raiz: "/proposicoes" },
  { href: "/comissoes-e-frentes", rotulo: "Comissões e frentes", raiz: "/comissoes-e-frentes" },
  { href: "/comparar", rotulo: "Comparar", raiz: "/comparar" },
  { href: "/dados", rotulo: "Sobre os dados", raiz: "/dados" },
];

export function Navegacao() {
  const caminho = usePathname();
  return (
    <nav aria-label="Principal">
      <ul className="flex flex-wrap gap-x-1 text-sm font-medium">
        {ITENS.map((n) => {
          const atual = caminho === n.raiz || caminho.startsWith(n.raiz + "/");
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={atual ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 px-2 hover:text-[var(--cor-primaria)] ${atual ? "border-[var(--cor-detalhe)] text-[var(--cor-primaria)]" : "border-transparent text-[var(--cor-texto-suave)]"}`}
              >
                {n.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}