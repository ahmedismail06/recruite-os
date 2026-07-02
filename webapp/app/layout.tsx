import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  description: "Ahmed's personal recruiting system",
};

const NAV = [
  { href: "/", label: "Pipeline" },
  { href: "/contacts", label: "Contacts" },
  { href: "/profile", label: "Profile Bank" },
];

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
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
            <nav className="flex items-center gap-6">
              <span className="text-sm font-semibold tracking-tight">
                Recruiting OS
              </span>
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action="/auth/signout" method="post">
              <button className="cursor-pointer text-sm text-slate-400 hover:text-slate-700">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
