'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { InfiniteGrid } from './InfiniteGrid'
import { ScrollIndicator } from './ScrollControls'
import { ThreeDPhotoCarousel } from './ui/3d-carousel'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 tlao-hero-gradient" />

      {/* Infinite Grid Animation */}
      <InfiniteGrid />

      <div className="relative z-10 container-max section-padding text-center">
        <div
          className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          {/* Etymology badge */}
          <div className="inline-flex items-center gap-2 bg-card/60 backdrop-blur-xl border border-border/50 rounded-full px-6 py-2 mb-8 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105">
            <span className="text-sm text-muted-foreground">
              τλάω (tláō) — <span className="text-foreground font-medium">to bear, to endure</span>
            </span>
          </div>

          {/* Main heading with logo */}
          <div className="mb-4 animate-fade-in">
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/tlao-logo.png`}
              alt="TLÁO"
              width={640}
              height={160}
              priority
              className="w-80 md:w-[32rem] lg:w-[40rem] mx-auto"
            />
          </div>

          <p className="text-base md:text-lg mb-3 text-muted-foreground max-w-2xl mx-auto font-light tracking-wide">
            Tactical Layer for Action & Outcomes
          </p>

          {/* Subtitle */}
          <p className="text-xl md:text-3xl mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              AI agents that bear your operational burden
            </span>
          </p>

          {/* 3D Carousel Gallery */}
          <div className="max-w-4xl mx-auto">
            <ThreeDPhotoCarousel />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator />
    </section>
  )
}
