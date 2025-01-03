"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="theme-preference"
      themes={["light", "dark", "system"]}
      value={{
        light: "light",
        dark: "dark",
        system: "system",
      }}
      disableTransitionOnChange={false}
      {...props}
    >
 
        {children}

    </NextThemesProvider>
  )
}