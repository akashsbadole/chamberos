import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import SecurityGate from "@/components/SecurityGate";

export const metadata: Metadata = {
  title: "Chambers — Practice Management",
  description: "AI-first practice management for law firms",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <LocaleProvider>
          <StoreProvider>
            <SecurityGate>{children}</SecurityGate>
          </StoreProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
