import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './ToastProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { InfoIcon } from './InfoIcon';

interface HeaderProps {
  onInfoClick?: () => void;
}

export default function Header({ onInfoClick }: HeaderProps = {}): JSX.Element {
  const { t } = useTranslation();
  const { user, signOut, loading } = useAuth();
  const toast = useToast();

  const handleInfoClick = () => {
    if (onInfoClick) {
      onInfoClick();
    } else {
      console.log('Info icon clicked');
    }
  };

  // Debug logging removed - auth working correctly

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Sign out failed');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('appTitle')}</h1>
              <p className="hidden lg:block text-xs text-gray-600">AI-powered career tools</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3">
            <InfoIcon onClick={handleInfoClick} />
            {user ? (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/account" 
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Account
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Login
              </Link>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
