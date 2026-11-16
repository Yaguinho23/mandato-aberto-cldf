import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sobre · Mandato Aberto · CLDF" };

export default function Sobre() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold text-[var(--cor-primaria)]">Sobre o projeto</h1>
      <p>
        O Mandato Aberto · CLDF reúne, em um só lugar, as proposições e a verba indenizatória dos deputados distritais da Câmara Legislativa do Distrito Federal na
        legislatura 2023–2026. Ele faz parte da iniciativa{" "}
        <a className="underline" href="https://mandatoaberto.org" target="_blank" rel="noopener noreferrer">Mandato Aberto</a>.
      </p>
      <p>Iniciativa independente. Não é um site oficial da CLDF. Os dados são públicos e cada número tem link para a fonte e a data da coleta.</p>

      <section>
        <h2 className="mb-2 text-xl font-bold text-[var(--cor-primaria)]">Princípios</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Transparência: toda informação mostra de onde veio e quando foi coletada.</li>
          <li>Independência partidária: nenhum deputado ou partido recebe destaque, nota ou posição em ranking.</li>
          <li>Acesso público: gratuito, sem cadastro, pensado para o celular.</li>
          <li>Participação cidadã: erros podem ser apontados por qualquer pessoa e são corrigidos com base na fonte.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-[var(--cor-primaria)]">Contato</h2>
        <p>
          E-mail:{" "}
          <a className="underline" href="mailto:contato@mandatoaberto.org">contato@mandatoaberto.org</a>
          {" · "}
          Instagram:{" "}
          <a className="underline" href="https://www.instagram.com/mandatoaberto" target="_blank" rel="noopener noreferrer">@mandatoaberto</a>
        </p>
      </section>
    </div>
  );
}