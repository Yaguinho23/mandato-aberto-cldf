import type { Metadata } from "next";
import Link from "next/link";
import { AvisoIndependencia } from "@/components/AvisoIndependencia";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mandato Aberto · CLDF",
  description: "Proposições e verba indenizatória dos deputados distritais da Câmara Legislativa do DF, com a fonte de cada número.",
};

const NAVEGACAO = [
  { href: "/#deputados", rotulo: "Deputados" },
  { href: "/proposicoes", rotulo: "Proposições" },
  { href: "/comparar", rotulo: "Comparar" },
  { href: "/sobre", rotulo: "Sobre os dados" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AvisoIndependencia />
        <header className="border-b border-[var(--cor-borda)]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
            <Link href="/" className="font-bold text-[var(--cor-primaria)]">
              Mandato Aberto · CLDF
            </Link>
            <nav aria-label="Principal">
              <ul className="flex flex-wrap gap-4 text-sm">
                {NAVEGACAO.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="hover:underline">
                      {n.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="mt-8 border-t border-[var(--cor-borda)]">
          <AvisoIndependencia />
          <p className="mx-auto max-w-5xl px-4 py-4 text-sm text-[var(--cor-texto-suave)]">
            Dados públicos da Câmara Legislativa do DF. Encontrou um erro?{" "}
            <a className="underline" href="mailto:contato@mandatoaberto.org">
              contato@mandatoaberto.org
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}