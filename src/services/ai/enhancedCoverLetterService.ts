// Enhanced Cover Letter Service with Few-Shot Prompting and Quality Control
// Integrates seamlessly with existing system while adding advanced features

import { COVER_LETTER_SYSTEM_PROMPT, COVER_LETTER_JSON_INSTRUCTION } from './prompts/coverLetterPrompt';
import { CVData, JobDescription, UserProfile } from '../../types';
import { ContactInfo } from '../../components/ContactInfoInput';
import { formatCompleteCoverLetter } from '../../utils/textUtils';
import { sendAiMessage, AiHistoryItem } from './aiProxyClient';
import { AppError, ErrorCode, mapUnknownError } from '../../utils/errors';
import { checkAndConsumeLimit, getErrorMessage } from '../creditService';

// Import our new quality and example systems
import { 
  CoverLetterExample, 
  getBestMatchingExamples,
  COVER_LETTER_EXAMPLES 
} from './coverLetterExamples';
import { 
  validateCoverLetterQuality, 
  QualityValidationResult,
  getQualityInsights 
} from './coverLetterQuality';

interface GenerationAttempt {
  content: string;
  qualityResult: QualityValidationResult;
  attemptNumber: number;
}

export class EnhancedCoverLetterService {
  private history: AiHistoryItem[] = [];
  private cvData: CVData | null = null;
  private jobDescription: JobDescription | null = null;
  private userProfile: UserProfile | null = null;

