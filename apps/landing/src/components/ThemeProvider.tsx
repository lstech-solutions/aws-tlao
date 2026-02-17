'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Only run on client
    setMounted(true)

    // Check localStorage for saved preference, default to 'system'
    const stored = localStorage.getItem('theme') as Theme | null
    const initialTheme = stored || 'system'
    setThemeState(initialTheme)

    // Apply theme on mount
    const html = document.documentElement
    let effectiveTheme: 'light' | 'dark'

    if (initialTheme === 'system') {
      effectiveTheme = getSystemTheme()
    } else {
      effectiveTheme = initialTheme
    }

    setResolvedTheme(effectiveTheme)

    if (effectiveTheme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

    // Save system as default if nothing was stored
    if (!stored) {
      localStorage.setItem('theme', 'system')
    }
  }, [])

  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement
    let effectiveTheme: 'light' | 'dark'

    if (newTheme === 'system') {
      effectiveTheme = getSystemTheme()
    } else {
      effectiveTheme = newTheme
    }

    setResolvedTheme(effectiveTheme)

    if (effectiveTheme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }

    localStorage.setItem('theme', newTheme)
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
  }

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      applyTheme('system')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mounted, theme, applyTheme])

  // Always render with provider to avoid hydration mismatch
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // Return a default value during SSR instead of throwing
    return { theme: 'system' as const, setTheme: () => {}, resolvedTheme: 'light' as const }
  }
  return context
}
