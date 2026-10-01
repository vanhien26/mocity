import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoCity",
  description: "MoCity - MoMo City Building Game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
