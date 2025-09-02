// Smart suggestions and auto-detection utilities
export interface JobInfo {
  jobTitle?: string;
  companyName?: string;
  location?: string;
  salary?: string;
  requirements?: string[];
}

// Common job titles for auto-complete
export const COMMON_JOB_TITLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Product Manager',
  'UX Designer',
  'UI Designer',
  'Data Scientist',
  'Data Analyst',
  'DevOps Engineer',
  'Marketing Manager',
  'Sales Manager',
  'Content Writer',
  'Graphic Designer',
  'Project Manager',
  'Business Analyst',
  'Quality Assurance Engineer',
  'Mobile Developer',
  'Technical Writer',
  'Customer Success Manager'
];

// Extract job information from job description text
export function extractJobInfo(text: string): JobInfo {
  if (!text || text.trim().length === 0) {
    return {};
  }

  const jobInfo: JobInfo = {};
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extract job title (usually in the first few lines)
  const titlePatterns = [
    /^(?:job title|position|role):\s*(.+)$/i,
    /^(.+)\s*(?:position|role|job)$/i,
    /^we(?:'re| are) (?:looking for|hiring|seeking) (?:an? )?(.+)$/i,
    /^(.+)\s*-\s*(?:full time|part time|contract|remote)$/i
  ];

  for (const line of lines.slice(0, 5)) {
    for (const pattern of titlePatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const title = match[1].trim()
          .replace(/\s*\([^)]*\)/, '') // Remove parentheses
          .replace(/\s*-.*$/, '') // Remove everything after dash
          .replace(/\s+/g, ' '); // Normalize spaces
        
        if (title.length > 3 && title.length < 50) {
          jobInfo.jobTitle = title;
          break;
        }
      }
    }
    if (jobInfo.jobTitle) break;
  }

  // Extract company name
  const companyPatterns = [
    /^(?:company|at|join)\s*[:]\s*(.+)$/i,
    /^(.+)\s*(?:is hiring|is looking for|seeks?)$/i,
    /^(?:about|join)\s+(.+)$/i,
    /\bat\s+([A-Z][a-zA-Z\s&.,]+)(?:\s|$)/,
    /^([A-Z][a-zA-Z\s&.,]+)\s*-\s*/
  ];

  for (const line of lines.slice(0, 10)) {
    for (const pattern of companyPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim()
          .replace(/\s*\([^)]*\)/, '') // Remove parentheses
          .replace(/[.,;:!?]$/, '') // Remove trailing punctuation
          .replace(/\s+/g, ' '); // Normalize spaces
        
        if (company.length > 2 && company.length < 30 && !company.toLowerCase().includes('position')) {
          jobInfo.companyName = company;
          break;
        }
      }
    }
    if (jobInfo.companyName) break;
  }

  // Extract location
  const locationPatterns = [
    /(?:location|based in|located in):\s*(.+)$/i,
    /(?:remote|hybrid|on-site)\s*[,-]\s*(.+)$/i,
    /([A-Z][a-z]+,\s*[A-Z]{2})\b/,
    /(New York|San Francisco|Los Angeles|Chicago|Boston|Seattle|Austin|Denver|Portland|Miami|Atlanta|Washington)/i
  ];

  for (const line of text.split('\n')) {
    for (const pattern of locationPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        jobInfo.location = match[1].trim();
        break;
      }
    }
    if (jobInfo.location) break;
  }

  // Extract salary information
  const salaryPatterns = [
    /\$[\d,]+(?:\s*-\s*\$[\d,]+)?(?:\s*(?:per year|annually|\/year))?/i,
    /[\d,]+k?(?:\s*-\s*[\d,]+k?)?\s*(?:per year|annually|\/year)/i,
    /salary:\s*(.+)$/i
  ];

  for (const line of text.split('\n')) {
    for (const pattern of salaryPatterns) {
      const match = line.match(pattern);
      if (match) {
        jobInfo.salary = match[0].trim();
        break;
      }
    }
    if (jobInfo.salary) break;
  }

  return jobInfo;
}

