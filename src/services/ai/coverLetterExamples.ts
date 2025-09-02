// High-quality cover letter examples for few-shot prompting
// These examples are carefully curated to demonstrate excellence across different scenarios

export interface CoverLetterExample {
  id: string;
  industry: 'tech' | 'finance' | 'creative' | 'general';
  experienceLevel: 'entry' | 'mid' | 'senior';
  tone: 'professional' | 'friendly' | 'direct';
  description: string;
  input: {
    jobTitle: string;
    companyName: string;
    userProfile: string;
  };
  output: string;
  qualityScore: number;
}

export const COVER_LETTER_EXAMPLES: CoverLetterExample[] = [
  {
    id: 'tech_mid_professional',
    industry: 'tech',
    experienceLevel: 'mid',
    tone: 'professional',
    description: 'Mid-level software engineer applying to tech company',
    input: {
      jobTitle: 'Senior Software Engineer',
      companyName: 'TechFlow Solutions',
      userProfile: '4 years experience, Python/React expertise, led team projects'
    },
    output: `Sarah Johnson
sarah.johnson@email.com | (555) 123-4567 | Seattle, WA
linkedin.com/in/sarahjohnson

March 15, 2024

TechFlow Solutions

Re: Application for Senior Software Engineer

Dear Hiring Manager,

I am writing to express my strong interest in the Senior Software Engineer position at TechFlow Solutions. With four years of progressive experience in full-stack development and a proven track record of leading cross-functional teams, I am excited to contribute to your innovative technology initiatives.

In my current role at DataVision Inc., I have successfully architected and implemented scalable web applications serving over 100,000 users daily. I led a team of five developers in migrating our legacy system to a modern React/Node.js stack, resulting in a 40% improvement in application performance and a 25% reduction in server costs. My expertise in Python and React, combined with my experience in agile methodologies, aligns perfectly with your requirements for this position.

I am particularly drawn to TechFlow Solutions' commitment to cutting-edge technology and collaborative culture. Your recent work on AI-powered analytics platforms resonates with my passion for leveraging technology to solve complex business challenges. I am confident that my technical skills and leadership experience would make me a valuable addition to your engineering team.

Thank you for considering my application. I look forward to discussing how my experience and enthusiasm can contribute to TechFlow Solutions' continued success.

Sincerely,

Sarah Johnson`,
    qualityScore: 0.95
  },

  {
    id: 'finance_senior_professional',
    industry: 'finance',
    experienceLevel: 'senior',
    tone: 'professional',
    description: 'Senior financial analyst applying to Fortune 500 company',
    input: {
      jobTitle: 'Senior Financial Analyst',
      companyName: 'Global Capital Partners',
      userProfile: '7 years experience, CFA certification, M&A expertise'
    },
    output: `Michael Chen, CFA
michael.chen@email.com | (555) 987-6543 | New York, NY
linkedin.com/in/michaelchencfa

March 15, 2024

Global Capital Partners

Re: Application for Senior Financial Analyst

Dear Hiring Manager,

I am pleased to submit my application for the Senior Financial Analyst position at Global Capital Partners. With seven years of progressive experience in financial analysis and my CFA certification, I bring a comprehensive understanding of capital markets and investment strategies that would contribute significantly to your team's analytical capabilities.

During my tenure at Investment Solutions LLC, I have led financial modeling and due diligence for over $500M in M&A transactions, consistently delivering analysis that informed critical investment decisions. I developed a proprietary valuation model that improved accuracy by 15% and reduced analysis time by 30%, directly contributing to the successful completion of 12 major acquisitions. My expertise in DCF modeling, comparable company analysis, and market research has been instrumental in identifying undervalued investment opportunities.

Global Capital Partners' reputation for excellence in investment banking and your commitment to data-driven decision making strongly align with my professional values and career aspirations. I am particularly impressed by your recent expansion into emerging markets and would welcome the opportunity to apply my analytical skills to support your growth initiatives.

I would appreciate the opportunity to discuss how my experience and analytical expertise can contribute to Global Capital Partners' continued success in delivering superior results for your clients.

Sincerely,

Michael Chen, CFA`,
    qualityScore: 0.93
  },

  {
    id: 'creative_entry_friendly',
    industry: 'creative',
    experienceLevel: 'entry',
    tone: 'friendly',
    description: 'Entry-level marketing coordinator for creative agency',
    input: {
      jobTitle: 'Marketing Coordinator',
      companyName: 'Creative Spark Agency',
      userProfile: 'Recent graduate, internship experience, social media expertise'
    },
    output: `Emma Rodriguez
emma.rodriguez@email.com | (555) 456-7890 | Austin, TX
linkedin.com/in/emmarodriguez | portfolio.emmadesigns.com

March 15, 2024

Creative Spark Agency

Re: Application for Marketing Coordinator

Dear Creative Spark Team,

I was thrilled to discover your Marketing Coordinator opening, as it perfectly combines my passion for creative marketing with my desire to work at an agency that consistently produces innovative campaigns. As a recent marketing graduate with hands-on experience in digital marketing and brand development, I am excited about the opportunity to contribute to your team's creative success.

During my internship at Bright Ideas Marketing, I managed social media campaigns that increased client engagement by 45% and contributed to a 20% growth in follower count across multiple platforms. I also collaborated on the development of a brand identity project that won the local American Advertising Awards competition. My proficiency in Adobe Creative Suite, combined with my understanding of current digital marketing trends, positions me well to support Creative Spark's diverse client portfolio.

What particularly excites me about Creative Spark Agency is your commitment to pushing creative boundaries while delivering measurable results for clients. Your recent campaign for EcoTech Solutions beautifully demonstrated how compelling storytelling can drive both brand awareness and environmental consciousness. I would love to bring my fresh perspective and enthusiasm to help create similarly impactful campaigns.

Thank you for considering my application. I look forward to the opportunity to discuss how my creativity, energy, and marketing skills can contribute to Creative Spark Agency's continued innovation and growth.

Best regards,

Emma Rodriguez`,
    qualityScore: 0.91
  },

  {
    id: 'general_mid_direct',
    industry: 'general',
    experienceLevel: 'mid',
    tone: 'direct',
    description: 'Mid-level project manager for corporate role',
    input: {
      jobTitle: 'Project Manager',
      companyName: 'Apex Corporation',
      userProfile: '5 years experience, PMP certification, cross-functional leadership'
    },
    output: `James Mitchell, PMP
james.mitchell@email.com | (555) 234-5678 | Chicago, IL
linkedin.com/in/jamesmitchellpmp

March 15, 2024

Apex Corporation

Re: Application for Project Manager

Dear Hiring Manager,

Your Project Manager position immediately caught my attention because it aligns perfectly with my five years of experience leading complex, cross-functional projects and my commitment to delivering results on time and within budget. My PMP certification and proven track record of managing $2M+ projects make me an ideal candidate for this role.

At my current position with Strategic Solutions Inc., I have successfully managed 15+ projects with an average completion rate of 98% on-time delivery and 12% under budget. I led the implementation of a new ERP system that improved operational efficiency by 35% and managed a team of 20+ stakeholders across four departments. My expertise in Agile and Waterfall methodologies, combined with my ability to navigate complex organizational dynamics, has consistently delivered exceptional project outcomes.

I am drawn to Apex Corporation's reputation for operational excellence and your commitment to continuous improvement. My experience in process optimization and stakeholder management would directly support your strategic initiatives and contribute to your project success metrics.

I would welcome the opportunity to discuss how my project management expertise and results-driven approach can help Apex Corporation achieve its strategic objectives.

Best regards,

James Mitchell, PMP`,
    qualityScore: 0.89
  },

  {
    id: 'tech_senior_direct',
    industry: 'tech',
    experienceLevel: 'senior',
    tone: 'direct',
    description: 'Senior engineering manager for tech startup',
    input: {
      jobTitle: 'Engineering Manager',
      companyName: 'InnovateTech',
      userProfile: '8 years experience, team leadership, startup background'
    },
    output: `David Park
david.park@email.com | (555) 345-6789 | San Francisco, CA
linkedin.com/in/davidpark-eng

March 15, 2024

InnovateTech

Re: Application for Engineering Manager

Dear InnovateTech Team,

I am applying for the Engineering Manager position because your mission to revolutionize enterprise software aligns with my eight years of experience building high-performing engineering teams and scaling technology platforms. My background in startup environments and proven ability to lead teams through rapid growth phases make me uniquely qualified for this role.

As Engineering Manager at ScaleUp Solutions, I built and led a team of 12 engineers that delivered three major product releases, increasing user base by 300% and reducing system downtime by 85%. I implemented agile development practices that improved sprint velocity by 40% and established a mentorship program that reduced junior developer onboarding time by 50%. My technical expertise spans modern web technologies, cloud architecture, and DevOps practices.

InnovateTech's focus on innovation and technical excellence resonates with my leadership philosophy of empowering teams to deliver exceptional results. Your commitment to building products that transform how businesses operate matches my passion for creating technology solutions that drive meaningful impact.

I look forward to discussing how my engineering leadership experience and startup mindset can help InnovateTech achieve its ambitious growth goals.

Best regards,

David Park`,
    qualityScore: 0.92
  },

  {
    id: 'finance_entry_professional',
    industry: 'finance',
    experienceLevel: 'entry',
    tone: 'professional',
    description: 'Entry-level financial analyst for corporate finance',
    input: {
      jobTitle: 'Financial Analyst',
      companyName: 'Metropolitan Financial Group',
      userProfile: 'Recent finance graduate, internship experience, Excel expertise'
    },
    output: `Alexandra Williams
alexandra.williams@email.com | (555) 678-9012 | Boston, MA
linkedin.com/in/alexandrawilliams

March 15, 2024

Metropolitan Financial Group

Re: Application for Financial Analyst

Dear Hiring Manager,

I am writing to express my interest in the Financial Analyst position at Metropolitan Financial Group. As a recent finance graduate with practical experience in financial modeling and analysis, I am eager to begin my career with an organization renowned for its commitment to financial excellence and client service.

During my internship at Regional Investment Advisors, I developed comprehensive financial models for client portfolios totaling $15M and conducted market research that informed investment recommendations resulting in an average 8% portfolio outperformance. I also created automated reporting templates in Excel that reduced monthly reporting time by 25%, demonstrating my ability to improve operational efficiency while maintaining analytical rigor.

Metropolitan Financial Group's reputation for developing young professionals and your focus on innovative financial solutions strongly appeal to me. I am particularly interested in your recent expansion into sustainable investing, as this aligns with my academic research on ESG investment strategies and their impact on long-term portfolio performance.

I would welcome the opportunity to discuss how my analytical skills, attention to detail, and enthusiasm for financial markets can contribute to Metropolitan Financial Group's continued success in serving its clients.

Sincerely,

Alexandra Williams`,
    qualityScore: 0.88
  }
];

