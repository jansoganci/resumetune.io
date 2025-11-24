import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, CreditCard, TrendingUp } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ToastProvider';
import { logger } from '../utils/logger';
import { AccountPageSkeletons } from '../components/AccountPageSkeleton';

import { fetchQuotaInfo, QuotaInfo } from '../services/quotaService';

export default function AccountPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuotaInfo = async () => {
      try {
        setLoading(true);
        const quota = await fetchQuotaInfo();
        setQuotaInfo(quota);
      } catch (error) {
        logger.error('Failed to fetch quota info', error instanceof Error ? error : { error });
        toast.error('Failed to load account information');
      } finally {
        setLoading(false);
      }
    };

    loadQuotaInfo();
    
    // Check URL params for success status
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('status') === 'success') {
      toast.success('Payment successful! Your account has been updated.');
      // Remove the status param from URL
      window.history.replaceState({}, '', '/account');
    }
  }, [toast]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to view your account information.</p>
            <a
              href="/login"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 min-h-11"
            >
              Sign In
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading ? (
          <AccountPageSkeletons />
        ) : (
          <>
            {/* Account Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Account Overview</h1>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Plan & Quota Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Plan */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Plan Type</span>
                    <span className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm font-medium">
                      {quotaInfo?.plan === 'free' ? 'Free' : 'Paid'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                  {quotaInfo?.credits !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Credits Balance</span>
                      <span className="font-semibold text-gray-900">{quotaInfo.credits}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email Address</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Account Created</label>
                  <p className="text-gray-900">
                    {user.created_at ? formatDate(user.created_at) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Billing & Upgrades */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Billing & Credits</h3>
          </div>
          <div className="space-y-4">
            <p className="text-gray-600">
              Upgrade your plan or purchase additional credits to increase your daily limits.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 min-h-11"
              >
                Buy Credits
              </Link>
              <button
                onClick={() => toast.info('Billing portal coming soon')}
                className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 min-h-11"
              >
                View Billing History
              </button>
            </div>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Usage Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Free accounts get 3 AI requests per day</li>
            <li>• Usage resets daily at midnight UTC</li>
            <li>• Each job analysis, cover letter generation, or resume optimization counts as one request</li>
            <li>• Chat messages within an active session don't count toward your limit</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
