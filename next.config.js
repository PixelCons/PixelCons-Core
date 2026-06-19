module.exports = {
  //set rewrites for meta data
  async rewrites() {
    return [
      {
        source: '/meta/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  experimental: {
    scrollRestoration: true,
  },
};
