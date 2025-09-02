import React from 'react';
import { Check, User, Mail, FileText, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserProfile } from '../types';
import { ContactInfo } from './ContactInfoInput';
import { CVData } from '../types';
import { SuccessCelebration } from '../utils/animations';
import { ProfileCompletion } from './ProgressIndicators';
import { Tooltip, AutoSaveIndicator } from './MicroFeedback';


interface ProfileStatusBarProps {
  userProfile: UserProfile | null;
  contactInfo: ContactInfo | null;
  cvData: CVData | null;
  onEdit: () => void;
  onClear: () => void;
}

export const ProfileStatusBar: React.FC<ProfileStatusBarProps> = ({
  userProfile,
  contactInfo,
  cvData,
  onEdit,
  onClear
}) => {
  const { t } = useTranslation();
  
  const hasProfile = !!userProfile?.content;
  const hasContact = !!(contactInfo?.fullName && contactInfo?.email);
  const hasCV = !!cvData?.content;
  
  const allComplete = hasProfile && hasContact && hasCV;
  const totalSteps = 3;
  const completedSteps = [hasProfile, hasContact, hasCV].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-6">
          {/* Profile Status */}
          <Tooltip content={hasProfile ? "Profile completed" : "Click Edit to add your profile"}>
            <div className="flex items-center space-x-2">
              {hasProfile ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <User className="w-5 h-5 text-amber-600" />
              )}
              <span className={`text-sm font-medium ${hasProfile ? 'text-green-800' : 'text-amber-800'}`}>
                {t('profile.title')}
              </span>
            </div>
          </Tooltip>

          {/* Contact Status */}
          <div className="flex items-center space-x-2">
            {hasContact ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <Mail className="w-5 h-5 text-amber-600" />
            )}
            <span className={`text-sm font-medium ${hasContact ? 'text-green-800' : 'text-amber-800'}`}>
              {t('contactInfo.title')}
            </span>
          </div>

          {/* CV Status */}
          <div className="flex items-center space-x-2">
            {hasCV ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <FileText className="w-5 h-5 text-amber-600" />
            )}
            <span className={`text-sm font-medium ${hasCV ? 'text-green-800' : 'text-amber-800'}`}>
              {t('yourCV')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-3">
          {/* Enhanced Progress indicator */}
          <ProfileCompletion 
            hasProfile={hasProfile}
            hasContact={hasContact}
            hasCV={hasCV}
          />
          
          {/* Edit button */}
          <button
            onClick={onEdit}
            className="flex items-center space-x-1 px-3 py-2 min-h-[44px] bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
          >
            <Edit3 className="w-3 h-3" />
            <span>{t('profile.edit')}</span>
          </button>

          {/* Clear button (only show if has data) */}
          {(hasProfile || hasContact || hasCV) && (
            <button
              onClick={onClear}
              className="px-3 py-2 min-h-[44px] text-gray-600 text-sm hover:text-gray-800 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md touch-manipulation"
            >
              {t('profile.clear')}
            </button>
          )}
        </div>
      </div>

      {/* Status message */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          {allComplete ? (
            <SuccessCelebration show={allComplete} type="pulse">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-700 font-medium">
                  {t('profile.allComplete')}
                </span>
              </div>
            </SuccessCelebration>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-amber-700">
                {t('profile.completeSetup')} ({completedSteps}/{totalSteps} {t('profile.completed')})
              </span>
            </div>
          )}
        </div>
        
        {/* Auto-save indicator */}
        <AutoSaveIndicator 
          isSaving={false}
          lastSaved={userProfile?.savedAt}
        />
      </div>
    </div>
  );
};
