import {NextApiRequest, NextApiResponse} from 'next';
import {ethers} from 'ethers';
import deployments from '../../../archive/contracts/deployments.json' assert {type: 'json'};
import buildConfig from '../../build.config';

//Data constants
const pixelconsAddress = buildConfig.OVERRIDE_PIXELCONS_CONTRACT_ADDRESS || deployments.mainnet.contracts[0].address;
const cacheOther = buildConfig.API_CACHE_RPC_OTHER || 1 * 60 * 60;
const cacheCall = buildConfig.API_CACHE_RPC_CALL || 1 * 60;
const ensCall = buildConfig.API_CACHE_RPC_CALL || 4 * 60 * 60;
const cacheErrorServer = buildConfig.API_CACHE_ERROR_SERVER || 1 * 60;
const cacheErrorInvalid = buildConfig.API_CACHE_ERROR_INVALID || 12 * 60 * 60;
const fullyAllowedMethods = ['eth_chainId'];
const ensFunctions = ['resolver(bytes32)', 'name(bytes32)', 'supportsInterface(bytes4)', 'addr(bytes32)'].map((f) =>
  ethers.keccak256(ethers.toUtf8Bytes(f)).substring(0, 10),
);

//Error code constants
const analysisInvalid = 'invalid';
const analysisContractCall = 'contractCall';
const analysisENSCall = 'ensCall';
const analysisOtherCall = 'otherCall';

//API endpoint that forwards a limited set of RPC calls to a secret provider
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const analysis = validateRPC(req.body);
  if (!isSupported()) {
    //not supported
    res.setHeader('Cache-Control', `public, max-age=${cacheErrorInvalid}, s-maxage=${cacheErrorInvalid}`);
    res.status(405).end();
  } else if (req.method !== 'POST' || analysis === analysisInvalid) {
    //invalid
    res.setHeader('Cache-Control', `public, max-age=${cacheErrorInvalid}, s-maxage=${cacheErrorInvalid}`);
    res.status(400).end();
  } else {
    const result = await handleRPC(req.body);
    if (!result) {
      //internal error
      res.setHeader('Cache-Control', `public, max-age=${cacheErrorServer}, s-maxage=${cacheErrorServer}`);
      res.status(500).end();
    } else {
      //success
      if (analysis === analysisContractCall) {
        res.setHeader('Cache-Control', `public, max-age=${cacheCall}, s-maxage=${cacheCall}`);
      } else if (analysis === analysisENSCall) {
        res.setHeader('Cache-Control', `public, max-age=${ensCall}, s-maxage=${ensCall}`);
      } else {
        res.setHeader('Cache-Control', `public, max-age=${cacheOther}, s-maxage=${cacheOther}`);
      }
      res.status(200).json(result);
    }
  }
}

//Helper function that validates the rpc with either analysisInvalid, analysisContractCall or analysisOtherCall
//eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateRPC(rpc: any): string {
  const rpcs = Array.isArray(rpc) ? rpc : [rpc];
  for (const rpc of rpcs) {
    if (rpc.jsonrpc !== '2.0') return analysisInvalid;
    if (rpc.method === 'eth_call') {
      //only allow eth_call to the pixelcon contract
      const callTo = rpc.params && rpc.params[0] && rpc.params[0].to ? '' + rpc.params[0].to : null;
      if (callTo.toLowerCase() != pixelconsAddress) {
        //check if this is one of the allowed ens functions
        const functionSelector = rpc.params[0].data.substring(0, 10);
        if (ensFunctions.indexOf(functionSelector) === -1) {
          console.log(`RPC API: Unallowed call to [${callTo}]`);
          return analysisInvalid;
        }
        return analysisENSCall;
      }
      return analysisContractCall;
    } else if (fullyAllowedMethods.indexOf(rpc.method) === -1) {
      console.log(`RPC API: Unallowed method [${rpc.method}]`);
      return analysisInvalid;
    } else {
      return analysisOtherCall;
    }
  }
  return analysisInvalid;
}

//Helper function to forward the rpc to a known provider
//eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRPC(rpc: any): Promise<string> {
  try {
    //try to use environment configured rpc first
    const jsonRpc = buildConfig.OVERRIDE_JSON_RPC || process.env.JSON_RPC;
    if (jsonRpc) {
      const response = await fetch(jsonRpc, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rpc),
      });
      return await response.json();
    }
  } catch (e) {
    //do nothing
  }
  return null;
}

//Helper function to quickly determine if rpc forwarding is supported
function isSupported(): boolean {
  try {
    const jsonRpc = buildConfig.OVERRIDE_JSON_RPC || process.env.JSON_RPC;
    if (buildConfig.EXPOSE_RPC && jsonRpc) return true;
  } catch (e) {
    //do nothing
  }
  return false;
}
