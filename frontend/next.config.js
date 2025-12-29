/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@supabase/ssr'],
  // Removed rewrites - API client calls backend directly
  // This prevents URL conflicts and ensures direct backend communication
};

module.exports = nextConfig;

