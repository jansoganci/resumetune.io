import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import { PageLoadingSkeleton } from './components/PageLoadingSkeleton';

// Page-specific skeleton components
import LoginSkeleton from './components/LoginSkeleton';
import RegisterSkeleton from './components/RegisterSkeleton';
import ResetPasswordSkeleton from './components/ResetPasswordSkeleton';
import PricingPageSkeleton from './components/PricingPageSkeleton';
import BlogPageSkeleton from './components/BlogPageSkeleton';
import BlogArticlePageSkeleton from './components/BlogArticlePageSkeleton';

// Lazy load non-critical pages for better performance
const PricingPage = lazy(() => import('./pages/PricingPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogArticlePage = lazy(() => import('./pages/BlogArticlePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  return (
    <HelmetProvider>
      <Routes>
        {/* Critical pages loaded immediately */}
        <Route path="/" element={<HomePage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Non-critical pages lazy loaded with Suspense */}
      <Route
        path="/pricing"
        element={
          <Suspense fallback={<PricingPageSkeleton />}>
            <PricingPage />
          </Suspense>
        }
      />
      <Route
        path="/account"
        element={
          <Suspense fallback={<PageLoadingSkeleton />}>
            <AccountPage />
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <Suspense fallback={<LoginSkeleton />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/register"
        element={
          <Suspense fallback={<RegisterSkeleton />}>
            <Register />
          </Suspense>
        }
      />
      <Route
        path="/reset-password"
        element={
          <Suspense fallback={<ResetPasswordSkeleton />}>
            <ResetPassword />
          </Suspense>
        }
      />
      <Route
        path="/blog"
        element={
          <Suspense fallback={<BlogPageSkeleton />}>
            <BlogPage />
          </Suspense>
        }
      />
      <Route
        path="/blog/:slug"
        element={
          <Suspense fallback={<BlogArticlePageSkeleton />}>
            <BlogArticlePage />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <Suspense fallback={<PageLoadingSkeleton />}>
            <NotFoundPage />
          </Suspense>
        }
      />
      </Routes>
    </HelmetProvider>
  );
}

export default App;