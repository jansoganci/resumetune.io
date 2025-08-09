import { useState } from 'react';
import { Check, Zap, CreditCard, Users, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ToastProvider';
import { supabase } from '../config/supabase';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PricingPage() {
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
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.user.id,
        },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Checkout error:', error);
        toast.error('Failed to start checkout. Please try again.');
        return;
      }

      const { url } = await response.json();
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        toast.error('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Error handling plan selection:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: 'credits_50',
      name: '50 Credits',
      price: '$9',
      description: 'Perfect for trying out our AI tools',
      features: [
        '50 AI analysis credits',
        'Job matching & cover letters',
        'Resume optimization',
        'Priority support',
        'Credits never expire'
      ],
      popular: false,
      buttonText: 'Buy 50 Credits'
    },
    {
      id: 'credits_200',
      name: '200 Credits',
      price: '$19',
      description: 'Best value for active job seekers',
      features: [
        '200 AI analysis credits',
        'Job matching & cover letters',
        'Resume optimization',
        'Priority support',
        'Credits never expire',
        'Great value per credit'
      ],
      popular: true,
      buttonText: 'Buy 200 Credits'
    },
    {
      id: 'sub_100',
      name: 'Pro Monthly',
      price: '$9',
      period: '/month',
      description: '300 credits monthly for consistent users',
      features: [
        '300 credits every month',
        'Job matching & cover letters',
        'Resume optimization',
        'Priority support',
        'Advanced features',
        'Cancel anytime'
      ],
      popular: false,
      buttonText: 'Subscribe Monthly'
    },
    {
      id: 'sub_300',
      name: 'Pro Yearly',
      price: '$89',
      period: '/year',
      description: 'Best value for career professionals',
      features: [
        '300 credits every month',
        'Job matching & cover letters',
        'Resume optimization',
        'Priority support',
        'Advanced features',
        'Save $19 vs monthly',
        'Career coaching sessions'
      ],
      popular: false,
      buttonText: 'Subscribe Yearly'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-12">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto">
          Unlock the full power of AI-driven career tools. Get more interviews, better matches, and land your dream job faster.
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
                    Most Popular
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
            Why Choose CareerBoost AI?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join thousands of professionals who have accelerated their careers with our AI-powered tools.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Matching</h3>
            <p className="text-gray-600 text-sm">
              Our advanced AI analyzes job descriptions and matches them perfectly with your profile.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Expert Cover Letters</h3>
            <p className="text-gray-600 text-sm">
              Generate personalized, compelling cover letters that get you noticed by hiring managers.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Resume Optimization</h3>
            <p className="text-gray-600 text-sm">
              Optimize your resume for ATS systems and human recruiters to maximize your interview chances.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-2">Need help choosing?</h3>
          <p className="text-gray-600 text-sm mb-4">
            Contact our support team or start with the free tier to try our tools.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/content/index.html"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Guides
            </a>
            <span className="text-gray-300">•</span>
            <a
              href="mailto:support@careerboost.ai"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}
