/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  serverExternalPackages: [
    'systeminformation',
    'osx-temperature-sensor',
    'macos-temperature-sensor',
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('osx-temperature-sensor', 'macos-temperature-sensor')
    } else {
      config.externals = config.externals || []
      config.externals.push('systeminformation')
    }
    return config
  },
}

export default nextConfig
