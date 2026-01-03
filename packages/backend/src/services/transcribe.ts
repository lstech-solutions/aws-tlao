/**
 * AWS Transcribe service for audio transcription
 */

import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  DeleteTranscriptionJobCommand,
  TranscriptionJob,
  TranscriptionJobStatus,
} from '@aws-sdk/client-transcribe';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { s3Service } from './s3';

/**
 * Transcription job parameters
 */
export interface TranscriptionJobParams {
  jobName: string;
  audioS3Uri: string;
  outputS3Uri: string;
  languageCode?: string;
  mediaFormat?: string;
}

/**
 * Transcription result
 */
export interface TranscriptionResult {
  transcript: string;
  confidence?: number;
  jobStatus: TranscriptionJobStatus;
  outputUri?: string;
}

/**
 * AWS Transcribe service wrapper
 */
export class TranscribeService {
  private client: TranscribeClient;
  private readonly maxPollAttempts = 60; // 5 minutes with 5-second intervals
  private readonly pollIntervalMs = 5000; // 5 seconds

  constructor() {
    this.client = new TranscribeClient({ region: config.aws.region });
  }

  /**
   * Start transcription job for audio file
   */
  async startTranscriptionJob(params: TranscriptionJobParams): Promise<string> {
    try {
      const command = new StartTranscriptionJobCommand({
        TranscriptionJobName: params.jobName,
        Media: {
          MediaFileUri: params.audioS3Uri,
        },
        MediaFormat: params.mediaFormat || this.detectMediaFormat(params.audioS3Uri),
        LanguageCode: params.languageCode || 'en-US',
        OutputBucketName: config.s3.bucketName,
        OutputKey: this.extractS3KeyFromUri(params.outputS3Uri),
        Settings: {
          ShowSpeakerLabels: false, // Disable for simplicity
          MaxSpeakerLabels: 2,
        },
      });

      const response = await this.client.send(command);
      
      logger.info('Transcription job started', {
        jobName: params.jobName,
        audioUri: params.audioS3Uri,
        outputUri: params.outputS3Uri,
      });

      return response.TranscriptionJob?.TranscriptionJobName || params.jobName;
    } catch (error) {
      logger.error('Failed to start transcription job', {
        jobName: params.jobName,
        error: (error as Error).message,
      });
      throw new Error(`Failed to start transcription: ${(error as Error).message}`);
    }
  }

  /**
   * Get transcription job status and result
   */
  async getTranscriptionJob(jobName: string): Promise<TranscriptionJob | null> {
    try {
      const command = new GetTranscriptionJobCommand({
        TranscriptionJobName: jobName,
      });

      const response = await this.client.send(command);
      
      logger.debug('Transcription job status retrieved', {
        jobName,
        status: response.TranscriptionJob?.TranscriptionJobStatus,
      });

      return response.TranscriptionJob || null;
    } catch (error) {
      logger.error('Failed to get transcription job', {
        jobName,
        error: (error as Error).message,
      });
      throw new Error(`Failed to get transcription job: ${(error as Error).message}`);
    }
  }

  /**
   * Wait for transcription job to complete and return result
   */
  async waitForTranscriptionCompletion(jobName: string): Promise<TranscriptionResult> {
    let attempts = 0;

    while (attempts < this.maxPollAttempts) {
      try {
        const job = await this.getTranscriptionJob(jobName);
        
        if (!job) {
          throw new Error('Transcription job not found');
        }

        const status = job.TranscriptionJobStatus;
        
        logger.debug('Polling transcription job', {
          jobName,
          status,
          attempt: attempts + 1,
        });

        switch (status) {
          case TranscriptionJobStatus.COMPLETED:
            // Job completed successfully
            const transcript = await this.downloadTranscript(job);
            return {
              transcript,
              jobStatus: status,
              outputUri: job.Transcript?.TranscriptFileUri,
            };

          case TranscriptionJobStatus.FAILED:
            // Job failed
            const failureReason = job.FailureReason || 'Unknown error';
            throw new Error(`Transcription failed: ${failureReason}`);

          case TranscriptionJobStatus.IN_PROGRESS:
          case TranscriptionJobStatus.QUEUED:
            // Job still running, continue polling
            break;

          default:
            throw new Error(`Unexpected job status: ${status}`);
        }

        // Wait before next poll
        await this.sleep(this.pollIntervalMs);
        attempts++;
      } catch (error) {
        logger.error('Error while waiting for transcription', {
          jobName,
          attempt: attempts + 1,
          error: (error as Error).message,
        });
        throw error;
      }
    }

    throw new Error(`Transcription job timed out after ${this.maxPollAttempts} attempts`);
  }

