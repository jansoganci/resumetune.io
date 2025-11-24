// ================================================================
// PROFILE SECTION COMPONENT - PHASE 2 REFACTOR
// ================================================================
// Manages profile status display and editing modal
// Extracted from HomePage to reduce complexity

import React, { useState } from 'react';
import { ProfileStatusBar } from '../ProfileStatusBar';
import { ProfileEditModal } from '../ProfileEditModal';
import { useProfile } from '../../contexts/ProfileContext';
import { AnimateOnScroll } from '../../utils/animations';

export function ProfileSection() {
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const {
    userProfile,
    contactInfo,
    cvData,
    handleProfileSave,
    handleContactInfoSave,
    handleCVUpload,
    clearProfile,
    clearContactInfo,
    clearCV,
    clearAll,
  } = useProfile();

  return (
    <>
      {/* Profile Status Bar */}
      <AnimateOnScroll animation="slideInFromTop" delay="delay75">
        <ProfileStatusBar
          userProfile={userProfile}
          contactInfo={contactInfo}
          cvData={cvData}
          onEdit={() => setIsProfileEditModalOpen(true)}
          onClear={clearAll}
        />
      </AnimateOnScroll>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileEditModalOpen}
        onClose={() => setIsProfileEditModalOpen(false)}
        userProfile={userProfile}
        contactInfo={contactInfo}
        cvData={cvData}
        onProfileSave={handleProfileSave}
        onContactInfoSave={handleContactInfoSave}
        onCVUpload={handleCVUpload}
        onClearProfile={clearProfile}
        onClearContactInfo={clearContactInfo}
        onClearCV={clearCV}
      />
    </>
  );
}
