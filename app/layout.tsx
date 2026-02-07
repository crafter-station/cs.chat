import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark, shadcn } from "@clerk/themes";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "C3.chat",
  description: "by Crafter Station",
  metadataBase: new URL("https://c3.crafter.run"),
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "C3.chat",
    description: "by Crafter Station",
    url: "https://c3.crafter.run",
    siteName: "C3.chat",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        type: "image/png",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "C3.chat",
    description: "by Crafter Station",
    images: ["/og-twitter.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ baseTheme: [dark, shadcn] }}>
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "16rem",
              } as React.CSSProperties
            }
          >
            <AppSidebar variant="inset" />
            <SidebarInset>
              {children}
            </SidebarInset>
          </SidebarProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
    </ClerkProvider>
  );
}
