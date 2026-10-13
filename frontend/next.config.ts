import type { NextConfig } from "next";

const apiInternalUrl = (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8001").replace(/\/+$/, "");

if (process.env.VERCEL) {
  if (!process.env.API_INTERNAL_URL) {
    throw new Error("Configure API_INTERNAL_URL na Vercel com a URL HTTPS da API hospedada.");
  }
  const apiUrl = new URL(apiInternalUrl);
  if (apiUrl.protocol !== "https:" || apiUrl.username || apiUrl.password ||
      ["localhost", "127.0.0.1", "[::1]"].includes(apiUrl.hostname) || apiUrl.search || apiUrl.hash) {
    throw new Error("API_INTERNAL_URL deve ser uma URL HTTPS pública, sem credenciais, query ou fragmento.");
  }
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiInternalUrl}/:path*` }];
  },
};

export default nextConfig;
