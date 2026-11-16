import type { Metadata } from "next";
import Link from "next/link";
import { AvisoIndependencia } from "@/components/AvisoIndependencia";
import { IconeEscudo } from "@/components/Icones";
import { Navegacao } from "@/components/Navegacao";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mandato Aberto · CLDF",
  description: "Proposições e verba indenizatória dos deputados distritais da Câmara Legislativa do DF, com a fonte de cada número.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AvisoIndependencia />
        <header className="sticky top-0 z-20 border-b border-[var(--cor-borda)] bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 px-4 py-1">
            <Link href="/" className="flex min-h-11 items-center gap-2 font-bold text-[var(--cor-primaria)]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--cor-primaria)] text-[var(--cor-detalhe)]"><IconeEscudo tamanho={18} /></span>
              Mandato Aberto · CLDF
            </Link>
            <Navegacao />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-[var(--cor-borda)] bg-[var(--cor-fundo-suave)]">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
            <div>
              <p className="font-bold text-[var(--cor-primaria)]">Mandato Aberto · CLDF</p>
              <p className="mt-1 text-[var(--cor-texto-suave)]">Dados públicos da Câmara Legislativa do DF, com a fonte de cada número.</p>
            </div>
            <div>
              <p className="font-semibold">Navegação</p>
              <ul className="mt-1 space-y-1">
                <li><Link className="inline-block py-1 underline" href="/proposicoes">Proposições</Link></li>
                <li><Link className="inline-block py-1 underline" href="/comparar">Comparar</Link></li>
                <li><Link className="inline-block py-1 underline" href="/dados">Sobre os dados</Link></li>
                <li><Link className="inline-block py-1 underline" href="/sobre">Sobre o projeto</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Encontrou um erro?</p>
              <p className="mt-1"><a className="inline-block py-1 underline" href="mailto:contato@mandatoaberto.org">contato@mandatoaberto.org</a></p>
            </div>
          </div>
          <AvisoIndependencia />
        </footer>
      </body>
    </html>
  );
}