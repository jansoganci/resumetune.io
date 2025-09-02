import { COVER_LETTER_SYSTEM_PROMPT, COVER_LETTER_JSON_INSTRUCTION } from './coverLetterPrompt';
import { CoverLetterExample } from '../../ai/coverLetterExamples';
import { extractCompanyName, extractPositionTitle, extractTopRequirements } from '../../../utils/jobDescriptionParser';
import { extractTopAchievements, extractCoverLetterBody } from '../../../utils/textUtils';
import type { CoverLetterContext } from '../../../types/coverLetter';

export const formatExampleForPrompt = (example: CoverLetterExample): string => {
  const bodyOnly = extractCoverLetterBody(example.output || '');
  return [
    `Input Context: ${example.description}`,
    `Job Title: ${example.input.jobTitle}`,
    `Company: ${example.input.companyName}`,
    `Generated Cover Letter (body only):\n${bodyOnly}`,
    `Quality Score: ${(example.qualityScore * 100).toFixed(1)}%`
  ].join('\n');
};

export const buildConsistencyPrompt = (examples: CoverLetterExample[], userTone: string): string => {
  const examplesText = examples.map(ex => formatExampleForPrompt(ex)).join('\n\n');
  return `${COVER_LETTER_SYSTEM_PROMPT}

CRITICAL FORMAT REQUIREMENTS:
- ALWAYS include proper header with contact information
- ALWAYS extract company name and position title from job description
- ALWAYS integrate 2-3 specific achievements from CV with metrics
- ALWAYS maintain ${userTone} tone throughout
- ALWAYS follow: Introduction → Skills/Achievements → Closing structure
 - NEVER include bracketed placeholders (e.g., [Company Name], [Platform]) — omit unknown details instead
 - AVOID perk/benefit-centric phrasing; focus on candidate value and company impact

EXAMPLES OF PERFECT COVER LETTERS:
${examplesText}

QUALITY STANDARDS FROM EXAMPLES:
- Natural achievement integration (not forced)
- Specific company/role references
- Professional yet personalized voice
- Proper business letter structure

Now generate following these exact standards:
${COVER_LETTER_JSON_INSTRUCTION}`;
};

export const enhancePromptWithContext = (
  basePrompt: string,
  context: {
    jobDescription: { content: string };
    contactInfo: any;
    cvData: { content: string };
  }
): string => {
  const companyName = extractCompanyName(context.jobDescription.content) || 'Unknown Company';
  const positionTitle = extractPositionTitle(context.jobDescription.content) || 'Target Position';
  const topReqs = extractTopRequirements(context.jobDescription.content).slice(0, 3);
  const achievements = extractTopAchievements(context.cvData.content).slice(0, 3);

  return `${basePrompt}

EXTRACTION CONTEXT:
Company Name: ${companyName}
Position: ${positionTitle}
Top 3 Job Requirements: ${topReqs.join(', ') || 'N/A'}

PERSONALIZATION DATA:
User Name: ${context.contactInfo?.fullName || 'Candidate'}
Key Achievements: ${achievements.join(' | ') || 'N/A'}

Generate cover letter ensuring ALL above elements are naturally integrated.`;
};

// Phase 2: Build prompt directly from structured context (Option B)
export const buildStructuredPrompt = (
  examples: CoverLetterExample[],
  context: CoverLetterContext
): string => {
  const examplesText = examples.map(ex => formatExampleForPrompt(ex)).join('\n\n');
  const compactContext = JSON.stringify({
    company: context.company,
    position: context.position,
    requirements: (context.requirements || []).slice(0, 3),
    achievements: (context.achievements || []).slice(0, 3),
    tone: context.tone,
    contact: {
      fullName: context.contact.fullName,
      location: context.contact.location
    }
  });

  return `${COVER_LETTER_SYSTEM_PROMPT}

CRITICAL FORMAT REQUIREMENTS:
- Use EXACTLY the provided company and position; DO NOT invent or guess
- Integrate 2–3 of the provided achievements naturally (no bullet list)
- Maintain ${context.tone} tone throughout
- Follow: Introduction → Skills/Achievements → Closing structure
- NEVER include bracketed placeholders (e.g., [Company Name], [Platform]) — omit unknown details instead
- AVOID perk/benefit-centric phrasing; focus on candidate value and company impact

EXAMPLES OF PERFECT COVER LETTERS:
${examplesText}

STRUCTURED CONTEXT (JSON):
${compactContext}

INSTRUCTIONS:
- Use only fields from the STRUCTURED CONTEXT above for company/position/achievements
- Do not restate the JSON; write a clean letter body only
- Keep paragraphs concise; avoid templates and clichés

Now generate following these exact standards:
${COVER_LETTER_JSON_INSTRUCTION}`;
};
