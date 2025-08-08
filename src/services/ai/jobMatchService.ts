import { JOB_MATCH_SYSTEM_PROMPT, JOB_MATCH_JSON_INSTRUCTION } from './prompts/jobMatchPrompt';
import { MatchResult, CVData, JobDescription, UserProfile } from '../../types';
import { sendAiMessage, AiHistoryItem } from './aiProxyClient';
import { z } from 'zod';
import { AppError, ErrorCode, mapUnknownError } from '../../utils/errors';

export class JobMatchService {
  private history: AiHistoryItem[] = [];

  async initializeChat(cvData: CVData, jobDescription: JobDescription, userProfile?: UserProfile) {
    const profileSection = userProfile ? `
CANDIDATE PROFILE:
${userProfile.content}
` : '';

    const initialContext = `${JOB_MATCH_SYSTEM_PROMPT}
${profileSection}

CV CONTENT:
${cvData.content}

JOB DESCRIPTION:
${jobDescription.content}

You now have the candidate's ${userProfile ? 'profile, ' : ''}CV and the job description. You can analyze them and provide match recommendations.`;

    this.history = [
      { role: 'user', parts: [{ text: initialContext }] },
      { role: 'model', parts: [{ text: 'I have analyzed the CV and job description. I\'m ready to provide a match recommendation.' }] }
    ];
  }

  async checkMatch(): Promise<MatchResult> {
    if (!this.history.length) {
      throw new Error('Chat not initialized. Please provide CV and job description first.');
    }

    try {
      const prompt = `Based on the CV and job description provided, decide whether the candidate should apply. ${JOB_MATCH_JSON_INSTRUCTION}`;
      const response = await sendAiMessage(this.history, prompt);

      // Be robust to models that wrap JSON in code fences or add extra text
      const sanitizeToJson = (text: string): string => {
        const withoutFences = text.replace(/```json|```/gi, '').trim();
        const match = withoutFences.match(/\{[\s\S]*\}/);
        return match ? match[0] : withoutFences;
      };

      const Schema = z.object({ decision: z.enum(['yes','no']), reason: z.string().max(200) });
      const parsed = Schema.parse(JSON.parse(sanitizeToJson(response)));

      return {
        decision: parsed.decision,
        message: parsed.reason,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error checking match:', error);
      const mapped = mapUnknownError(error);
      throw new AppError({ code: mapped.code || ErrorCode.AiFailed, messageKey: 'errors.aiFailed', cause: error });
    }
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.history.length) {
      throw new AppError({ code: ErrorCode.InvalidInput, messageKey: 'errors.invalidInput', message: 'Chat not initialized. Please provide CV and job description first.' });
    }

    try {
      const reply = await sendAiMessage(this.history, message);
      this.history.push({ role: 'user', parts: [{ text: message }] });
      this.history.push({ role: 'model', parts: [{ text: reply }] });
      return reply;
    } catch (error) {
      console.error('Error sending message:', error);
      const mapped = mapUnknownError(error);
      throw new AppError({ code: mapped.code || ErrorCode.AiFailed, messageKey: 'errors.aiFailed', cause: error });
    }
  }

  reset() {
    this.history = [];
  }
}