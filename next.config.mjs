/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5001/api/:path*',
      },
    ];
  },
  // Ensure we can use framer-motion and other client-side libs
  reactStrictMode: true,
};

export default nextConfig;
