'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggleWrapper } from './ThemeToggle'
import { TlaoXiIcon } from './icons/TlaoIcons'

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="container-max flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <TlaoXiIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">TLÁO</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
        <ThemeToggleWrapper />
      </div>
    </nav>
  )
}
