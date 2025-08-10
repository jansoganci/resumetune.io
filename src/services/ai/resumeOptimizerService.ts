import { RESUME_OPTIMIZER_SYSTEM_PROMPT } from './prompts/resumeOptimizerPrompt';
import { CVData, JobDescription, UserProfile } from '../../types';
import { cleanDocumentContent } from '../../utils/textUtils';
import { sendAiMessage, AiHistoryItem } from './aiProxyClient';
import { AppError, ErrorCode, mapUnknownError } from '../../utils/errors';
import { checkAndConsumeLimit, getErrorMessage } from '../creditService';

export class ResumeOptimizerService {
  private history: AiHistoryItem[] = [];
  private resumeData: { targetRole?: string; experienceLevel?: string; keyFocus?: string } = {};
  private isCollectingData = false;
  private currentStep = 0;
  
  private readonly steps = [
    { key: 'targetRole', question: 'What specific role title should I optimize for? (e.g., "Senior SAP Consultant", "Finance Manager")' },
    { key: 'experienceLevel', question: 'What experience level should I emphasize? (e.g., "Senior", "Lead", "Manager", "Specialist")' },
    { key: 'keyFocus', question: 'What should be the main focus? (e.g., "Technical expertise", "Leadership", "Analytics", "Automation")' }
  ];

  async initializeChat(cvData: CVData, jobDescription: JobDescription, userProfile?: UserProfile) {
    // Variables are used directly in the prompt, no need to store as instance variables
    
    const profileSection = userProfile ? `
CANDIDATE PROFILE:
${userProfile.content}
` : '';

    const initialContext = `${RESUME_OPTIMIZER_SYSTEM_PROMPT}
${profileSection}

CV CONTENT:
${cvData.content}

JOB DESCRIPTION:
${jobDescription.content}

You now have the candidate's ${userProfile ? 'profile, ' : ''}CV and the job description. You can help create an ATS-optimized resume.`;

    this.history = [
      { role: 'user', parts: [{ text: initialContext }] },
      { role: 'model', parts: [{ text: `I have analyzed the candidate's ${userProfile ? 'profile, ' : ''}CV and job description. I\'m ready to help you create an ATS-optimized resume tailored for this position.` }] }
    ];
  }

  startDataCollection(): string {
    this.isCollectingData = true;
    this.currentStep = 0;
    this.resumeData = {};
    
    return `🎯 **Resume Optimizer Started!**

I'll help you create an ATS-optimized resume tailored specifically for this position! I need to collect a few details first.

**Step 1 of ${this.steps.length}:**
${this.steps[0].question}`;
  }

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

  private async generateOptimizedResume(): Promise<string> {
    if (!this.history.length) {
      throw new Error('Chat not initialized');
    }

    // ✅ KREDİ KONTROLÜ - Resume optimization 1 kredi tüketir
    const creditCheck = await checkAndConsumeLimit('optimize_resume');
    
    if (!creditCheck.allowed) {
      const errorMessage = getErrorMessage(creditCheck);
      throw new AppError(ErrorCode.QuotaExceeded, errorMessage);
    }

    console.log('✅ Credit check passed for resume optimization:', {
      planType: creditCheck.planType,
      creditsRemaining: creditCheck.currentCredits,
      dailyUsage: creditCheck.dailyUsage
    });

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

      const raw = await sendAiMessage(this.history, prompt);
      // Parse JSON content robustly
      const sanitizeToJson = (text: string): string => {
        const withoutFences = text.replace(/```json|```/gi, '').trim();
        const match = withoutFences.match(/\{[\s\S]*\}/);
        return match ? match[0] : withoutFences;
      };
      let optimizedResume: string;
      try {
        const parsed = JSON.parse(sanitizeToJson(raw));
        optimizedResume = typeof parsed?.content === 'string' ? parsed.content : raw;
      } catch {
        optimizedResume = raw;
      }
      
      // Clean the resume content using utility function
      optimizedResume = cleanDocumentContent(optimizedResume);
      
      // Reset the data collection state
      this.resumeData = {};
      
      return `✅ **Your ATS-optimized resume is ready:**

${optimizedResume}

---
🎉 **Professional resume generated!** Click the download buttons below to get PDF or DOCX versions.`;
      
    } catch (error) {
      this.isCollectingData = false;
      this.resumeData = {};
      const mapped = mapUnknownError(error);
      throw new AppError(mapped.code || ErrorCode.AiFailed, 'AI failed to optimize resume', {}, error);
    }
  }

  isCollecting(): boolean {
    return this.isCollectingData;
  }

  reset() {
    this.history = [];
    this.resumeData = {};
    this.isCollectingData = false;
    this.currentStep = 0;
  }
}