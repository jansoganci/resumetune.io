// Quality validation system for cover letter generation
// Ensures consistent, high-quality output with automatic retry logic

import { ContactInfo } from '../../components/ContactInfoInput';
import { CVData, JobDescription } from '../../types';

export interface QualityMetrics {
  formatCompliance: number;      // 0-1: Structure matches professional format
  personalizationScore: number; // 0-1: User details properly integrated
  achievementIntegration: number; // 0-1: CV achievements naturally included
  professionalTone: number;     // 0-1: Maintains appropriate tone
  contentRelevance: number;     // 0-1: Addresses job requirements
  overallScore: number;         // 0-1: Weighted average of all metrics
}

export interface QualityValidationResult {
  metrics: QualityMetrics;
  shouldRetry: boolean;
  weaknesses: string[];
  improvements: string[];
}

// Quality thresholds for validation
const QUALITY_THRESHOLDS = {
  formatCompliance: 0.8,
  personalizationScore: 0.7,
  achievementIntegration: 0.6,
  professionalTone: 0.7,
  contentRelevance: 0.6,
  overall: 0.75  // Align with README threshold
};

// Required elements for format compliance
const REQUIRED_ELEMENTS = {
  greeting: /Dear\s+(?:Hiring\s+Manager|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),/i,
  closing: /Sincerely,|Best\s+regards,|Kind\s+regards,/i,
  name: null, // Will be set dynamically based on contactInfo
  date: /\w+\s+\d{1,2},\s+\d{4}/, // Match date format
  subject: /Re:\s*Application\s+for/i
};

// Professional phrases vs. clichés
const PROFESSIONAL_INDICATORS = [
  'contributed to', 'achieved', 'implemented', 'developed', 'managed',
  'increased', 'improved', 'reduced', 'led', 'collaborated'
];

const CLICHE_PHRASES = [
  'i am writing to apply', 'please find attached', 'look forward to hearing',
  'thank you for your time', 'i believe i would be', 'perfect fit',
  'passionate about', 'think outside the box', 'hit the ground running'
];

export function validateCoverLetterQuality(
  content: string,
  contactInfo: ContactInfo,
  cvData: CVData,
  jobDescription: JobDescription
): QualityValidationResult {
  const phase2 = (import.meta as any).env?.VITE_COVER_LETTER_PHASE2_PROMPT === '1' ||
                 (import.meta as any).env?.VITE_COVER_LETTER_PHASE2_PROMPT === 'true' ||
                 (import.meta as any).env?.VITE_COVER_LETTER_PHASE2_PROMPT === true;

  const metrics: QualityMetrics = {
    formatCompliance: checkFormatCompliance(content, contactInfo),
    personalizationScore: checkPersonalization(content, contactInfo, jobDescription),
    achievementIntegration: checkAchievementIntegration(content, cvData),
    professionalTone: checkProfessionalTone(content),
    contentRelevance: checkContentRelevance(content, jobDescription),
    overallScore: 0
  };

  // Calculate weighted overall score
  metrics.overallScore = calculateOverallScore(metrics);

  // Phase 2: enforce stricter gating on placeholders and achievements
  let shouldRetry = metrics.overallScore < QUALITY_THRESHOLDS.overall;
  if (phase2) {
    const hasPlaceholders = /\[[^\]]+\]/.test(content);
    const hasFewerThanTwoAchievements = (content.match(/\d+%|\$\d+|\d+\+/g)?.length || 0) < 2;
    if (hasPlaceholders || hasFewerThanTwoAchievements) {
      shouldRetry = true;
    }
  }
  const weaknesses = identifyWeaknesses(metrics);
  const improvements = generateImprovements(metrics, weaknesses);

  return {
    metrics,
    shouldRetry,
    weaknesses,
    improvements
  };
}

