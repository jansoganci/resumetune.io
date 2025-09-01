import React, { useState } from 'react';
import { X, AlertCircle, HelpCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'disclaimer' | 'how-to' | 'legal';

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('disclaimer');

  if (!isOpen) return null;

  const tabs = [
    { id: 'disclaimer' as TabType, label: t('disclaimerTitle'), icon: AlertCircle },
    { id: 'how-to' as TabType, label: t('howToDetailed.stepsTitle'), icon: HelpCircle },
    { id: 'legal' as TabType, label: 'Legal', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Help & Information</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === tab.id
                    ? 'text-blue-700 bg-blue-50 border-b-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'disclaimer' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-3 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {t('disclaimerTitle')}
                </h3>
                <div className="space-y-3 text-amber-800 text-sm">
                  <p>
                    <strong>{t('disclaimer.aiGeneratedTitle')}</strong> {t('disclaimer.aiGeneratedBody')}
                  </p>
                  <p>
                    <strong>{t('disclaimer.responsibilityTitle')}</strong> {t('disclaimer.responsibilityBody')}
                  </p>
                  <p>
                    <strong>{t('disclaimer.privacyTitle')}</strong> {t('disclaimer.privacyBody')}
                  </p>
                  <p>
                    <strong>{t('disclaimer.liabilityTitle')}</strong> {t('disclaimer.liabilityBody')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'how-to' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">{t('howToDetailed.stepsTitle')}</h3>
                <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
                  <li>{t('howToDetailed.step1')}</li>
                  <li>{t('howToDetailed.step2')}</li>
                  <li>{t('howToDetailed.step3')}</li>
                  <li>{t('howToDetailed.step4')}</li>
                  <li>{t('howToDetailed.step5')}</li>
                  <li>{t('howToDetailed.step6')}</li>
                </ol>
                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>{t('howToDetailed.bestPracticeTitle')}</strong> {t('howToDetailed.bestPracticeBody')}
                  </p>
                </div>
                <div className="mt-3 p-3 bg-green-100 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">{t('howToDetailed.whyTextTitle')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-green-700">
                    <div>{t('howToDetailed.whyTextBullet1')}</div>
                    <div>{t('howToDetailed.whyTextBullet2')}</div>
                    <div>{t('howToDetailed.whyTextBullet3')}</div>
                    <div>{t('howToDetailed.whyTextBullet4')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Legal Information</h3>
                <div className="space-y-3 text-gray-700 text-sm">
                  <p>
                    <strong>Privacy Policy:</strong> Learn how we handle your data and protect your privacy.
                  </p>
                  <p>
                    <strong>Terms of Service:</strong> Understand the terms and conditions of using our service.
                  </p>
                  <p>
                    <strong>Data Processing:</strong> Information about how your data is processed and stored.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href="/legal/privacy-policy.html"
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Privacy Policy
                  </a>
                  <a
                    href="/legal/terms-of-service.html"
                    className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Terms of Service
                  </a>
                  <a
                    href="/legal/imprint.html"
                    className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Imprint
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
