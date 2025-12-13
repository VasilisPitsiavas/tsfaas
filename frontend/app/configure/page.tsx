import { Suspense } from 'react';
import Configure from '@/intfrontend/pages/Configure';

export const dynamic = 'force-dynamic';

export default function ConfigurePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <Configure />
    </Suspense>
  );
}
