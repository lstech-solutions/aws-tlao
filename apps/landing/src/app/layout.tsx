import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Agent Platform - AWS 10,000 AIdeas Competition',
  description: 'Unified AI agent platform with Ops Copilot for solo founders and Grant Navigator for NGOs. Built for the AWS 10,000 AIdeas Competition.',
  keywords: ['AI', 'AWS', 'Bedrock', 'Lambda', 'DynamoDB', 'S3', 'agents', 'automation', 'grants', 'operations'],
  authors: [{ name: 'AI Agent Platform Team' }],
  openGraph: {
    title: 'AI Agent Platform - AWS 10,000 AIdeas Competition',
    description: 'Transform messy operational inputs into clear execution plans and discover grants with AI-powered assistance.',
    type: 'website',
    url: 'https://ai-agent-platform.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Agent Platform - AWS 10,000 AIdeas Competition',
    description: 'Transform messy operational inputs into clear execution plans and discover grants with AI-powered assistance.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}