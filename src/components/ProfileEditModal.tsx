import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProfileInput } from './ProfileInput';
import { ContactInfoInput, ContactInfo } from './ContactInfoInput';
import { FileUpload } from './FileUpload';
import { UserProfile, CVData } from '../types';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  contactInfo: ContactInfo | null;
  cvData: CVData | null;
  onProfileSave: (content: string) => void;
  onContactInfoSave: (contactData: ContactInfo) => void;
  onCVUpload: (content: string, fileName: string) => void;
  onClearProfile: () => void;
  onClearContactInfo: () => void;
  onClearCV: () => void;
}

type TabType = 'profile' | 'contact' | 'cv';

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  contactInfo,
  cvData,
  onProfileSave,
  onContactInfoSave,
  onCVUpload,
  onClearProfile,
  onClearContactInfo,
  onClearCV
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile' as TabType, label: t('profile.title') },
    { id: 'contact' as TabType, label: t('contactInfo.title') },
    { id: 'cv' as TabType, label: t('yourCV') },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fadeInScale">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{t('profile.editTitle')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeTab === tab.id
                  ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'profile' && (
            <div>
              <ProfileInput
                profile={userProfile?.content || ''}
                onProfileSave={onProfileSave}
                onClear={onClearProfile}
              />
            </div>
          )}

          {activeTab === 'contact' && (
            <div>
              <ContactInfoInput
                contactInfo={contactInfo}
                onContactInfoSave={onContactInfoSave}
                onClear={onClearContactInfo}
              />
            </div>
          )}

          {activeTab === 'cv' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('yourCV')}</h3>
                {cvData && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {t('source.pasted')}: {cvData.fileName}
                  </span>
                )}
              </div>
              <FileUpload
                label={t('addYourCV')}
                onFileProcessed={onCVUpload}
                currentFile={cvData?.fileName}
                compact={false}
                onClear={onClearCV}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 min-h-[48px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation font-medium"
            >
              {t('profile.done')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
