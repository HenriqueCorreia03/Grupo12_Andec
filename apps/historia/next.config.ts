import type { NextConfig } from "next";

/**
 * Site de apresentação "Evidência." (public/evidencia.html), à parte do dashboard.
 * Usa o Next que já está instalado na raiz do repositório; a raiz do site abre a página.
 */
const nextConfig: NextConfig = {
  agentRules: false,
  async redirects() {
    return [{ source: "/", destination: "/evidencia.html", permanent: false }];
  },
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
