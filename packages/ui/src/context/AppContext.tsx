'use client'

import { createContext, useContext, ReactNode } from 'react'

export type AppType = 'landing' | 'docs' | 'app'

interface AppContextType {
  appType: AppType
  basePath: string
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({
  children,
  appType,
  basePath = '',
}: {
  children: ReactNode
  appType: AppType
  basePath?: string
}) {
  return <AppContext.Provider value={{ appType, basePath }}>{children}</AppContext.Provider>
}

export function useApp(): AppContextType {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
