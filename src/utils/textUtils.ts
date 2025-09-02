// Advanced text processing utilities for professional document generation

export const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1')     // Italic
    .replace(/#{1,6}\s/g, '')        // Headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/`([^`]+)`/g, '$1')     // Code
    .trim();
};

export const cleanDocumentContent = (content: string): string => {
  return content
    // Remove AI response artifacts and system messages
    .replace(/^.*?Perfect!.*?cover letter.*?:/i, '')
    .replace(/^.*?Your.*?(?:cover letter|resume).*?is ready.*?$/gm, '')
    .replace(/^.*?Click the download buttons.*?$/gm, '')
    .replace(/^.*?Professional resume generated.*?$/gm, '')
    .replace(/^.*?Your ATS-optimized resume is ready.*?$/gm, '')
    .replace(/^.*?✅.*?$/gm, '')
    .replace(/^.*?🎉.*?$/gm, '')
    .replace(/^.*?📝.*?$/gm, '')
    .replace(/^.*?🎯.*?$/gm, '')
    
    // Remove markdown and formatting artifacts
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/---+/g, '')
    .replace(/^\s*[-*+]\s/gm, '• ') // Convert markdown bullets to proper bullets
    
    // Clean up spacing and structure
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .replace(/\s+$/gm, '')
    .trim();
};

// Phase 2: remove bracketed placeholders like [Company Name], [Platform ...]
export const stripKnownPlaceholders = (text: string): string => {
  if (!((import.meta as any).env?.VITE_COVER_LETTER_PHASE2_PROMPT === '1' || (import.meta as any).env?.VITE_COVER_LETTER_PHASE2_PROMPT === 'true' || (import.meta as any).env?.VITE_COVER_LETTER_PHASE2_PROMPT === true)) {
    return text;
  }
  // Remove bracketed segments that look like template placeholders
  return text.replace(/\[(?:[^\]]*?(?:Company\s*Name|Platform|advert|placeholder)[^\]]*)\]/gi, '').replace(/\s{2,}/g, ' ').trim();
};

export const fixCharacterSpacing = (text: string): string => {
  // Fix AI-generated character spacing issues for all languages
  let fixed = text;
  
  // Define Unicode ranges for letters
  const letterPattern = /[A-Za-z\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F\u1D00-\u1D7F\u1D80-\u1DBF\u1DC0-\u1DFF\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF]/;
  
  // Strategy: Split by spaces, then rejoin appropriately
  const words = fixed.split(/\s+/);
  const result = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // If this word is a single character and is a letter
    if (word.length === 1 && letterPattern.test(word)) {
      let combined = word;
      let j = i + 1;
      
      // Keep combining single letter "words" until we hit a word boundary indicator
      while (j < words.length && words[j].length === 1 && letterPattern.test(words[j])) {
        combined += words[j];
        j++;
      }
      
      // Check if we should break the word here (word boundary detection)
      if (j < words.length) {
        const nextWord = words[j];
        
        // If next word is also spaced letters, we likely have multiple words
        // Look ahead to see if there's a pattern that suggests word boundary
        if (nextWord.length === 1 && letterPattern.test(nextWord)) {
          // Check if this looks like a new word (common patterns)
          const combinedLower = combined.toLowerCase();
          
          // Turkish/international name patterns that suggest word boundary
          const wordBoundaryPatterns = [
            /^(ahmet|can|mehmet|ali|ayşe|fatma|zeynep|ibrahim|ismail|mustafa)$/i,
            /^(istanbul|ankara|izmir|bursa|antalya|adana)$/i,
            /^(university|üniversitesi|technical|teknik)$/i,
            /^(manager|uzman|specialist|engineer|analyst|consultant)$/i,
            /^(information|management|systems|business|data)$/i
          ];
          
          // If current combined word matches a known pattern, treat it as complete word
          if (wordBoundaryPatterns.some(pattern => pattern.test(combinedLower))) {
            result.push(combined);
            i = j - 1; // Continue from next word
            continue;
          }
        }
      }
      
      // If we combined multiple letters, this was likely spaced text
      if (j > i + 1) {
        result.push(combined);
        i = j - 1; // Skip the combined characters
        continue;
      }
    }
    
    // Handle punctuation attached to spaced characters
    if (word.length === 2 && letterPattern.test(word[0]) && /[,.;:]/.test(word[1])) {
      if (result.length > 0 && letterPattern.test(result[result.length - 1].slice(-1))) {
        result[result.length - 1] += word;
        continue;
      }
    }
    
    result.push(word);
  }
  
  // Join with spaces and clean up
  fixed = result.join(' ');
  
  // Fix remaining spaced punctuation
  fixed = fixed.replace(/\s+([,.;:])/g, '$1');
  
  // Clean up multiple spaces
  fixed = fixed.replace(/\s{2,}/g, ' ');
  
  return fixed.trim();
};

