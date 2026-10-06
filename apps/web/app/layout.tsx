import type { Metadata } from "next";
import { Kalam, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { themeInitScript } from "@/lib/theme";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Handwriting face for sample strokes and ink annotations.
const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Coreta",
  description: "Worksheet matematika TKA/UTBK yang dikerjakan dengan mencoret langsung di layar.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The init script adds the "dark" class before hydration, so the attribute differs by design.
    <html
      lang="id"
      className={`${jakarta.variable} ${kalam.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <Toaster>{children}</Toaster>
        </TooltipProvider>
      </body>
    </html>
  );
}
