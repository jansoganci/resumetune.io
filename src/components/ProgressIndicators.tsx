import React from 'react';
import { Check, Clock, Zap } from 'lucide-react';

// Circular progress ring component
interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 40,
  strokeWidth = 3,
  className = '',
  children
}) => {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-600 transition-all duration-300 ease-out"
          strokeLinecap="round"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

// Linear progress bar with labels
interface LinearProgressProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
  progress,
  label,
  showPercentage = false,
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    error: 'bg-red-600'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && <span className="text-sm text-gray-500">{Math.round(progress)}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} ${variantClasses[variant]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
    </div>
  );
};

// Multi-step progress indicator
interface Step {
  id: string;
  label: string;
  icon?: React.ReactNode;
  status: 'pending' | 'current' | 'completed' | 'error';
}

interface StepProgressProps {
  steps: Step[];
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  className = '',
  variant = 'horizontal'
}) => {
  if (variant === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <StepIndicator step={step} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${
                step.status === 'completed' ? 'text-green-800' :
                step.status === 'current' ? 'text-blue-800' :
                step.status === 'error' ? 'text-red-800' :
                'text-gray-500'
              }`}>
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className="absolute left-4 mt-8 w-0.5 h-6 bg-gray-200" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center">
        {steps.map((step, index) => (
          <li key={step.id} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {index !== steps.length - 1 && (
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="h-0.5 w-full bg-gray-200" />
              </div>
            )}
            <div className="relative flex items-center justify-center">
              <StepIndicator step={step} />
              <span className={`ml-2 text-sm font-medium ${
                step.status === 'completed' ? 'text-green-800' :
                step.status === 'current' ? 'text-blue-800' :
                step.status === 'error' ? 'text-red-800' :
                'text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Individual step indicator
const StepIndicator: React.FC<{ step: Step }> = ({ step }) => {
  const baseClasses = "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200";
  
  switch (step.status) {
    case 'completed':
      return (
        <div className={`${baseClasses} bg-green-600 border-green-600`}>
          <Check className="w-4 h-4 text-white" />
        </div>
      );
    case 'current':
      return (
        <div className={`${baseClasses} bg-blue-600 border-blue-600 animate-pulse`}>
          {step.icon || <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
      );
    case 'error':
      return (
        <div className={`${baseClasses} bg-red-600 border-red-600`}>
          <span className="text-white text-sm font-bold">!</span>
        </div>
      );
    default:
      return (
        <div className={`${baseClasses} bg-white border-gray-300`}>
          {step.icon || <div className="w-2 h-2 bg-gray-300 rounded-full" />}
        </div>
      );
  }
};

// Analysis progress component for job matching
interface AnalysisProgressProps {
  currentStep: 'analyzing' | 'matching' | 'generating' | 'complete';
  progress: number;
  className?: string;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  currentStep,
  progress,
  className = ''
}) => {
  const steps: Step[] = [
    {
      id: 'analyzing',
      label: 'Analyzing Job',
      icon: <Clock className="w-4 h-4 text-white" />,
      status: currentStep === 'analyzing' ? 'current' : 
              ['matching', 'generating', 'complete'].includes(currentStep) ? 'completed' : 'pending'
    },
    {
      id: 'matching',
      label: 'Matching Skills',
      icon: <Zap className="w-4 h-4 text-white" />,
      status: currentStep === 'matching' ? 'current' :
              ['generating', 'complete'].includes(currentStep) ? 'completed' :
              currentStep === 'analyzing' ? 'pending' : 'pending'
    },
    {
      id: 'generating',
      label: 'Generating Report',
      icon: <Check className="w-4 h-4 text-white" />,
      status: currentStep === 'generating' ? 'current' :
              currentStep === 'complete' ? 'completed' : 'pending'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="mb-4">
        <LinearProgress 
          progress={progress} 
          label="Analysis Progress" 
          showPercentage={true}
          size="md"
        />
      </div>
      <StepProgress steps={steps} variant="horizontal" />
    </div>
  );
};

// Profile completion indicator
interface ProfileCompletionProps {
  hasProfile: boolean;
  hasContact: boolean;
  hasCV: boolean;
  className?: string;
}

export const ProfileCompletion: React.FC<ProfileCompletionProps> = ({
  hasProfile,
  hasContact,
  hasCV,
  className = ''
}) => {
  const completedSteps = [hasProfile, hasContact, hasCV].filter(Boolean).length;
  const totalSteps = 3;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <CircularProgress progress={progress} size={32} strokeWidth={3}>
        <span className="text-xs font-bold text-gray-600">{completedSteps}</span>
      </CircularProgress>
      <div className="text-sm">
        <span className="font-medium text-gray-900">{completedSteps}/{totalSteps} Complete</span>
        {progress === 100 && (
          <div className="text-green-600 text-xs animate-pulse">✓ Ready to analyze</div>
        )}
      </div>
    </div>
  );
};
