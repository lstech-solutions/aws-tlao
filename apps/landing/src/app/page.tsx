import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Architecture from '@/components/Architecture'
import Agents from '@/components/Agents'
import Pricing from '@/components/Pricing'
import Competition from '@/components/Competition'
import Demo from '@/components/Demo'
import { ThemeToggleWrapper } from '@/components/ThemeToggle'
import { LandingFooter } from '@/components/LandingFooter'

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION
  ? `v${process.env.NEXT_PUBLIC_APP_VERSION}`
  : undefined

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Theme Toggle in top right */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggleWrapper />
      </div>
      <Hero />
      <Features />
      <Agents />
      <Architecture />
      <Pricing />
      <Demo />
      <Competition />
      <LandingFooter version={appVersion} />
    </main>
  )
}
