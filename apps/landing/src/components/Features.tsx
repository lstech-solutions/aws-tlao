'use client'

import { FileText, MessageSquare, Mic, Globe, Zap, Shield, Cloud, Database } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Multi-Format Document Processing',
    description: 'Process emails, PDFs, audio files, text, and markdown documents with intelligent parsing and extraction.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Mic,
    title: 'Audio Transcription',
    description: 'Automatic transcription of audio files using AWS Transcribe with support for multiple formats.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    icon: MessageSquare,
    title: 'AI-Powered Analysis',
    description: 'Claude 3 Sonnet via AWS Bedrock analyzes your inputs and generates structured, actionable outputs.',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    icon: Globe,
    title: 'Multilingual Support',
    description: 'Grant Navigator supports English, Spanish, and Portuguese for global accessibility.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Zap,
    title: 'Serverless Architecture',
    description: 'Built on AWS Lambda for automatic scaling and cost-effective operation within Free Tier limits.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'End-to-end encryption, API key authentication, and secure data storage with AWS KMS.',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    icon: Cloud,
    title: 'AWS Free Tier Optimized',
    description: 'Carefully designed to operate within AWS Free Tier limits with cost monitoring and optimization.',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
  {
    icon: Database,
    title: 'Scalable Data Storage',
    description: 'DynamoDB for metadata and S3 for documents with automatic backup and versioning.',
    color: 'text-teal-500',
    bgColor: 'bg-teal-50',
  },
]

export default function Features() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built with modern AWS services and AI capabilities to provide a robust, 
            scalable platform for operational efficiency and grant discovery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg card-hover border border-gray-100"
              >
                <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Technical highlights */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Technical Highlights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">TypeScript</div>
              <div className="text-gray-600">Type-safe development with comprehensive error handling</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">Property-Based</div>
              <div className="text-gray-600">Testing with fast-check for comprehensive validation</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">Monorepo</div>
              <div className="text-gray-600">Organized codebase with Turbo for efficient builds</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}