export const fixCharacterEncoding = (text: string): string => {
  // First fix character spacing issues
  let fixed = fixCharacterSpacing(text);
  
  // Then fix encoding issues
  const encodingFixes = {
    // Fix broken encoding characters (Turkish)
    'Ã¼': 'ü',
    'Ã¶': 'ö', 
    'Ã§': 'ç',
    'Ä±': 'ı',
    'Ä°': 'İ',
    'Åž': 'ş',
    'Ä': 'ğ',
    'Ã': 'ü',
    
    // Fix broken encoding characters (German)
    'Ã¤': 'ä',
    'Ã„': 'Ä',
    'Ã–': 'Ö',
    'Ãœ': 'Ü',
    'ÃŸ': 'ß',
    
    // Fix broken encoding characters (Spanish)
    'Ã±': 'ñ',
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    
    // Fix broken encoding characters (French)
    'Ã ': 'à',
    'Ã¨': 'è',
    'Ã¹': 'ù',
    'Ã¢': 'â',
    'Ãª': 'ê',
    'Ã®': 'î',
    'Ã´': 'ô',
    'Ã»': 'û',
    'Ã§fr': 'ç',
    
    // Remove replacement characters
    '�': '',
    '': ''
  };

  Object.entries(encodingFixes).forEach(([broken, fixedChar]) => {
    fixed = fixed.replace(new RegExp(broken, 'g'), fixedChar);
  });

  return fixed;
};

export const detectCharacterSpacingIssues = (content: string): boolean => {
  // Detect if content has character spacing issues
  const spacingPatterns = [
    /\b[A-Za-zÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u4E00-\u9FFF\uAC00-\uD7AF\u3040-\u309F\u30A0-\u30FF]\s+[A-Za-zÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u4E00-\u9FFF\uAC00-\uD7AF\u3040-\u309F\u30A0-\u30FF]\s+[A-Za-zÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u4E00-\u9FFF\uAC00-\uD7AF\u3040-\u309F\u30A0-\u30FF]/g,
    /[A-Za-zÀ-ÿĀ-žА-я\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u4E00-\u9FFF\uAC00-\uD7AF\u3040-\u309F\u30A0-\u30FF]\s+[,.;:]/g
  ];
  
  return spacingPatterns.some(pattern => pattern.test(content));
};

export const validateDocumentContent = (content: string, type: 'resume' | 'cover-letter'): boolean => {
  const cleanContent = cleanDocumentContent(content);
  
  // Check for character spacing issues
  const hasSpacingIssues = detectCharacterSpacingIssues(cleanContent);
  if (hasSpacingIssues) {
    console.warn('Document validation failed: Character spacing issues detected');
    return false;
  }
  
  if (type === 'resume') {
    // Resume should have key sections and be substantial
    const hasRequiredSections = cleanContent.toLowerCase().includes('professional summary') ||
                               cleanContent.toLowerCase().includes('work experience') ||
                               cleanContent.toLowerCase().includes('technical skills');
    const isSubstantial = cleanContent.length > 300;
    const noArtifacts = !cleanContent.includes('✅') && !cleanContent.includes('🎉');
    
    return hasRequiredSections && isSubstantial && noArtifacts;
  } else {
    // Cover letter should have proper structure
    const lower = cleanContent.toLowerCase();
    const hasGreeting = lower.includes('dear') || lower.includes('sayın') || lower.includes('merhaba');
    const hasClosing = lower.includes('sincerely') || lower.includes('saygılarımla') || lower.includes('sevgiler');
    const isSubstantial = cleanContent.length > 200;
    const noArtifacts = !cleanContent.includes('✅') && !cleanContent.includes('🎉');
    
    return hasGreeting && hasClosing && isSubstantial && noArtifacts;
  }
};

