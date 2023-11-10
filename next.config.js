module.exports = {
  //set rewrites for meta data and the rpc service
  async rewrites() {
    return [
      {
        source: '/meta/:path*',
        destination: '/api/:path*',
      },
      {
        source: '/rpc',
        destination: '/api/rpc',
      },
    ];
  },
  experimental: {
    scrollRestoration: true,
  },
};
