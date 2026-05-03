/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // systeminformation has optional macOS-only native deps — ignore on Windows/Linux
      config.externals.push('osx-temperature-sensor', 'macos-temperature-sensor')
    } else {
      // Never bundle systeminformation on the client
      config.externals = config.externals || []
      config.externals.push('systeminformation')
    }
    return config
  },
  experimental: {
    instrumentationHook: true,
  },
}

export default nextConfig
