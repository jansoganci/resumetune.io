import type { CVData, JobDescription } from './index';
import type { ContactInfo } from '../components/ContactInfoInput';

export type CoverLetterTone = 'professional' | 'friendly' | 'direct';

export interface CoverLetterContext {
  company: string;           // Final company display name
  position: string;          // Final position display name
  requirements: string[];    // Top 1-3 requirements (normalized short phrases)
  achievements: string[];    // Top 2-3 quantified achievements from CV
  contact: Pick<ContactInfo, 'fullName' | 'email' | 'phone' | 'location' | 'linkedin' | 'portfolio' | 'professionalTitle'>;
  tone: CoverLetterTone;
  dateISO: string;           // ISO date string for rendering localized date later
  locale?: string;           // Optional locale hint for date formatting
  // Optional source references for debugging/telemetry
  _source?: {
    jobTitleFromJD?: string | null;
    companyFromJD?: string | null;
  };
}

export interface CoverLetterContextInput {
  cvData: CVData;
  jobDescription: JobDescription;
  contactInfo: ContactInfo;
  tone?: CoverLetterTone;
  locale?: string;
}

