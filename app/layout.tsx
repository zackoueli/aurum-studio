import type { Metadata } from "next";
import "./globals.css";
import Cursor from "@/components/Cursor";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Aurum Studio",
  description: "Salon de coiffure premium — Paris",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <Cursor />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
