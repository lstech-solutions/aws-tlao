/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/aws',
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true,
  },
}

module.exports = nextConfig