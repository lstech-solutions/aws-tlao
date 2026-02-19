'use client'

import { useEffect, useRef, useState } from 'react'

const pricingPlans = [
  {
    name: 'Free',
    description: 'Perfect for individuals and small projects',
    price: '$0',
    period: '/month',
    features: [
      '100 emails/month processed',
      '5 execution plans/month',
      '5 grant proposals/month',
      'Basic agent orchestration',
      'Community support',
      'AWS Free Tier optimized',
    ],
    cta: 'Start for Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    description: 'For growing teams and businesses',
    price: '$49',
    period: '/month',
    features: [
      '1,000 emails/month processed',
      '50 execution plans/month',
      '50 grant proposals/month',
      'Advanced agent orchestration',
      'Priority support',
      'API access',
      'Team collaboration',
      'Analytics & reporting',
    ],
    cta: 'Get Started',
    highlighted: true,
  },
]

export default function Pricing() {
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
    <section id="pricing" ref={sectionRef} className="section-padding bg-muted/30">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include AWS Free Tier optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => {
            const isPlanVisible = isVisible && (index === 0 || index === 1)
            return (
              <div
                key={plan.name}
                ref={(el) => {
                  /* Ref handling */
                }}
                className={`group relative bg-card/60 backdrop-blur-xl rounded-3xl p-8 border transition-all duration-700 hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden ${
                  isPlanVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-primary/20 to-transparent h-full w-1/3 rounded-bl-3xl" />
                )}

                <div className="relative">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
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
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25'
                        : 'bg-card border border-border hover:border-primary text-foreground'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Product-specific pricing details */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
            <h4 className="text-lg font-bold mb-4">TLÁO Plan</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Execution plans: $0-49/mo</li>
              <li>Email processing: Included</li>
              <li>AI analysis: Claude 3 Sonnet</li>
            </ul>
          </div>
          <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
            <h4 className="text-lg font-bold mb-4">TLÁO Grant</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Grant proposals: $0-49/mo</li>
              <li>Eligibility checks: Included</li>
              <li>Multilingual: EN/ES/PT</li>
            </ul>
          </div>
          <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
            <h4 className="text-lg font-bold mb-4">TLÁO Email</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Emails processed: $0-49/mo</li>
              <li>AI categorization: Included</li>
              <li>Calendar sync: Included</li>
            </ul>
          </div>
          <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-6 border border-border/50">
            <h4 className="text-lg font-bold mb-4">TLÁO Builder</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Agent orchestration: $0-49/mo</li>
              <li>Task → Run → Artifact: Included</li>
              <li>CLI & SDK: Included</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
