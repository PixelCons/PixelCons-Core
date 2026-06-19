const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  sassOptions: {
    includePaths: [process.cwd()],
  },
  async rewrites() {
    return [
      {
        source: '/meta/data/:id([^/.]+)',
        destination: '/meta/data/:id.json',
      },
      {
        source: '/meta/image/:id([^/.]+)',
        destination: '/meta/image/:id.png',
      },
    ];
  },
  experimental: {
    scrollRestoration: true,
  },
};

export default nextConfig;
