import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Architecture from '@/components/Architecture'
import Agents from '@/components/Agents'
import Competition from '@/components/Competition'
import Demo from '@/components/Demo'
import Footer from '@/components/Footer'
import { ThemeToggleWrapper } from '@/components/ThemeToggle'

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
      <Demo />
      <Competition />
      <Footer />
    </main>
  )
}