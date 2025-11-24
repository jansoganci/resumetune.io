// ================================================================
// PROFILE CONTEXT - PHASE 2 REFACTOR
// ================================================================
// Centralized state management for user profile, contact info, CV, and job data
// Eliminates prop drilling and reduces HomePage complexity

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ContactInfo } from '../components/ContactInfoInput';
import { CVData, JobDescription, UserProfile } from '../types';
import { saveToStorage, loadFromStorage, removeFromStorage, STORAGE_KEYS } from '../utils/storage';
import { useToast } from '../components/ToastProvider';

interface ProfileContextValue {
  // State
  userProfile: UserProfile | null;
  contactInfo: ContactInfo | null;
  cvData: CVData | null;
  jobDescription: JobDescription | null;

  // Actions
  setUserProfile: (profile: UserProfile | null) => void;
  setContactInfo: (info: ContactInfo | null) => void;
  setCvData: (cv: CVData | null) => void;
  setJobDescription: (job: JobDescription | null) => void;

  // Handlers
  handleProfileSave: (content: string) => void;
  handleContactInfoSave: (contactData: ContactInfo) => void;
  handleCVUpload: (content: string, fileName: string) => void;
  handleJobDescriptionChange: (content: string, jobTitle?: string, companyName?: string) => void;

  // Clear functions
  clearProfile: () => void;
  clearContactInfo: () => void;
  clearCV: () => void;
  clearJobDescription: () => void;
  clearAll: () => void;

  // Computed
  hasCompleteProfile: boolean;

