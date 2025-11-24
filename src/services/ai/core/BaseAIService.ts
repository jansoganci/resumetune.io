import { CVData, JobDescription, UserProfile } from '../../../types';
import { sendAiMessage, AiHistoryItem } from '../aiProxyClient';
import { AppError, ErrorCode, mapUnknownError } from '../../../utils/errors';
import { checkAndConsumeLimit, getErrorMessage } from '../../creditService';
import { logger } from '../../../utils/logger';

/**
 * Base class for all AI services
 * Eliminates code duplication by providing common functionality:
 * - History management
 * - Chat initialization
 * - Error handling
 * - Credit checking
 */
export abstract class BaseAIService {
  protected history: AiHistoryItem[] = [];

  /**
   * System prompt specific to this service
   * Must be implemented by each service
   */
  protected abstract getSystemPrompt(): string;

  /**
   * Service name for logging and credit tracking
   * Must be implemented by each service
   */
  protected abstract getServiceName(): string;

  /**
   * Initialize chat with CV, job description, and optional user profile
   * Common implementation used by all services
   */
  async initializeChat(
    cvData: CVData,
    jobDescription: JobDescription,
    userProfile?: UserProfile
  ): Promise<void> {
    const profileSection = userProfile ? `
CANDIDATE PROFILE:
${userProfile.content}
` : '';

    const initialContext = `${this.getSystemPrompt()}
${profileSection}

CV CONTENT:
${cvData.content}

JOB DESCRIPTION:
${jobDescription.content}

You now have the candidate's ${userProfile ? 'profile, ' : ''}CV and the job description. You can analyze them and provide recommendations.`;

    this.history = [
      { role: 'user', parts: [{ text: initialContext }] },
      {
        role: 'model',
        parts: [{
          text: this.getInitialResponseMessage(userProfile)
        }]
      }
    ];
  }

  /**
   * Get the initial AI response message after initialization
   * Can be overridden by services for custom messages
   */
  protected getInitialResponseMessage(userProfile?: UserProfile): string {
    return `I have analyzed the candidate's ${userProfile ? 'profile, ' : ''}CV and the job description. I'm ready to assist you.`;
  }

  /**
   * Reset the service state
   * Clears conversation history
   */
  reset(): void {
    this.history = [];
    this.onReset();
  }

  /**
   * Hook for services to perform additional reset actions
   * Override this in services that have extra state to clear
   */
  protected onReset(): void {
    // No-op by default
  }

  /**
   * Check if chat has been initialized
   */
  protected isInitialized(): boolean {
    return this.history.length > 0;
  }

  /**
   * Ensure chat is initialized before performing operations
   * Throws error if not initialized
   */
  protected ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new AppError(
        ErrorCode.InvalidInput,
        `${this.getServiceName()} not initialized. Please provide CV and job description first.`
      );
    }
  }

  /**
   * Send a message to the AI with error handling
   * Common pattern used across all services
   */
  protected async sendMessage(prompt: string): Promise<string> {
    this.ensureInitialized();

    try {
      const response = await sendAiMessage(this.history, prompt);
      return response;
    } catch (error) {
      logger.error(`${this.getServiceName()} error`, error as Error);
      const mapped = mapUnknownError(error);
      throw new AppError(
        mapped.code || ErrorCode.AiFailed,
        `AI failed to process ${this.getServiceName()} request`,
        {},
        error
      );
    }
  }

  /**
   * Send a message and update history
   * Used for conversational interactions
   */
  protected async sendMessageWithHistory(message: string): Promise<string> {
    this.ensureInitialized();

    try {
      const reply = await sendAiMessage(this.history, message);
      this.history.push({ role: 'user', parts: [{ text: message }] });
      this.history.push({ role: 'model', parts: [{ text: reply }] });
      return reply;
    } catch (error) {
      logger.error(`${this.getServiceName()} error`, error as Error);
      const mapped = mapUnknownError(error);
      throw new AppError(
        mapped.code || ErrorCode.AiFailed,
        `AI failed to process message`,
        {},
        error
      );
    }
  }

  /**
   * Check credits and consume if allowed
   * Common pattern used across all services
   *
   * @param action - Action name for logging (e.g., 'analyze_job_match')
   * @returns Credit check result
   * @throws AppError if credits are insufficient
   */
  protected async checkAndConsume(action: string): Promise<void> {
    const creditCheck = await checkAndConsumeLimit(action);

    if (!creditCheck.allowed) {
      const errorMessage = getErrorMessage(creditCheck);
      throw new AppError(ErrorCode.QuotaExceeded, errorMessage);
    }

    logger.debug(`Credit check passed for ${action}`, {
      service: this.getServiceName(),
      planType: creditCheck.planType,
      creditsRemaining: creditCheck.currentCredits,
      dailyUsage: creditCheck.dailyUsage
    });
  }

  /**
   * Parse JSON response with robust error handling
   * Handles code fences and extracts JSON from mixed content
   */
  protected sanitizeToJson(text: string): string {
    const withoutFences = text.replace(/```json|```/gi, '').trim();
    const match = withoutFences.match(/\{[\s\S]*\}/);
    return match ? match[0] : withoutFences;
  }

  /**
   * Get conversation history
   * Useful for debugging or advanced use cases
   */
  getHistory(): AiHistoryItem[] {
    return [...this.history]; // Return copy to prevent external modification
  }

  /**
   * Get history length
   * Useful for checking conversation state
   */
  getHistoryLength(): number {
    return this.history.length;
  }
}
