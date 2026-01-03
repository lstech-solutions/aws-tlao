import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Architecture from '@/components/Architecture'
import Agents from '@/components/Agents'
import Competition from '@/components/Competition'
import Demo from '@/components/Demo'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
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