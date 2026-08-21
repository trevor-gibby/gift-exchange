import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Gift Exchange — Make the season surprising",
    template: "%s | Gift Exchange",
  },
  description: "Create a joyful, private gift exchange with thoughtful exclusions and a fair randomized draw.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <div className="ambient ambient-left" aria-hidden="true" />
        <div className="ambient ambient-right" aria-hidden="true" />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
