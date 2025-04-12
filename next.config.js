/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'localhost',
      'binwahab.vercel.app',
      'koupyrvfvczzkolwvwnc.supabase.co',
      'uploadthing.com',
      'utfs.io',
      'res.cloudinary.com',
      'images.unsplash.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig; 