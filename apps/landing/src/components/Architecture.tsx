'use client'

import { Cloud, Database, Zap, Shield, Cpu, FileText, MessageSquare, Globe } from 'lucide-react'

const awsServices = [
  {
    name: 'Amazon Bedrock',
    description: 'Claude 3 Sonnet for AI reasoning and structured output generation',
    icon: Cpu,
  },
  {
    name: 'AWS Lambda',
    description: 'Serverless compute for document ingestion and agent orchestration',
    icon: Zap,
  },
  {
    name: 'Amazon DynamoDB',
    description: 'NoSQL database for user data, sessions, and metadata storage',
    icon: Database,
  },
  {
    name: 'Amazon S3',
    description: 'Object storage for documents, transcripts, and results with encryption',
    icon: FileText,
  },
  {
    name: 'Amazon Transcribe',
    description: 'Speech-to-text service for audio file processing',
    icon: MessageSquare,
  },
  {
    name: 'API Gateway',
    description: 'RESTful API endpoints with authentication and rate limiting',
    icon: Globe,
  },
]

const architectureFlow = [
  {
    step: '1',
    title: 'Document Upload',
    description: 'Users upload documents via API Gateway with authentication',
  },
  {
    step: '2',
    title: 'Processing',
    description: 'Lambda functions parse documents and handle transcription',
  },
  {
    step: '3',
    title: 'AI Analysis',
    description: 'Bedrock processes content and generates structured outputs',
  },
  {
    step: '4',
    title: 'Storage',
    description: 'Results stored in DynamoDB with documents in S3',
  },
]

export default function Architecture() {
  return (
    <section className="section-padding">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            AWS-Native Architecture
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Built entirely on AWS services for maximum reliability, scalability, and cost-effectiveness. 
            Designed to operate within Free Tier limits while providing enterprise-grade capabilities.
          </p>
        </div>

        {/* AWS Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {awsServices.map((service, index) => {
            const Icon = service.icon
            return (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-soft card-hover border border-border"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">
                  {service.name}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Architecture Flow */}
        <div className="bg-card rounded-2xl p-8 shadow-soft border border-border">
          <h3 className="text-2xl font-bold mb-8 text-center">
            Request Flow Architecture
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {architectureFlow.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                {index < architectureFlow.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-6 h-0.5 bg-border transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Security & Compliance</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                End-to-end encryption with AWS KMS
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                Builder ID authentication with session management
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                Row-level security for user data isolation
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                HTTPS/TLS encryption for all communications
              </li>
            </ul>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Cloud className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Scalability & Performance</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                Serverless auto-scaling with AWS Lambda
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                DynamoDB on-demand billing for variable loads
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                Retry logic with exponential backoff
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                CloudWatch monitoring and alerting
              </li>
            </ul>
          </div>
        </div>

        {/* Free Tier Optimization */}
        <div className="mt-8 bg-primary/10 rounded-xl p-6 border border-primary/20">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-3">
              AWS Free Tier Optimized
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Carefully designed to operate within AWS Free Tier limits with intelligent cost monitoring, 
              token usage tracking, and resource optimization strategies.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}