import { privacyService } from '../services/privacy-service';

interface PrivacyRequest {
  workspaceId: string;
  mailboxId: string;
  optedIn: boolean;
}

interface PrivacyResponse {
  success: boolean;
  data?: {
    workspaceId: string;
    mailboxId: string;
    optedIn: boolean;
  };
  error?: string;
}

/**
 * Handle GET /api/email/workspaces/{workspaceId}/privacy/{mailboxId}
 * Check if user has opted in for personal email ingestion
 */
export async function handleCheckOptIn(
  workspaceId: string,
  mailboxId: string
): Promise<PrivacyResponse> {
  try {
    const optedIn = await privacyService.checkOptIn(workspaceId, mailboxId);

    return {
      success: true,
      data: {
        workspaceId,
        mailboxId,
        optedIn,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to check opt-in status: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Handle POST /api/email/workspaces/{workspaceId}/privacy/{mailboxId}
 * Set opt-in preference for personal email ingestion
 */
export async function handleSetOptIn(
  workspaceId: string,
  mailboxId: string,
  optedIn: boolean
): Promise<PrivacyResponse> {
  try {
    await privacyService.setOptIn(workspaceId, mailboxId, optedIn);

    return {
      success: true,
      data: {
        workspaceId,
        mailboxId,
        optedIn,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to update opt-in preference: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
