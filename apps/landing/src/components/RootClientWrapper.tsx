'use client'

import { AppProvider } from '@tlao/ui'
import { ThemeProvider } from './ThemeProvider'
import { BackToTopButtonWrapper } from './ScrollControls'

interface RootClientWrapperProps {
  children: React.ReactNode
  basePath: string
}

export function RootClientWrapper({ children, basePath }: RootClientWrapperProps) {
  return (
    <AppProvider appType="landing" basePath={basePath}>
      <ThemeProvider>
        <BackToTopButtonWrapper />
        {children}
      </ThemeProvider>
    </AppProvider>
  )
}
