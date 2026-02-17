'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'

const tlaoPlanFeatures = [
  'Analyzes emails, notes, invoices',
  'Generates execution plans',
  'Identifies blockers',
  'Creates alerts',
]

const tlaoGrantFeatures = [
  'Discovers grant opportunities',
  'Assesses eligibility',
  'Drafts proposals',
  'Multilingual (EN/ES/PT)',
]

export default function Agents() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="agents" ref={sectionRef} className="section-padding">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-4">Two Specialized Agents</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Purpose-built AI agents powered by Claude 3 Sonnet
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* TLÁO Plan */}
          <div
            className={`group relative bg-card/60 backdrop-blur-xl rounded-3xl p-10 border border-primary/30 hover:border-primary transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              {/* Minimalistic icon */}
              <div className="w-20 h-20 mb-6 relative">
                <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
                <div className="relative w-full h-full bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
              </div>

              <h3 className="text-3xl font-bold mb-2">TLÁO Plan</h3>
              <p className="text-primary font-medium mb-6">Execution Planning</p>

              <p className="text-lg text-muted-foreground mb-6">
                Transform messy inputs into clear, actionable weekly plans for solo founders.
              </p>

              <div className="space-y-3 mb-6">
                {tlaoPlanFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-4 transition-all">
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/documentation/agents/tlao-plan`}
                  className="flex items-center gap-2"
                >
                  Learn more <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* TLÁO Grant */}
          <div
            className={`group relative bg-card/60 backdrop-blur-xl rounded-3xl p-10 border border-accent/30 hover:border-accent transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}
            style={{ transitionDelay: '200ms' }}
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative">
              {/* Minimalistic icon */}
              <div className="w-20 h-20 mb-6 relative">
                <div className="absolute inset-0 bg-accent/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500" />
                <div className="relative w-full h-full bg-gradient-to-br from-accent to-accent/80 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              <h3 className="text-3xl font-bold mb-2">TLÁO Grant</h3>
              <p className="text-accent font-medium mb-6">Grant Discovery</p>

              <p className="text-lg text-muted-foreground mb-6">
                Discover grants, assess eligibility, and generate proposals for NGOs and startups.
              </p>

              <div className="space-y-3 mb-6">
                {tlaoGrantFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-accent font-medium group-hover:gap-4 transition-all">
                <a
                  href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/documentation/agents/tlao-grant`}
                  className="flex items-center gap-2"
                >
                  Learn more <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