export const extractJobInfo = (content: string) => {
  const companyMatch = content.match(/Dear\s+(.+?)\s+Hiring\s+Manager/i) || 
                      content.match(/at\s+([A-Z][a-zA-Z\s&]+?)(?:\s+for|\s+as|\.|,)/);
  const positionMatch = content.match(/for\s+the\s+(.+?)\s+position/i) ||
                       content.match(/applying\s+for\s+(.+?)\s+role/i);
  
  return {
    company: fixCharacterEncoding(companyMatch?.[1]?.trim() || 'Company'),
    position: positionMatch?.[1]?.trim() || 'Position'
  };
};

export const extractResumeInfo = (content: string) => {
  // Extract name from first line or contact section
  const lines = content.split('\n').filter(line => line.trim()).map(line => fixCharacterEncoding(line));
  const nameMatch = lines[0]?.match(/^([A-Z][a-zA-Z\s]+)$/) ||
                   content.match(/^([A-Z][a-zA-Z\s]+)\s*$/m);
  
  // Extract role from professional summary or job titles
  const roleMatch = content.match(/(?:PROFESSIONAL SUMMARY|Professional Summary)[\s\S]*?([A-Z][a-zA-Z\s]*(?:Consultant|Manager|Analyst|Specialist|Developer|Engineer|Director|Lead|Expert))/i) ||
                   content.match(/([A-Z][a-zA-Z\s]*(?:SAP|BPC|Finance|Financial|Senior|Lead)[\s\w]*(?:Consultant|Manager|Analyst|Specialist))/i);
  
  return {
    name: fixCharacterEncoding(nameMatch?.[1]?.trim() || 'Professional'),
    role: roleMatch?.[1]?.trim() || 'Resume'
  };
}

export const formatResumeStructure = (content: string): string => {
  let formatted = content;
  
  // Ensure proper section headers with consistent formatting
  formatted = formatted
    .replace(/PROFESSIONAL\s+SUMMARY/gi, '\nPROFESSIONAL SUMMARY\n')
    .replace(/TECHNICAL\s+SKILLS/gi, '\nTECHNICAL SKILLS\n')
    .replace(/WORK\s+EXPERIENCE/gi, '\nWORK EXPERIENCE\n')
    .replace(/EDUCATION.*?CERTIFICATIONS/gi, '\nEDUCATION & CERTIFICATIONS\n')
    .replace(/CERTIFICATIONS/gi, '\nCERTIFICATIONS\n')
    
    // Fix bullet point formatting
    .replace(/•\s+/g, '• ')
    .replace(/^\s*[-*+]\s/gm, '• ')
    
    // Clean up excessive whitespace but preserve section breaks
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .replace(/\s+$/gm, '')
    .trim();
  
  return formatted;
};

export const formatProfessionalContent = (content: string, type: 'resume' | 'cover-letter'): string => {
  let formatted = cleanDocumentContent(content);
  formatted = fixCharacterEncoding(formatted);
  
  if (type === 'resume') {
    formatted = formatResumeStructure(formatted);
  }
  
  return formatted;
};

