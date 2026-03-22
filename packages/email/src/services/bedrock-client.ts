import * as AWS from 'aws-sdk';
import { ClassificationResult, EmailClassification } from '../types/classification';

const bedrock = new AWS.BedrockRuntime({ region: process.env.BEDROCK_REGION || 'us-east-1' });

export class BedrockClient {
  async classifyEmail(subject: string, body: string): Promise<ClassificationResult> {
    const truncatedBody = body.substring(0, 10000);

    const prompt = `You are an email classifier for the TLÁO platform. Classify the following email into exactly one category.

Categories:
- client_request: A client asking for work, deliverables, or services
- bug_report: A report of a software bug or issue
- invoice: A billing document or payment request
- grant_announcement: A new grant opportunity or funding announcement
- grant_response: A response to a previously submitted grant application
- partner_reply: A reply from a business partner continuing an existing workflow

Email:
Subject: ${subject}
Body: ${truncatedBody}

Respond with JSON:
{
  "classification": "<category>",
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation>"
}`;

    let retries = 3;
    while (retries > 0) {
      try {
        const response = await bedrock
          .invokeModel({
            modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
            body: JSON.stringify({
              anthropic_version: 'bedrock-2023-06-01',
              max_tokens: 1024,
              messages: [
                {
                  role: 'user',
                  content: prompt,
                },
              ],
            }),
          })
          .promise();

        const responseBody = JSON.parse(response.body?.toString() || '{}');
        const content = responseBody.content?.[0]?.text || '';

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const result = JSON.parse(jsonMatch[0]);

        return {
          classification: result.classification as EmailClassification,
          confidence: Math.min(1, Math.max(0, result.confidence || 0)),
          reasoning: result.reasoning || '',
        };
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`Classification failed after 3 attempts: ${error}`);
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, 3 - retries) * 100));
      }
    }

    throw new Error('Classification failed');
  }
}

export const bedrockClient = new BedrockClient();
