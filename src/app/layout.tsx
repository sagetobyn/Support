import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportWaala — RTOShield Profit Recovery SaaS",
  description: "Modern COD, NDR, and RTO profit recovery SaaS for ecommerce sellers"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
