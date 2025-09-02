// Job description parsing utility to extract job title and company name

export interface ParsedJobInfo {
  jobTitle: string | null;
  companyName: string | null;
}

export const parseJobDescription = (content: string): ParsedJobInfo => {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let jobTitle: string | null = null;
  let companyName: string | null = null;

  // Extract job title - look for common patterns in first few lines
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    
    // Skip very short lines or lines with too many special characters
    if (line.length < 3 || line.split(/[^a-zA-Z\s]/).length > line.split(' ').length) {
      continue;
    }
    
    // Look for job title patterns
    const jobTitlePatterns = [
      // Direct job title patterns
      /^(?:job title|position|role):\s*(.+)$/i,
      /^(.+?)\s*(?:position|role|job)$/i,
      // Common job titles
      /^(.*(?:manager|director|analyst|consultant|engineer|developer|designer|specialist|coordinator|assistant|lead|senior|junior|intern).*)$/i,
      // First substantial line that looks like a job title
      /^([A-Z][a-zA-Z\s&,-]{5,50})$/
    ];
    
    for (const pattern of jobTitlePatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim();
        // Validate it looks like a job title
        if (candidate.length >= 5 && candidate.length <= 60 && 
            !candidate.toLowerCase().includes('company') &&
            !candidate.toLowerCase().includes('about') &&
            !candidate.toLowerCase().includes('description')) {
          jobTitle = candidate;
          break;
        }
      }
    }
    
    if (jobTitle) break;
  }

  // Extract company name - look for common patterns
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    
    const companyPatterns = [
      // Direct company patterns
      /^(?:company|organization|employer):\s*(.+)$/i,
      /^(.+?)\s*(?:is looking for|seeks|hiring).*$/i,
      /^(?:at|for|with)\s+(.+?)(?:\s|$)/i,
      // Company name followed by common indicators
      /^(.+?)\s*(?:inc|ltd|llc|corp|corporation|company|group|solutions|technologies|systems)\.?$/i,
      // Lines that mention the company context
      /(?:join|work at|employed by|position at)\s+(.+?)(?:\s|$|,)/i
    ];
    
    for (const pattern of companyPatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const candidate = match[1].trim();
        // Validate it looks like a company name
        if (candidate.length >= 2 && candidate.length <= 50 &&
            !candidate.toLowerCase().includes('position') &&
            !candidate.toLowerCase().includes('role') &&
            !candidate.toLowerCase().includes('job')) {
          companyName = candidate;
          break;
        }
      }
    }
    
    if (companyName) break;
  }

  return {
    jobTitle,
    companyName
  };
};

// Phase 2 helpers (non-breaking): simple extractors building on parseJobDescription
export const extractCompanyName = (content: string): string | null => {
  const parsed = parseJobDescription(content || '');
  if (parsed.companyName) return parsed.companyName;
  // Fallback patterns inline for robustness
  const m = (content || '').match(/(?:company|organization|employer):\s*([^\n]+)/i) ||
            (content || '').match(/\bat\s+([A-Z][\w\s&.,-]+)/i);
  return m?.[1]?.trim() || null;
};

export const extractPositionTitle = (content: string): string | null => {
  const parsed = parseJobDescription(content || '');
  if (parsed.jobTitle) return parsed.jobTitle;
  const m = (content || '').match(/(?:job title|position|role):\s*([^\n]+)/i) ||
            (content || '').match(/\bfor\s+the\s+([A-Z][\w\s&.,-]+)(?:\s+position|\s+role)/i);
  return m?.[1]?.trim() || null;
};

export const extractTopRequirements = (content: string): string[] => {
  const text = (content || '').toLowerCase();
  // Naive keyphrase extraction: lines under Requirements/Qualifications or bullet-like lines
  const lines = content.split(/\n+/).map(l => l.trim());
  const reqStart = lines.findIndex(l => /requirements|qualifications|responsibilities/i.test(l));
  const candidates: string[] = [];
  for (let i = reqStart >= 0 ? reqStart + 1 : 0; i < lines.length && candidates.length < 8; i++) {
    const line = lines[i];
    if (!line) continue;
    if (/^[-*•]/.test(line) || line.length > 20) {
      const clean = line.replace(/^[-*•]\s*/, '').replace(/[:.;]$/,'').trim();
      if (clean && !/about\s+us|benefits|company|culture/i.test(clean)) {
        candidates.push(clean);
      }
    }
    if (reqStart >= 0 && /^\s*$/.test(line)) break; // stop at blank after section
  }
  // Fallback: extract nouns/skills-like tokens
  if (candidates.length === 0) {
    const skills = Array.from(new Set((content.match(/\b[A-Za-z]{3,}\b/g) || [])
      .filter(w => !['with','and','for','the','this','that','will','team','work','role','your','our','you','have','are','from','into'].includes(w.toLowerCase()))));
    return skills.slice(0, 3);
  }
  return candidates.slice(0, 5);
};
