import { extractCompanyName, extractPositionTitle, extractTopRequirements } from '../../../utils/jobDescriptionParser';
import { extractTopAchievements } from '../../../utils/textUtils';
import type { CoverLetterContext, CoverLetterContextInput, CoverLetterTone } from '../../../types/coverLetter';

function normalizeText(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function dedupeList(items: string[], max: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of items) {
    const v = normalizeText(raw);
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(v);
    if (result.length >= max) break;
  }
  return result;
}

function inferTone(contactProfessionalTitle?: string, overrideTone?: CoverLetterTone): CoverLetterTone {
  if (overrideTone) return overrideTone;
  // Default to professional for now; future: map titles to tone if needed
  return 'professional';
}

export function buildCoverLetterContext(input: CoverLetterContextInput): CoverLetterContext {
  const { cvData, jobDescription, contactInfo, tone: toneOverride, locale } = input;

  const companyFromJD = extractCompanyName(jobDescription.content) || jobDescription.companyName || null;
  const positionFromJD = extractPositionTitle(jobDescription.content) || jobDescription.jobTitle || null;

  const company = normalizeText(companyFromJD) || 'Company Name';
  const position = normalizeText(positionFromJD) || 'Position';

  const rawRequirements = extractTopRequirements(jobDescription.content);
  const requirements = dedupeList(rawRequirements, 3);

  const rawAchievements = extractTopAchievements(cvData.content);
  const achievements = dedupeList(rawAchievements, 3);

  const tone = inferTone(contactInfo.professionalTitle, toneOverride);
  const dateISO = new Date().toISOString();

  return {
    company,
    position,
    requirements,
    achievements,
    contact: {
      fullName: contactInfo.fullName,
      email: contactInfo.email,
      phone: contactInfo.phone,
      location: contactInfo.location,
      linkedin: contactInfo.linkedin,
      portfolio: contactInfo.portfolio,
      professionalTitle: contactInfo.professionalTitle,
    },
    tone,
    dateISO,
    locale,
    _source: {
      jobTitleFromJD: positionFromJD,
      companyFromJD: companyFromJD,
    },
  };
}

