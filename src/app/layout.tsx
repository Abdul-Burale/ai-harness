import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Harness | Local-first AWS Bedrock CLI",
  description:
    "Run, save, and compare AWS Bedrock prompts locally. A cost-aware AI evaluation CLI built for repeatable prompt work.",
  openGraph: {
    title: "AI Harness",
    description:
      "A local-first AWS Bedrock prompt evaluation CLI with a safe interactive demo.",
    type: "website",
  },
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
