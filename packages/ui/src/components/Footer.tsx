'use client'

import { useEffect, useState, ReactNode } from 'react'
import { Github, Mail, Twitter, ExternalLink } from 'lucide-react'
import styles from './Footer.module.css'

export type AppType = 'landing' | 'docs' | 'app'

interface FooterProps {
  appType?: AppType
  version?: string
  showVersion?: boolean
  themeToggle?: ReactNode
  basePath?: string
  docsUrl?: string
  landingUrl?: string
  renderInternalLink?: (href: string, label: string, className: string) => ReactNode
}

function getEnvironmentUrls(docsUrl?: string, landingUrl?: string) {
  if (typeof window === 'undefined') {
    return { docs: docsUrl || '/documentation', landing: landingUrl || '/' }
  }
  const hostname = window.location.hostname
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
  return {
    docs: docsUrl || (isLocal ? 'http://localhost:3002' : '/aws-tlao/documentation'),
    landing: landingUrl || (isLocal ? 'http://localhost:3003' : '/aws-tlao'),
  }
}

function UnicornStudioBackground() {
  useEffect(() => {
    const embedScript = document.createElement('script')
    embedScript.type = 'text/javascript'
    embedScript.textContent = `!function(){if(!window.UnicornStudio){window.UnicornStudio={isInitialized:!1};var i=document.createElement("script");i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.33/dist/unicornStudio.umd.js";i.onload=function(){window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=!0)};(document.head || document.body).appendChild(i)}}();`
    document.head.appendChild(embedScript)

    const style = document.createElement('style')
    style.textContent = `
      [data-us-project] {
        position: absolute !important;
        top: -60% !important;
        left: -60% !important;
        width: 220% !important;
        height: 220% !important;
        overflow: hidden !important;
        transform: scale(0.7) !important;
        animation: zoomIn 1.2s ease-out forwards !important;
      }
      @keyframes zoomIn {
        from {
          transform: scale(0.4) !important;
          opacity: 0.5 !important;
        }
        to {
          transform: scale(0.7) !important;
          opacity: 1 !important;
        }
      }
      [data-us-project] canvas {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }
      [data-us-project] * { pointer-events: none !important; }
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

    const hideBranding = () => {
      document.querySelectorAll('[data-us-project]').forEach((container) => {
        container.querySelectorAll('*').forEach((el) => {
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
    setTimeout(hideBranding, 1200)
    const interval = setInterval(hideBranding, 500)
    setTimeout(() => clearInterval(interval), 8000)
    return () => {
      clearInterval(interval)
      document.head.removeChild(embedScript)
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className={styles.background}>
      <div data-us-project="OMzqyUv6M3kSnv0JeAtC" style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

function XiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="footer-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="32" cy="6" r="3.5" fill="currentColor" filter="url(#footer-glow)" />
      <rect
        x="14"
        y="16"
        width="36"
        height="5"
        rx="2.5"
        fill="currentColor"
        filter="url(#footer-glow)"
      />
      <rect
        x="14"
        y="29.5"
        width="36"
        height="5"
        rx="2.5"
        fill="currentColor"
        filter="url(#footer-glow)"
      />
      <rect
        x="14"
        y="43"
        width="36"
        height="5"
        rx="2.5"
        fill="currentColor"
        filter="url(#footer-glow)"
      />
    </svg>
  )
}

export function Footer({
  version,
  showVersion = true,
  themeToggle,
  docsUrl,
  landingUrl,
}: FooterProps) {
  const [mounted, setMounted] = useState(false)
  const [urls, setUrls] = useState({ docs: '', landing: '' })

  useEffect(() => {
    setMounted(true)
    setUrls(getEnvironmentUrls(docsUrl, landingUrl))
  }, [docsUrl, landingUrl])

  if (!mounted) return null

  return (
    <footer className={styles.footer}>
      <UnicornStudioBackground />

      <div className={styles.content}>
        <div className={styles.grid}>
          {/* Brand — spans 2 columns on desktop */}
          <div className={styles.brand}>
            <div className={styles.brandHeader}>
              <div className={styles.iconBox}>
                <XiIcon className={styles.icon} />
              </div>
              <span className={styles.title}>TLÁO</span>
            </div>
            <p className={styles.description}>
              Autonomous agent platform for execution planning and grant discovery.
            </p>
            <div className={styles.socialIcons}>
              <a
                href="https://github.com/lstech-solutions/aws-tlao"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="GitHub"
              >
                <Github className={styles.socialIcon} />
              </a>
              <a
                href="https://x.com/LSTS_TECH"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="X (Twitter)"
              >
                <Twitter className={styles.socialIcon} />
              </a>
              <a href="mailto:hello@tláo.com" className={styles.socialLink} aria-label="Email">
                <Mail className={styles.socialIcon} />
              </a>
            </div>
          </div>

          {/* AI Agents */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>AI Agents</h3>
            <ul className={styles.linkList}>
              <li>
                <a href="#" className={styles.link}>
                  <span className={styles.dot} />
                  TLÁO Plan
                </a>
              </li>
              <li>
                <a href="#" className={styles.link}>
                  <span className={styles.dot} />
                  TLÁO Grant
                </a>
              </li>
              <li>
                <a href="#" className={styles.link}>
                  <span className={styles.dot} />
                  Demo
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Resources</h3>
            <ul className={styles.linkList}>
              <li>
                <a href={urls.docs} className={styles.link}>
                  <span className={styles.dot} />
                  Documentation
                  <ExternalLink className={styles.externalIcon} />
                </a>
              </li>
              <li>
                <a
                  href="https://aws.amazon.com/bedrock/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  <span className={styles.dot} />
                  AWS Bedrock
                  <ExternalLink className={styles.externalIcon} />
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className={styles.link}>
                  <span className={styles.dot} />
                  Privacy
                </a>
              </li>
              <li>
                <a href="/terms-of-service" className={styles.link}>
                  <span className={styles.dot} />
                  Terms
                </a>
              </li>
              <li>
                <a href="/contact" className={styles.link}>
                  <span className={styles.dot} />
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={styles.bottom}>
          <div className={styles.copyright}>
            <span>© {new Date().getFullYear()} TLÁO</span>
            {showVersion && version && <span className={styles.version}>{version}</span>}
          </div>
          {themeToggle && <div>{themeToggle}</div>}
        </div>
      </div>
    </footer>
  )
}
