import type { ReactNode } from "react";

function Icone({ children, tamanho = 20 }: { children: ReactNode; tamanho?: number }) {
  return (
    <svg aria-hidden="true" focusable="false" width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const IconeEscudo = ({ tamanho }: { tamanho?: number }) => (
  <Icone tamanho={tamanho}><path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></Icone>
);
export const IconePessoas = ({ tamanho }: { tamanho?: number }) => (
  <Icone tamanho={tamanho}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" /><path d="M16 4.7a3.5 3.5 0 010 6.6" /><path d="M18.5 14.8c1.6.8 2.7 2.4 3 5.2" /></Icone>
);
export const IconeDocumento = ({ tamanho }: { tamanho?: number }) => (
  <Icone tamanho={tamanho}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></Icone>
);
export const IconeMoeda = ({ tamanho }: { tamanho?: number }) => (
  <Icone tamanho={tamanho}><circle cx="12" cy="12" r="9" /><path d="M14.5 9.5c-.5-.9-1.400-1.500-2.500-1.500-1.400 0-2.500.8-2.500 2 0 2.800 5 1.500 5 4.200 0 1.200-1.100 2-2.500 2-1.200 0-2.100-.6-2.600-1.500M12 6.500V8m0 8v1.500" /></Icone>
);
export const IconeEtiqueta = ({ tamanho }: { tamanho?: number }) => (
  <Icone tamanho={tamanho}><path d="M3 12V4a1 1 0 011-1h8l9 9-9 9-9-9z" /><circle cx="8" cy="8" r="1.200" /></Icone>
);
export const IconeSeta = ({ tamanho }: { tamanho?: number }) => (
  <Icone tamanho={tamanho}><path d="M5 12h14M13 6l6 6-6 6" /></Icone>
);