import type { Metadata } from "next";
import "./globals.css";
import "./book.css";
import AppLayout from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "Crônicas — O registro de suas aventuras",
  description:
    "Registre campanhas, acontecimentos e histórias das suas aventuras de RPG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}