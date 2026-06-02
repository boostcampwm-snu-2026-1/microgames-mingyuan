import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Microgames",
  description: "A fast web microgame project built with Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
