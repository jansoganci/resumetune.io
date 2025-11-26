import { useState } from 'react';
import { Check, Zap, CreditCard, Users, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ToastProvider';
import { supabase } from '../config/supabase';
import { getAuthHeaders } from '../utils/apiClient';
import { STRIPE_PLANS, APP_ROUTES, CONTACT } from '../config/constants';
import { logger } from '../utils/logger';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SEOHead } from '../components/SEOHead';

export default function PricingPage() {
  const { t } = useTranslation(['pages']);
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePlanSelection = async (plan: string) => {
    setLoading(plan);
    
    try {
      // Track analytics
      if ((window as any).dataLayer) {
        (window as any).dataLayer.push({ event: 'select_plan', plan: plan });
      }

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Redirect to login with return URL
        window.location.href = `/login?next=${encodeURIComponent('/pricing')}`;
        return;
      }

      // User is authenticated, proceed with checkout
      const headers = await getAuthHeaders();
      const response = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Checkout error', { status: response.status, error });
        toast.error(t('pages:pricing.errorCheckout'));
        return;
      }

      const { url } = await response.json();
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        toast.error(t('pages:pricing.errorSession'));
      }
    } catch (error) {
      logger.error('Error handling plan selection', error as Error, { plan });
      toast.error(t('pages:pricing.errorGeneric'));
    } finally {
      setLoading(null);
    }
  };

  // Use centralized plan configuration
  const plans = [
    {
      id: STRIPE_PLANS.CREDITS_50.id,
      name: STRIPE_PLANS.CREDITS_50.name,
      price: STRIPE_PLANS.CREDITS_50.price,
      description: t('pages:pricing.freeSubtitle'),
      features: [
        `${STRIPE_PLANS.CREDITS_50.credits} AI analysis credits`,
        t('pages:pricing.feature1'),
        t('pages:pricing.feature2'),
        t('pages:pricing.feature3'),
        t('pages:pricing.feature4')
      ],
      popular: false,
      buttonText: `Buy ${STRIPE_PLANS.CREDITS_50.credits} Credits`
    },
    {
      id: STRIPE_PLANS.CREDITS_200.id,
      name: STRIPE_PLANS.CREDITS_200.name,
      price: STRIPE_PLANS.CREDITS_200.price,
      description: t('pages:pricing.starterSubtitle'),
      features: [
        `${STRIPE_PLANS.CREDITS_200.credits} AI analysis credits`,
        t('pages:pricing.feature1'),
        t('pages:pricing.feature2'),
        t('pages:pricing.feature3'),
        t('pages:pricing.feature4'),
        t('pages:pricing.feature5')
      ],
      popular: true,
      buttonText: `Buy ${STRIPE_PLANS.CREDITS_200.credits} Credits`
    },
    {
      id: STRIPE_PLANS.SUB_100.id,
      name: STRIPE_PLANS.SUB_100.name,
      price: STRIPE_PLANS.SUB_100.price,
      period: t('pages:pricing.perMonth'),
      description: `${STRIPE_PLANS.SUB_100.creditsPerMonth} credits monthly for consistent users`,
      features: [
        `${STRIPE_PLANS.SUB_100.creditsPerMonth} credits every month`,
        t('pages:pricing.feature1'),
        t('pages:pricing.feature2'),
        t('pages:pricing.feature3'),
        'Advanced features',
        'Cancel anytime'
      ],
      popular: false,
      buttonText: t('pages:pricing.subscribeMonthly')
    },
    {
      id: STRIPE_PLANS.SUB_300.id,
      name: STRIPE_PLANS.SUB_300.name,
      price: STRIPE_PLANS.SUB_300.price,
      period: t('pages:pricing.perYear'),
      description: t('pages:pricing.proSubtitle'),
      features: [
        `${STRIPE_PLANS.SUB_300.creditsPerMonth} credits every month`,
        t('pages:pricing.feature1'),
        t('pages:pricing.feature2'),
        t('pages:pricing.feature3'),
        'Advanced features',
        t('pages:pricing.saveMoney'),
        t('pages:pricing.feature6')
      ],
      popular: false,
      buttonText: t('pages:pricing.subscribeYearly')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      <SEOHead
        title="Pricing Plans - ResumeTune | Affordable AI Resume & Cover Letter Tools"
        description="Choose the perfect plan for your job search. Get AI-powered resume optimization and cover letter generation starting at just $9. Free tier available with 3 daily requests."
        keywords="resume pricing, cover letter pricing, AI tools pricing, resume optimizer cost, job search tools, affordable resume builder"
        canonicalUrl="https://resumetune.io/pricing"
        ogType="website"
        ogImage="https://resumetune.io/og-image-pricing.png"
        twitterCard="summary_large_image"
      />

      <Header />
      <div className="py-12">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {t('pages:pricing.title')}
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          {t('pages:pricing.subtitle')}
        </p>
      </div>



      {/* Pricing Plans */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl shadow-sm border-2 p-6 ${
                plan.popular 
                  ? 'border-blue-500 shadow-lg transform scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
              } transition-all duration-200`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {t('pages:pricing.mostPopular')}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-500 ml-1">{plan.period}</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanSelection(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ minHeight: '44px' }}
              >
                {loading === plan.id ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {plan.buttonText}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('pages:pricing.whyChooseTitle')}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('pages:pricing.whyChooseSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('pages:pricing.aiPoweredTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('pages:pricing.aiPoweredDesc')}
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('pages:pricing.expertLettersTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('pages:pricing.expertLettersDesc')}
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('pages:pricing.resumeOptTitle')}</h3>
            <p className="text-gray-600 text-sm">
              {t('pages:pricing.resumeOptDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-2">{t('pages:pricing.needHelp')}</h3>
          <p className="text-gray-600 text-sm mb-4">
            {t('pages:pricing.needHelpDesc')}
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href={APP_ROUTES.GUIDES}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {t('pages:pricing.viewGuides')}
            </a>
            <span className="text-gray-300">•</span>
            <a
              href={`mailto:${CONTACT.SUPPORT_EMAIL}`}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {t('pages:pricing.contactSupport')}
            </a>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}
