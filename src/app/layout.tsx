import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wembro — Profit Recovery for D2C Sellers",
  description: "Recover profit after checkout by fixing COD risk, NDR rescue, RTO leakage, and savings proof — without spreadsheets."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
