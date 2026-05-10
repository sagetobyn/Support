import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wembro — AI Operations OS for Ecommerce Sellers",
  description: "Automatically detect, prevent, and recover operational losses across ecommerce marketplaces with connected data, AI agents, automation policies, and clear audit trails."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
