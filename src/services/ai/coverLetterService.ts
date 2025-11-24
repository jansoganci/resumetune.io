import { COVER_LETTER_SYSTEM_PROMPT, COVER_LETTER_JSON_INSTRUCTION } from './prompts/coverLetterPrompt';
import { UserProfile } from '../../types';
import { ContactInfo } from '../../components/ContactInfoInput';
import { formatCompleteCoverLetter } from '../../utils/textUtils';
import { AppError, ErrorCode } from '../../utils/errors';
import { BaseAIService } from './core/BaseAIService';
import { logger } from '../../utils/logger';

/**
 * Cover Letter Service
 * Generates personalized cover letters based on CV and job description
 * Extends BaseAIService to eliminate code duplication
 */
export class CoverLetterService extends BaseAIService {
  protected getSystemPrompt(): string {
    return COVER_LETTER_SYSTEM_PROMPT;
  }

  protected getServiceName(): string {
    return 'CoverLetterService';
  }

  protected getInitialResponseMessage(userProfile?: UserProfile): string {
    return `I have analyzed the candidate's ${userProfile ? 'profile, ' : ''}CV and job description. I'm ready to help you create a personalized cover letter for this position.`;
  }

  /**
   * Generate a professional cover letter
   * Consumes 1 credit (unless skipCreditCheck is true)
   */
  async generateCoverLetter(
    contactInfo: ContactInfo,
    options?: { skipCreditCheck?: boolean }
  ): Promise<string> {
    this.ensureInitialized();

    // Check and consume credit (unless orchestrator already handled it)
    if (!options?.skipCreditCheck) {
      await this.checkAndConsume('generate_cover_letter');
    }

    // Debug logs limited to dev environment to avoid leaking PII in production
    logger.debug('CoverLetterService - Received contact info', {
      fullName: contactInfo.fullName,
      email: contactInfo.email,
      location: contactInfo.location,
      hasPhone: Boolean(contactInfo.phone),
      hasLinkedin: Boolean(contactInfo.linkedin),
      hasPortfolio: Boolean(contactInfo.portfolio),
    });

    try {
      const prompt = `Generate a professional cover letter with the following information:

CONTACT INFORMATION:
- Name: ${contactInfo.fullName}
- Email: ${contactInfo.email}
- Phone: ${contactInfo.phone || 'Not provided'}
- Location: ${contactInfo.location}
- Professional Title: ${contactInfo.professionalTitle}
- LinkedIn: ${contactInfo.linkedin || 'Not provided'}
- Portfolio: ${contactInfo.portfolio || 'Not provided'}

INSTRUCTIONS:
- Extract company name and role from the job description provided earlier
- Write a compelling cover letter focusing on content quality
- Use professional business letter structure
- Include specific achievements and quantified results
- Match the tone to the company culture
- Keep paragraphs concise and impactful

Generate ONLY the cover letter content - no additional text or formatting instructions.
${COVER_LETTER_JSON_INSTRUCTION}`;

      const rawCoverLetter = await this.sendMessage(prompt);

      if (!rawCoverLetter || rawCoverLetter.trim().length < 50) {
        throw new Error('Generated cover letter is too short. Please try again.');
      }

      // Parse JSON content robustly (handle code fences if any)
      let content: string;
      try {
        const parsed = JSON.parse(this.sanitizeToJson(rawCoverLetter));
        content = typeof parsed?.content === 'string' ? parsed.content : rawCoverLetter;
      } catch {
        content = rawCoverLetter;
      }

      // Apply professional formatting using our utility functions
      const formattedCoverLetter = formatCompleteCoverLetter(content, contactInfo);

      return `✅ **Perfect! Here's your personalized cover letter:**

${formattedCoverLetter}

---
🎉 **Your cover letter is ready!** Click the download buttons below to get PDF or DOCX versions.`;

    } catch (error) {
      logger.error('Cover letter generation error', error as Error);
      throw new AppError(
        ErrorCode.AiFailed,
        'AI failed to generate cover letter',
        {},
        error
      );
    }
  }
}