// Get suggestions for job titles based on input
export function getJobTitleSuggestions(input: string, maxSuggestions = 5): string[] {
  if (!input || input.length < 2) {
    return [];
  }

  const inputLower = input.toLowerCase();
  const suggestions = COMMON_JOB_TITLES
    .filter(title => title.toLowerCase().includes(inputLower))
    .sort((a, b) => {
      // Prioritize titles that start with the input
      const aStartsWith = a.toLowerCase().startsWith(inputLower);
      const bStartsWith = b.toLowerCase().startsWith(inputLower);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Then by length (shorter first)
      return a.length - b.length;
    })
    .slice(0, maxSuggestions);

  return suggestions;
}

// Analyze text complexity and provide feedback
export interface TextAnalysis {
  characterCount: number;
  wordCount: number;
  readabilityScore: 'simple' | 'moderate' | 'complex';
  hasJobTitle: boolean;
  hasCompany: boolean;
  hasRequirements: boolean;
  completeness: number; // 0-100
}

export function analyzeJobDescription(text: string): TextAnalysis {
  const characterCount = text.length;
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Simple readability score based on word and sentence length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;
  const avgCharsPerWord = wordCount > 0 ? characterCount / wordCount : 0;
  
  let readabilityScore: 'simple' | 'moderate' | 'complex' = 'simple';
  if (avgWordsPerSentence > 20 || avgCharsPerWord > 7) {
    readabilityScore = 'complex';
  } else if (avgWordsPerSentence > 15 || avgCharsPerWord > 5) {
    readabilityScore = 'moderate';
  }

  const jobInfo = extractJobInfo(text);
  const hasJobTitle = !!jobInfo.jobTitle;
  const hasCompany = !!jobInfo.companyName;
  
  // Check for requirements section
  const hasRequirements = /(?:requirements?|qualifications?|skills?|experience):/i.test(text) ||
                         /(?:must have|required|essential|preferred):/i.test(text);

  // Calculate completeness score - more generous for substantial content
  let completeness = 0;
  
  // Base score for content length (more generous)
  if (characterCount > 100) completeness += 15;
  if (characterCount > 500) completeness += 15;
  if (characterCount > 1000) completeness += 15;  // Bonus for substantial content
  if (characterCount > 2000) completeness += 10;  // Extra bonus for very detailed content
  
  // Content quality indicators
  if (hasJobTitle) completeness += 15;
  if (hasCompany) completeness += 15;
  if (hasRequirements) completeness += 15;
  
  // Additional quality indicators for substantial content
  if (wordCount > 200) completeness += 10;  // Bonus for detailed descriptions
  if (wordCount > 500) completeness += 5;   // Extra bonus for very detailed content

  return {
    characterCount,
    wordCount,
    readabilityScore,
    hasJobTitle,
    hasCompany,
    hasRequirements,
    completeness: Math.min(completeness, 100)
  };
}

// Get contextual suggestions based on analysis
export function getContextualSuggestions(analysis: TextAnalysis): string[] {
  const suggestions: string[] = [];

  // Only suggest more content if it's truly minimal
  if (analysis.characterCount < 200) {
    suggestions.push('Add more details about the role and requirements');
  }

  // Only suggest missing elements if content is substantial enough
  if (analysis.characterCount > 500) {
    if (!analysis.hasJobTitle) {
      suggestions.push('Include the specific job title or position name');
    }

    if (!analysis.hasCompany) {
      suggestions.push('Mention the company or organization name');
    }

    if (!analysis.hasRequirements) {
      suggestions.push('Add required skills, experience, or qualifications');
    }
  }

  if (analysis.completeness < 60) {
    suggestions.push('Consider adding salary range, location, or benefits');
  }

  return suggestions;
}

// ---------------------------------------------------------------
// Phase 1 additions: inference helpers (non‑breaking)
// ---------------------------------------------------------------

export type SeniorityLevel =
  | 'Intern'
  | 'Junior'
  | 'Mid'
  | 'Senior'
  | 'Lead'
  | 'Staff'
  | 'Principal'
  | 'Manager'
  | 'Director';

