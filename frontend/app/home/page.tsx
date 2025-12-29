import { Suspense } from 'react';
import HomePage from '@/intfrontend/pages/Home';
import HomePageWithLogin from '@/intfrontend/pages/HomeWithLogin';

export const dynamic = 'force-dynamic';

export default function Home({
  searchParams,
}: {
  searchParams?: { login?: string; redirect?: string };
}) {
  // If login query param is present, show home page with login form
  if (searchParams?.login === 'true') {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <HomePageWithLogin />
      </Suspense>
    );
  }

  // Otherwise, show the public home page
  return <HomePage />;
}
