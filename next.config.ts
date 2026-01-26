/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // important pour Capacitor
  reactStrictMode: true,
  images: {
    unoptimized: true, // 👈 OBLIGATOIRE
  },
};

module.exports = nextConfig;
