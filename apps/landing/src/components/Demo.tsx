'use client'

import { useState } from 'react'
import { Play, Code, FileText, Bot, Globe, ArrowRight } from 'lucide-react'

const demoSections = [
  {
    id: 'ops-copilot',
    title: 'Ops Copilot Demo',
    icon: Bot,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'See how messy operational inputs become structured execution plans',
    input: `Email: "Urgent: Client reported bug in payment system, needs fix ASAP"
GitHub Issue #123: "Implement user dashboard analytics"
Note: "AWS bill due next Friday, $47.23"
Meeting: "Discussed new mobile app features with team"`,
    output: {
      executionPlan: [
        {
          taskId: 'task-001',
          title: 'Fix payment system bug (URGENT)',
          priority: 'high',
          owner: 'founder',
          deadline: '2024-01-03',
          estimatedHours: 4,
        },
        {
          taskId: 'task-002',
          title: 'Pay AWS bill',
          priority: 'medium',
          owner: 'founder',
          deadline: '2024-01-05',
          estimatedHours: 0.5,
        },
        {
          taskId: 'task-003',
          title: 'Implement dashboard analytics',
          priority: 'medium',
          owner: 'founder',
          deadline: '2024-01-07',
          estimatedHours: 8,
        },
      ],
      alerts: [
        {
          severity: 'critical',
          message: 'Payment system bug requires immediate attention',
          affectedTasks: ['task-001'],
        },
      ],
      metrics: {
        totalTasks: 3,
        highPriorityCount: 1,
        blockedCount: 0,
        estimatedWeeklyHours: 12.5,
      },
    },
  },
  {
    id: 'grant-navigator',
    title: 'Grant Navigator Demo',
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: 'Discover grants and generate proposals for your organization',
    input: `Organization: "EcoVerde Brazil"
Type: Environmental NGO
Mission: "Forest conservation and indigenous community support"
Location: São Paulo, Brazil
Budget: $75,000
Focus Areas: Environmental protection, Community development`,
    output: {
      grants: [
        {
          grantId: 'env-001',
          name: 'Environmental Sustainability Grant',
          funder: 'Green Future Foundation',
          amount: 75000,
          deadline: '2024-07-31',
          eligibilityScore: 92,
          matchReasons: [
            'Perfect alignment with environmental focus',
            'Strong community development component',
            'Geographic eligibility for Brazil',
          ],
        },
      ],
      proposals: [
        {
          grantId: 'env-001',
          executiveSummary: 'EcoVerde Brazil seeks funding to expand forest conservation efforts...',
          problemStatement: 'Deforestation in the Amazon threatens biodiversity and indigenous communities...',
          solution: 'Implement community-based conservation programs with indigenous partners...',
          budget: {
            personnel: 45000,
            equipment: 15000,
            operations: 15000,
            total: 75000,
          },
        },
      ],
    },
  },
]

export default function Demo() {
  const [activeDemo, setActiveDemo] = useState('ops-copilot')
  const [showCode, setShowCode] = useState(false)

  const currentDemo = demoSections.find(demo => demo.id === activeDemo)!

  return (
    <section className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            See It In Action
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience how our AI agents transform unstructured inputs into actionable, 
            structured outputs that drive real business value.
          </p>
        </div>

        {/* Demo selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            {demoSections.map((demo) => {
              const Icon = demo.icon
              return (
                <button
                  key={demo.id}
                  onClick={() => setActiveDemo(demo.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
                    activeDemo === demo.id
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {demo.title}
                </button>
              )
            })}
          </div>
        </div>

        {/* Demo content */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 ${currentDemo.bgColor} rounded-lg flex items-center justify-center`}>
              <currentDemo.icon className={`w-6 h-6 ${currentDemo.color}`} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{currentDemo.title}</h3>
              <p className="text-gray-600">{currentDemo.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Input</h4>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700 whitespace-pre-line">
                {currentDemo.input}
              </div>
            </div>

            {/* Output */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">Structured Output</h4>
                </div>
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <Code className="w-4 h-4" />
                  {showCode ? 'Hide' : 'Show'} JSON
                </button>
              </div>

              {showCode ? (
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-xs">
                    {JSON.stringify(currentDemo.output, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeDemo === 'ops-copilot' && (
                    <>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">📋 Execution Plan</h5>
                        <div className="space-y-2">
                          {currentDemo.output.executionPlan?.map((task: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {task.priority}
                              </span>
                              <span className="text-sm text-gray-700">{task.title}</span>
                              <span className="text-xs text-gray-500 ml-auto">{task.estimatedHours}h</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">🚨 Alerts</h5>
                        <div className="p-2 bg-red-50 rounded border border-red-200">
                          <span className="text-sm text-red-700">
                            {currentDemo.output.alerts?.[0]?.message}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {activeDemo === 'grant-navigator' && (
                    <>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">🎯 Grant Match</h5>
                        <div className="p-3 bg-green-50 rounded border border-green-200">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="font-medium text-green-900">
                              {currentDemo.output.grants?.[0]?.name}
                            </h6>
                            <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                              {currentDemo.output.grants?.[0]?.eligibilityScore}% match
                            </span>
                          </div>
                          <p className="text-sm text-green-700 mb-2">
                            ${currentDemo.output.grants?.[0]?.amount?.toLocaleString()} • {currentDemo.output.grants?.[0]?.funder}
                          </p>
                          <div className="text-xs text-green-600">
                            {currentDemo.output.grants?.[0]?.matchReasons?.join(' • ')}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">📝 Generated Proposal</h5>
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-sm text-blue-700 mb-2">
                            {currentDemo.output.proposals?.[0]?.executiveSummary}
                          </p>
                          <div className="text-xs text-blue-600">
                            Budget: ${currentDemo.output.proposals?.[0]?.budget?.total?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Try it button */}
          <div className="text-center mt-8">
            <button className="btn-primary flex items-center gap-2 mx-auto">
              <Play className="w-5 h-5" />
              Try Interactive Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}