  /**
   * Transcribe audio file end-to-end
   */
  async transcribeAudio(
    userId: string,
    documentId: string,
    audioS3Key: string,
    languageCode?: string
  ): Promise<string> {
    const jobName = `transcribe-${userId}-${documentId}-${Date.now()}`;
    const audioS3Uri = `s3://${config.s3.bucketName}/${audioS3Key}`;
    const outputS3Key = `transcripts/${userId}/${documentId}/output.json`;
    const outputS3Uri = `s3://${config.s3.bucketName}/${outputS3Key}`;

    try {
      logger.info('Starting audio transcription', {
        userId,
        documentId,
        jobName,
        audioS3Key,
      });

      // Start transcription job
      await this.startTranscriptionJob({
        jobName,
        audioS3Uri,
        outputS3Uri,
        languageCode,
        mediaFormat: this.detectMediaFormat(audioS3Key),
      });

      // Wait for completion
      const result = await this.waitForTranscriptionCompletion(jobName);

      // Clean up transcription job
      await this.deleteTranscriptionJob(jobName);

      logger.info('Audio transcription completed', {
        userId,
        documentId,
        jobName,
        transcriptLength: result.transcript.length,
      });

      return result.transcript;
    } catch (error) {
      logger.error('Failed to transcribe audio', {
        userId,
        documentId,
        jobName,
        error: (error as Error).message,
      });

      // Clean up failed job
      try {
        await this.deleteTranscriptionJob(jobName);
      } catch (cleanupError) {
        logger.warn('Failed to clean up transcription job', {
          jobName,
          error: (cleanupError as Error).message,
        });
      }

      throw new Error(`Failed to transcribe audio: ${(error as Error).message}`);
    }
  }

  /**
   * Download and parse transcript from S3
   */
  private async downloadTranscript(job: TranscriptionJob): Promise<string> {
    if (!job.Transcript?.TranscriptFileUri) {
      throw new Error('No transcript file URI in job result');
    }

    try {
      // Extract S3 key from URI
      const s3Key = this.extractS3KeyFromUri(job.Transcript.TranscriptFileUri);
      
      // Download transcript file from S3
      const result = await s3Service.download(s3Key);
      const transcriptJson = JSON.parse(result.body.toString('utf-8'));

      // Extract transcript text from AWS Transcribe JSON format
      const transcript = transcriptJson.results?.transcripts?.[0]?.transcript || '';
      
      if (!transcript) {
        throw new Error('No transcript text found in result file');
      }

      return transcript;
    } catch (error) {
      logger.error('Failed to download transcript', {
        transcriptUri: job.Transcript.TranscriptFileUri,
        error: (error as Error).message,
      });
      throw new Error(`Failed to download transcript: ${(error as Error).message}`);
    }
  }

  /**
   * Delete transcription job
   */
  async deleteTranscriptionJob(jobName: string): Promise<void> {
    try {
      const command = new DeleteTranscriptionJobCommand({
        TranscriptionJobName: jobName,
      });

      await this.client.send(command);
      
      logger.debug('Transcription job deleted', { jobName });
    } catch (error) {
      logger.warn('Failed to delete transcription job', {
        jobName,
        error: (error as Error).message,
      });
      // Don't throw error for cleanup operations
    }
  }

  /**
   * Detect media format from file extension
   */
  private detectMediaFormat(s3KeyOrUri: string): string {
    const extension = s3KeyOrUri.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'mp3':
        return 'mp3';
      case 'wav':
        return 'wav';
      case 'm4a':
        return 'm4a';
      case 'flac':
        return 'flac';
      case 'ogg':
        return 'ogg';
      default:
        return 'mp3'; // Default fallback
    }
  }

  /**
   * Extract S3 key from S3 URI
   */
  private extractS3KeyFromUri(s3Uri: string): string {
    // Remove s3://bucket-name/ prefix
    const parts = s3Uri.replace(/^s3:\/\/[^\/]+\//, '');
    return parts;
  }

  /**
   * Sleep utility for polling
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate audio file for transcription
   */
  static validateAudioFile(fileName: string, fileSize: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Check supported formats
    const supportedFormats = ['mp3', 'wav', 'm4a', 'flac', 'ogg'];
    if (!extension || !supportedFormats.includes(extension)) {
      errors.push(`Unsupported audio format. Supported formats: ${supportedFormats.join(', ')}`);
    }

    // Check file size (AWS Transcribe limits)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (fileSize > maxSize) {
      errors.push('Audio file too large. Maximum size is 2GB');
    }

    if (fileSize === 0) {
      errors.push('Audio file is empty');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Estimate transcription cost (for monitoring)
   */
  static estimateTranscriptionCost(durationSeconds: number): number {
    // AWS Transcribe pricing: $0.0004 per second (as of 2024)
    const pricePerSecond = 0.0004;
    return durationSeconds * pricePerSecond;
  }
}

// Export singleton instance
export const transcribeService = new TranscribeService();