export const extractSenderInfo = (content: string) => {
  // Extract sender information from cover letter
  const nameMatch = content.match(/Sincerely,\s*([A-Z][a-zA-Z\s]+)/i) ||
                   content.match(/^([A-Z][a-zA-Z\s]+)\s*$/m);
  
  const emailMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = content.match(/(\+\d{1,3}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9})/);
  
  // Extract location from pipe-delimited contact line format: email | phone | location
  let location = null;
  
  // Look for pipe-delimited contact lines with exactly 3 segments
  const contactLineMatch = content.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*\|\s*([^|]*?)\s*\|\s*([^|\n]+)/);
  if (contactLineMatch && contactLineMatch[3]) {
    // Third segment after email and phone should be location
    location = contactLineMatch[3].trim();
  }
  
  // If no pipe-delimited format found, fallback to pattern matching
  if (!location) {
    const locationPatterns = [
      // City, Country format
      /([A-Z][a-zA-Z\s]+),\s*([A-Z][a-zA-Z\s]+)/g,
      // Single location names that are not generic words
      /(Bangkok|Istanbul|Singapore|London|New York|Tokyo|Berlin|Paris|Sydney|Toronto|Dubai|Mumbai|Delhi|Shanghai|Seoul|Manila|Jakarta|Kuala Lumpur|Ho Chi Minh City|Hanoi|Yangon|Phnom Penh|Vientiane|Bandar Seri Begawan|Male|Colombo|Kathmandu|Thimphu|Dhaka|Islamabad|Kabul|Tehran|Baghdad|Damascus|Beirut|Amman|Jerusalem|Cairo|Tripoli|Tunis|Algiers|Rabat|Casablanca|Lagos|Nairobi|Cape Town|Johannesburg|Addis Ababa|Khartoum|Accra|Abuja|Dakar|Bamako|Ouagadougou|Niamey|N'Djamena|Bangui|Kinshasa|Brazzaville|Libreville|Malabo|Sao Tome|Luanda|Windhoek|Gaborone|Maseru|Mbabane|Maputo|Antananarivo|Port Louis|Victoria|Moroni)/gi
    ];
    
    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match && match[0]) {
        location = match[0];
        break;
      }
    }
  }
  
  return {
    name: fixCharacterEncoding(nameMatch?.[1]?.trim() || 'Your Name'),
    email: emailMatch?.[1] || null,
    phone: phoneMatch?.[1] || null,
    location: location ? fixCharacterEncoding(location) : null
  };
};

export const extractRecipientInfo = (content: string) => {
  // Extract recipient information
  const nameMatch = content.match(/Dear\s+([A-Z][a-zA-Z\s]+),/i);
  const companyMatch = content.match(/at\s+([A-Z][a-zA-Z\s&]+?)(?:\s+for|\s+as|\.|,)/);
  
  return {
    name: nameMatch?.[1]?.trim() !== 'Hiring Manager' ? nameMatch?.[1]?.trim() : null,
    company: fixCharacterEncoding(companyMatch?.[1]?.trim() || 'Company Name'),
  };
};

export const extractCoverLetterBody = (content: string): string => {
  // Extract main body content, removing header and footer elements
  let bodyContent = content
    .replace(/^.*?Dear\s+[^,]+,\s*/is, '') // Remove everything before greeting
    .replace(/\s*Sincerely,.*$/is, '') // Remove closing and signature
    .replace(/^.*?Perfect!.*?cover letter.*?:/i, '') // Remove AI artifacts
    .replace(/^.*?Your.*?cover letter.*?is ready.*?$/gm, '')
    .replace(/---+/g, '')
    .trim();
  
  // Split into logical paragraphs and clean up
  const sentences: string[] = bodyContent.split(/\.\s+/);
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];
  
  sentences.forEach((sentence, index) => {
    currentParagraph.push(sentence.trim());
    
    // Create paragraph breaks at logical points
    if (currentParagraph.length >= 3 || 
        sentence.includes('experience') || 
        sentence.includes('particularly drawn') ||
        sentence.includes('Thank you')) {
      paragraphs.push(currentParagraph.join('. ') + (index < sentences.length - 1 ? '.' : ''));
      currentParagraph = [];
    }
  });
  
  // Add any remaining content
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join('. ') + '.');
  }
  
  return paragraphs.join('\n\n');
};

