'use client'

import { Bot, Globe, Github, ExternalLink, Mail, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-max section-padding">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">AI Agent Platform</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Unified AI agent platform with Ops Copilot for solo founders and Grant Navigator 
              for NGOs. Built for the AWS 10,000 AIdeas Competition.
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="mailto:hello@ai-agent-platform.com" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Agents */}
          <div>
            <h3 className="font-semibold text-white mb-4">AI Agents</h3>
            <ul className="space-y-3">
              <li>
                <a href="#ops-copilot" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Ops Copilot
                </a>
              </li>
              <li>
                <a href="#grant-navigator" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Grant Navigator
                </a>
              </li>
              <li>
                <a href="#demo" className="text-gray-400 hover:text-white transition-colors">
                  Interactive Demo
                </a>
              </li>
              <li>
                <a href="#architecture" className="text-gray-400 hover:text-white transition-colors">
                  Architecture
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="https://aws.amazon.com/developer/community/10000-aideas/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  Competition Details
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://aws.amazon.com/bedrock/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  AWS Bedrock
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  API Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Developer Guide
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* AWS Services */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <h3 className="font-semibold text-white mb-4 text-center">Built with AWS Services</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              'Amazon Bedrock',
              'AWS Lambda', 
              'Amazon DynamoDB',
              'Amazon S3',
              'Amazon Transcribe',
              'API Gateway'
            ].map((service) => (
              <span 
                key={service} 
                className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm border border-gray-700"
              >
                {service}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2024 AI Agent Platform. Built for AWS 10,000 AIdeas Competition.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>

        {/* Competition badge */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 rounded-full">
            <span className="text-sm font-medium">🏆 AWS 10,000 AIdeas Competition Entry</span>
          </div>
        </div>
      </div>
    </footer>
  )
}