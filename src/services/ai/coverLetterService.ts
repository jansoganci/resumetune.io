import { COVER_LETTER_SYSTEM_PROMPT, COVER_LETTER_JSON_INSTRUCTION } from './prompts/coverLetterPrompt';
import { CVData, JobDescription, UserProfile } from '../../types';
import { ContactInfo } from '../../components/ContactInfoInput';
import { formatCompleteCoverLetter } from '../../utils/textUtils';
import { sendAiMessage, AiHistoryItem } from './aiProxyClient';
import { AppError, ErrorCode, mapUnknownError } from '../../utils/errors';
import { checkAndConsumeLimit, getErrorMessage } from '../creditService';

export class CoverLetterService {
  private history: AiHistoryItem[] = [];

  async initializeChat(cvData: CVData, jobDescription: JobDescription, userProfile?: UserProfile) {
    // Variables are used directly in the prompt, no need to store as instance variables
    
    const profileSection = userProfile ? `
CANDIDATE PROFILE:
${userProfile.content}
` : '';

    const initialContext = `${COVER_LETTER_SYSTEM_PROMPT}
${profileSection}

CV CONTENT:
${cvData.content}

JOB DESCRIPTION:
${jobDescription.content}

You now have the candidate's ${userProfile ? 'profile, ' : ''}CV and the job description. You can help create a personalized cover letter.`;

    this.history = [
      { role: 'user', parts: [{ text: initialContext }] },
      { role: 'model', parts: [{ text: `I have analyzed the candidate's ${userProfile ? 'profile, ' : ''}CV and job description. I\'m ready to help you create a personalized cover letter for this position.` }] }
    ];
  }

  async generateCoverLetter(contactInfo: ContactInfo, options?: { skipCreditCheck?: boolean }): Promise<string> {
    if (!this.history.length) {
      throw new Error('Cover letter service not initialized. Please try again.');
    }

    // ✅ KREDİ KONTROLÜ - Allow orchestrator to handle once
    if (!options?.skipCreditCheck) {
      const creditCheck = await checkAndConsumeLimit('generate_cover_letter');
      if (!creditCheck.allowed) {
        const errorMessage = getErrorMessage(creditCheck);
        throw new AppError(ErrorCode.QuotaExceeded, errorMessage);
      }
      console.log('✅ Credit check passed for cover letter generation:', {
        planType: creditCheck.planType,
        creditsRemaining: creditCheck.currentCredits,
        dailyUsage: creditCheck.dailyUsage
      });
    }

    // Debug logs limited to dev environment to avoid leaking PII in production
    if (import.meta.env.DEV) {
      console.log('CoverLetterService - Received contact info (dev):', {
        fullName: contactInfo.fullName,
        email: contactInfo.email,
        location: contactInfo.location,
        hasPhone: Boolean(contactInfo.phone),
        hasLinkedin: Boolean(contactInfo.linkedin),
        hasPortfolio: Boolean(contactInfo.portfolio),
      });
    }

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
      
      const rawCoverLetter = await sendAiMessage(this.history, prompt);
      
      if (!rawCoverLetter || rawCoverLetter.trim().length < 50) {
        throw new Error('Generated cover letter is too short. Please try again.');
      }
      
      // Parse JSON content robustly (handle code fences if any)
      const sanitizeToJson = (text: string): string => {
        const withoutFences = text.replace(/```json|```/gi, '').trim();
        const match = withoutFences.match(/\{[\s\S]*\}/);
        return match ? match[0] : withoutFences;
      };
      let content: string;
      try {
        const parsed = JSON.parse(sanitizeToJson(rawCoverLetter));
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
      console.error('Cover letter generation error:', error);
      const mapped = mapUnknownError(error);
      throw new AppError(mapped.code || ErrorCode.AiFailed, 'AI failed to generate cover letter', {}, error);
    }
  }

  reset() {
    this.history = [];
  }
}
