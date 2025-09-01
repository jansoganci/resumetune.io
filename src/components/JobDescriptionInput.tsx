import React, { useState, useEffect } from 'react';
import { Briefcase, X, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
// Note: Using smart extraction instead of parseJobDescription
import { useTranslation } from 'react-i18next';
import { extractJobInfo, analyzeJobDescription, getContextualSuggestions, type JobInfo, type TextAnalysis } from '../utils/smartSuggestions';
import { LinearProgress } from './ProgressIndicators';

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string, jobTitle?: string, companyName?: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({
  value,
  onChange,
  onClear
}) => {
  const { t } = useTranslation();
  const [jobInfo, setJobInfo] = useState<JobInfo>({});
  const [analysis, setAnalysis] = useState<TextAnalysis | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Analyze text in real-time with debouncing
  useEffect(() => {
    if (!value) {
      setJobInfo({});
      setAnalysis(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      const extractedInfo = extractJobInfo(value);
      const textAnalysis = analyzeJobDescription(value);
      setJobInfo(extractedInfo);
      setAnalysis(textAnalysis);
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [value]);

  const handleChange = (newValue: string) => {
    // Use smart extraction for better parsing
    const extractedInfo = extractJobInfo(newValue);
    onChange(
      newValue, 
      extractedInfo.jobTitle || undefined, 
      extractedInfo.companyName || undefined
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard shortcut: Ctrl/Cmd + Enter to trigger analysis
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      // This would trigger analysis if we had access to the parent's analyze function
      // For now, we'll show a visual hint
      setShowSuggestions(true);
      setTimeout(() => setShowSuggestions(false), 2000);
    }
  };

  const suggestions = analysis ? getContextualSuggestions(analysis) : [];
  const hasDetectedInfo = jobInfo.jobTitle || jobInfo.companyName;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Briefcase className="w-5 h-5" />
          <span>{t('jobDesc.label')}</span>
        </label>
        {value && (
          <button
            onClick={onClear}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Auto-detected information preview */}
      {hasDetectedInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-fadeInUp">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 mb-1">Auto-detected information:</p>
              <div className="space-y-1">
                {jobInfo.jobTitle && (
                  <p className="text-xs text-blue-700">
                    <strong>Position:</strong> {jobInfo.jobTitle}
                  </p>
                )}
                {jobInfo.companyName && (
                  <p className="text-xs text-blue-700">
                    <strong>Company:</strong> {jobInfo.companyName}
                  </p>
                )}
                {jobInfo.location && (
                  <p className="text-xs text-blue-700">
                    <strong>Location:</strong> {jobInfo.location}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`${t('jobDesc.placeholder')}\n\n💡 Tip: Press Ctrl+Enter for quick analysis`}
        className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />

      {/* Analysis feedback */}
      {analysis && (
        <div className="space-y-3">
          {/* Completeness progress */}
          <LinearProgress 
            progress={analysis.completeness}
            label="Job Description Completeness"
            size="sm"
            variant={analysis.completeness > 80 ? 'success' : analysis.completeness > 50 ? 'default' : 'warning'}
          />

          {/* Character and word count with enhanced feedback */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span className="text-gray-500">
                {analysis.characterCount} characters, {analysis.wordCount} words
              </span>
              <div className="flex items-center space-x-1">
                {analysis.completeness > 80 ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span className="text-green-600 font-medium">Excellent detail</span>
                  </>
                ) : analysis.completeness > 50 ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span className="text-amber-600 font-medium">Good, could be enhanced</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-600" />
                    <span className="text-red-600 font-medium">Needs more detail</span>
                  </>
                )}
              </div>
            </div>
            
            {showSuggestions && (
              <span className="text-blue-600 animate-pulse">
                💡 Press Ctrl+Enter to analyze
              </span>
            )}
          </div>

          {/* Contextual suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 mb-2">Suggestions to improve:</p>
                  <ul className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="text-xs text-amber-700">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};