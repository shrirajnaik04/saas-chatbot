/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Avoid WasmHash issues on unsupported Node versions by using xxhash64
    if (!config.output) config.output = {}
    config.output.hashFunction = 'xxhash64'
    return config
  },
}

export default nextConfig
