import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Forecastly</h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Time Series Forecasting as a Service
      </p>
      <Link
        href="/upload"
        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        Get Started
      </Link>
    </main>
  );
}

