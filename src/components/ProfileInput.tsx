import React, { useState } from 'react';
import { useEffect } from 'react';
import { User, Edit3, Save, X } from 'lucide-react';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/storage';
import { useTranslation } from 'react-i18next';

interface ProfileInputProps {
  profile: string;
  onProfileSave: (content: string) => void;
  onClear?: () => void;
}

export const ProfileInput: React.FC<ProfileInputProps> = ({
  profile,
  onProfileSave,
  onClear
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(profile);
  const [error, setError] = useState<string | null>(null);

  // Load saved profile from localStorage on component mount
  useEffect(() => {
    const savedProfile = loadFromStorage(STORAGE_KEYS.USER_PROFILE);
    if (savedProfile && savedProfile.content) {
      // Auto-populate the edit content
      setEditContent(savedProfile.content);
      // If we have saved content, show in display mode (not editing)
      setIsEditing(false);
    } else {
      // No saved profile, show in editing mode
      setIsEditing(true);
    }
  }, []);

  // Update editing state when profile prop changes
  useEffect(() => {
    if (profile) {
      setIsEditing(false);
    } else if (!editContent) {
      setIsEditing(true);
    }
  }, [profile, editContent]);

  // Sync editContent with profile prop when it changes
  useEffect(() => {
    setEditContent(profile);
  }, [profile]);

  const handleSave = () => {
    const trimmedContent = editContent.trim();
    
    if (!trimmedContent) {
      setError(t('profile.errorRequired'));
      return;
    }

    if (trimmedContent.length < 50) {
      setError(t('profile.errorMin'));
      return;
    }

    // Save to localStorage immediately
    const profileData = {
      content: trimmedContent,
      savedAt: new Date()
    };
    saveToStorage(STORAGE_KEYS.USER_PROFILE, profileData);

    onProfileSave(trimmedContent);
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setEditContent(profile);
    setIsEditing(false);
    setError(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Ensure we have the latest content when starting to edit
    if (!editContent && profile) {
      setEditContent(profile);
    }
    setError(null);
  };

  const getPreviewText = (text: string) => {
    if (text.length <= 100) return text;
    return text.substring(0, 100) + '...';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <User className="w-4 h-4" />
          <span>{t('profile.label')}</span>
        </label>
        {profile && !isEditing && (
          <div className="flex items-center space-x-2">
            {onClear && (
              <button
                onClick={onClear}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder={t('profile.placeholder')}
            className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {editContent.length} {t('jobDesc.chars')} {editContent.length < 50 && '(minimum 50)'}
            </p>
            <div className="flex space-x-2">
              {profile && (
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {t('profile.cancel')}
                </button>
              )}
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-1"
              >
                <Save className="w-3 h-3" />
                <span>{t('profile.save')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : profile ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <User className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-800 text-sm whitespace-pre-wrap">
                {getPreviewText(profile)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
          <User className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm mb-2">{t('profile.previewHelpTitle')}</p>
          <p className="text-xs text-gray-500">{t('profile.previewHelpDesc')}</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}
    </div>
  );
};