import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Harness",
  description: "Personal AWS Bedrock prompt lab",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
