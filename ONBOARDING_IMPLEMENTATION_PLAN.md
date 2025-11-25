# 🚀 Onboarding Flow Implementation Plan

**Project**: ResumeTune User Onboarding
**Goal**: Collect essential user information upfront, store securely in database, simplify HomePage
**Status**: Planning Phase
**Estimated Timeline**: 3-4 days

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Proposed Architecture](#proposed-architecture)
4. [Database Design](#database-design)
5. [Component Architecture](#component-architecture)
6. [Privacy & Security](#privacy--security)
7. [Integration Strategy](#integration-strategy)
8. [Implementation Phases](#implementation-phases)
9. [Testing Plan](#testing-plan)
10. [Rollback Strategy](#rollback-strategy)

---

## Executive Summary

### Problem Statement
Currently, users must manually enter their profile and contact information scattered across multiple sections on HomePage. This creates friction and makes the main interface cluttered.

### Solution
Implement a one-time onboarding flow that:
- Collects essential user data during first login
- Stores data encrypted in Supabase database
- Auto-populates application forms with stored data
- Reduces HomePage complexity by 40-50%
- Provides GDPR-compliant data management (edit/delete anytime)

### Success Metrics
- **UX**: First-time-to-value reduced from 120s → 30s
- **Code**: HomePage reduced from ~145 → ~90 lines
- **Data Quality**: 95%+ completion rate for essential fields
- **Trust**: Clear privacy messaging, GDPR compliance

---

## Current State Analysis

### Data Flow (Before)
```
┌──────────────────────────────────────────────┐
│           HomePage (145 lines)               │
│                                              │
│  ┌──────────────┐  ┌────────────────────┐   │
│  │ Profile      │  │ Contact Info       │   │
│  │ Section      │  │ Section            │   │
│  │              │  │                    │   │
│  │ • Free text  │  │ • Full name        │   │
│  │   summary    │  │ • Email            │   │
│  │              │  │ • Phone            │   │
│  │              │  │ • Location         │   │
│  │              │  │ • LinkedIn         │   │
│  │              │  │ • Portfolio        │   │
│  │              │  │ • Professional     │   │
│  │              │  │   Title            │   │
│  └──────────────┘  └────────────────────┘   │
│            ↓                 ↓               │
│       ┌─────────────────────────┐            │
│       │ localStorage (client)   │            │
│       └─────────────────────────┘            │
└──────────────────────────────────────────────┘
```

### Current Storage
- **Location**: `localStorage` (browser only)
- **Keys**:
  - `resumetune_user_profile`
  - `resumetune_contact_info`
  - `resumetune_cv_data`
  - `resumetune_job_description`
- **Persistence**: Per-device only, lost on cache clear
- **Security**: Unencrypted, accessible via client JS

### Existing Database Tables
```sql
✅ public.users (Supabase Auth managed)
✅ public.daily_usage (quota tracking)
✅ public.rate_limits (rate limiting)
✅ public.webhook_cache (Stripe webhooks)
✅ public.credit_transactions (payment tracking)
✅ public.anonymous_user_tracking (guest users)

❌ public.user_profiles (MISSING - we'll create this)
```

---

## Proposed Architecture

### Data Flow (After)
```
┌────────────────────────────────────────────────────────────┐
│                  First Login / Empty Profile               │
│                           ↓                                │
│           ┌───────────────────────────────┐                │
│           │   Onboarding Flow (NEW)       │                │
│           │                               │                │
│           │  Step 1: Welcome              │                │
│           │  Step 2: Basic Info           │                │
│           │  Step 3: Professional Info    │                │
│           │  Step 4: Privacy Consent      │                │
│           └───────────────────────────────┘                │
│                           ↓                                │
│           ┌───────────────────────────────┐                │
│           │  Supabase: user_profiles      │                │
│           │  (encrypted, GDPR-compliant)  │                │
│           └───────────────────────────────┘                │
│                           ↓                                │
│           ┌───────────────────────────────┐                │
│           │   HomePage (simplified)       │                │
│           │   • Profile auto-filled       │                │
│           │   • Contact info auto-filled  │                │
│           │   • Focus on job analysis     │                │
│           └───────────────────────────────┘                │
└────────────────────────────────────────────────────────────┘
```

### Key Benefits
1. **User Experience**: One-time setup, lifetime convenience
2. **Data Persistence**: Survives cache clears, works across devices
3. **Security**: Database-level encryption, RLS policies
4. **Compliance**: GDPR right to access, edit, delete
5. **Code Quality**: Cleaner HomePage, better separation of concerns

---

## Database Design

### Schema: `public.user_profiles`

```sql
-- ================================================================
-- USER PROFILES TABLE - ONBOARDING DATA STORAGE
-- ================================================================
-- Stores essential user information collected during onboarding
-- Encrypted, GDPR-compliant, one profile per user

CREATE TABLE IF NOT EXISTS public.user_profiles (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Essential Information (collected during onboarding)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  current_position TEXT NOT NULL,

  -- Optional Professional Links
  linkedin_url TEXT,
  portfolio_url TEXT,
  github_url TEXT,

  -- Location (optional)
  city TEXT,
  country TEXT,

  -- Profile Content (transferred from localStorage)
  professional_summary TEXT,  -- Free-text "elevator pitch"

  -- Privacy & Consent
  data_consent BOOLEAN NOT NULL DEFAULT false,
  data_consent_date TIMESTAMPTZ,
  marketing_consent BOOLEAN DEFAULT false,

  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- GDPR Compliance
  data_retention_acknowledged BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Check constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone IS NULL OR LENGTH(phone) >= 10),
  CONSTRAINT valid_names CHECK (LENGTH(first_name) >= 1 AND LENGTH(last_name) >= 1)
) TABLESPACE pg_default;

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

CREATE INDEX idx_user_profiles_user_id
  ON public.user_profiles USING btree (user_id);

CREATE INDEX idx_user_profiles_email
  ON public.user_profiles USING btree (email);

CREATE INDEX idx_user_profiles_onboarding
  ON public.user_profiles USING btree (onboarding_completed, created_at);

CREATE INDEX idx_user_profiles_last_activity
  ON public.user_profiles USING btree (last_activity_at DESC);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile (onboarding)
CREATE POLICY "Users can create their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own profile (GDPR right to be forgotten)
CREATE POLICY "Users can delete their own profile"
  ON public.user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_timestamp
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Auto-update last_activity_at on any interaction
CREATE OR REPLACE FUNCTION update_user_profiles_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_activity
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_activity();

-- ================================================================
-- RPC FUNCTIONS
-- ================================================================

-- Get user profile with fallback
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  current_position TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  github_url TEXT,
  city TEXT,
  country TEXT,
  professional_summary TEXT,
  onboarding_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.id,
    up.first_name,
    up.last_name,
    up.email,
    up.phone,
    up.current_position,
    up.linkedin_url,
    up.portfolio_url,
    up.github_url,
    up.city,
    up.country,
    up.professional_summary,
    up.onboarding_completed
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;
END;
$$;

-- Mark onboarding as completed
CREATE OR REPLACE FUNCTION complete_onboarding(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_profiles
  SET
    onboarding_completed = true,
    onboarding_completed_at = NOW()
  WHERE user_id = p_user_id;

  RETURN FOUND;
END;
$$;

-- GDPR: Export user data
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'profile', row_to_json(up.*),
    'daily_usage', (SELECT jsonb_agg(row_to_json(du.*)) FROM public.daily_usage du WHERE du.user_id = p_user_id),
    'exported_at', NOW()
  )
  INTO user_data
  FROM public.user_profiles up
  WHERE up.user_id = p_user_id;

  RETURN user_data;
END;
$$;

-- GDPR: Delete all user data
CREATE OR REPLACE FUNCTION delete_all_user_data(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete profile (cascade will handle related data)
  DELETE FROM public.user_profiles WHERE user_id = p_user_id;
  DELETE FROM public.daily_usage WHERE user_id = p_user_id;

  -- Note: auth.users deletion should be handled separately via Supabase Auth
  RETURN true;
END;
$$;

-- ================================================================
-- GRANTS
-- ================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
```

### Migration File Name
`supabase/migrations/20250125000000_user_profiles_onboarding.sql`

### Data Migration Strategy
We need to migrate existing localStorage data to the database for authenticated users:

```typescript
// Migration helper function (run once after deployment)
async function migrateLocalStorageToDatabase() {
  const profile = loadFromStorage(STORAGE_KEYS.USER_PROFILE);
  const contactInfo = loadFromStorage(STORAGE_KEYS.CONTACT_INFO);

  if (profile || contactInfo) {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('user_profiles').upsert({
        user_id: user.id,
        first_name: contactInfo?.fullName?.split(' ')[0] || '',
        last_name: contactInfo?.fullName?.split(' ').slice(1).join(' ') || '',
        email: contactInfo?.email || user.email || '',
        phone: contactInfo?.phone || null,
        current_position: contactInfo?.professionalTitle || '',
        linkedin_url: contactInfo?.linkedin || null,
        portfolio_url: contactInfo?.portfolio || null,
        professional_summary: profile?.content || null,
        onboarding_completed: true, // Mark as completed for existing users
        data_consent: true,
      });

      // Clear localStorage after successful migration
      removeFromStorage(STORAGE_KEYS.USER_PROFILE);
      removeFromStorage(STORAGE_KEYS.CONTACT_INFO);
    }
  }
}
```

---

## Component Architecture

### File Structure
```
src/
├── components/
│   ├── onboarding/
│   │   ├── OnboardingFlow.tsx          (Main orchestrator)
│   │   ├── OnboardingWelcome.tsx       (Step 1: Welcome screen)
│   │   ├── OnboardingBasicInfo.tsx     (Step 2: Name, email, phone)
│   │   ├── OnboardingProfessional.tsx  (Step 3: Position, links)
│   │   ├── OnboardingPrivacy.tsx       (Step 4: Privacy consent)
│   │   ├── OnboardingProgress.tsx      (Progress indicator)
│   │   └── OnboardingLayout.tsx        (Shared layout wrapper)
│   └── ...
├── pages/
│   ├── OnboardingPage.tsx              (Route wrapper)
│   └── ...
├── hooks/
│   ├── useOnboarding.ts                (Onboarding logic)
│   └── useUserProfile.ts               (Database profile operations)
├── services/
│   └── profileService.ts               (Supabase profile CRUD)
└── types/
    └── onboarding.ts                   (TypeScript interfaces)
```

### Component Breakdown

#### 1. OnboardingFlow.tsx (Main Orchestrator)
```typescript
/**
 * Main onboarding flow component
 * Manages multi-step wizard state and navigation
 */
interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

type OnboardingStep = 'welcome' | 'basic' | 'professional' | 'privacy' | 'complete';

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [formData, setFormData] = useState<OnboardingFormData>({});
  const { saveProfile, isLoading } = useUserProfile();

  const handleNext = (stepData: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    // Navigate to next step
  };

  const handleSubmit = async () => {
    await saveProfile(formData);
    onComplete();
  };

  return (
    <OnboardingLayout>
      <OnboardingProgress currentStep={currentStep} totalSteps={4} />
      {currentStep === 'welcome' && <OnboardingWelcome onNext={handleNext} />}
      {currentStep === 'basic' && <OnboardingBasicInfo onNext={handleNext} data={formData} />}
      {currentStep === 'professional' && <OnboardingProfessional onNext={handleNext} data={formData} />}
      {currentStep === 'privacy' && <OnboardingPrivacy onSubmit={handleSubmit} data={formData} />}
    </OnboardingLayout>
  );
}
```

#### 2. OnboardingBasicInfo.tsx (Step 2)
```typescript
/**
 * Collects essential personal information
 * Fields: First name, last name, email, phone
 */
interface OnboardingBasicInfoProps {
  onNext: (data: BasicInfoData) => void;
  data?: Partial<OnboardingFormData>;
}

export function OnboardingBasicInfo({ onNext, data }: OnboardingBasicInfoProps) {
  const [firstName, setFirstName] = useState(data?.firstName || '');
  const [lastName, setLastName] = useState(data?.lastName || '');
  const [email, setEmail] = useState(data?.email || '');
  const [phone, setPhone] = useState(data?.phone || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const validationErrors = validateBasicInfo({ firstName, lastName, email, phone });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onNext({ firstName, lastName, email, phone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold">Let's start with the basics</h2>
      <p className="text-gray-600">This information will be used in your applications</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="First Name *"
          value={firstName}
          onChange={setFirstName}
          error={errors.firstName}
          placeholder="İsim"
          required
        />
        <FormInput
          label="Last Name *"
          value={lastName}
          onChange={setLastName}
          error={errors.lastName}
          placeholder="Soyisim"
          required
        />
      </div>

      <FormInput
        label="Email *"
        type="email"
        value={email}
        onChange={setEmail}
        error={errors.email}
        placeholder="your.email@example.com"
        required
      />

      <FormInput
        label="Phone Number"
        type="tel"
        value={phone}
        onChange={setPhone}
        error={errors.phone}
        placeholder="+90 555 123 4567"
      />

      <div className="flex justify-between pt-4">
        <button type="button" className="btn-secondary">Back</button>
        <button type="submit" className="btn-primary">Continue</button>
      </div>
    </form>
  );
}
```

#### 3. OnboardingProfessional.tsx (Step 3)
```typescript
/**
 * Collects professional information
 * Fields: Current position, LinkedIn, portfolio, GitHub
 */
export function OnboardingProfessional({ onNext, data }: OnboardingProfessionalProps) {
  const [currentPosition, setCurrentPosition] = useState(data?.currentPosition || '');
  const [linkedinUrl, setLinkedinUrl] = useState(data?.linkedinUrl || '');
  const [portfolioUrl, setPortfolioUrl] = useState(data?.portfolioUrl || '');
  const [githubUrl, setGithubUrl] = useState(data?.githubUrl || '');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold">Tell us about your career</h2>
      <p className="text-gray-600">Help us tailor your applications</p>

      <FormInput
        label="Current Position *"
        value={currentPosition}
        onChange={setCurrentPosition}
        placeholder="e.g., Senior Full-Stack Developer"
        required
      />

      <FormInput
        label="LinkedIn Profile"
        value={linkedinUrl}
        onChange={setLinkedinUrl}
        placeholder="https://linkedin.com/in/yourprofile"
      />

      <FormInput
        label="Portfolio Website"
        value={portfolioUrl}
        onChange={setPortfolioUrl}
        placeholder="https://yourportfolio.com"
      />

      <FormInput
        label="GitHub Profile"
        value={githubUrl}
        onChange={setGithubUrl}
        placeholder="https://github.com/yourusername"
      />

      <div className="flex justify-between pt-4">
        <button type="button" className="btn-secondary">Back</button>
        <button type="submit" className="btn-primary">Continue</button>
      </div>
    </form>
  );
}
```

#### 4. OnboardingPrivacy.tsx (Step 4)
```typescript
/**
 * Privacy consent and data usage explanation
 * GDPR-compliant consent collection
 */
export function OnboardingPrivacy({ onSubmit, data }: OnboardingPrivacyProps) {
  const [dataConsent, setDataConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your privacy matters</h2>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">How we protect your data</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>✓ Stored encrypted in secure database</li>
              <li>✓ Never sold to third parties</li>
              <li>✓ Not used for advertising</li>
              <li>✓ You can edit or delete anytime</li>
              <li>✓ GDPR & CCPA compliant</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={dataConsent}
            onChange={(e) => setDataConsent(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600"
          />
          <span className="text-sm text-gray-700">
            <strong className="text-gray-900">I consent to data processing (Required)</strong>
            <br />
            I understand my data will be stored securely and used only to generate job applications.
            I can access, edit, or delete my data at any time from my account settings.
          </span>
        </label>

        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600"
          />
          <span className="text-sm text-gray-700">
            <strong className="text-gray-900">Marketing communications (Optional)</strong>
            <br />
            Send me job search tips, product updates, and special offers. Unsubscribe anytime.
          </span>
        </label>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded">
        <p>
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-blue-600 underline">Terms of Service</a> and{' '}
          <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" className="btn-secondary">Back</button>
        <button
          onClick={() => onSubmit({ ...data, dataConsent, marketingConsent })}
          disabled={!dataConsent}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Complete Setup
        </button>
      </div>
    </div>
  );
}
```

### State Management

```typescript
// types/onboarding.ts
export interface OnboardingFormData {
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;

  // Professional Info
  currentPosition: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  city?: string;
  country?: string;

  // Privacy
  dataConsent: boolean;
  marketingConsent: boolean;
}

export interface UserProfileDB {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  current_position: string;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  city?: string;
  country?: string;
  professional_summary?: string;
  data_consent: boolean;
  marketing_consent: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## Privacy & Security

### Encryption Strategy

**Database-Level Encryption** (Supabase built-in):
- All data encrypted at rest (AES-256)
- Encrypted in transit (TLS 1.3)
- Row-Level Security (RLS) enforces user isolation

**Sensitive Field Handling**:
```typescript
// Email masking for UI display (optional)
function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 2)}***@${domain}`;
}

// Phone number masking
function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
}
```

### GDPR Compliance

#### Right to Access
```typescript
// User can export all their data
async function exportMyData() {
  const { data, error } = await supabase.rpc('export_user_data');

  if (data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumetune-data-export-${new Date().toISOString()}.json`;
    a.click();
  }
}
```

#### Right to Erasure
```typescript
// User can delete all their data
async function deleteMyAccount() {
  const confirmed = window.confirm(
    'Are you sure? This will permanently delete all your data and cannot be undone.'
  );

  if (confirmed) {
    await supabase.rpc('delete_all_user_data');
    await supabase.auth.signOut();
    window.location.href = '/';
  }
}
```

#### Right to Rectification
```typescript
// User can edit profile anytime
async function updateProfile(updates: Partial<UserProfileDB>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .select()
    .single();

  return { data, error };
}
```

### Privacy Messaging

**Key Messages to Display**:
1. **Transparency**: "We collect this data to personalize your job applications"
2. **Security**: "Your data is encrypted and stored securely in our database"
3. **Control**: "You can edit or delete your information anytime"
4. **No Selling**: "We never sell your data to advertisers or third parties"
5. **Minimal Collection**: "We only ask for what's necessary"

---

## Integration Strategy

### Phase 1: Database Migration (Day 1)

**Tasks**:
1. Create database migration file
2. Run migration in Supabase dashboard
3. Verify tables, indexes, RLS policies
4. Test RPC functions
5. Create Supabase service functions

**Files Modified**:
- `supabase/migrations/20250125000000_user_profiles_onboarding.sql` (NEW)
- `src/services/profileService.ts` (NEW)

### Phase 2: Onboarding Components (Day 2)

**Tasks**:
1. Create onboarding component files
2. Implement form validation
3. Add progress indicator
4. Style with Tailwind CSS
5. Add animations (fade-in, slide-in)

**Files Modified**:
- `src/components/onboarding/OnboardingFlow.tsx` (NEW)
- `src/components/onboarding/OnboardingWelcome.tsx` (NEW)
- `src/components/onboarding/OnboardingBasicInfo.tsx` (NEW)
- `src/components/onboarding/OnboardingProfessional.tsx` (NEW)
- `src/components/onboarding/OnboardingPrivacy.tsx` (NEW)
- `src/components/onboarding/OnboardingProgress.tsx` (NEW)
- `src/components/onboarding/OnboardingLayout.tsx` (NEW)
- `src/pages/OnboardingPage.tsx` (NEW)
- `src/types/onboarding.ts` (NEW)

### Phase 3: Profile Context Refactor (Day 3)

**Tasks**:
1. Update ProfileContext to use database instead of localStorage
2. Create useUserProfile hook for database operations
3. Implement auto-migration from localStorage
4. Add loading states and error handling
5. Update HomePage to use database profile

**Files Modified**:
- `src/contexts/ProfileContext.tsx` (MAJOR REFACTOR)
- `src/hooks/useUserProfile.ts` (NEW)
- `src/services/profileService.ts` (UPDATE)
- `src/pages/HomePage.tsx` (SIMPLIFY)
- `src/components/sections/ProfileSection.tsx` (REMOVE or SIMPLIFY)

### Phase 4: HomePage Simplification (Day 3.5)

**Current HomePage Structure**:
```tsx
<main>
  <ProfileSection />           ← REMOVE (auto-filled from DB)
  <ContactInfoSection />       ← REMOVE (auto-filled from DB)
  <CVUploadSection />          ← KEEP (still needed)
  <JobAnalysisSection />       ← KEEP (core feature)
  <ResultsSection />           ← KEEP (core feature)
</main>
```

**New HomePage Structure**:
```tsx
<main>
  {!hasProfile && <OnboardingPrompt />}  ← NEW (show if no profile)
  <CVUploadSection />                    ← KEEP
  <JobAnalysisSection />                 ← KEEP
  <ResultsSection />                     ← KEEP
  <ProfileEditLink />                    ← NEW (link to /profile)
</main>
```

**Files Modified**:
- `src/pages/HomePage.tsx` (SIMPLIFY: ~145 → ~90 lines)
- `src/components/sections/ProfileSection.tsx` (REMOVE or move to /profile page)
- `src/components/OnboardingPrompt.tsx` (NEW)

### Phase 5: Profile Edit Page (Day 4)

**Tasks**:
1. Create dedicated profile editing page
2. Reuse onboarding form components
3. Add save/cancel buttons
4. Add "Delete Account" section
5. Add "Export Data" button

**Files Modified**:
- `src/pages/ProfilePage.tsx` (NEW)
- `src/App.tsx` (add `/profile` route)
- `src/components/Header.tsx` (add "Profile" link)

### Phase 6: Testing & Polish (Day 4)

**Tasks**:
1. End-to-end testing of onboarding flow
2. Test data migration from localStorage
3. Test GDPR export/delete functions
4. Test mobile responsiveness
5. Add loading skeletons
6. Add success animations

---

## Implementation Phases

### Timeline: 3-4 Days

#### Day 1: Database Foundation
- ⏰ **Duration**: 6-8 hours
- **Morning** (3-4 hours):
  - [ ] Write migration SQL file
  - [ ] Test migration locally
  - [ ] Deploy to Supabase
  - [ ] Verify RLS policies
- **Afternoon** (3-4 hours):
  - [ ] Create `profileService.ts`
  - [ ] Write TypeScript types
  - [ ] Test RPC functions
  - [ ] Write unit tests

#### Day 2: Onboarding UI
- ⏰ **Duration**: 8 hours
- **Morning** (4 hours):
  - [ ] Create OnboardingFlow component
  - [ ] Implement step navigation
  - [ ] Add progress indicator
  - [ ] Create welcome screen
- **Afternoon** (4 hours):
  - [ ] Build BasicInfo form
  - [ ] Build Professional form
  - [ ] Build Privacy consent screen
  - [ ] Add form validation

#### Day 3: Integration
- ⏰ **Duration**: 8 hours
- **Morning** (4 hours):
  - [ ] Refactor ProfileContext
  - [ ] Create useUserProfile hook
  - [ ] Implement auto-migration
  - [ ] Update HomePage
- **Afternoon** (4 hours):
  - [ ] Remove ProfileSection
  - [ ] Remove ContactInfoSection
  - [ ] Add OnboardingPrompt
  - [ ] Test end-to-end flow

#### Day 4: Polish & Testing
- ⏰ **Duration**: 6-8 hours
- **Morning** (3-4 hours):
  - [ ] Create ProfilePage
  - [ ] Add edit/delete features
  - [ ] Add GDPR export
  - [ ] Mobile testing
- **Afternoon** (3-4 hours):
  - [ ] End-to-end testing
  - [ ] Fix bugs
  - [ ] Add animations
  - [ ] Final commit & push

---

## Testing Plan

### Unit Tests

```typescript
// __tests__/services/profileService.test.ts
describe('profileService', () => {
  it('should save user profile to database', async () => {
    const mockProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      currentPosition: 'Developer',
    };

    const result = await saveUserProfile(mockProfile);
    expect(result.error).toBeNull();
    expect(result.data?.first_name).toBe('John');
  });

  it('should enforce email validation', async () => {
    const invalidProfile = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      currentPosition: 'Developer',
    };

    const result = await saveUserProfile(invalidProfile);
    expect(result.error).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/onboarding.test.tsx
describe('Onboarding Flow', () => {
  it('should complete full onboarding journey', async () => {
    render(<OnboardingFlow onComplete={jest.fn()} />);

    // Step 1: Welcome
    expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Get Started/i));

    // Step 2: Basic Info
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
    fireEvent.click(screen.getByText(/Continue/i));

    // Step 3: Professional
    fireEvent.change(screen.getByLabelText(/Current Position/i), { target: { value: 'Developer' } });
    fireEvent.click(screen.getByText(/Continue/i));

    // Step 4: Privacy
    fireEvent.click(screen.getByLabelText(/I consent/i));
    fireEvent.click(screen.getByText(/Complete Setup/i));

    await waitFor(() => {
      expect(screen.getByText(/Success/i)).toBeInTheDocument();
    });
  });
});
```

### Manual Testing Checklist

- [ ] First-time user sees onboarding prompt
- [ ] Onboarding flow completes successfully
- [ ] Data saves to database correctly
- [ ] HomePage auto-fills from database
- [ ] Profile edit page works
- [ ] GDPR export downloads JSON file
- [ ] Account deletion works
- [ ] Data migration from localStorage works
- [ ] Mobile responsive design
- [ ] Form validation shows helpful errors
- [ ] Loading states display correctly
- [ ] Success animations play
- [ ] RLS policies prevent unauthorized access

---

## Rollback Strategy

### If Critical Issues Arise

**Rollback Plan**:
1. **Database**: Keep old migration, don't drop table
2. **Code**: Use feature flag to toggle onboarding
3. **Data**: Keep localStorage as backup for 30 days

**Feature Flag**:
```typescript
// .env
VITE_ENABLE_ONBOARDING=true

// App.tsx
const ONBOARDING_ENABLED = import.meta.env.VITE_ENABLE_ONBOARDING === 'true';

function App() {
  return (
    <Routes>
      {ONBOARDING_ENABLED && <Route path="/onboarding" element={<OnboardingPage />} />}
      {/* ... */}
    </Routes>
  );
}
```

### Monitoring

**Key Metrics to Watch**:
- Onboarding completion rate (target: >90%)
- Time to complete onboarding (target: <2 minutes)
- Database query performance (target: <100ms)
- Error rate (target: <1%)
- User retention after onboarding (target: >80%)

---

## Success Criteria

### Must-Have (MVP)
- ✅ Database table created and RLS enabled
- ✅ Onboarding flow works (4 steps)
- ✅ Data saves to database
- ✅ HomePage auto-fills from database
- ✅ Privacy consent collected
- ✅ Mobile responsive

### Nice-to-Have (V2)
- ⏳ Profile picture upload
- ⏳ Resume auto-parsing to pre-fill onboarding
- ⏳ Social auth (Google, LinkedIn)
- ⏳ Multi-language support
- ⏳ Progressive profile completion (partial save)
- ⏳ Email verification flow

### Out of Scope (Future)
- ❌ Resume builder
- ❌ Cover letter templates
- ❌ Interview prep tools
- ❌ Job search integration

---

## Open Questions / Decisions Needed

1. **Onboarding Trigger**: When should we show onboarding?
   - [ ] Option A: Immediately after registration (recommended)
   - [ ] Option B: First visit to HomePage with empty profile
   - [ ] Option C: Optional, show prompt with "Skip" button

2. **Professional Summary**: Where to collect?
   - [ ] Option A: In onboarding (adds complexity)
   - [ ] Option B: Separate step after onboarding
   - [ ] Option C: Keep on HomePage as optional (current behavior)

3. **CV Upload**: Should we parse CV to pre-fill onboarding?
   - [ ] Option A: Yes, parse CV first, then onboarding
   - [ ] Option B: No, too complex and error-prone (current decision)
   - [ ] Option C: Optional: "Import from CV" button

4. **Skip Onboarding**: Should users be able to skip?
   - [ ] Option A: No, required for app to work (recommended)
   - [ ] Option B: Yes, allow skip but show persistent reminder
   - [ ] Option C: Partial skip (basic info required, professional optional)

5. **Data Migration**: How to handle existing users?
   - [ ] Option A: Auto-migrate on first login (recommended)
   - [ ] Option B: Show prompt: "Import from browser storage?"
   - [ ] Option C: Require manual re-entry (poor UX)

---

## Next Steps

### Immediate Actions
1. **Review this plan** with stakeholders
2. **Answer open questions** (see section above)
3. **Create database migration** file
4. **Set up feature flag** in .env
5. **Start Day 1 implementation**

### Pre-Implementation Checklist
- [ ] Approve database schema design
- [ ] Approve onboarding flow (4 steps vs more/less?)
- [ ] Approve privacy messaging
- [ ] Decide on onboarding trigger logic
- [ ] Decide on skip/optional behavior
- [ ] Review timeline (3-4 days realistic?)

---

## Appendix

### A. File Change Summary

**New Files** (15):
```
supabase/migrations/20250125000000_user_profiles_onboarding.sql
src/components/onboarding/OnboardingFlow.tsx
src/components/onboarding/OnboardingWelcome.tsx
src/components/onboarding/OnboardingBasicInfo.tsx
src/components/onboarding/OnboardingProfessional.tsx
src/components/onboarding/OnboardingPrivacy.tsx
src/components/onboarding/OnboardingProgress.tsx
src/components/onboarding/OnboardingLayout.tsx
src/components/OnboardingPrompt.tsx
src/pages/OnboardingPage.tsx
src/pages/ProfilePage.tsx
src/hooks/useUserProfile.ts
src/services/profileService.ts
src/types/onboarding.ts
__tests__/services/profileService.test.ts
```

**Modified Files** (4):
```
src/contexts/ProfileContext.tsx (major refactor)
src/pages/HomePage.tsx (simplify: ~145 → ~90 lines)
src/App.tsx (add /onboarding and /profile routes)
src/components/Header.tsx (add Profile link)
```

**Removed Files** (1-2):
```
src/components/sections/ProfileSection.tsx (move to /profile page)
src/components/ContactInfoInput.tsx (integrate into onboarding)
```

### B. Privacy Policy Template

```markdown
## Data We Collect

When you create an account, we collect:
- Name (first and last)
- Email address
- Phone number (optional)
- Current job title
- Professional links (LinkedIn, portfolio, GitHub - optional)

## How We Use Your Data

We use your information to:
- Generate personalized job applications
- Analyze job match compatibility
- Improve our AI algorithms
- Send you service updates (with consent)

We DO NOT:
- Sell your data to third parties
- Use your data for advertising
- Share with anyone without your permission

## Your Rights

You have the right to:
- Access your data (export as JSON)
- Edit your information anytime
- Delete your account and all data
- Withdraw consent for marketing emails

## Data Retention

- Active accounts: Indefinite
- Inactive accounts (>2 years): We may contact you before deletion
- Deleted accounts: Erased within 30 days

## Contact

For privacy questions: privacy@resumetune.io
```

---

**End of Implementation Plan**

**Document Version**: 1.0
**Last Updated**: 2025-01-25
**Status**: Ready for Review
