/**
 * Prompt templates for AI agents
 */

import { ProcessedDocument, ExecutionPlan, GrantAssessment } from '../models/types';
import { BedrockService } from './bedrock';

/**
 * Ops Copilot prompt parameters
 */
export interface OpsCopilotPromptParams {
  documents: ProcessedDocument[];
  userContext?: {
    organizationType?: string;
    previousPlans?: string[];
    preferences?: Record<string, any>;
  };
}

/**
 * Grant Navigator prompt parameters
 */
export interface GrantNavigatorPromptParams {
  organizationProfile: {
    name: string;
    type: string;
    mission: string;
    location: string;
    budget?: number;
    focusAreas: string[];
    teamSize?: number;
  };
  language?: string;
  grantsDatabase?: any[]; // In real implementation, this would be a proper grants database
}

/**
 * Prompt template service
 */
export class PromptTemplateService {
  /**
   * Generate Ops Copilot prompt
   */
  static createOpsCopilotPrompt(params: OpsCopilotPromptParams): string {
    const systemPrompt = `You are an AI operations assistant for solo founders. Your job is to analyze operational inputs (emails, notes, invoices, GitHub issues, etc.) and generate a structured weekly execution plan with tasks, priorities, deadlines, alerts, and metrics.

Key responsibilities:
1. Extract actionable tasks from messy operational inputs
2. Assign realistic priorities (high, medium, low)
3. Set reasonable deadlines within the next 7 days
4. Identify dependencies between tasks
5. Generate alerts for critical issues, blockers, or overdue items
6. Calculate weekly metrics for planning

Output Format:
You must respond with valid JSON in exactly this format:

{
  "executionPlan": [
    {
      "taskId": "unique-task-id",
      "title": "Clear, actionable task description",
      "priority": "high|medium|low",
      "owner": "person responsible (default to 'founder' if unclear)",
      "deadline": "YYYY-MM-DD (within next 7 days)",
      "estimatedHours": number,
      "dependencies": ["array-of-task-ids-this-depends-on"]
    }
  ],
  "alerts": [
    {
      "severity": "critical|warning|info",
      "message": "Clear description of the issue",
      "affectedTasks": ["array-of-related-task-ids"]
    }
  ],
  "metrics": {
    "totalTasks": number,
    "highPriorityCount": number,
    "blockedCount": number,
    "estimatedWeeklyHours": number
  }
}

Guidelines:
- Be practical and realistic with time estimates
- Focus on actionable tasks, not vague goals
- Identify true blockers and dependencies
- Use "founder" as default owner for solo founder context
- Deadlines must be within 7 days from today
- High priority = urgent and important, Medium = important but not urgent, Low = nice to have`;

    const documentContext = this.formatDocumentContext(params.documents);
    
    const userInput = `Please analyze the following operational inputs and create a weekly execution plan:

${documentContext}

${params.userContext ? `Additional Context:
- Organization Type: ${params.userContext.organizationType || 'Solo Founder'}
- Previous Plans: ${params.userContext.previousPlans?.join(', ') || 'None'}
` : ''}

Generate a structured execution plan with tasks, alerts, and metrics in the specified JSON format.`;

    return BedrockService.createStructuredPrompt(systemPrompt, userInput);
  }

