'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { InfiniteGrid } from './InfiniteGrid'
import { ScrollIndicator } from './ScrollControls'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

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
          <div className="mb-6 animate-fade-in">
            <img 
              src="/tláo-logo.png" 
              alt="TLÁO" 
              className="w-64 md:w-96 mx-auto"
            />
          </div>
          
          <p className="text-lg md:text-xl mb-4 text-muted-foreground max-w-2xl mx-auto font-light tracking-wide">
            Tactical Layer for Action & Outcomes
          </p>

          {/* Subtitle */}
          <p className="text-2xl md:text-4xl mb-16 max-w-4xl mx-auto leading-relaxed font-light">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              AI agents that bear your operational burden
            </span>
          </p>

          {/* Agent cards - minimalistic */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16 max-w-2xl mx-auto">
            <button 
              onClick={scrollToAgents}
              className="group relative bg-card/40 backdrop-blur-xl rounded-3xl px-10 py-8 border border-primary/30 hover:border-primary transition-all duration-500 hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                {/* Minimalistic icon */}
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <div className="relative w-full h-full bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                </div>
                
                <span className="font-bold text-2xl block mb-2">TLÁO Plan</span>
                <span className="text-sm text-muted-foreground">Execution Planning</span>
              </div>
            </button>

            <button 
              onClick={scrollToAgents}
              className="group relative bg-card/40 backdrop-blur-xl rounded-3xl px-10 py-8 border border-accent/30 hover:border-accent transition-all duration-500 hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                {/* Minimalistic icon */}
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                  <div className="relative w-full h-full bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                
                <span className="font-bold text-2xl block mb-2">TLÁO Grant</span>
                <span className="text-sm text-muted-foreground">Grant Discovery</span>
              </div>
            </button>
          </div>

          {/* CTA button */}
          <button 
            onClick={scrollToDemo}
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-full text-lg font-medium hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl"
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Try Interactive Demo
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator />
    </section>
  )
}
