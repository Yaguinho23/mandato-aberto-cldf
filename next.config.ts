import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /proposicoes é renderizada no servidor (20 mil itens, filtros por URL); precisa dos dados no pacote.
  outputFileTracingIncludes: { "/proposicoes": ["./data/**/*"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
