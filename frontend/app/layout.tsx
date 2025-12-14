import type { Metadata } from 'next';
import './globals.css';
import Layout from '@/intfrontend/Layout';

export const metadata: Metadata = {
  title: 'Forecastly - Time Series Forecasting as a Service',
  description: 'Upload your time-series data and get professional forecasts in minutes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}
