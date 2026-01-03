'use client'

import { Bot, Globe, ArrowRight, CheckCircle, Users, Building, Lightbulb } from 'lucide-react'

const opsCopilotFeatures = [
  'Analyzes emails, notes, invoices, GitHub issues',
  'Generates weekly execution plans with priorities',
  'Identifies dependencies and blockers',
  'Creates alerts for critical issues',
  'Calculates productivity metrics',
  'Supports solo founder workflows'
]

const grantNavigatorFeatures = [
  'Discovers relevant grant opportunities',
  'Assesses eligibility with scoring',
  'Drafts first-pass proposals',
  'Supports multilingual output (EN/ES/PT)',
  'Provides match reasoning',
  'Helps NGOs and startups access funding'
]

export default function Agents() {
  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Two Specialized AI Agents
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Each agent is purpose-built for specific use cases, powered by Claude 3 Sonnet 
            and designed to solve real-world problems for different user types.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Ops Copilot */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Ops Copilot</h3>
                <p className="text-blue-600 font-medium">For Solo Founders</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              Transform messy operational inputs into clear, actionable weekly execution plans. 
              Perfect for solo founders who need to stay organized and focused on high-impact work.
            </p>

            <div className="space-y-3 mb-8">
              {opsCopilotFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2">Example Input:</h4>
              <p className="text-sm text-gray-600 mb-3">
                "Email from client about urgent bug fix, GitHub issue #123 needs review, 
                invoice from AWS due next week, meeting notes about new feature requirements..."
              </p>
              <h4 className="font-semibold text-gray-900 mb-2">Generated Output:</h4>
              <p className="text-sm text-gray-600">
                Structured execution plan with prioritized tasks, deadlines, and alerts for the urgent bug fix.
              </p>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Target: Solo founders, entrepreneurs, small business owners</span>
            </div>
          </div>

          {/* Grant Navigator */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Grant Navigator</h3>
                <p className="text-green-600 font-medium">For NGOs & Startups</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6 leading-relaxed">
              Discover relevant grants, assess eligibility, and generate first-pass proposals. 
              Especially valuable for organizations in LATAM and Global South with multilingual support.
            </p>

            <div className="space-y-3 mb-8">
              {grantNavigatorFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2">Example Input:</h4>
              <p className="text-sm text-gray-600 mb-3">
                "Environmental NGO in Brazil, $50K budget, focus on forest conservation, 
                team of 8, working with indigenous communities..."
              </p>
              <h4 className="font-semibold text-gray-900 mb-2">Generated Output:</h4>
              <p className="text-sm text-gray-600">
                Matched grants with eligibility scores, detailed proposal drafts, and budget breakdowns.
              </p>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <Building className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Target: NGOs, social impact startups, community organizations</span>
            </div>
          </div>
        </div>

        {/* Shared platform benefits */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <Lightbulb className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Unified Platform Benefits
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Both agents share the same robust infrastructure, ensuring consistent performance, 
              security, and reliability across all use cases.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Shared Infrastructure</h4>
              <p className="text-sm text-gray-600">
                Common AWS services, authentication, and data storage
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Extensible Design</h4>
              <p className="text-sm text-gray-600">
                Easy to add new agents for different use cases
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-6 h-6 text-primary-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Cost Efficient</h4>
              <p className="text-sm text-gray-600">
                Optimized for AWS Free Tier with smart resource usage
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}