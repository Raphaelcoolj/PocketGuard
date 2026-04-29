import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PwaRegister } from "@/components/PwaRegister";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PocketGuard",
  description: "Track your finances in a smart way",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <AuthProvider>
          <ThemeProvider>
            {children}
            <PwaRegister />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}