import { RESUME_OPTIMIZER_SYSTEM_PROMPT } from './prompts/resumeOptimizerPrompt';
import { UserProfile } from '../../types';
import { cleanDocumentContent, fixCharacterEncoding, validateDocumentContent } from '../../utils/textUtils';
import { AppError, ErrorCode } from '../../utils/errors';
import { BaseAIService } from './core/BaseAIService';

/**
 * Resume Optimizer Service
 * Creates ATS-optimized resumes tailored to specific job descriptions
 * Extends BaseAIService to eliminate code duplication
 */
export class ResumeOptimizerService extends BaseAIService {
  private resumeData: { targetRole?: string; experienceLevel?: string; keyFocus?: string } = {};
  private isCollectingData = false;
  private currentStep = 0;

  private readonly steps = [
    { key: 'targetRole', question: 'What specific role title should I optimize for? (e.g., "Senior SAP Consultant", "Finance Manager")' },
    { key: 'experienceLevel', question: 'What experience level should I emphasize? (e.g., "Senior", "Lead", "Manager", "Specialist")' },
    { key: 'keyFocus', question: 'What should be the main focus? (e.g., "Technical expertise", "Leadership", "Analytics", "Automation")' }
  ];

  protected getSystemPrompt(): string {
    return RESUME_OPTIMIZER_SYSTEM_PROMPT;
  }

  protected getServiceName(): string {
    return 'ResumeOptimizerService';
  }

  protected getInitialResponseMessage(userProfile?: UserProfile): string {
    return `I have analyzed the candidate's ${userProfile ? 'profile, ' : ''}CV and job description. I'm ready to help you create an ATS-optimized resume tailored for this position.`;
  }

  /**
   * Clear additional state beyond history
   */
  protected onReset(): void {
    this.resumeData = {};
    this.isCollectingData = false;
    this.currentStep = 0;
  }

  /**
   * Generate optimized resume from provided specs (non-interactive mode)
   * Consumes 1 credit
   */
  async generateFromSpecs(specs: { targetRole?: string; experienceLevel?: string; keyFocus?: string }): Promise<string> {
    this.ensureInitialized();

    // Reset any previous collection state
    this.isCollectingData = false;
    this.currentStep = 0;

    // Apply provided specs with safe defaults for inference
    this.resumeData = {
      targetRole: specs.targetRole || 'Infer from job description and CV',
      experienceLevel: specs.experienceLevel || 'Infer from user professional title and JD',
      keyFocus: specs.keyFocus || 'Infer from job requirements and candidate background'
    };

    return await this.generateOptimizedResume();
  }

  /**
   * Start interactive data collection flow
   * Returns first question
   */
  startDataCollection(): string {
    this.isCollectingData = true;
    this.currentStep = 0;
    this.resumeData = {};

    return `🎯 **Resume Optimizer Started!**

I'll help you create an ATS-optimized resume tailored specifically for this position! I need to collect a few details first.

**Step 1 of ${this.steps.length}:**
${this.steps[0].question}`;
  }

  /**
   * Handle user response during data collection
   * Returns next question or generates resume if complete
   */
  async handleDataCollection(message: string): Promise<string> {
    const currentStepData = this.steps[this.currentStep];
    (this.resumeData as any)[currentStepData.key] = message.trim();
    this.currentStep++;

    // If we have more steps, ask the next question
    if (this.currentStep < this.steps.length) {
      const nextStep = this.steps[this.currentStep];
      return `✅ Got it!

**Step ${this.currentStep + 1} of ${this.steps.length}:**
${nextStep.question}`;
    }

    // All data collected, generate the optimized resume
    this.isCollectingData = false;
    return await this.generateOptimizedResume();
  }

  /**
   * Generate optimized resume using collected data
   * Private method called by generateFromSpecs() or handleDataCollection()
   */
  private async generateOptimizedResume(): Promise<string> {
    this.ensureInitialized();

    // Check and consume credit
    await this.checkAndConsume('optimize_resume');

    try {
      const prompt = `Create a professional, ATS-optimized resume using these specifications:

TARGET SPECIFICATIONS:
- Target Role: ${this.resumeData.targetRole}
- Experience Level: ${this.resumeData.experienceLevel}
- Key Focus: ${this.resumeData.keyFocus}

CRITICAL WORK EXPERIENCE INSTRUCTIONS:
- MAINTAIN the EXACT chronological order of work experience as it appears in the original CV
- PRESERVE company names, job titles, employment dates, and locations EXACTLY as they appear in the original CV
- DO NOT reorder, rename, or change any company names, job titles, or dates
- ONLY optimize and improve the bullet points/achievements within each job entry

CRITICAL INSTRUCTIONS:
- Analyze the CV and job description provided earlier
- Keep all work experience entries in their original chronological order
- Preserve original company names, job titles, and dates exactly
- Only optimize the bullet points to highlight relevant achievements for the target role
- Use the exact structure specified in the system prompt
- Include quantified achievements with numbers/percentages
- Optimize bullet points to match job requirements while maintaining chronological order
- Keep total length under 500 words for 1-2 page output
- Use clean, professional language without any AI metadata
- Focus on achievements that demonstrate value and impact
- Ensure all content is ATS-compatible and scannable

Generate ONLY the resume content following the mandatory structure. No introductory text, no explanations, no AI responses - just the clean resume content ready for export.
\n\nRESPONSE FORMAT (MANDATORY):\nOutput ONLY valid JSON with this exact shape and nothing else (no prose, no code fences):\n{\n  "content": "string (the full, final resume content)"\n}`;

      const raw = await this.sendMessage(prompt);

      // Parse JSON content robustly
      let optimizedResume: string;
      try {
        const parsed = JSON.parse(this.sanitizeToJson(raw));
        optimizedResume = typeof parsed?.content === 'string' ? parsed.content : raw;
      } catch {
        optimizedResume = raw;
      }

      // Clean the resume content using utility function
      optimizedResume = cleanDocumentContent(optimizedResume);

      // Apply international character fixes (handles Turkish, German, Spanish, etc.)
      optimizedResume = fixCharacterEncoding(optimizedResume);

      // Validate resume quality - retry if malformed
      const isValid = validateDocumentContent(optimizedResume, 'resume');
      if (!isValid) {
        console.warn('Resume validation failed, attempting to fix character issues');
        // Apply character fixes again as a fallback
        optimizedResume = fixCharacterEncoding(optimizedResume);

        // If still invalid after fixes, log warning but proceed
        const stillInvalid = !validateDocumentContent(optimizedResume, 'resume');
        if (stillInvalid) {
          console.warn('Resume still has formatting issues after fixes, but proceeding');
        }
      }

      // Reset the data collection state
      this.resumeData = {};

      // Return clean resume content only (no wrapper/CTA)
      return optimizedResume;

    } catch (error) {
      this.isCollectingData = false;
      this.resumeData = {};
      throw new AppError(
        ErrorCode.AiFailed,
        'AI failed to optimize resume',
        {},
        error
      );
    }
  }

  /**
   * Check if currently collecting data from user
   */
  isCollecting(): boolean {
    return this.isCollectingData;
  }
}
