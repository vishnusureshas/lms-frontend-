/** @type {import('next').NextConfig} */
const API_TARGET = process.env.API_TARGET || 'https://backend-lms-production-bfca.up.railway.app';

const nextConfig = {
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_TARGET}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
