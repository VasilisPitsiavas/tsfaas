'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/intfrontend/components/ui/button';
import { Card } from '@/intfrontend/components/ui/card';
import { api } from '@/lib/api';
import { CheckCircle, Loader2 } from 'lucide-react';

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refresh user profile to check if is_pro was updated
        const profile = await api.billing.getProfile();
        
        if (profile.is_pro) {
          // Success - user is now Pro
          setLoading(false);
          
          // Refresh the session to get updated user data
          await supabase.auth.refreshSession();
        } else {
          // Webhook might not have processed yet, wait a bit more
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const profileRetry = await api.billing.getProfile();
          if (profileRetry.is_pro) {
            setLoading(false);
            await supabase.auth.refreshSession();
          } else {
            setError('Payment processed but profile update is pending. Please refresh the page in a moment.');
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error('Error verifying payment:', err);
        setError(err.response?.data?.detail || 'Failed to verify payment');
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Processing Your Payment
          </h2>
          <p className="text-gray-600">
            Please wait while we confirm your Pro subscription...
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">✕</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verification Issue
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push('/pricing')}
            >
              Back to Pricing
            </Button>
            <Button
              variant="default"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <Card className="p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Pro!
        </h2>
        <p className="text-gray-600 mb-6">
          Your subscription has been activated. You now have access to all Pro features.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="default"
            onClick={() => router.push('/upload')}
          >
            Start Forecasting
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <Card className="p-8 max-w-md w-full text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          </Card>
        </div>
      }
    >
      <BillingSuccessContent />
    </Suspense>
  );
}

