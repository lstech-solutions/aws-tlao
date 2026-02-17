'use client'

import { useState, useEffect } from 'react'
import { InfiniteGrid } from './InfiniteGrid'
import { ScrollIndicator } from './ScrollControls'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const scrollToAgents = () => {
    document.getElementById('agents')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 tlao-hero-gradient" />
      
      {/* Infinite Grid Animation */}
      <InfiniteGrid />

      <div className="relative z-10 container-max section-padding text-center">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Etymology badge */}
          <div className="inline-flex items-center gap-2 bg-card/60 backdrop-blur-xl border border-border/50 rounded-full px-6 py-2 mb-8 shadow-soft hover:shadow-lg transition-all duration-300 hover:scale-105">
            <span className="text-sm text-muted-foreground">
              τλάω (tláō) — <span className="text-foreground font-medium">to bear, to endure</span>
            </span>
          </div>

          {/* Main heading with logo */}
          <div className="mb-4 animate-fade-in">
            <img 
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/tlao-logo.png`}
              alt="TLÁO" 
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

          {/* Agent cards - minimalistic */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 max-w-2xl mx-auto">
            <button 
              onClick={scrollToAgents}
              className="group relative bg-card/40 backdrop-blur-xl rounded-3xl px-10 py-8 border border-primary/30 hover:border-primary transition-all duration-500 hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                {/* Logo */}
                <div className="w-48 h-48 mx-auto mb-6 relative">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/tlao-plan-logo.png`}
                    alt="TLÁO Plan"
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                
                <span className="text-lg text-muted-foreground">Execution Planning</span>
              </div>
            </button>

            <button 
              onClick={scrollToAgents}
              className="group relative bg-card/40 backdrop-blur-xl rounded-3xl px-10 py-8 border border-accent/30 hover:border-accent transition-all duration-500 hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                {/* Logo */}
                <div className="w-48 h-48 mx-auto mb-6 relative">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/tlao-grant-logo.png`}
                    alt="TLÁO Grant"
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                
                <span className="text-lg text-muted-foreground">Grant Discovery</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator />
    </section>
  )
}
