"use client";
import { useState } from "react";
import type { Deputado } from "@/lib/types";
import { CartaoDeputado } from "./CartaoDeputado";

const simplificar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function BuscaDeputados({ deputados }: { deputados: Deputado[] }) {
  const [busca, setBusca] = useState("");
  const termo = simplificar(busca.trim());
  const visiveis = termo === "" ? deputados : deputados.filter((d) => simplificar(d.nome).includes(termo));
  return (
    <div>
      <label htmlFor="busca" className="block text-sm font-medium">
        Buscar deputado pelo nome
      </label>
      <input
        id="busca"
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[var(--cor-borda)] bg-white px-3 py-2 sm:max-w-sm"
      />
      <p className="mt-2 text-sm text-[var(--cor-texto-suave)]" aria-live="polite">
        {visiveis.length} de {deputados.length} deputados, em ordem alfabética
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visiveis.map((d) => (
          <li key={d.slug}>
            <CartaoDeputado deputado={d} />
          </li>
        ))}
      </ul>
    </div>
  );
}