  /**
   * Generate Grant Navigator prompt
   */
  static createGrantNavigatorPrompt(params: GrantNavigatorPromptParams): string {
    const language = params.language || 'en';
    const languageInstructions = this.getLanguageInstructions(language);

    const systemPrompt = `You are an AI grant discovery and proposal assistant. Your job is to help NGOs, startups, and community leaders discover relevant grants, assess eligibility, and draft initial grant proposals.

Key responsibilities:
1. Match organizations with relevant grant opportunities
2. Assess eligibility based on organization profile
3. Generate first-pass proposal drafts
4. Provide clear reasoning for grant matches
5. Support multiple languages (English, Spanish, Portuguese)

${languageInstructions}

Output Format:
You must respond with valid JSON in exactly this format:

{
  "grants": [
    {
      "grantId": "unique-grant-identifier",
      "name": "Grant Program Name",
      "funder": "Organization providing the grant",
      "amount": number (in USD),
      "deadline": "YYYY-MM-DD",
      "eligibilityScore": number (0-100, where 100 = perfect match),
      "matchReasons": ["array of specific reasons why this grant matches"],
      "url": "https://official-grant-page-url.com"
    }
  ],
  "proposals": [
    {
      "grantId": "matching-grant-id-from-above",
      "executiveSummary": "2-3 sentence overview of the proposal",
      "problemStatement": "Clear description of the problem being addressed",
      "solution": "How the organization will solve the problem",
      "budget": {
        "personnel": number,
        "equipment": number,
        "operations": number,
        "total": number
      },
      "impactMetrics": ["array of measurable outcomes expected"]
    }
  ]
}

Guidelines:
- Only suggest grants with eligibility score > 60
- Be realistic about eligibility - don't oversell matches
- Provide specific, actionable match reasons
- Budget should be reasonable and detailed
- Impact metrics should be measurable and achievable`;

    const organizationContext = this.formatOrganizationProfile(params.organizationProfile);
    const grantsContext = this.formatGrantsDatabase(params.grantsDatabase);

    const userInput = `Please analyze this organization profile and suggest relevant grants with proposal drafts:

Organization Profile:
${organizationContext}

${grantsContext}

Generate grant matches and proposal drafts in the specified JSON format, responding in ${this.getLanguageName(language)}.`;

    return BedrockService.createStructuredPrompt(systemPrompt, userInput);
  }

  /**
   * Format document context for prompts
   */
  private static formatDocumentContext(documents: ProcessedDocument[]): string {
    if (documents.length === 0) {
      return 'No documents provided.';
    }

    return documents
      .map((doc, index) => {
        const metadata = doc.metadata ? 
          Object.entries(doc.metadata)
            .filter(([key, value]) => value && key !== 'needsTranscription')
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ') : '';

        return `Document ${index + 1} (${doc.documentType}${metadata ? `, ${metadata}` : ''}):
${doc.textContent}

---`;
      })
      .join('\n\n');
  }

  /**
   * Format organization profile for prompts
   */
  private static formatOrganizationProfile(profile: GrantNavigatorPromptParams['organizationProfile']): string {
    return `Name: ${profile.name}
Type: ${profile.type}
Mission: ${profile.mission}
Location: ${profile.location}
Focus Areas: ${profile.focusAreas.join(', ')}
${profile.budget ? `Annual Budget: $${profile.budget.toLocaleString()}` : ''}
${profile.teamSize ? `Team Size: ${profile.teamSize}` : ''}`;
  }

  /**
   * Format grants database for prompts (mock data for demo)
   */
  private static formatGrantsDatabase(grantsDatabase?: any[]): string {
    if (!grantsDatabase || grantsDatabase.length === 0) {
      // Mock grants database for demonstration
      return `Available Grants Database:

1. Community Impact Grant
   - Funder: Local Community Foundation
   - Amount: $50,000
   - Focus: Community development, social impact
   - Deadline: 2024-06-30
   - Eligibility: NGOs, community organizations
   - URL: https://example.com/community-grant

2. Tech for Good Initiative
   - Funder: Tech Innovation Fund
   - Amount: $100,000
   - Focus: Technology solutions for social problems
   - Deadline: 2024-08-15
   - Eligibility: Startups, NGOs with tech focus
   - URL: https://example.com/tech-grant

3. Environmental Sustainability Grant
   - Funder: Green Future Foundation
   - Amount: $75,000
   - Focus: Environmental protection, sustainability
   - Deadline: 2024-07-31
   - Eligibility: Environmental organizations, green startups
   - URL: https://example.com/env-grant

4. Education Innovation Fund
   - Funder: Education Excellence Foundation
   - Amount: $60,000
   - Focus: Educational technology, learning innovation
   - Deadline: 2024-09-30
   - Eligibility: Educational organizations, edtech startups
   - URL: https://example.com/edu-grant

5. Healthcare Access Grant
   - Funder: Health Equity Initiative
   - Amount: $80,000
   - Focus: Healthcare access, medical innovation
   - Deadline: 2024-05-15
   - Eligibility: Healthcare organizations, medical startups
   - URL: https://example.com/health-grant`;
    }

    return `Available Grants Database:
${grantsDatabase.map((grant, index) => 
  `${index + 1}. ${grant.name}
   - Funder: ${grant.funder}
   - Amount: $${grant.amount?.toLocaleString() || 'TBD'}
   - Focus: ${grant.focusAreas?.join(', ') || 'General'}
   - Deadline: ${grant.deadline || 'TBD'}
   - URL: ${grant.url || 'TBD'}`
).join('\n\n')}`;
  }

