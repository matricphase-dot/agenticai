import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'AgenticAI — The Infrastructure Layer for the AI Agent Economy',
  description: 'Create, deploy, and monetize AI agents. Earn rewards by staking on the best agents. Join the decentralized AI economy.',
  keywords: 'AI agents, agent marketplace, staking, DeFi, LLM, automation',
  openGraph: {
    title: 'AgenticAI Platform',
    description: 'The Infrastructure Layer for the AI Agent Economy',
    url: 'https://agenticai-frontend-3tam.onrender.com',
    siteName: 'AgenticAI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgenticAI Platform',
    description: 'The Infrastructure Layer for the AI Agent Economy',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
