import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, CreditCard, TrendingUp, Shield, Download, Trash2, AlertCircle, Edit3, Linkedin, Globe, Github, Phone, Mail, Briefcase } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ToastProvider';
import { logger } from '../utils/logger';
import { AccountPageSkeletons } from '../components/AccountPageSkeleton';
import { useUserProfile } from '../hooks/useUserProfile';
import { UserProfileEditModal } from '../components/UserProfileEditModal';

import { fetchQuotaInfo, QuotaInfo } from '../services/quotaService';

export default function AccountPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // User profile from onboarding database
  const { profile, updateProfile, exportData, deleteAccount, isLoading: profileLoading } = useUserProfile();

  useEffect(() => {
    const loadQuotaInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const quota = await fetchQuotaInfo();
        setQuotaInfo(quota);
      } catch (err) {
        const errorMessage = 'Failed to load account information';
        setError(errorMessage);
        logger.error('Failed to fetch quota info', err instanceof Error ? err : { err });
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

  // Calculate profile completeness
  const calculateProfileCompleteness = () => {
    if (!profile) return 0;

    const fields = [
      profile.first_name,
      profile.last_name,
      profile.email,
      profile.phone,
      profile.current_position,
      profile.linkedin_url,
      profile.portfolio_url,
      profile.github_url,
    ];

    const filledFields = fields.filter(field => field && field.trim().length > 0).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  // Handle profile edit
  const handleProfileEdit = async (updates: any) => {
    const success = await updateProfile(updates);
    if (success) {
      setIsEditingProfile(false);
    }
  };

  // Handle data export
  const handleExportData = async () => {
    try {
      await exportData();
    } catch (err) {
      // Error handled in hook
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you absolutely sure you want to delete your account?\n\n' +
      'This will:\n' +
      '• Permanently delete all your data\n' +
      '• Remove your profile and settings\n' +
      '• Sign you out immediately\n\n' +
      'This action CANNOT be undone.'
    );

    if (confirmed) {
      const success = await deleteAccount();
      if (success) {
        // User will be redirected by auth state change
      }
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Failed to Load Account Data</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {loading || profileLoading ? (
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

            {/* Profile Completeness Banner */}
            {profile && calculateProfileCompleteness() < 100 && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 text-lg mb-1">
                      Profile {calculateProfileCompleteness()}% Complete
                    </h3>
                    <p className="text-sm text-yellow-800">
                      Complete your profile to improve AI recommendations and personalization
                    </p>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors whitespace-nowrap"
                  >
                    Complete Now
                  </button>
                </div>
                <div className="mt-4 w-full bg-yellow-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${calculateProfileCompleteness()}%` }}
                  />
                </div>
              </div>
            )}

            {/* Plan & Quota Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Plan */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CreditCard className="w-5 h-5 text-blue-600" />
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

              {/* Usage Statistics */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Usage Today</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Requests Used</span>
                    <span className="font-semibold text-gray-900">{quotaInfo?.used || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Daily Limit</span>
                    <span className="font-semibold text-gray-900">{quotaInfo?.limit || 3}</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{Math.round(((quotaInfo?.used || 0) / (quotaInfo?.limit || 3)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(((quotaInfo?.used || 0) / (quotaInfo?.limit || 3)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Profile Information */}
            {profile ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                  </div>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Full Name</span>
                    </label>
                    <p className="text-gray-900 mt-1 font-medium">
                      {profile.first_name} {profile.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                      <Briefcase className="w-4 h-4" />
                      <span>Current Position</span>
                    </label>
                    <p className="text-gray-900 mt-1">{profile.current_position}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>Email Address</span>
                    </label>
                    <p className="text-gray-900 mt-1">{profile.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>Phone Number</span>
                    </label>
                    <p className="text-gray-900 mt-1">{profile.phone || 'Not provided'}</p>
                  </div>
                  {profile.linkedin_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                        <Linkedin className="w-4 h-4" />
                        <span>LinkedIn</span>
                      </label>
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mt-1 block truncate"
                      >
                        View Profile →
                      </a>
                    </div>
                  )}
                  {profile.portfolio_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>Portfolio</span>
                      </label>
                      <a
                        href={profile.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mt-1 block truncate"
                      >
                        Visit Website →
                      </a>
                    </div>
                  )}
                  {profile.github_url && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center space-x-2">
                        <Github className="w-4 h-4" />
                        <span>GitHub</span>
                      </label>
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mt-1 block truncate"
                      >
                        View Profile →
                      </a>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Account Created</label>
                    <p className="text-gray-900 mt-1">
                      {profile.created_at ? formatDate(profile.created_at) : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">Complete Your Profile</h3>
                    <p className="text-sm text-blue-800 mt-1">
                      Set up your profile to get personalized AI recommendations and better job matches.
                    </p>
                  </div>
                  <Link
                    to="/onboarding"
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Complete Profile
                  </Link>
                </div>
              </div>
            )}
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

        {/* Privacy & Data Management */}
        {profile && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Privacy & Data Management</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                Manage your data and privacy settings. Your data is encrypted and never sold to third parties.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExportData}
                  disabled={profileLoading}
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export My Data</span>
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={profileLoading}
                  className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account</span>
                </button>
              </div>
              <p className="text-xs text-gray-500">
                <strong>Data Export:</strong> Downloads all your profile information, usage history, and settings as JSON. <br />
                <strong>Delete Account:</strong> Permanently removes all your data and signs you out. This action cannot be undone.
              </p>
            </div>
          </div>
        )}

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

      {/* Profile Edit Modal */}
      {isEditingProfile && profile && (
        <UserProfileEditModal
          profile={profile}
          onSave={handleProfileEdit}
          onCancel={() => setIsEditingProfile(false)}
          isLoading={profileLoading}
        />
      )}
    </div>
  );
}