// Helper functions for example selection
export const getExamplesByIndustry = (industry: string): CoverLetterExample[] => {
  return COVER_LETTER_EXAMPLES.filter(example => 
    example.industry === industry || example.industry === 'general'
  );
};

export const getExamplesByLevel = (level: string): CoverLetterExample[] => {
  return COVER_LETTER_EXAMPLES.filter(example => example.experienceLevel === level);
};

export const getExamplesByTone = (tone: string): CoverLetterExample[] => {
  return COVER_LETTER_EXAMPLES.filter(example => example.tone === tone);
};

export const getBestMatchingExamples = (
  industry: string, 
  level: string, 
  tone: string, 
  count: number = 3
): CoverLetterExample[] => {
  // First, try to find exact matches
  let matches = COVER_LETTER_EXAMPLES.filter(example => 
    example.industry === industry && 
    example.experienceLevel === level && 
    example.tone === tone
  );

  // If not enough exact matches, expand search
  if (matches.length < count) {
    const additionalMatches = COVER_LETTER_EXAMPLES.filter(example => 
      !matches.includes(example) && (
        (example.industry === industry || example.industry === 'general') ||
        example.experienceLevel === level ||
        example.tone === tone
      )
    );
    matches = [...matches, ...additionalMatches];
  }

  // Sort by quality score and return top matches
  return matches
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, count);
};