  // Sample data
  fillSampleData: () => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children, onAnalysisReset }: { children: ReactNode; onAnalysisReset?: () => void }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const toast = useToast();

  // Load saved data on mount
  useEffect(() => {
    const savedProfile = loadFromStorage(STORAGE_KEYS.USER_PROFILE);
    const savedContactInfo = loadFromStorage(STORAGE_KEYS.CONTACT_INFO);
    const savedCV = loadFromStorage(STORAGE_KEYS.CV_DATA);
    const savedJob = loadFromStorage(STORAGE_KEYS.JOB_DESCRIPTION);

    if (savedProfile) {
      setUserProfile({
        ...savedProfile,
        savedAt: new Date(savedProfile.savedAt)
      });
    }

    if (savedContactInfo) {
      setContactInfo({
        ...savedContactInfo,
        savedAt: new Date(savedContactInfo.savedAt)
      });
    }

    if (savedCV) {
      setCvData({
        ...savedCV,
        uploadedAt: new Date(savedCV.uploadedAt)
      });
    }

    if (savedJob) {
      setJobDescription({
        ...savedJob,
        addedAt: new Date(savedJob.addedAt)
      });
    }
  }, []);

  const handleProfileSave = useCallback((content: string) => {
    const newProfile = {
      content,
      savedAt: new Date()
    };
    setUserProfile(newProfile);
    saveToStorage(STORAGE_KEYS.USER_PROFILE, newProfile);
    toast.clear();
    onAnalysisReset?.();
  }, [toast, onAnalysisReset]);

  const handleContactInfoSave = useCallback((contactData: ContactInfo) => {
    const newContactInfo = {
      ...contactData,
      savedAt: new Date()
    };

    setContactInfo(newContactInfo);
    saveToStorage(STORAGE_KEYS.CONTACT_INFO, newContactInfo);
    toast.clear();
  }, [toast]);

  const handleCVUpload = useCallback((content: string, fileName: string) => {
    const newCVData = {
      content,
      fileName,
      uploadedAt: new Date()
    };
    setCvData(newCVData);
    saveToStorage(STORAGE_KEYS.CV_DATA, newCVData);
    toast.clear();
    onAnalysisReset?.();
  }, [toast, onAnalysisReset]);

  const handleJobDescriptionChange = useCallback((content: string, jobTitle?: string, companyName?: string) => {
    const newJobData = {
      content,
      jobTitle,
      companyName,
      addedAt: new Date()
    };
    setJobDescription(newJobData);
    saveToStorage(STORAGE_KEYS.JOB_DESCRIPTION, newJobData);
    toast.clear();
  }, [toast]);

  const clearProfile = useCallback(() => {
    setUserProfile(null);
    removeFromStorage(STORAGE_KEYS.USER_PROFILE);
    onAnalysisReset?.();
  }, [onAnalysisReset]);

  const clearContactInfo = useCallback(() => {
    setContactInfo(null);
    removeFromStorage(STORAGE_KEYS.CONTACT_INFO);
  }, []);

  const clearCV = useCallback(() => {
    setCvData(null);
    removeFromStorage(STORAGE_KEYS.CV_DATA);
    onAnalysisReset?.();
  }, [onAnalysisReset]);

  const clearJobDescription = useCallback(() => {
    setJobDescription(null);
    removeFromStorage(STORAGE_KEYS.JOB_DESCRIPTION);
  }, []);

  const clearAll = useCallback(() => {
    setUserProfile(null);
    setContactInfo(null);
    setCvData(null);
    removeFromStorage(STORAGE_KEYS.USER_PROFILE);
    removeFromStorage(STORAGE_KEYS.CONTACT_INFO);
    removeFromStorage(STORAGE_KEYS.CV_DATA);
    onAnalysisReset?.();
  }, [onAnalysisReset]);

  const hasCompleteProfile = Boolean(userProfile && contactInfo && cvData && jobDescription);

  // Fill with realistic sample data for demo purposes
  const fillSampleData = useCallback(() => {
    // Sample Professional Summary
    const sampleProfile = {
      content: `Senior Full-Stack Developer with 5+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud architecture (AWS, Azure). Led development teams of 4-8 engineers and successfully delivered 15+ production applications serving 500K+ users.

Key achievements:
• Reduced application load time by 60% through performance optimization
• Built microservices architecture handling 1M+ daily API requests
• Mentored 12 junior developers, with 80% promoted within 2 years
• Led migration from monolith to microservices, reducing deployment time from 4 hours to 15 minutes

Passionate about clean code, user experience, and building products that solve real problems.`,
      savedAt: new Date()
    };

    // Sample Contact Info
    const sampleContact: ContactInfo = {
      fullName: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      professionalTitle: 'Senior Full-Stack Developer',
      linkedin: 'https://linkedin.com/in/alexjohnson',
      portfolio: 'https://alexjohnson.dev',
      github: 'https://github.com/alexjohnson',
      savedAt: new Date()
    };

    // Sample CV/Resume
    const sampleCV = {
      content: `ALEX JOHNSON
Senior Full-Stack Developer | San Francisco, CA
alex.johnson@example.com | +1 (555) 123-4567
LinkedIn: linkedin.com/in/alexjohnson | GitHub: github.com/alexjohnson

PROFESSIONAL EXPERIENCE

Senior Full-Stack Developer | TechCorp Solutions | 2021 - Present
• Lead development of SaaS platform serving 500K+ users with React, Node.js, and AWS
• Architected microservices infrastructure reducing API response time by 45%
• Manage team of 6 engineers, conducting code reviews and mentoring junior developers
• Implemented CI/CD pipeline with GitHub Actions, reducing deployment time by 70%
• Technologies: React, TypeScript, Node.js, PostgreSQL, Redis, AWS (EC2, S3, Lambda)

Full-Stack Developer | StartupHub Inc. | 2019 - 2021
• Built MVP for B2B marketplace connecting 10K+ businesses
• Developed RESTful APIs handling 100K+ daily requests
• Implemented real-time notifications using WebSocket and Redis pub/sub
• Collaborated with design team to create responsive UI with React and Tailwind CSS
• Technologies: React, Node.js, Express, MongoDB, Socket.io, Docker

Junior Developer | Digital Agency Pro | 2018 - 2019
• Developed 15+ client websites using modern JavaScript frameworks
• Fixed critical bugs reducing customer support tickets by 30%
• Participated in agile sprints and daily standups
• Technologies: React, Vue.js, WordPress, PHP, MySQL

EDUCATION

Bachelor of Science in Computer Science | University of California | 2018
GPA: 3.8/4.0 | Dean's List (4 semesters)

TECHNICAL SKILLS

Languages: JavaScript/TypeScript, Python, SQL, HTML/CSS
Frontend: React, Next.js, Vue.js, Tailwind CSS, Redux
Backend: Node.js, Express, Django, PostgreSQL, MongoDB, Redis
Cloud & DevOps: AWS (EC2, S3, Lambda, RDS), Docker, Kubernetes, CI/CD
Tools: Git, GitHub Actions, Jest, Webpack, Vite

CERTIFICATIONS
• AWS Certified Solutions Architect - Associate (2022)
• Google Cloud Professional Developer (2021)`,
      fileName: 'alex_johnson_resume.txt',
      uploadedAt: new Date()
    };

    // Sample Job Description
    const sampleJob = {
      content: `Senior Full-Stack Engineer
InnovateTech | San Francisco, CA (Remote OK) | $140K - $180K

About InnovateTech:
We're a fast-growing B2B SaaS company revolutionizing project management for remote teams. Our platform serves 50K+ companies worldwide, and we're backed by top-tier VCs.

The Role:
We're looking for a Senior Full-Stack Engineer to join our core product team. You'll build features used by thousands of users daily, working closely with product managers and designers to create delightful experiences.

What You'll Do:
• Build and maintain scalable web applications with React and Node.js
• Design and implement RESTful APIs serving millions of requests
• Collaborate with cross-functional teams in an agile environment
• Mentor junior engineers and participate in code reviews
• Contribute to technical architecture decisions
• Optimize application performance and database queries

Requirements:
• 5+ years of professional software development experience
• Strong proficiency in React, TypeScript, and Node.js
• Experience with SQL and NoSQL databases (PostgreSQL, MongoDB, Redis)
• Experience with cloud platforms (AWS or Azure preferred)
• Proven track record building scalable, production-grade applications
• Excellent communication and teamwork skills
• Experience with microservices architecture is a plus

What We Offer:
• Competitive salary ($140K - $180K) + equity
• Remote-first culture with flexible hours
• Health, dental, and vision insurance
• 401(k) with company match
• Unlimited PTO and generous parental leave
• Annual learning & development budget ($2K)
• Latest MacBook Pro and home office stipend

Apply now to join our mission of making remote work seamless!`,
      jobTitle: 'Senior Full-Stack Engineer',
      companyName: 'InnovateTech',
      addedAt: new Date()
    };

    // Set all sample data
    setUserProfile(sampleProfile);
    setContactInfo(sampleContact);
    setCvData(sampleCV);
    setJobDescription(sampleJob);

    // Save to storage
    saveToStorage(STORAGE_KEYS.USER_PROFILE, sampleProfile);
    saveToStorage(STORAGE_KEYS.CONTACT_INFO, sampleContact);
    saveToStorage(STORAGE_KEYS.CV_DATA, sampleCV);
    saveToStorage(STORAGE_KEYS.JOB_DESCRIPTION, sampleJob);

    toast.success('✨ Sample data loaded! Try "Check Job Match" now.');
    onAnalysisReset?.();
  }, [toast, onAnalysisReset]);

  const value: ProfileContextValue = {
    userProfile,
    contactInfo,
    cvData,
    jobDescription,
    setUserProfile,
    setContactInfo,
    setCvData,
    setJobDescription,
    handleProfileSave,
    handleContactInfoSave,
    handleCVUpload,
    handleJobDescriptionChange,
    clearProfile,
    clearContactInfo,
    clearCV,
    clearJobDescription,
    clearAll,
    hasCompleteProfile,
    fillSampleData,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}
