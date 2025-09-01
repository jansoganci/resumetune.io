import React from 'react';
import { HelpCircle } from 'lucide-react';

interface InfoIconProps {
  onClick: () => void;
  className?: string;
}

export const InfoIcon: React.FC<InfoIconProps> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      aria-label="Help and Information"
      title="Help and Information"
    >
      <HelpCircle className="w-5 h-5" />
    </button>
  );
};