// Extract top quantified achievements from CV/resume text
export const extractTopAchievements = (cvContent: string): string[] => {
  const lines = (cvContent || '')
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);
  // Prefer bullets or sentences with numbers/percentages/currency
  const scored = lines.map(l => {
    const score =
      (l.match(/\d+%/g)?.length || 0) * 3 +
      (l.match(/\$\s?\d+[\d,]*/g)?.length || 0) * 2 +
      (l.match(/\b\d{2,}\b/g)?.length || 0) +
      (l.match(/\b(achieved|increased|improved|reduced|led|managed|delivered|launched|optimized|built|implemented)\b/i)?.length ? 2 : 0);
    return { line: l, score };
  });
  return scored
    .filter(x => x.score > 0 && x.line.length > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.line.replace(/^[-*•]\s*/, ''));
};

// Cover Letter Specific Formatting Functions
export const extractCoverLetterFromAIResponse = (aiResponse: string): string => {
  // Remove AI wrapper text and extract just the cover letter content
  let coverLetter = aiResponse
    .replace(/^.*?Perfect!.*?cover letter.*?:/i, '') // Remove AI intro
    .replace(/^.*?Your.*?cover letter.*?is ready.*?$/gm, '') // Remove AI outro
    .replace(/---+.*$/s, '') // Remove everything after separator
    .replace(/🎉.*$/s, '') // Remove celebration text
    .replace(/✅.*$/gm, '') // Remove checkmarks
    .replace(/Click the download buttons.*$/s, '') // Remove download instructions
    .trim();
  
  return coverLetter;
};

export const formatCoverLetterHeader = (contactInfo: any): string => {
  // Debug: Restricted to dev to prevent PII exposure in production logs
  if (import.meta.env.DEV) {
    console.log('formatCoverLetterHeader(dev) - received keys:', Object.keys(contactInfo || {}));
  }
  
  // Format contact information in professional 2-3 line format
  const headerLines = [];
  
  // Line 1: Full Name
  headerLines.push(contactInfo.fullName || 'Your Name');
  
  // Line 2: Email | Phone | Location (combine with separators)
  const contactLine = [
    contactInfo.email || 'your.email@example.com',
    contactInfo.phone || null,
    contactInfo.location || 'Your City, Country'
  ].filter(Boolean).join(' | ');
  
  // Minimal dev-only insight
  if (import.meta.env.DEV) {
    console.log('formatCoverLetterHeader(dev) - contact line length:', contactLine.length);
  }
  
  if (contactLine) {
    headerLines.push(contactLine);
  }
  
  if (import.meta.env.DEV) {
    console.log('formatCoverLetterHeader(dev) - final lines count:', headerLines.length);
  }
  
  // Line 3: LinkedIn/Portfolio (if provided)
  if (contactInfo.linkedin) {
    headerLines.push(contactInfo.linkedin);
  } else if (contactInfo.portfolio) {
    headerLines.push(contactInfo.portfolio);
  }
  
  return headerLines.join('\n');
};

export const formatCoverLetterBody = (bodyContent: string): string => {
  // Split content into logical paragraphs with proper spacing
  const paragraphs = bodyContent
    .split(/\n+/) // Split on existing line breaks
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  // Process each paragraph to ensure proper sentence structure
  const formattedParagraphs = paragraphs.map(paragraph => {
    // Ensure paragraph ends with proper punctuation
    if (!paragraph.match(/[.!?]$/)) {
      paragraph += '.';
    }
    
    // Clean up spacing within paragraph
    return paragraph.replace(/\s+/g, ' ').trim();
  });
  
  // Join paragraphs with double line breaks for proper spacing
  return formattedParagraphs.join('\n\n');
};

