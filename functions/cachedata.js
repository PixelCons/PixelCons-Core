/***********************************************************************
 * cachedata.js
 * Provides functions for caching data sets
 ***********************************************************************/

// Settings
const maxEntrySize = 10000;

// Data
var data_cache = {};

// Gets pixelcon details
async function cacheData(key, fetchPromise, lifetime) {
	if(lifetime > 0) {
		let data = cacheFetch(key);
		if(data) return data;
		data = await fetchPromise();
		data = cacheAdd(key, data, lifetime);
		return data;
	}
	return await fetchPromise();
}

// Utils
function cacheFetch(key) {
	let currTime = (new Date()).getTime();
	let cacheEntry = data_cache[key];
	if(cacheEntry !== undefined) {
		if(cacheEntry.expireTime > currTime) return JSON.parse(JSON.stringify(cacheEntry.data));
		cacheRemove(key);
	}
	return null;
}
function cacheAdd(key, data, lifetime) {
	cacheClean(true);
	data_cache[key] = {
		data: data,
		expireTime: (new Date()).getTime() + (lifetime*1000)
	}
	return JSON.parse(JSON.stringify(data));
}
function cacheRemove(key) {
	delete data_cache[key];
}
function cacheClean(forceRoom) {
	let currTime = (new Date()).getTime();
	let soonestExpireKey = null;
	let soonestExpireTime = null;
	let toRemove = [];
	let count = 0;
	for(let ckey in data_cache) {
		count++;
		if(data_cache[ckey].expireTime < currTime) {
			toRemove.push(ckey);
		} else {
			if(soonestExpireTime == null || soonestExpireTime > data_cache[ckey].expireTime) {
				soonestExpireKey = ckey;
				soonestExpireTime = data_cache[ckey].expireTime
			}
		}
	}
	
	for(let i=0; i<toRemove.length; i++) cacheRemove(toRemove[i]);
	if(forceRoom && count >= maxEntrySize) cacheRemove(soonestExpireKey);
}

// Export
module.exports = {
    cacheData: cacheData
}
