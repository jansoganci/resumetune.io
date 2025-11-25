// ================================================================
// ONBOARDING PROGRESS INDICATOR
// ================================================================
// Visual progress bar for onboarding flow

import React from 'react';
import { Check } from 'lucide-react';
import { OnboardingStep } from '../../types/onboarding';

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
}

const STEPS = [
  { id: 'welcome', label: 'Welcome', number: 1 },
  { id: 'basic', label: 'Basic Info', number: 2 },
  { id: 'professional', label: 'Professional', number: 3 },
  { id: 'privacy', label: 'Privacy', number: 4 },
] as const;

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
}) => {
  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep);

  const getStepStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full py-6">
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200" />

          {/* Progress line */}
          <div
            className="absolute top-5 left-0 h-1 bg-blue-600 transition-all duration-500 ease-in-out"
            style={{
              width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
            }}
          />

          {/* Step indicators */}
          {STEPS.map((step, index) => {
            const status = getStepStatus(index);

            return (
              <div key={step.id} className="relative flex flex-col items-center z-10">
                {/* Circle indicator */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-300 ease-in-out
                    ${
                      status === 'completed'
                        ? 'bg-blue-600 text-white shadow-lg scale-110'
                        : status === 'current'
                        ? 'bg-blue-600 text-white shadow-xl scale-125 ring-4 ring-blue-200 animate-pulse'
                        : 'bg-white text-gray-400 border-2 border-gray-300'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>

                {/* Step label */}
                <span
                  className={`
                    mt-2 text-xs font-medium whitespace-nowrap
                    ${
                      status === 'current'
                        ? 'text-blue-700 font-bold'
                        : status === 'completed'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current step info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Step {currentStepIndex + 1} of {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
};
