export default {
  //Flag to indicate if the envirnment specified JSON_RPC should be wrapped and exposed
  //as a frontend fallback if the user has no other providers available.
  EXPOSE_RPC: true,

  //The web domain to use in all links to metadata, images, and website links
  WEB_DOMAIN: 'https://pixelcons.io',

  //Data fetching restrictions to prevent overwhelming the JSON RPC provider
  DATA_FETCHING_MAX_PARALLEL_QUERY: 5,
  DATA_FETCHING_MAX_PIXELCON_IDS: 200,

  //Meta data generation related info
  METADATA_GENESIS_YEAR: '2018',
  METADATA_GENESIS_COUNT: 651,

  //API service call caching values (in seconds)
  API_CACHE_RPC_CALL: 60,
  API_CACHE_RPC_OTHER: 3600,
  API_CACHE_METADATA: 3600,
  API_CACHE_IMAGE: 604800,
  API_CACHE_ERROR_SERVER: 60,
  API_CACHE_ERROR_UNKNOWN: 300,
  API_CACHE_ERROR_INVALID: 43200,

  //Override values for testing on other chains (leave as null to point to mainnet)
  //Note: setting a value for OVERRIDE_JSON_RPC should not be used for production as it will be publicly visible
  //(use the JSON_RPC environment variable for production)
  OVERRIDE_JSON_RPC: null,
  OVERRIDE_CHAIN_ID: null,
  OVERRIDE_PIXELCONS_CONTRACT_ADDRESS: null,
};
