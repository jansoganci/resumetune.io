// Test script for Enhanced Cover Letter Service
// This validates the few-shot prompting and quality control integration

import { EnhancedCoverLetterService } from '../enhancedCoverLetterService';
import { CVData, JobDescription, UserProfile } from '../../../types';
import { ContactInfo } from '../../../components/ContactInfoInput';

// Test data
const testCVData: CVData = {
  content: `John Smith
Software Engineer
Experience: 5 years in full-stack development
Skills: React, Node.js, Python, AWS
Achievements: 
- Led development of e-commerce platform serving 50,000+ users
- Improved application performance by 40% through optimization
- Managed team of 4 developers on critical projects`,
  fileName: 'test-cv.pdf',
  uploadedAt: new Date()
};

const testJobDescription: JobDescription = {
  content: `Senior Software Engineer - TechCorp Inc.
Location: San Francisco, CA
Requirements:
- 3+ years experience in web development
- Proficiency in React, Node.js
- Experience with cloud platforms (AWS/Azure)
- Strong problem-solving skills
- Ability to lead technical projects

About TechCorp: We're an innovative technology company building next-generation software solutions for enterprise clients.`,
  jobTitle: 'Senior Software Engineer',
  companyName: 'TechCorp Inc.',
  addedAt: new Date()
};

const testContactInfo: ContactInfo = {
  fullName: 'John Smith',
  email: 'john.smith@email.com',
  phone: '(555) 123-4567',
  location: 'San Francisco, CA',
  linkedin: 'https://linkedin.com/in/johnsmith',
  portfolio: 'https://johnsmith.dev',
  professionalTitle: 'Software Engineer'
};

const testUserProfile: UserProfile = {
  content: 'Experienced software engineer with passion for building scalable web applications. Strong background in React and Node.js development.',
  savedAt: new Date()
};

// Test function
export async function testEnhancedCoverLetterService() {
  console.log('🧪 Testing Enhanced Cover Letter Service...\n');
  
  try {
    // Initialize service
    const service = new EnhancedCoverLetterService();
    await service.initializeChat(testCVData, testJobDescription, testUserProfile);
    
    console.log('✅ Service initialized successfully');
    
    // Generate cover letter
    console.log('🚀 Generating cover letter with few-shot prompting...');
    const result = await service.generateCoverLetter(testContactInfo);
    
    console.log('✅ Cover letter generated successfully!');
    console.log('\n📄 Generated Cover Letter:');
    console.log('='.repeat(50));
    console.log(result);
    console.log('='.repeat(50));
    
    // Validate output format
    const hasHeader = result.includes(testContactInfo.fullName);
    const hasCompany = result.includes('TechCorp');
    const hasPersonalization = result.includes('john.smith@email.com');
    const hasMetrics = /\d+%|\d+\+|\$\d+/.test(result);
    
    console.log('\n🔍 Quality Validation:');
    console.log(`Header with name: ${hasHeader ? '✅' : '❌'}`);
    console.log(`Company reference: ${hasCompany ? '✅' : '❌'}`);
    console.log(`Personalization: ${hasPersonalization ? '✅' : '❌'}`);
    console.log(`Quantified achievements: ${hasMetrics ? '✅' : '❌'}`);
    
    const overallQuality = [hasHeader, hasCompany, hasPersonalization, hasMetrics]
      .filter(Boolean).length / 4;
    
    console.log(`\n📊 Overall Quality Score: ${(overallQuality * 100).toFixed(1)}%`);
    
    if (overallQuality >= 0.75) {
      console.log('🎉 Test PASSED - High quality output achieved!');
    } else {
      console.log('⚠️ Test WARNING - Quality could be improved');
    }
    
  } catch (error) {
    console.error('❌ Test FAILED:', error);
    throw error;
  }
}

// Example usage validation
export function validateExampleLibrary() {
  console.log('\n📚 Validating Example Library...');
  
  import('../coverLetterExamples').then(({ COVER_LETTER_EXAMPLES, getBestMatchingExamples }) => {
    console.log(`Total examples: ${COVER_LETTER_EXAMPLES.length}`);
    
    // Test example selection
    const techExamples = getBestMatchingExamples('tech', 'mid', 'professional', 3);
    const financeExamples = getBestMatchingExamples('finance', 'senior', 'professional', 3);
    const generalExamples = getBestMatchingExamples('general', 'entry', 'friendly', 3);
    
    console.log(`Tech examples found: ${techExamples.length}`);
    console.log(`Finance examples found: ${financeExamples.length}`);
    console.log(`General examples found: ${generalExamples.length}`);
    
    // Validate example quality
    const avgQuality = COVER_LETTER_EXAMPLES.reduce((sum, ex) => sum + ex.qualityScore, 0) / COVER_LETTER_EXAMPLES.length;
    console.log(`Average example quality: ${(avgQuality * 100).toFixed(1)}%`);
    
    if (avgQuality >= 0.85) {
      console.log('✅ Example library validation PASSED');
    } else {
      console.log('⚠️ Example library needs quality improvements');
    }
  });
}

// If running directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  testEnhancedCoverLetterService()
    .then(() => validateExampleLibrary())
    .catch(console.error);
}
