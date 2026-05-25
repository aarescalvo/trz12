import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ResilienceProvider } from "@/components/ResilienceProvider";
import { PreferenciasUIProvider } from "@/components/providers/preferencias-init";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solemar Alimentaria - Sistema Frigorífico",
  description: "Sistema de gestión frigorífica para control de tropas, pesaje y faena.",
  authors: [{ name: "Solemar Alimentaria" }],
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <PreferenciasUIProvider>
              <ResilienceProvider>
                {children}
              </ResilienceProvider>
            </PreferenciasUIProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
