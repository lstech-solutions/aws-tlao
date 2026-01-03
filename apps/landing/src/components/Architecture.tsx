'use client'

import { Cloud, Database, Zap, Shield, Cpu, FileText, MessageSquare, Globe } from 'lucide-react'

const awsServices = [
  {
    name: 'Amazon Bedrock',
    description: 'Claude 3 Sonnet for AI reasoning and structured output generation',
    icon: Cpu,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    name: 'AWS Lambda',
    description: 'Serverless compute for document ingestion and agent orchestration',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    name: 'Amazon DynamoDB',
    description: 'NoSQL database for user data, sessions, and metadata storage',
    icon: Database,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Amazon S3',
    description: 'Object storage for documents, transcripts, and results with encryption',
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    name: 'Amazon Transcribe',
    description: 'Speech-to-text service for audio file processing',
    icon: MessageSquare,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    name: 'API Gateway',
    description: 'RESTful API endpoints with authentication and rate limiting',
    icon: Globe,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
]

const architectureFlow = [
  {
    step: '1',
    title: 'Document Upload',
    description: 'Users upload documents via API Gateway with authentication',
    color: 'bg-blue-500',
  },
  {
    step: '2',
    title: 'Processing',
    description: 'Lambda functions parse documents and handle transcription',
    color: 'bg-green-500',
  },
  {
    step: '3',
    title: 'AI Analysis',
    description: 'Bedrock processes content and generates structured outputs',
    color: 'bg-purple-500',
  },
  {
    step: '4',
    title: 'Storage',
    description: 'Results stored in DynamoDB with documents in S3',
    color: 'bg-orange-500',
  },
]

export default function Architecture() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            AWS-Native Architecture
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built entirely on AWS services for maximum reliability, scalability, and cost-effectiveness. 
            Designed to operate within Free Tier limits while providing enterprise-grade capabilities.
          </p>
        </div>

        {/* AWS Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {awsServices.map((service, index) => {
            const Icon = service.icon
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg card-hover border border-gray-100"
              >
                <div className={`w-12 h-12 ${service.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${service.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {service.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Architecture Flow */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Request Flow Architecture
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {architectureFlow.map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4`}>
                  {item.step}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
                {index < architectureFlow.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-6 h-0.5 bg-gray-300 transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">Security & Compliance</h3>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                End-to-end encryption with AWS KMS
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                API key authentication with session management
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                Row-level security for user data isolation
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                HTTPS/TLS encryption for all communications
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Cloud className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Scalability & Performance</h3>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                Serverless auto-scaling with AWS Lambda
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                DynamoDB on-demand billing for variable loads
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                Retry logic with exponential backoff
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                CloudWatch monitoring and alerting
              </li>
            </ul>
          </div>
        </div>

        {/* Free Tier Optimization */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              🎯 AWS Free Tier Optimized
            </h3>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Carefully designed to operate within AWS Free Tier limits with intelligent cost monitoring, 
              token usage tracking, and resource optimization strategies.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}