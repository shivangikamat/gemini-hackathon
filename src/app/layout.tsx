import type { ReactNode } from "react";
import "./globals.css";
import N8nChatWidget from "@/components/N8nChatWidget";

export const metadata = {
  title: "HairMatch",
  description: "AI hairstyle suggestions with local salon matching",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        {children}
        <N8nChatWidget />
      </body>
    </html>
  );
}

