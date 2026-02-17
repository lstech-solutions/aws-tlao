'use client'

import { Bot, Globe, Github, ExternalLink, Mail, Twitter } from 'lucide-react'
import { getVersion } from '@ai-agent-platform/versioning'
import { ThemeToggleWrapper } from './ThemeToggle'
import { useEffect } from 'react'

let versionInfo = 'v1.0.0'
try {
  versionInfo = getVersion()
} catch (error) {
  console.warn('Failed to load version info:', error)
}

// Unicorn Studio animation component as background
function UnicornStudioBackground() {
  useEffect(() => {
    const embedScript = document.createElement('script')
    embedScript.type = 'text/javascript'
    embedScript.textContent = `!function(){if(!window.UnicornStudio){window.UnicornStudio={isInitialized:!1};var i=document.createElement("script");i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js";i.onload=function(){window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0)};(document.head || document.body).appendChild(i)}}();`
    document.head.appendChild(embedScript)

    // Add CSS to hide branding and zoom animation
    const style = document.createElement('style')
    style.textContent = `
      [data-us-project] {
        position: absolute !important;
        top: -10% !important;
        left: -10% !important;
        width: 120% !important;
        height: 120% !important;
        overflow: hidden !important;
        transform: scale(1.3) !important;
      }
      [data-us-project] canvas {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }
      [data-us-project] * {
        pointer-events: none !important;
      }
      [data-us-project] a,
      [data-us-project] button,
      [data-us-project] div[class*="brand"],
      [data-us-project] div[class*="credit"],
      [data-us-project] div[class*="watermark"],
      [data-us-project] [href*="unicorn"],
      [data-us-project] [title*="unicorn"],
      [data-us-project] [title*="Made with"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        top: -9999px !important;
      }
    `
    document.head.appendChild(style)

    // Aggressively hide branding
    const hideBranding = () => {
      const containers = document.querySelectorAll('[data-us-project]')
      containers.forEach((container) => {
        const allElements = container.querySelectorAll('*')
        allElements.forEach((el) => {
          const text = (el.textContent || '').toLowerCase()
          const title = (el.getAttribute('title') || '').toLowerCase()
          const href = (el.getAttribute('href') || '').toLowerCase()
          if (
            text.includes('made with') ||
            text.includes('unicorn') ||
            title.includes('made with') ||
            title.includes('unicorn') ||
            href.includes('unicorn.studio')
          ) {
            el.remove()
          }
        })
      })
    }

    hideBranding()
    const interval = setInterval(hideBranding, 100)
    setTimeout(() => clearInterval(interval), 10000)

    return () => {
      clearInterval(interval)
      document.head.removeChild(embedScript)
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden opacity-20">
      <div data-us-project="OMzqyUv6M3kSnv0JeAtC" style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="relative bg-muted text-foreground transition-colors duration-300 overflow-hidden">
      {/* Unicorn Studio Animation as Background */}
      <UnicornStudioBackground />

      {/* Content overlay */}
      <div className="relative z-10 container-max py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold">TLÁO</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              Autonomous agent platform for execution planning and grant discovery.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/lstech-solutions/aws-tlao"
                className="w-9 h-9 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-300 hover:scale-110"
                aria-label="GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                className="w-9 h-9 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="mailto:hello@tlao.dev"
                className="w-9 h-9 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-300 hover:scale-110"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Agents */}
          <div>
            <h3 className="font-semibold mb-4">AI Agents</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#agents"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <div className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  TLÁO Plan
                </a>
              </li>
              <li>
                <a
                  href="#agents"
                  className="text-muted-foreground hover:text-accent transition-colors flex items-center gap-2 group"
                >
                  <div className="w-1 h-1 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                  TLÁO Grant
                </a>
              </li>
              <li>
                <a
                  href="#demo"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                >
                  <div className="w-1 h-1 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  Demo
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/documentation`}
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                >
                  <div className="w-1 h-1 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  Documentation
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a
                  href="https://aws.amazon.com/bedrock/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                >
                  <div className="w-1 h-1 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  AWS Bedrock
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a
                  href="/privacy-policy"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                >
                  <div className="w-1 h-1 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="/terms-of-service"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                >
                  <div className="w-1 h-1 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                >
                  <div className="w-1 h-1 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border/50 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-muted-foreground text-sm flex items-center gap-4">
            <span>© 2025 TLÁO</span>
            {versionInfo && (
              <span className="bg-card/50 backdrop-blur-sm px-2 py-1 rounded text-xs border border-border/50">
                {versionInfo}
              </span>
            )}
          </div>
          <ThemeToggleWrapper />
        </div>
      </div>
    </footer>
  )
}