export const formatCompleteCoverLetter = (rawContent: string, contactInfo: any): string => {
  // Extract just the cover letter content from AI response
  let cleanContent = extractCoverLetterFromAIResponse(rawContent);
  // Phase 2: strip known placeholders
  cleanContent = stripKnownPlaceholders(cleanContent);
  
  // Extract different parts of the cover letter
  const dateMatch = cleanContent.match(/(\w+ \d{1,2}, \d{4})/);
  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Extract company and position from content
  const phase2 = (import.meta as any).env?.VITE_COVER_LETTER_PHASE2_PROMPT === '1' ||
                 (import.meta as any).env?.VITE_COVER_LETTER_PHASE2_PROMPT === 'true' ||
                 (import.meta as any).env?.VITE_COVER_LETTER_PHASE2_PROMPT === true;
  let companyRaw = '';
  let positionRaw = '';
  if (phase2) {
    // Prefer 'at <Company>' capture to avoid mistaking role phrases for company
    const companyAtMatch = cleanContent.match(/\bat\s+([A-Z][a-zA-Z\s&.,-]+?)(?:\.|,|\s|$)/i);
    const companyForMatch = cleanContent.match(/\bfor\s+([A-Z][a-zA-Z\s&.,-]+?)(?:\s+for|\s+as|\.|,|\s+role|\s+position)/i);
    companyRaw = (companyAtMatch?.[1] || companyForMatch?.[1] || '').trim();
    // Position can appear as 'for the <Title> position', 'applying for <Title> role', or '<Title> position at <Company>'
    const positionMatch = cleanContent.match(/\b(?:for|as)\s+(?:the\s+)?([A-Z][a-zA-Z\s&.,-]+?)(?:\s+position|\s+role|\s+at)/i) ||
                         cleanContent.match(/\bapplying\s+for\s+(?:the\s+)?([A-Z][a-zA-Z\s&.,-]+?)(?:\s+position|\s+role)/i) ||
                         cleanContent.match(/\b([A-Z][a-zA-Z\s&.,-]+?)\s+position\s+at\s+[A-Z]/i);
    positionRaw = positionMatch?.[1]?.trim() || '';
    // Guard: if companyRaw looks like a role, discard it
    const roleWords = /(analyst|engineer|developer|manager|director|consultant|specialist|designer|coordinator|lead|officer|architect|scientist)/i;
    if (companyRaw && roleWords.test(companyRaw)) {
      companyRaw = '';
    }
  } else {
    // Legacy extraction behavior
    const companyMatch = cleanContent.match(/(?:at|for)\s+([A-Z][a-zA-Z\s&.,-]+?)(?:\s+for|\s+as|\.|,|\s+role|\s+position)/i) ||
                        cleanContent.match(/Dear.*?Manager.*?at\s+([A-Z][a-zA-Z\s&.,-]+)/i);
    const legacyPosition = cleanContent.match(/(?:for|as)\s+(?:the\s+)?([A-Z][a-zA-Z\s&.,-]+?)(?:\s+position|\s+role|\s+at)/i) ||
                           cleanContent.match(/applying\s+for\s+(?:the\s+)?([A-Z][a-zA-Z\s&.,-]+?)(?:\s+position|\s+role)/i);
    companyRaw = companyMatch?.[1]?.trim() || '';
    positionRaw = legacyPosition?.[1]?.trim() || '';
  }
  
  const company = companyRaw || 'Company Name';
  const position = positionRaw || 'Position';
  
  // Extract body content (everything between greeting and closing)
  const bodyMatch = cleanContent.match(/Dear[^,]+,\s*([\s\S]*?)\s*Sincerely,/i);
  let bodyContent = bodyMatch ? bodyMatch[1].trim() : cleanContent;
  
  // Limit body content to 3 paragraphs maximum for single page
  const paragraphs = bodyContent.split('\n\n').filter(p => p.trim());
  if (paragraphs.length > 3) {
    bodyContent = paragraphs.slice(0, 3).join('\n\n');
  }
  
  // Format the complete cover letter
  const formattedHeader = formatCoverLetterHeader(contactInfo);
  console.log('formatCompleteCoverLetter - Formatted header result:', formattedHeader);
  const formattedBody = formatCoverLetterBody(bodyContent);
  
  const formattedCoverLetter = `${formattedHeader}

${date}

${company}

Re: Application for ${position}

Dear Hiring Manager,

${formattedBody}

Sincerely,

${contactInfo.fullName || 'Your Name'}`;

  return formattedCoverLetter;
};
