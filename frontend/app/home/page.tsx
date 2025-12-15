import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HomePage from '@/intfrontend/pages/Home';
import LoginForm from '@/components/auth/LoginForm';

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not authenticated, show login form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome to Forecastly
            </h1>
            <p className="text-lg text-gray-600">
              Sign in to start forecasting your time-series data
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  // If authenticated, show the home page
  return <HomePage />;
}
