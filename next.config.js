/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Webpack configuration to handle canvas and node modules
  webpack: (config, { isServer }) => {
    // Externalize canvas module (not available in browser/serverless)
    config.externals = config.externals || [];
    config.externals.push({
      canvas: 'canvas',
    });
    
    // Ignore Node.js modules in client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig

