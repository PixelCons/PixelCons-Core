module.exports = {
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
};
