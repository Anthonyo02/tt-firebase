// next.config.js

/** @type {import('next').NextConfig} */
const isCapacitorBuild = process.env.BUILD_TARGET === 'capacitor';

const nextConfig = {
  reactStrictMode: true,
  
  // ✅ Export statique SEULEMENT pour Capacitor
  ...(isCapacitorBuild && {
    output: "export",
    trailingSlash: true,
  }),
  
  images: {
    // Unoptimized seulement pour Capacitor, sinon utiliser l'optimisation Vercel
    unoptimized: isCapacitorBuild,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;