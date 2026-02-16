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
  },
  {
    category: 'Track Winners',
    amount: '$25,000',
    description: 'Winner in each of 5 competition tracks',
    icon: Award,
  },
  {
    category: 'Category Awards',
    amount: '$10,000',
    description: 'Multiple category-specific awards',
    icon: DollarSign,
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
    <section className="section-padding">
      <div className="container-max">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-full mb-6">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">AWS 10,000 AIdeas Competition</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Competing for Innovation
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI Agent Platform is competing in the largest developer competition in AWS history, 
            showcasing innovative AI applications built with AWS tools.
          </p>
        </div>

        {/* Competition stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-card rounded-xl p-6 text-center shadow-soft border border-border">
            <DollarSign className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-2xl font-bold mb-1">$250,000</div>
            <div className="text-sm text-muted-foreground">Total Prize Pool</div>
          </div>
          <div className="bg-card rounded-xl p-6 text-center shadow-soft border border-border">
            <Users className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-2xl font-bold mb-1">10,000+</div>
            <div className="text-sm text-muted-foreground">Expected Participants</div>
          </div>
          <div className="bg-card rounded-xl p-6 text-center shadow-soft border border-border">
            <Award className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-2xl font-bold mb-1">20</div>
            <div className="text-sm text-muted-foreground">Winner Categories</div>
          </div>
          <div className="bg-card rounded-xl p-6 text-center shadow-soft border border-border">
            <Trophy className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="text-2xl font-bold mb-1">5</div>
            <div className="text-sm text-muted-foreground">Competition Tracks</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Timeline */}
          <div className="bg-card rounded-2xl p-8 shadow-soft border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold">Competition Timeline</h3>
            </div>
            
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                    item.status === 'completed' ? 'bg-primary' :
                    item.status === 'current' ? 'bg-primary' :
                    'bg-border'
                  }`} />
                  <div>
                    <div className={`font-medium ${
                      item.status === 'current' ? 'text-primary' : 'text-foreground'
                    }`}>
                      {item.date}
                    </div>
                    <div className="text-muted-foreground text-sm">{item.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Our submission */}
          <div className="bg-card rounded-2xl p-8 shadow-soft border border-border">
            <h3 className="text-2xl font-bold mb-6">Our Submission</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-semibold mb-2">Competition Track</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    Workplace Efficiency
                  </span>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    Social Impact
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Key Innovation</h4>
                <p className="text-muted-foreground text-sm">
                  Unified AI agent platform serving both solo founders (TLÁO Plan) and 
                  NGOs/startups (TLÁO Grant) with shared AWS infrastructure.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">AWS Services Used</h4>
                <div className="flex flex-wrap gap-2">
                  {['Bedrock', 'Lambda', 'DynamoDB', 'S3', 'Transcribe', 'API Gateway'].map((service) => (
                    <span key={service} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h4 className="font-semibold mb-2">Why We&apos;ll Win</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
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
          <h3 className="text-2xl font-bold mb-8 text-center">Prize Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {prizes.map((prize, index) => {
              const Icon = prize.icon
              return (
                <div key={index} className="bg-card rounded-xl p-6 shadow-soft border border-border text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">{prize.category}</h4>
                  <div className="text-2xl font-bold mb-2">{prize.amount}</div>
                  <p className="text-sm text-muted-foreground">{prize.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-card rounded-2xl p-8 shadow-soft border border-border max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Follow Our Journey
            </h3>
            <p className="text-muted-foreground mb-6">
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