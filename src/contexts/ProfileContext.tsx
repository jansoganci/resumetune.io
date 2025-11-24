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
