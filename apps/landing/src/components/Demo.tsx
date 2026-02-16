'use client'

import { useState } from 'react'
import { Play, Code, FileText, Bot, Globe, ArrowRight } from 'lucide-react'

const demoSections = [
  {
    id: 'tlao-plan',
    title: 'TLÁO Plan Demo',
    icon: Bot,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
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
    id: 'tlao-grant',
    title: 'TLÁO Grant Demo',
    icon: Globe,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
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
  const [activeDemo, setActiveDemo] = useState('tlao-plan')
  const [showCode, setShowCode] = useState(false)

  const currentDemo = demoSections.find(demo => demo.id === activeDemo)!

  return (
    <section className="section-padding">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            See It In Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience how our AI agents transform unstructured inputs into actionable, 
            structured outputs that drive real business value.
          </p>
        </div>

        {/* Demo selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted rounded-lg p-1 flex">
            {demoSections.map((demo) => {
              const Icon = demo.icon
              return (
                <button
                  key={demo.id}
                  onClick={() => setActiveDemo(demo.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-all ${
                    activeDemo === demo.id
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
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
        <div className="bg-card rounded-2xl p-8 shadow-soft border border-border">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 ${currentDemo.bgColor} rounded-lg flex items-center justify-center`}>
              <currentDemo.icon className={`w-6 h-6 ${currentDemo.color}`} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{currentDemo.title}</h3>
              <p className="text-muted-foreground">{currentDemo.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input */}
            <div className="bg-background rounded-xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <h4 className="font-semibold">Input</h4>
              </div>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm text-muted-foreground whitespace-pre-line">
                {currentDemo.input}
              </div>
            </div>

            {/* Output */}
            <div className="bg-background rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  <h4 className="font-semibold">Structured Output</h4>
                </div>
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
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
                  {activeDemo === 'tlao-plan' && (
                    <>
                      <div>
                        <h5 className="font-medium mb-2">📋 Execution Plan</h5>
                        <div className="space-y-2">
                          {currentDemo.output.executionPlan?.map((task: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                task.priority === 'high' ? 'bg-destructive/15 text-destructive' :
                                task.priority === 'medium' ? 'bg-warning/15 text-warning' :
                                'bg-success/15 text-success'
                              }`}>
                                {task.priority}
                              </span>
                              <span className="text-sm">{task.title}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{task.estimatedHours}h</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">🚨 Alerts</h5>
                        <div className="p-2 bg-destructive/15 rounded border border-destructive/20">
                          <span className="text-sm text-destructive">
                            {currentDemo.output.alerts?.[0]?.message}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {activeDemo === 'tlao-grant' && (
                    <>
                      <div>
                        <h5 className="font-medium mb-2">🎯 Grant Match</h5>
                        <div className="p-3 bg-success/15 rounded border border-success/20">
                          <div className="flex justify-between items-start mb-2">
                            <h6 className="font-medium text-success">
                              {currentDemo.output.grants?.[0]?.name}
                            </h6>
                            <span className="bg-success text-success-foreground px-2 py-1 rounded text-xs font-medium">
                              {currentDemo.output.grants?.[0]?.eligibilityScore}% match
                            </span>
                          </div>
                          <p className="text-sm text-success mb-2">
                            ${currentDemo.output.grants?.[0]?.amount?.toLocaleString()} • {currentDemo.output.grants?.[0]?.funder}
                          </p>
                          <div className="text-xs text-success/80">
                            {currentDemo.output.grants?.[0]?.matchReasons?.join(' • ')}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-2">📝 Generated Proposal</h5>
                        <div className="p-3 bg-accent/15 rounded border border-accent/20">
                          <p className="text-sm text-accent mb-2">
                            {currentDemo.output.proposals?.[0]?.executiveSummary}
                          </p>
                          <div className="text-xs text-accent/80">
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