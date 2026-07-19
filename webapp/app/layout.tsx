import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import TopNav from "@/components/TopNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recruiting OS",
  description: "Personal recruiting system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg font-sans text-text-primary">
        <div className="flex min-h-screen justify-center overflow-x-auto px-6 py-7">
          <div className="h-fit w-full max-w-[1440px] overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
            <Suspense fallback={<div className="h-[60px]" />}>
              <TopNav />
            </Suspense>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
