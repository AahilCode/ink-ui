import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "INK UI — From sketch to interactive",
  description:
    "Turn a hand-drawn interface into a working prototype. Ink UI converts your sketches into interactive UI instantly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#08080A] text-zinc-100 selection:bg-white/15 font-sans">
        {children}
      </body>
    </html>
  );
}
