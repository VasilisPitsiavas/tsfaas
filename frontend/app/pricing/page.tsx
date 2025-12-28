'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/intfrontend/components/ui/button';
import { Card } from '@/intfrontend/components/ui/card';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Check, Zap, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is already Pro
    const checkProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const profile = await api.billing.getProfile();
          setIsPro(profile.is_pro);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    checkProfile();
  }, [supabase]);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const response = await api.billing.createCheckoutSession();
      
      if (response.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = response.checkout_url;
      } else {
        alert('Failed to create checkout session');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      alert(error.response?.data?.detail || 'Failed to start checkout process');
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600">
            Unlock powerful forecasting features with Pro
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Sparkles className="w-8 h-8 text-gray-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Free</h2>
              <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
              <p className="text-gray-600">Forever</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Basic time series forecasting</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">CSV file upload</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Basic model selection</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Export results</span>
              </li>
            </ul>

            <Button
              variant="outline"
              className="w-full"
              disabled
            >
              Current Plan
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="p-8 border-2 border-blue-500 relative">
            {isPro && (
              <div className="absolute top-4 right-4">
                <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Active
                </span>
              </div>
            )}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pro</h2>
              <div className="text-4xl font-bold text-gray-900 mb-1">$29</div>
              <p className="text-gray-600">per month</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Everything in Free</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Advanced model selection</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Multiple exogenous variables</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Extended forecast horizons</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Priority support</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">API access (coming soon)</span>
              </li>
            </ul>

            {isPro ? (
              <Button
                variant="default"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled
              >
                ✓ Pro Active
              </Button>
            ) : (
              <Button
                variant="default"
                className="w-full"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Upgrade to Pro'}
              </Button>
            )}
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            All payments are processed securely by Stripe. Test mode enabled.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Use test card: 4242 4242 4242 4242
          </p>
        </div>
      </div>
    </div>
  );
}