  /**
   * Get language-specific instructions
   */
  private static getLanguageInstructions(language: string): string {
    switch (language) {
      case 'es':
        return 'Responde en español. Asegúrate de que todas las descripciones, propuestas y explicaciones estén en español claro y profesional.';
      case 'pt':
        return 'Responda em português. Certifique-se de que todas as descrições, propostas e explicações estejam em português claro e profissional.';
      case 'en':
      default:
        return 'Respond in English. Ensure all descriptions, proposals, and explanations are in clear, professional English.';
    }
  }

  /**
   * Get language name for user input
   */
  private static getLanguageName(language: string): string {
    switch (language) {
      case 'es':
        return 'Spanish';
      case 'pt':
        return 'Portuguese';
      case 'en':
      default:
        return 'English';
    }
  }

  /**
   * Validate execution plan response
   */
  static validateExecutionPlan(obj: any): obj is ExecutionPlan {
    return (
      obj &&
      typeof obj === 'object' &&
      Array.isArray(obj.executionPlan) &&
      Array.isArray(obj.alerts) &&
      obj.metrics &&
      typeof obj.metrics === 'object' &&
      typeof obj.metrics.totalTasks === 'number' &&
      typeof obj.metrics.highPriorityCount === 'number' &&
      typeof obj.metrics.blockedCount === 'number' &&
      typeof obj.metrics.estimatedWeeklyHours === 'number'
    );
  }

  /**
   * Validate grant assessment response
   */
  static validateGrantAssessment(obj: any): obj is GrantAssessment {
    return (
      obj &&
      typeof obj === 'object' &&
      Array.isArray(obj.grants) &&
      Array.isArray(obj.proposals) &&
      obj.grants.every((grant: any) => 
        grant.grantId &&
        grant.name &&
        grant.funder &&
        typeof grant.amount === 'number' &&
        grant.deadline &&
        typeof grant.eligibilityScore === 'number' &&
        Array.isArray(grant.matchReasons) &&
        grant.url
      )
    );
  }

  /**
   * Sanitize prompt input to prevent injection
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines
      .replace(/[^\w\s\-.,!?@#$%^&*()+=[\]{}|;':"<>/\\]/g, '') // Remove unusual characters
      .trim()
      .substring(0, 10000); // Limit length
  }

  /**
   * Extract JSON from model response (handles markdown code blocks)
   */
  static extractJsonFromResponse(response: string): string {
    // Remove markdown code blocks
    const cleaned = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    // Find JSON object boundaries
    const startIndex = cleaned.indexOf('{');
    const lastIndex = cleaned.lastIndexOf('}');

    if (startIndex === -1 || lastIndex === -1 || startIndex >= lastIndex) {
      throw new Error('No valid JSON object found in response');
    }

    return cleaned.substring(startIndex, lastIndex + 1);
  }
}