function normalizeSeniorityFromText(text?: string | null): SeniorityLevel | null {
  if (!text) return null;
  const t = text.toLowerCase();
  // Check explicit managerial first to avoid matching 'senior' inside other words
  if (/\b(director|head of|vp|vice president)\b/.test(t)) return 'Director';
  if (/\b(manager|management)\b/.test(t)) return 'Manager';
  if (/\b(principal)\b/.test(t)) return 'Principal';
  if (/\b(staff)\b/.test(t)) return 'Staff';
  if (/\b(lead|team lead|tech lead|leading)\b/.test(t)) return 'Lead';
  if (/\b(senior|sr\.?|snr\.?|expert)\b/.test(t)) return 'Senior';
  if (/\b(mid|middle|intermediate)\b/.test(t)) return 'Mid';
  if (/\b(junior|jr\.?|entry|associate)\b/.test(t)) return 'Junior';
  if (/\b(intern|internship|trainee)\b/.test(t)) return 'Intern';
  return null;
}

/**
 * Infer a normalized seniority level from the user's professional title,
 * optionally overridden by an explicit seniority cue in the JD title.
 * Non‑breaking: safe to call without altering existing flows.
 */
export function inferSeniority(
  professionalTitle?: string,
  jdTitle?: string
): SeniorityLevel | null {
  // Prefer explicit JD title cues if present
  const fromJD = normalizeSeniorityFromText(jdTitle);
  if (fromJD) return fromJD;
  // Fallback to user's own professional title
  const fromUser = normalizeSeniorityFromText(professionalTitle);
  return fromUser;
}

/**
 * Infer a single key focus theme from the job description by scoring
 * common requirement clusters. Returns a concise label.
 */
export function inferKeyFocus(jdText?: string): string | null {
  if (!jdText || jdText.trim().length === 0) return null;
  const t = jdText.toLowerCase();

  const buckets: Record<string, string[]> = {
    'Leadership': [
      'leadership', 'lead cross', 'manage', 'management', 'mentor', 'stakeholder',
      'roadmap', 'strategy', 'strategic', 'ownership', 'drive initiatives'
    ],
    'Analytics': [
      'analytics', 'analysis', 'insights', 'kpi', 'dashboard', 'sql', 'a/b', 'hypothesis', 'statistics'
    ],
    'Automation': [
      'automation', 'automate', 'rpa', 'scripting', 'pipelines', 'ci/cd'
    ],
    'Technical Expertise': [
      'architecture', 'design systems', 'low latency', 'scalability', 'performance tuning', 'best practices', 'clean code'
    ],
    'Cloud/DevOps': [
      'aws', 'gcp', 'azure', 'terraform', 'kubernetes', 'docker', 'helm', 'devops', 'observability'
    ],
    'Data & Insights': [
      'data engineering', 'etl', 'elt', 'data warehouse', 'snowflake', 'bigquery', 'spark', 'airflow'
    ],
    'Security': [
      'security', 'owasp', 'iso 27001', 'sox', 'gdpr', 'iam', 'oauth', 'encryption', 'threat'
    ],
    'Compliance': [
      'compliance', 'audit', 'regulatory', 'sox', 'pci', 'hipaa'
    ],
    'Product/Ownership': [
      'product', 'roadmap', 'discovery', 'requirements', 'backlog', 'prioritization', 'go-to-market'
    ],
    'Customer Focus': [
      'customer', 'user research', 'ux', 'ui', 'usability', 'customer success', 'stakeholder satisfaction'
    ]
  };

  // Score buckets by keyword occurrences
  const scores: Record<string, number> = {};
  for (const [label, keywords] of Object.entries(buckets)) {
    scores[label] = keywords.reduce((acc, kw) => acc + (t.includes(kw) ? 1 : 0), 0);
  }

  // Choose the highest scoring label with a sensible priority order for ties
  const priority = [
    'Leadership', 'Technical Expertise', 'Cloud/DevOps', 'Data & Insights',
    'Analytics', 'Automation', 'Security', 'Compliance', 'Product/Ownership', 'Customer Focus'
  ];

  let best: string | null = null;
  let bestScore = 0;
  for (const label of priority) {
    const score = scores[label] || 0;
    if (score > bestScore) {
      best = label;
      bestScore = score;
    }
  }

  return best;
}