function checkFormatCompliance(content: string, contactInfo: ContactInfo): number {
  let score = 0;
  const checks = [];

  // Check for proper greeting
  if (REQUIRED_ELEMENTS.greeting.test(content)) {
    score += 0.25;
    checks.push('greeting');
  }

  // Check for proper closing
  if (REQUIRED_ELEMENTS.closing.test(content)) {
    score += 0.25;
    checks.push('closing');
  }

  // Check for user's name in signature
  if (contactInfo.fullName && content.includes(contactInfo.fullName)) {
    score += 0.25;
    checks.push('name');
  }

  // Check for professional structure (paragraphs)
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
  if (paragraphs.length >= 3 && paragraphs.length <= 5) {
    score += 0.25;
    checks.push('structure');
  }

  return Math.min(score, 1.0);
}

function checkPersonalization(
  content: string, 
  contactInfo: ContactInfo, 
  jobDescription: JobDescription
): number {
  let score = 0;

  // Check if user's name is included
  if (contactInfo.fullName && content.includes(contactInfo.fullName)) {
    score += 0.3;
  }

  // Check if company name is mentioned (extract from job description)
  const companyMatch = jobDescription.content.match(/(?:company|organization|firm):\s*([A-Z][a-zA-Z\s&.,]+)/i) ||
                      jobDescription.content.match(/at\s+([A-Z][a-zA-Z\s&.,]+)/i);
  if (companyMatch && content.includes(companyMatch[1].trim())) {
    score += 0.3;
  }

  // Check if job title is mentioned
  if (jobDescription.jobTitle && content.toLowerCase().includes(jobDescription.jobTitle.toLowerCase())) {
    score += 0.2;
  }

  // Check for location reference
  if (contactInfo.location && content.includes(contactInfo.location)) {
    score += 0.2;
  }

  return Math.min(score, 1.0);
}

function checkAchievementIntegration(content: string, cvData: CVData): number {
  const contentLower = content.toLowerCase();
  let score = 0;

  // Look for quantified achievements (numbers/percentages)
  const numberMatches = content.match(/\d+%|\$\d+|\d+\+|over\s+\d+|more\s+than\s+\d+/gi);
  if (numberMatches && numberMatches.length >= 2) {
    score += 0.4;
  }

  // Look for action verbs indicating achievements
  const achievementVerbs = PROFESSIONAL_INDICATORS.filter(verb => 
    contentLower.includes(verb.toLowerCase())
  );
  if (achievementVerbs.length >= 3) {
    score += 0.3;
  }

  // Check if content references specific skills/technologies from CV
  const cvLower = cvData.content.toLowerCase();
  const skillMatches = extractCommonTerms(contentLower, cvLower);
  if (skillMatches >= 3) {
    score += 0.3;
  }

  return Math.min(score, 1.0);
}

function checkProfessionalTone(content: string): number {
  const contentLower = content.toLowerCase();
  let score = 1.0;

  // Penalty for clichéd phrases
  const clicheCount = CLICHE_PHRASES.filter(phrase => 
    contentLower.includes(phrase.toLowerCase())
  ).length;
  score -= (clicheCount * 0.1);

  // Bonus for professional language
  const professionalCount = PROFESSIONAL_INDICATORS.filter(phrase => 
    contentLower.includes(phrase.toLowerCase())
  ).length;
  score += (professionalCount * 0.05);

  // Check sentence structure (avoid overly long sentences)
  const sentences = content.split(/[.!?]+/);
  const longSentences = sentences.filter(s => s.split(' ').length > 25).length;
  if (longSentences > 2) {
    score -= 0.1;
  }

  // Phase 2: light penalty for perk/benefit emphasis to discourage applicant-centric framing
  const phase2 = (import.meta as any).env?.VITE_COVER_LETTER_PHASE2_PROMPT === '1' ||
                 (import.meta as any).env?.VITE_COVER_LETTER_PHASE2_PROMPT === 'true' ||
                 (import.meta as any).env?.VITE_COVER_LETTER_PHASE2_PROMPT === true;
  if (phase2) {
    const perkTerms = ['benefits', 'discounted flights', 'health insurance', 'perks', 'wellness', 'gym'];
    const perkHits = perkTerms.filter(t => contentLower.includes(t)).length;
    if (perkHits > 0) score -= Math.min(0.1, 0.03 * perkHits);
  }

  return Math.max(0, Math.min(score, 1.0));
}

