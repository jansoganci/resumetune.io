import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { UserLimitInfo } from '../services/creditService';
import { useAuth } from '../contexts/AuthContext';

interface QuotaIndicatorProps {
  className?: string;
}

export interface QuotaIndicatorRef {
  refresh: () => void;
}

export const QuotaIndicator = forwardRef<QuotaIndicatorRef, QuotaIndicatorProps>(({ className = '' }, ref) => {
  const { user } = useAuth();
  const [quotaInfo, setQuotaInfo] = useState<UserLimitInfo | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchQuotaInfo();
    }
  }, [user?.id]);

  // Expose refresh function to parent
  useImperativeHandle(ref, () => ({
    refresh: fetchQuotaInfo
  }), [user?.id]);

  const fetchQuotaInfo = async () => {
    if (!user?.id) return;
    
    try {
      const { getUserLimitInfo } = await import('../services/creditService');
      const info = await getUserLimitInfo(user.id);
      setQuotaInfo(info);
    } catch (err) {
      // Silent fail - don't show quota if it fails
    }
  };

  if (!quotaInfo) return null;

  const { planType, creditsBalance, dailyUsage, dailyLimit, hasActiveSubscription } = quotaInfo;
  
  // Get minimal status
  const getStatus = () => {
    if (hasActiveSubscription) {
      return { icon: CheckCircle, color: 'text-green-600', text: '∞' };
    }
    
    if (planType === 'credits') {
      const isLow = creditsBalance <= 5;
      return { 
        icon: isLow ? AlertCircle : Zap, 
        color: isLow ? 'text-amber-600' : 'text-blue-600', 
        text: creditsBalance.toString() 
      };
    }
    
    // Free plan
    const remaining = Math.max(0, dailyLimit - dailyUsage);
    const isLow = remaining <= 1;
    return { 
      icon: isLow ? AlertCircle : Zap, 
      color: isLow ? 'text-amber-600' : 'text-gray-600', 
      text: remaining.toString() 
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <StatusIcon className={`w-4 h-4 ${status.color}`} />
      <span className={`text-sm font-medium ${status.color}`}>
        {status.text}
      </span>
    </div>
  );
});
