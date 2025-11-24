import React, { useCallback } from 'react';
import { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Type, Info, Edit3 } from 'lucide-react';
import { extractTextFromFile } from '../utils/fileProcessor';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';

interface FileUploadProps {
  onFileProcessed: (content: string, fileName: string) => void;
  currentFile?: string;
  onClear?: () => void;
  label: string;
  accept?: Record<string, string[]>;
  compact?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileProcessed,
  currentFile,
  onClear,
  label,
  compact = false,
  accept = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  }
}) => {
  const { t } = useTranslation();
  const [cvText, setCvText] = React.useState('');
  const [inputMethod, setInputMethod] = React.useState<'text' | 'file'>('text');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load saved CV text from localStorage on component mount
  useEffect(() => {
    try {
      const savedCvText = localStorage.getItem('userCvText');
      if (savedCvText && savedCvText.trim()) {
        setCvText(savedCvText);
      }
    } catch (error) {
      logger.warn('Failed to load saved CV text from localStorage', { error });
    }
  }, []); // Remove onFileProcessed dependency to prevent infinite loop

  // Auto-save CV text to localStorage when it changes
  useEffect(() => {
    if (cvText.trim()) {
      try {
        localStorage.setItem('userCvText', cvText);
      } catch (error) {
        logger.warn('Failed to save CV text to localStorage', { error });
        // Handle localStorage quota exceeded or other errors
        setError(t('fileUpload.errorSave'));
      }
    }
  }, [cvText]);

  // Auto-process saved content when component mounts and has substantial content (disabled: avoid surprising auto-submit)
  useEffect(() => {
    // kept intentionally disabled; user should confirm with button
  }, [cvText, currentFile]);
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const extractedPdfText = await extractTextFromFile(file);
      // Priority logic: Use pasted text when provided; otherwise use extracted text
      const finalContent = cvText.trim() || extractedPdfText;
      const sourceLabel = cvText.trim() ? t('fileUpload.pastedLabel') : file.name;
      
      onFileProcessed(finalContent, sourceLabel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  }, [onFileProcessed, cvText]);

  const handleTextSubmit = () => {
    if (!cvText.trim()) {
      setError(t('fileUpload.errorRequired'));
      return;
    }
    
    if (cvText.trim().length < 50) {
      setError(t('fileUpload.errorMin'));
      return;
    }
    
    setError(null);
    
    // Priority logic: Always use clean text content when available
    const finalContent = cvText.trim();
    onFileProcessed(finalContent, t('fileUpload.pastedLabel'));
  };

  const handleTextClear = () => {
    setCvText('');
    // Clear from localStorage
    try {
      localStorage.removeItem('userCvText');
    } catch (error) {
      logger.warn('Failed to clear CV text from localStorage', { error });
    }
    // Clear the processed CV data as well
    if (onClear) {
      onClear();
    }
  };

  const handleFileClear = () => {
    // Clear file upload and use text content if available
    if (cvText.trim()) {
      // If we have text content, re-process it as the primary source
      const finalContent = cvText.trim();
      onFileProcessed(finalContent, 'Pasted CV Content');
    } else if (onClear) {
      // If no text content, clear everything
      onClear();
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    disabled: isProcessing || inputMethod === 'text'
  });

  return (
    <div className="space-y-2">
      {!compact && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      
      {/* Input Method Toggle */}
      <div className="flex items-center space-x-4 mb-3">
        <button
          type="button"
          onClick={() => setInputMethod('text')}
          className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors ${
            inputMethod === 'text'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>{t('fileUpload.pasteText')}</span>
        </button>
        <button
          type="button"
          onClick={() => setInputMethod('file')}
          className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors ${
            inputMethod === 'file'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>{t('fileUpload.uploadFile')}</span>
        </button>
      </div>

      {/* Text Input Method */}
      {inputMethod === 'text' && (
        <div className="space-y-3">
          <div className="flex items-start space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">{t('fileUpload.recommendedTitle')}</p>
              <div className="space-y-1">
                <p>• <strong>{t('fileUpload.bulletAccuracy').split(':')[0]}:</strong> {t('fileUpload.bulletAccuracy').split(':')[1]?.trim()}</p>
                <p>• <strong>{t('fileUpload.bulletFaster').split(':')[0]}:</strong> {t('fileUpload.bulletFaster').split(':')[1]?.trim()}</p>
                <p>• <strong>{t('fileUpload.bulletEditing').split(':')[0]}:</strong> {t('fileUpload.bulletEditing').split(':')[1]?.trim()}</p>
                <p>• <strong>{t('fileUpload.bulletNoLimits').split(':')[0]}:</strong> {t('fileUpload.bulletNoLimits').split(':')[1]?.trim()}</p>
              </div>
              <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                <strong>{t('fileUpload.howToCopyTitle')}</strong> {t('fileUpload.howToCopyBody')}
              </div>
            </div>
          </div>
          
          {currentFile && inputMethod === 'text' ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-green-600" />
                <span className="text-green-800 text-sm">{t('fileUpload.contentReady')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    setInputMethod('text');
                    // Don't clear the text, just switch to edit mode
                  }}
                  className="p-1 text-green-600 hover:text-green-800 transition-colors"
                  title={t('fileUpload.edit')}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleTextClear}
                  className="p-1 text-red-500 hover:text-red-700 transition-colors"
                  title={t('fileUpload.delete')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <textarea
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder={`📋 ${t('profile.placeholder')}`}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-xs text-gray-500">
                    {cvText.length} {t('jobDesc.chars')}
                  </p>
                  {cvText.length > 0 && (
                    <div className="flex items-center space-x-1">
                      {cvText.length >= 50 ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                           <span className="text-xs text-green-600">{t('fileUpload.goodLength')}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                           <span className="text-xs text-yellow-600">{t('fileUpload.needMore')}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    handleTextSubmit();
                  }}
                  disabled={cvText.length < 50}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {cvText.length < 50 ? t('fileUpload.needMoreBtn') : t('fileUpload.useThisCv')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* File Upload Method */}
      {inputMethod === 'file' && (
        <div className="space-y-3">
          <div className="flex items-start space-x-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-2">{t('fileUpload.altTitle')}</p>
              <div className="space-y-1">
                <p>• <strong>{t('fileUpload.bulletSupport').split(':')[0]}:</strong> {t('fileUpload.bulletSupport').split(':')[1]?.trim()}</p>
                <p>• <strong>{t('fileUpload.bulletExtraction').split(':')[0]}:</strong> {t('fileUpload.bulletExtraction').split(':')[1]?.trim()}</p>
                <p>• <strong>{t('fileUpload.bulletBackup').split(':')[0]}:</strong> {t('fileUpload.bulletBackup').split(':')[1]?.trim()}</p>
              </div>
              <div className="mt-3 p-2 bg-amber-100 rounded text-xs">
                <strong>{t('fileUpload.note')}</strong> {t('fileUpload.noteText')}
              </div>
            </div>
          </div>
          
          {currentFile ? (
            <div className={`flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg ${compact ? 'py-2' : ''}`}>
              <div className="flex items-center space-x-2">
                <File className="w-4 h-4 text-green-600" />
                <span className={`text-green-800 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                  {compact ? `✓ ${currentFile}` : currentFile}
                </span>
              </div>
              {onClear && (
                <div className="flex items-center space-x-1">
                  {cvText.trim() && (
                    <button
                      onClick={() => {
                        setInputMethod('text');
                        // Switch to text mode to show the content for editing
                      }}
                      className="p-1 text-green-600 hover:text-green-800 transition-colors"
                      title="Edit CV content"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleFileClear}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    title="Delete file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                compact ? 'p-3' : 'p-6'
              } ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className={`text-gray-400 mx-auto ${compact ? 'w-5 h-5 mb-1' : 'w-8 h-8 mb-2'}`} />
              {isProcessing ? (
                <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-sm'}`}>{t('fileUpload.processing')}</p>
              ) : isDragActive ? (
                <p className={`text-blue-600 ${compact ? 'text-xs' : 'text-sm'}`}>{t('fileUpload.dropHere')}</p>
              ) : (
                <div>
                  <p className={`text-gray-600 ${compact ? 'text-xs mb-0' : 'text-sm mb-1'}`}>
                    {compact ? t('fileUpload.uploadCv') : t('fileUpload.dragDropHint')}
                  </p>
                  {!compact && <p className="text-xs text-gray-500">{t('fileUpload.onlyPdfWord')}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}
    </div>
  );
};