  async initializeChat(cvData: CVData, jobDescription: JobDescription, userProfile?: UserProfile) {
    this.cvData = cvData;
    this.jobDescription = jobDescription;
    this.userProfile = userProfile || null;
    
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

  async generateCoverLetter(contactInfo: ContactInfo): Promise<string> {
    if (!this.history.length || !this.cvData || !this.jobDescription) {
      throw new Error('Cover letter service not initialized. Please try again.');
    }

    // Credit control (keeping existing logic)
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

    // Debug logs (keeping existing privacy protection)
    if (import.meta.env.DEV) {
      console.log('EnhancedCoverLetterService - Received contact info (dev):', {
        fullName: contactInfo.fullName,
        email: contactInfo.email,
        location: contactInfo.location,
        hasPhone: Boolean(contactInfo.phone),
        hasLinkedin: Boolean(contactInfo.linkedin),
        hasPortfolio: Boolean(contactInfo.portfolio),
      });
    }

    try {
      return await this.generateWithQualityAssurance(contactInfo);
    } catch (error) {
      console.error('Enhanced cover letter generation error:', error);
      const mapped = mapUnknownError(error);
      throw new AppError(mapped.code || ErrorCode.AiFailed, 'AI failed to generate cover letter', {}, error);
    }
  }

  private async generateWithQualityAssurance(contactInfo: ContactInfo): Promise<string> {
    const maxAttempts = 3;
    const attempts: GenerationAttempt[] = [];
    
    for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber++) {
      try {
        // Select optimal examples for this attempt
        const examples = this.selectOptimalExamples(contactInfo, attemptNumber);
        
        // Build enhanced prompt with few-shot examples
        const prompt = this.buildFewShotPrompt(examples, contactInfo, attemptNumber);
        
        // Generate cover letter
        const rawContent = await sendAiMessage(this.history, prompt);
        
        // Basic validation (keeping existing logic)
        if (!rawContent || rawContent.trim().length < 50) {
          throw new Error('Generated cover letter is too short. Please try again.');
        }
        
        // Parse and clean content (keeping existing logic)
        const cleanContent = this.parseAndCleanContent(rawContent);
        
        // Quality validation
        const qualityResult = validateCoverLetterQuality(
          cleanContent, 
          contactInfo, 
          this.cvData!, 
          this.jobDescription!
        );
        
        attempts.push({
          content: cleanContent,
          qualityResult,
          attemptNumber
        });
        
        // Log quality insights in dev
        if (import.meta.env.DEV) {
          console.log(`Attempt ${attemptNumber} Quality:`, getQualityInsights(qualityResult));
        }
        
        // Accept if quality threshold met
        if (!qualityResult.shouldRetry) {
          const formattedCoverLetter = formatCompleteCoverLetter(cleanContent, contactInfo);
          return this.formatSuccessResponse(formattedCoverLetter, qualityResult);
        }
        
      } catch (error) {
        console.error(`Attempt ${attemptNumber} failed:`, error);
        if (attemptNumber === maxAttempts) {
          throw error; // Re-throw on final attempt
        }
      }
      
      // Add delay before next attempt to avoid rate limiting
      if (attemptNumber < maxAttempts) {
        console.log(`Waiting 2 seconds before retry attempt ${attemptNumber + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // If all attempts had quality issues, return the best one
    const bestAttempt = this.selectBestAttempt(attempts);
    if (bestAttempt) {
      const formattedCoverLetter = formatCompleteCoverLetter(bestAttempt.content, contactInfo);
      return this.formatSuccessResponse(formattedCoverLetter, bestAttempt.qualityResult);
    }
    
    throw new Error('Failed to generate acceptable cover letter quality after multiple attempts');
  }

  private selectOptimalExamples(contactInfo: ContactInfo, attemptNumber: number): CoverLetterExample[] {
    // Detect industry and experience level from CV and job description
    const detectedIndustry = this.detectIndustry();
    const detectedLevel = this.detectExperienceLevel();
    const preferredTone = contactInfo.professionalTitle ? 'professional' : 'professional'; // Default to professional for now
    
    if (import.meta.env.DEV) {
      console.log(`Attempt ${attemptNumber} - Detected:`, {
        industry: detectedIndustry,
        level: detectedLevel,
        tone: preferredTone
      });
    }
    
    // Get best matching examples (2-3 examples)
    let examples = getBestMatchingExamples(detectedIndustry, detectedLevel, preferredTone, 3);
    
    // For retry attempts, try different example combinations
    if (attemptNumber > 1 && examples.length > 3) {
      const offset = (attemptNumber - 1) * 2;
      examples = [...examples.slice(offset), ...examples.slice(0, offset)].slice(0, 3);
    }
    
    return examples;
  }

  private buildFewShotPrompt(examples: CoverLetterExample[], contactInfo: ContactInfo, attemptNumber: number): string {
    const examplesText = examples.map((example, index) => `
EXAMPLE ${index + 1}:
Input Context: ${example.description}
Job Title: ${example.input.jobTitle}
Company: ${example.input.companyName}
Candidate Profile: ${example.input.userProfile}

Generated Cover Letter:
${example.output}

Quality Score: ${(example.qualityScore * 100).toFixed(1)}%
---`).join('\n');

    // Add attempt-specific improvements
    let improvementFocus = '';
    if (attemptNumber > 1) {
      improvementFocus = `
IMPROVEMENT FOCUS FOR THIS ATTEMPT:
- Ensure perfect business letter format with proper greeting and closing
- Include specific quantified achievements with numbers/percentages
- Naturally integrate company name and job title throughout
- Maintain professional yet personalized tone
- Address key job requirements explicitly
`;
    }

    return `Based on the examples below, generate a professional cover letter with the following information:

EXAMPLES OF EXCELLENT COVER LETTERS:
${examplesText}

CRITICAL QUALITY STANDARDS FROM EXAMPLES:
- Perfect business letter structure (header, date, greeting, body, closing, signature)
- Natural integration of candidate's specific achievements with metrics
- Proper company name and job title usage throughout
- Professional tone matching the role and industry
- Specific examples that demonstrate qualifications
- Concise yet compelling content (3-4 paragraphs maximum)

${improvementFocus}

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
- Write a compelling cover letter following the EXACT format and quality standards shown in examples
- Include specific achievements with quantified results from the CV
- Match the professional tone and structure demonstrated above
- Ensure proper business letter formatting throughout

Generate ONLY the cover letter content following the examples' format - no additional text or formatting instructions.
${COVER_LETTER_JSON_INSTRUCTION}`;
  }

  private parseAndCleanContent(rawContent: string): string {
    // Keep existing parsing logic
    const sanitizeToJson = (text: string): string => {
      const withoutFences = text.replace(/```json|```/gi, '').trim();
      const match = withoutFences.match(/\{[\s\S]*\}/);
      return match ? match[0] : withoutFences;
    };

    let content: string;
    try {
      const parsed = JSON.parse(sanitizeToJson(rawContent));
      content = typeof parsed?.content === 'string' ? parsed.content : rawContent;
    } catch {
      content = rawContent;
    }

    return content;
  }

  private selectBestAttempt(attempts: GenerationAttempt[]): GenerationAttempt | null {
    if (attempts.length === 0) return null;
    
    // Sort by quality score and return the best
    return attempts.sort((a, b) => 
      b.qualityResult.metrics.overallScore - a.qualityResult.metrics.overallScore
    )[0];
  }

  private formatSuccessResponse(formattedCoverLetter: string, qualityResult: QualityValidationResult): string {
    const qualityBadge = qualityResult.metrics.overallScore >= 0.9 ? '🌟' : '✅';
    
    return `${qualityBadge} **Perfect! Here's your personalized cover letter:**

${formattedCoverLetter}

---
🎉 **Your cover letter is ready!** Click the download buttons below to get PDF or DOCX versions.`;
  }

  // Helper methods for industry/level detection
  private detectIndustry(): string {
    if (!this.jobDescription) return 'general';
    
    const content = this.jobDescription.content.toLowerCase();
    
    if (content.includes('software') || content.includes('engineer') || content.includes('developer') || 
        content.includes('tech') || content.includes('programming')) {
      return 'tech';
    }
    
    if (content.includes('financial') || content.includes('finance') || content.includes('analyst') || 
        content.includes('investment') || content.includes('banking')) {
      return 'finance';
    }
    
    if (content.includes('marketing') || content.includes('design') || content.includes('creative') || 
        content.includes('brand') || content.includes('content')) {
      return 'creative';
    }
    
    return 'general';
  }

  private detectExperienceLevel(): string {
    if (!this.cvData) return 'mid';
    
    const content = this.cvData.content.toLowerCase();
    
    if (content.includes('senior') || content.includes('lead') || content.includes('manager') || 
        content.includes('director') || content.match(/\d+\+?\s*years/) && 
        parseInt(content.match(/(\d+)\+?\s*years/)?.[1] || '0') >= 7) {
      return 'senior';
    }
    
    if (content.includes('junior') || content.includes('graduate') || content.includes('entry') || 
        content.includes('intern') || content.match(/\d+\s*years/) && 
        parseInt(content.match(/(\d+)\s*years/)?.[1] || '0') <= 2) {
      return 'entry';
    }
    
    return 'mid';
  }

  reset() {
    this.history = [];
    this.cvData = null;
    this.jobDescription = null;
    this.userProfile = null;
  }
}
