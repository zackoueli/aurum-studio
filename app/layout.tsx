import type { Metadata } from "next";
import "./globals.css";
import Cursor from "@/components/Cursor";

export const metadata: Metadata = {
  title: "Aurum Studio",
  description: "Salon de coiffure premium — Paris",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Cursor />
        {children}
      </body>
    </html>
  );
}
