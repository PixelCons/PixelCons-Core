/* eslint-disable @typescript-eslint/no-var-requires */
const pixelconIds = require('./archive/pixelconIds.json');

module.exports = {
  async rewrites() {
    const rewrites = [];
    for (let id of pixelconIds) {
      //generate all /meta/data/[id] -> /archive/meta/[id]
      const metaArchive = `/archive/meta/${id}.json`;
      rewrites.push({source: `/meta/data/${id}`, destination: metaArchive});
      rewrites.push({source: `/meta/data/${id.substring(2)}`, destination: metaArchive});
      rewrites.push({source: `/meta/data/${id}.json`, destination: metaArchive});
      rewrites.push({source: `/meta/data/${id.substring(2)}.json`, destination: metaArchive});

      //generate all /meta/image/[id] -> /archive/image/[id]
      const imageArchive = `/archive/image/${id}.png`;
      rewrites.push({source: `/meta/image/${id}`, destination: imageArchive});
      rewrites.push({source: `/meta/image/${id.substring(2)}`, destination: imageArchive});
      rewrites.push({source: `/meta/image/${id}.png`, destination: imageArchive});
      rewrites.push({source: `/meta/image/${id.substring(2)}.png`, destination: imageArchive});
    }

    //dynamically generate metadata and imagedata with api
    rewrites.push({
      source: '/meta/:path*',
      destination: '/api/:path*',
    });

    //rewrite rpc with api
    rewrites.push({
      source: '/rpc',
      destination: '/api/rpc',
    });

    return rewrites;
  },
};
