/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Exclude the problematic modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@safe-global/safe-apps-sdk': false,
      '@wagmi/connectors/safe': false
    };

    config.resolve.fallback = { 
      fs: false,
      net: false,
      tls: false,
      encoding: false,
      path: false,
      os: false
    };
    
    // Add additional configuration for RainbowKit and wagmi
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    return config;
  },
  transpilePackages: [
    '@rainbow-me',
    '@wagmi',
    'wagmi',
    'viem',
    '@coinbase',
    '@walletconnect',
    '@metamask',
    'abitype'
  ],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

module.exports = nextConfig;
