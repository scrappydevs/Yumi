import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { GlassFilters } from "@/components/glass-filters";
import { AuthProvider } from "@/lib/auth-context";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yummy - Personalized AI Food Recommendations",
  description: "AI-powered restaurant discovery with personalized recommendations based on your taste profile and preferences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        style={{ fontFamily: 'var(--font-inter)' }}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <GlassFilters />
      </body>
    </html>
  );
}
