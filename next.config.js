/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      { hostname: 'i.ytimg.com' },
      { hostname: 'i3.ytimg.com' },
      { hostname: '*.supabaseusercontent.com' },
      { hostname: 'lh3.googleusercontent.com' },
    ],
    unoptimized: false,
  },
  env: {},
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
};

module.exports = nextConfig;