function checkContentRelevance(content: string, jobDescription: JobDescription): number {
  const contentLower = content.toLowerCase();
  const jobLower = jobDescription.content.toLowerCase();
  
  // Extract key terms from job description
  const jobKeywords = extractKeywords(jobLower);
  const contentKeywords = extractKeywords(contentLower);
  
  // Calculate overlap
  const overlap = jobKeywords.filter(keyword => 
    contentKeywords.includes(keyword)
  ).length;
  
  const relevanceScore = Math.min(overlap / Math.max(jobKeywords.length * 0.3, 1), 1.0);
  
  return relevanceScore;
}

function calculateOverallScore(metrics: QualityMetrics): number {
  // Weighted average with format compliance and personalization having higher weight
  const weights = {
    formatCompliance: 0.3,
    personalizationScore: 0.25,
    achievementIntegration: 0.2,
    professionalTone: 0.15,
    contentRelevance: 0.1
  };

  return (
    metrics.formatCompliance * weights.formatCompliance +
    metrics.personalizationScore * weights.personalizationScore +
    metrics.achievementIntegration * weights.achievementIntegration +
    metrics.professionalTone * weights.professionalTone +
    metrics.contentRelevance * weights.contentRelevance
  );
}

function identifyWeaknesses(metrics: QualityMetrics): string[] {
  const weaknesses: string[] = [];

  if (metrics.formatCompliance < QUALITY_THRESHOLDS.formatCompliance) {
    weaknesses.push('format_compliance');
  }
  if (metrics.personalizationScore < QUALITY_THRESHOLDS.personalizationScore) {
    weaknesses.push('personalization');
  }
  if (metrics.achievementIntegration < QUALITY_THRESHOLDS.achievementIntegration) {
    weaknesses.push('achievement_integration');
  }
  if (metrics.professionalTone < QUALITY_THRESHOLDS.professionalTone) {
    weaknesses.push('professional_tone');
  }
  if (metrics.contentRelevance < QUALITY_THRESHOLDS.contentRelevance) {
    weaknesses.push('content_relevance');
  }

  return weaknesses;
}

function generateImprovements(metrics: QualityMetrics, weaknesses: string[]): string[] {
  const improvements: string[] = [];

  if (weaknesses.includes('format_compliance')) {
    improvements.push('Ensure proper business letter format with greeting, body paragraphs, and professional closing');
  }
  if (weaknesses.includes('personalization')) {
    improvements.push('Include specific company name, job title, and personal details');
  }
  if (weaknesses.includes('achievement_integration')) {
    improvements.push('Add more quantified achievements and specific examples from experience');
  }
  if (weaknesses.includes('professional_tone')) {
    improvements.push('Use more professional language and avoid clichéd phrases');
  }
  if (weaknesses.includes('content_relevance')) {
    improvements.push('Better align content with job requirements and company needs');
  }

  return improvements;
}

// Helper functions
function extractCommonTerms(text1: string, text2: string): number {
  const words1 = text1.split(/\W+/).filter(w => w.length > 3);
  const words2 = text2.split(/\W+/).filter(w => w.length > 3);
  
  return words1.filter(word => words2.includes(word)).length;
}

function extractKeywords(text: string): string[] {
  // Extract meaningful keywords (nouns, adjectives, professional terms)
  const words = text.split(/\W+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were'].includes(word.toLowerCase()));
  
  // Return unique keywords
  return [...new Set(words.map(w => w.toLowerCase()))];
}

export function getQualityInsights(result: QualityValidationResult): string {
  const { metrics } = result;
  
  let insights = `Quality Score: ${(metrics.overallScore * 100).toFixed(1)}%\n`;
  
  if (metrics.overallScore >= 0.9) {
    insights += '✅ Excellent quality - ready to use!';
  } else if (metrics.overallScore >= 0.75) {
    insights += '👍 Good quality - minor improvements possible';
  } else {
    insights += '⚠️ Needs improvement - will retry with enhanced prompts';
  }
  
  return insights;
}
