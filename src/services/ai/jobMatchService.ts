import { JOB_MATCH_SYSTEM_PROMPT, JOB_MATCH_JSON_INSTRUCTION } from './prompts/jobMatchPrompt';
import { MatchResult } from '../../types';
import { z } from 'zod';
import { AppError, ErrorCode } from '../../utils/errors';
import { BaseAIService } from './core/BaseAIService';
import { LIMITS } from '../../config/constants';
import { logger } from '../../utils/logger';

/**
 * Job Match Service
 * Analyzes CV against job description to recommend whether candidate should apply
 * Extends BaseAIService to eliminate code duplication
 */
export class JobMatchService extends BaseAIService {
  protected getSystemPrompt(): string {
    return JOB_MATCH_SYSTEM_PROMPT;
  }

  protected getServiceName(): string {
    return 'JobMatchService';
  }

  protected getInitialResponseMessage(): string {
    return "I have analyzed the CV and job description. I'm ready to provide a match recommendation.";
  }

  /**
   * Analyze job match and return decision
   * Consumes 1 credit
   */
  async checkMatch(): Promise<MatchResult> {
    this.ensureInitialized();

    // Check and consume credit
    await this.checkAndConsume('analyze_job_match');

    try {
      const prompt = `Based on the CV and job description provided, decide whether the candidate should apply. Also provide a match score (0-100) indicating how well the candidate's profile aligns with the job requirements. ${JOB_MATCH_JSON_INSTRUCTION}`;
      const response = await this.sendMessage(prompt);

      // Parse and validate JSON response
      const Schema = z.object({
        decision: z.enum(['yes', 'no']),
        reason: z.string().max(LIMITS.MATCH_REASON_MAX_LENGTH),
        score: z.number().min(0).max(100)
      });

      const parsed = Schema.parse(JSON.parse(this.sanitizeToJson(response)));

      return {
        decision: parsed.decision,
        message: parsed.reason,
        score: parsed.score,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error checking match', error as Error);
      throw new AppError(
        ErrorCode.AiFailed,
        'AI failed to check job match',
        {},
        error
      );
    }
  }

  /**
   * Send a conversational message
   * For follow-up questions about the match
   */
  async sendChatMessage(message: string): Promise<string> {
    return await this.sendMessageWithHistory(message);
  }
}
