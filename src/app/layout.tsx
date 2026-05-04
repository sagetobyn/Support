import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SupportWaala — RTOShield Profit Recovery Control Room",
  description: "Client-first RTO/NDR profit recovery control room for Indian e-commerce sellers"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
