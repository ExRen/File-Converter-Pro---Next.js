/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Webpack configuration to handle canvas for pdfjs-dist
  webpack: (config, { isServer }) => {
    // Externalize canvas module (not available in browser/serverless)
    config.externals = config.externals || [];
    config.externals.push({
      canvas: 'canvas',
    });
    
    // Ignore canvas in client-side bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      };
    }
    
    return config;
  },
}

module.exports = nextConfig
