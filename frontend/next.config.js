/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@supabase/ssr'],
  async rewrites() {
    // Get API URL and ensure it has a protocol
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // If URL doesn't start with http:// or https://, add https://
    if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = `https://${apiUrl}`;
    }
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

