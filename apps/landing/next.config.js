/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@ai-agent-platform/ui': require.resolve('../../packages/ui/src/index.ts'),
    }
    return config
  },
}

module.exports = nextConfig
