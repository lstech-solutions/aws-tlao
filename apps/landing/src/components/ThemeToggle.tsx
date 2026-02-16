'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { useEffect, useState } from 'react'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const themes: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark']
  const currentIndex = themes.indexOf(theme)
  const nextTheme = themes[(currentIndex + 1) % themes.length]

  const getIcon = () => {
    switch (theme) {
      case 'system':
        return <Monitor className="w-4 h-4" />
      case 'light':
        return <Sun className="w-4 h-4" />
      case 'dark':
        return <Moon className="w-4 h-4" />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'system':
        return 'System'
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
    }
  }

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors border border-border"
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Current: ${getLabel()} | Click to switch to ${nextTheme}`}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </button>
  )
}

export function ThemeToggleWrapper() {
  return <ThemeToggle />
}
