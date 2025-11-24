import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Menu, X } from 'lucide-react';
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
  const { user, signOut } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleInfoClick = () => {
    if (onInfoClick) {
      onInfoClick();
    }
  };

  // Debug logging removed - auth working correctly

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsMobileMenuOpen(false);
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Sign out failed');
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 mr-4">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Home
              </Link>
              <Link
                to="/blog"
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/blog')
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Blog
              </Link>
              <Link
                to="/pricing"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === '/pricing'
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Pricing
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

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

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Mobile Menu Drawer */}
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Menu Navigation */}
              <nav className="flex-1 overflow-y-auto py-4">
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className={`block px-6 py-3 text-base font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/blog"
                  onClick={closeMobileMenu}
                  className={`block px-6 py-3 text-base font-medium transition-colors ${
                    location.pathname.startsWith('/blog')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Blog
                </Link>
                <Link
                  to="/pricing"
                  onClick={closeMobileMenu}
                  className={`block px-6 py-3 text-base font-medium transition-colors ${
                    location.pathname === '/pricing'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Pricing
                </Link>

                {user && (
                  <Link
                    to="/account"
                    onClick={closeMobileMenu}
                    className={`block px-6 py-3 text-base font-medium transition-colors ${
                      location.pathname === '/account'
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Account
                  </Link>
                )}
              </nav>

              {/* Mobile Menu Footer */}
              <div className="border-t p-4 space-y-2">
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-left font-medium"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="block w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-medium"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
