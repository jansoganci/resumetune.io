import React from 'react';
import { CheckCircle, AlertCircle, TrendingUp, Clock, FileText, Edit3, Lightbulb } from 'lucide-react';
import { MatchResult as MatchResultType } from '../types';
import { useTranslation } from 'react-i18next';

interface MatchResultProps {
  result: MatchResultType;
  onSendMessage?: (message: string) => void;
  onExpandChat?: () => void;
}

export const MatchResult: React.FC<MatchResultProps> = ({
  result,
  onSendMessage,
  onExpandChat
}) => {
  const { t } = useTranslation();
  const score = result.score || 0;

  const handleQuickAction = (action: string) => {
    if (onSendMessage) {
      onSendMessage(action);
      // Auto-expand chat when action is triggered
      if (onExpandChat) {
        onExpandChat();
      }
    }
  };

  // Localized quick prompts (same as ChatInterface)
  const qaCover = 'Generate a cover letter for this position';
  const qaResume = 'Optimize my resume for this position';
  const qaImprove = 'What can I improve to be a better fit for this role?';

  // Score-based styling and messaging
  const getScoreConfig = () => {
    if (score >= 85) {
      return {
        icon: CheckCircle,
        title: '🎉 Excellent Match!',
        bgGradient: 'from-green-50 to-emerald-50',
        border: 'border-green-200',
        textColor: 'text-green-800',
        descColor: 'text-green-700',
        progressColor: 'text-green-600',
        progressBg: 'bg-green-600',
        showActions: true
      };
    } else if (score >= 60) {
      return {
        icon: TrendingUp,
        title: '✅ Good Match',
        bgGradient: 'from-blue-50 to-indigo-50',
        border: 'border-blue-200',
        textColor: 'text-blue-800',
        descColor: 'text-blue-700',
        progressColor: 'text-blue-600',
        progressBg: 'bg-blue-600',
        showActions: true
      };
    } else if (score >= 40) {
      return {
        icon: TrendingUp,
        title: '⚡ Fair Match - Room to Grow',
        bgGradient: 'from-amber-50 to-yellow-50',
        border: 'border-amber-200',
        textColor: 'text-amber-800',
        descColor: 'text-amber-700',
        progressColor: 'text-amber-600',
        progressBg: 'bg-amber-600',
        showActions: true
      };
    } else {
      return {
        icon: AlertCircle,
        title: '⚠️ Not Quite Ready Yet - Let\'s Fix This!',
        bgGradient: 'from-orange-50 to-amber-50',
        border: 'border-orange-200',
        textColor: 'text-orange-800',
        descColor: 'text-orange-700',
        progressColor: 'text-orange-600',
        progressBg: 'bg-orange-600',
        showActions: false // Show improvement suggestions instead
      };
    }
  };

  const config = getScoreConfig();
  const Icon = config.icon;

  // Circular progress for score visualization
  const circumference = 2 * Math.PI * 36; // radius = 36
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className={`p-6 rounded-lg border-2 transition-all duration-300 bg-gradient-to-r ${config.bgGradient} ${config.border}`}>
      <div className="flex items-start space-x-4">
        {/* Score Circle Visualization */}
        <div className="relative flex-shrink-0">
          <svg className="w-24 h-24 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r="36"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`${config.progressColor} transition-all duration-1000 ease-out`}
              strokeLinecap="round"
            />
          </svg>
          {/* Score text in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${config.textColor}`}>{score}%</span>
            <span className="text-xs text-gray-600">Match</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Icon className={`w-6 h-6 ${config.progressColor}`} />
            <h3 className={`font-semibold text-xl ${config.textColor}`}>
              {config.title}
            </h3>
          </div>

          <p className={`text-base ${config.descColor}`}>
            {result.message}
          </p>

          <div className="flex items-center space-x-1 mt-4 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{t('match.analyzedAt')} {result.timestamp.toLocaleTimeString()}</span>
          </div>

          {/* Quick Action Buttons for good matches */}
          {config.showActions && onSendMessage && (
            <div className={`mt-6 pt-4 border-t ${config.border}`}>
              <p className={`text-sm font-medium ${config.textColor} mb-3`}>
                {t('match.nextSteps')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleQuickAction(qaCover)}
                  className="px-4 py-3 min-h-[48px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all duration-150 inline-flex items-center justify-center space-x-2 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t('chat.qaCover')}</span>
                </button>
                <button
                  onClick={() => handleQuickAction(qaResume)}
                  className="px-4 py-3 min-h-[48px] bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:scale-95 transition-all duration-150 inline-flex items-center justify-center space-x-2 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 touch-manipulation"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{t('chat.qaResume')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Improvement suggestions for low matches */}
          {!config.showActions && onSendMessage && (
            <div className={`mt-6 pt-4 border-t ${config.border}`}>
              <div className="flex items-center space-x-2 mb-3">
                <Lightbulb className={`w-5 h-5 ${config.progressColor}`} />
                <p className={`text-sm font-medium ${config.textColor}`}>
                  Don't give up! Here's how to improve:
                </p>
              </div>
              <div className="space-y-2 mb-4">
                <p className={`text-sm ${config.descColor}`}>
                  💪 You're closer than you think. Let's work together to:
                </p>
                <ul className={`text-sm ${config.descColor} list-disc list-inside space-y-1 ml-2`}>
                  <li>Identify the skill gaps you can bridge</li>
                  <li>Highlight your transferable experience</li>
                  <li>Find similar roles you're better suited for</li>
                </ul>
              </div>
              <button
                onClick={() => handleQuickAction(qaImprove)}
                className="w-full px-4 py-3 min-h-[48px] bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 active:scale-95 transition-all duration-150 inline-flex items-center justify-center space-x-2 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 touch-manipulation shadow-md"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Get Personalized Improvement Plan</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
