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

  // Calculate completeness score
  let completeness = 0;
  if (characterCount > 100) completeness += 20;
  if (characterCount > 500) completeness += 20;
  if (hasJobTitle) completeness += 20;
  if (hasCompany) completeness += 20;
  if (hasRequirements) completeness += 20;

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

  if (analysis.characterCount < 100) {
    suggestions.push('Add more details about the role and requirements');
  }

  if (!analysis.hasJobTitle) {
    suggestions.push('Include the specific job title or position name');
  }

  if (!analysis.hasCompany) {
    suggestions.push('Mention the company or organization name');
  }

  if (!analysis.hasRequirements) {
    suggestions.push('Add required skills, experience, or qualifications');
  }

  if (analysis.completeness < 60) {
    suggestions.push('Consider adding salary range, location, or benefits');
  }

  return suggestions;
}
