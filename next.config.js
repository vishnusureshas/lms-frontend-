/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://backend-lms-production-bfca.up.railway.app/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
