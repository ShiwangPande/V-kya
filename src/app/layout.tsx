import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Smart Content Generator",
    template: "%s | Smart Content Generator"
  },
  description: "AI-powered content generation tool using OpenAI GPT",
  keywords: ["AI", "content", "generator", "OpenAI", "GPT", "writing assistant"],
  authors: [{ name: "Content Generator" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen w-full bg-background font-sans antialiased",
          "selection:bg-blue-600/10 selection:text-blue-600",
          "dark:selection:bg-blue-400/10 dark:selection:text-blue-400",
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="relative flex min-h-screen flex-col">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}