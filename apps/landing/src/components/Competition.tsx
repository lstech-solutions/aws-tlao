'use client'

import { Trophy, Calendar, Users, DollarSign, Award, ExternalLink } from 'lucide-react'

const timeline = [
  {
    date: 'Dec 5, 2025',
    event: 'Competition starts',
    status: 'completed',
  },
  {
    date: 'Jan 21, 2026',
    event: 'Initial submissions due',
    status: 'current',
  },
  {
    date: 'Feb 11, 2026',
    event: 'Top 1,000 semi-finalists announced',
    status: 'upcoming',
  },
  {
    date: 'Mar 13, 2026',
    event: 'Prototype articles published',
    status: 'upcoming',
  },
  {
    date: 'Apr 30, 2026',
    event: 'Winners announced',
    status: 'upcoming',
  },
]

const prizes = [
  {
    category: 'Grand Prize',
    amount: '$50,000',
    description: 'Overall winner across all tracks',
    icon: Trophy,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    category: 'Track Winners',
    amount: '$25,000',
    description: 'Winner in each of 5 competition tracks',
    icon: Award,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    category: 'Category Awards',
    amount: '$10,000',
    description: 'Multiple category-specific awards',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
]

const tracks = [
  'Workplace Efficiency',
  'Daily Life Enhancement', 
  'Commercial Solutions',
  'Social Impact',
  'Creative Expression'
]

export default function Competition() {
  return (
    <section className="section-padding bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container-max">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-full mb-6">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">AWS 10,000 AIdeas Competition</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Competing for Innovation
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI Agent Platform is competing in the largest developer competition in AWS history, 
            showcasing innovative AI applications built with AWS tools.
          </p>
        </div>

        {/* Competition stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-xl p-6 text-center shadow-lg border border-gray-100">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">$250,000</div>
            <div className="text-sm text-gray-600">Total Prize Pool</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg border border-gray-100">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">10,000+</div>
            <div className="text-sm text-gray-600">Expected Participants</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg border border-gray-100">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">20</div>
            <div className="text-sm text-gray-600">Winner Categories</div>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-lg border border-gray-100">
            <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">5</div>
            <div className="text-sm text-gray-600">Competition Tracks</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Timeline */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Competition Timeline</h3>
            </div>
            
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                    item.status === 'completed' ? 'bg-green-500' :
                    item.status === 'current' ? 'bg-blue-500' :
                    'bg-gray-300'
                  }`} />
                  <div>
                    <div className={`font-medium ${
                      item.status === 'current' ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {item.date}
                    </div>
                    <div className="text-gray-600 text-sm">{item.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Our submission */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Submission</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Competition Track</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    Workplace Efficiency
                  </span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    Social Impact
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Key Innovation</h4>
                <p className="text-gray-600 text-sm">
                  Unified AI agent platform serving both solo founders (Ops Copilot) and 
                  NGOs/startups (Grant Navigator) with shared AWS infrastructure.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">AWS Services Used</h4>
                <div className="flex flex-wrap gap-2">
                  {['Bedrock', 'Lambda', 'DynamoDB', 'S3', 'Transcribe', 'API Gateway'].map((service) => (
                    <span key={service} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-2">Why We'll Win</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Addresses real problems for underserved markets</li>
                <li>• Innovative dual-agent architecture</li>
                <li>• Production-ready with comprehensive testing</li>
                <li>• AWS Free Tier optimized for accessibility</li>
                <li>• Strong social impact potential (LATAM focus)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Prize breakdown */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Prize Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {prizes.map((prize, index) => {
              const Icon = prize.icon
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 text-center">
                  <div className={`w-12 h-12 ${prize.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-6 h-6 ${prize.color}`} />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{prize.category}</h4>
                  <div className="text-2xl font-bold text-gray-900 mb-2">{prize.amount}</div>
                  <p className="text-sm text-gray-600">{prize.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Follow Our Journey
            </h3>
            <p className="text-gray-600 mb-6">
              Stay updated on our progress in the competition and get early access 
              to the AI Agent Platform when it launches.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">
                Get Early Access
              </button>
              <a 
                href="https://aws.amazon.com/developer/community/10000-aideas/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary flex items-center gap-2 justify-center"
              >
                Learn About Competition
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}