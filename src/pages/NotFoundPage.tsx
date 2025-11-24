// ================================================================
// NOT FOUND PAGE - PHASE 3 UX POLISH
// ================================================================
// 404 error page for unmatched routes
// Provides helpful navigation back to main areas of the app

import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 mb-4">
              <Search className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 min-w-[200px]"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">Or try one of these pages:</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/blog"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Blog
              </Link>
              <span className="text-gray-400">•</span>
              <Link
                to="/pricing"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Pricing
              </Link>
              <span className="text-gray-400">•</span>
              <Link
                to="/account"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Account
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
