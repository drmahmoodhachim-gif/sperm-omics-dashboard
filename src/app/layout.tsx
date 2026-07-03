import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DEVELOPER } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "SpermOmics Resource Library",
  description:
    "Publication-ready figures, tables, methods, and curated public omics data for male infertility and sperm research.",
  authors: [{ name: DEVELOPER.name, url: DEVELOPER.profileUrl }],
  creator: DEVELOPER.name,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${serif.variable} ${mono.variable} font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
