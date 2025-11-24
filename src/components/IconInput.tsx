// ================================================================
// ICON INPUT - PHASE 3 SHARED COMPONENTS
// ================================================================
// Reusable input component with left icon
// Cleans up duplicated input patterns in Login/Register forms

import { InputHTMLAttributes, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  error?: string;
  rightElement?: ReactNode;
}

export function IconInput({
  label,
  icon: Icon,
  error,
  rightElement,
  id,
  className = '',
  ...props
}: IconInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id={inputId}
          className={`appearance-none block w-full pl-10 ${
            rightElement ? 'pr-10' : 'pr-3'
          } py-2 border ${
            error ? 'border-red-300' : 'border-gray-300'
          } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
