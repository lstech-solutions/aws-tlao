import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { RootClientWrapper } from '@/components/RootClientWrapper'

const inter = Inter({ subsets: ['latin', 'greek'] })

export const metadata: Metadata = {
  title: 'TLÁO - Tactical Layer for Action & Outcomes',
  description:
    'TLÁO (τλάω - to bear, to endure) — AI agents and control plane that carry your operational burden. Transform messy inputs into execution plans with TLÁO Plan, discover grants with TLÁO Grant, manage emails with TLÁO Email, and orchestrate agents with TLÁO Builder. Powered by AWS Bedrock.',
  keywords: [
    'AI',
    'AWS',
    'Bedrock',
    'Lambda',
    'DynamoDB',
    'agents',
    'automation',
    'grants',
    'operations',
    'TLÁO',
    'execution planning',
    'grant discovery',
  ],
  authors: [{ name: 'TLÁO Team' }],
  openGraph: {
    title: 'TLÁO - AI Agents That Bear Your Operational Burden',
    description:
      'Inspired by the Greek τλάω (to bear) and Atlas (the bearer). AI-powered execution planning and grant discovery.',
    type: 'website',
    url: 'https://tlao.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TLÁO - Tactical Layer for Action & Outcomes',
    description:
      'AI agents that carry your operational burden. Execution planning and grant discovery powered by AWS Bedrock.',
  },
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-background text-foreground transition-colors duration-300 overflow-x-hidden`}
      >
        <RootClientWrapper basePath={process.env.NEXT_PUBLIC_BASE_PATH || ''}>
          {children}
        </RootClientWrapper>
      </body>
    </html>
  )
}
