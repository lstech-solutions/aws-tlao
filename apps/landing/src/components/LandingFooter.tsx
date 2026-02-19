'use client'

import Link from 'next/link'
import { Footer } from '@ai-agent-platform/ui'
import { ThemeToggleWrapper } from './ThemeToggle'

/**
 * Landing-specific Footer wrapper.
 * Passes Next.js Link for internal routes and ThemeToggle.
 */
export function LandingFooter({ version }: { version?: string }) {
  return (
    <Footer
      appType="landing"
      version={version}
      themeToggle={<ThemeToggleWrapper />}
      renderInternalLink={(href, label, className) => (
        <Link href={href} className={className}>
          {label}
        </Link>
      )}
    />
  )
}
