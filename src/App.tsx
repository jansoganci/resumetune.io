import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import { PageLoadingSkeleton } from './components/PageLoadingSkeleton';

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
    <Routes>
      {/* Critical pages loaded immediately */}
      <Route path="/" element={<HomePage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Non-critical pages lazy loaded with Suspense */}
      <Route
        path="/pricing"
        element={
          <Suspense fallback={<PageLoadingSkeleton />}>
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
          <Suspense fallback={<PageLoadingSkeleton />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/register"
        element={
          <Suspense fallback={<PageLoadingSkeleton />}>
            <Register />
          </Suspense>
        }
      />
      <Route
        path="/reset-password"
        element={
          <Suspense fallback={<PageLoadingSkeleton />}>
            <ResetPassword />
          </Suspense>
        }
      />
      <Route
        path="/blog"
        element={
          <Suspense fallback={<PageLoadingSkeleton />}>
            <BlogPage />
          </Suspense>
        }
      />
      <Route
        path="/blog/:slug"
        element={
          <Suspense fallback={<PageLoadingSkeleton />}>
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
  );
}

export default App;