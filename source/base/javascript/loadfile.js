/*$
 * @name loadfile.js
 * @fileOverview basic config file loading routines used by the whole g11n package.
 * 
 * 
 */

/*globals G11n  IMPORTS root document enyo*/

//* @protected
enyo.g11n.Utils = enyo.g11n.Utils || function() {};

enyo.g11n.Utils._fileCache = {};

/**
	Finds the root window
*/
enyo.g11n.Utils._getRootWindow = function() {
	var w = window.opener || window.rootWindow || window.top || window;
	if(!w.setTimeout) { // use this window as the root if we don't have access to the real root.
		w = window;
	}
	return w;
}

/**
	Return a string with the URL that is the root path of the application.
*/
enyo.g11n.Utils._fetchAppRootPath = function() {
	var r = enyo.g11n.Utils._getRootWindow();
	var doc = r.document;
	var match = doc.baseURI.match(new RegExp(".*:\/\/[^#]*\/"));
	if (match) {
		return match[0];
	}
}

enyo.g11n.Utils._setRoot = function _setRoot(path) {
	var rootPath = path;
	if (!path && enyo.g11n.isEnyoAvailable()){
		rootPath = enyo.g11n.Utils._fetchAppRootPath() + "assets"
	} else {
		rootPath = ".";
	}
	return enyo.g11n.root = rootPath;
};

enyo.g11n.Utils._getRoot = function _getRoot() {
	return enyo.g11n.root || enyo.g11n.Utils._setRoot();
};

enyo.g11n.Utils._getEnyoRoot = function _getEnyoRoot(prefix) {
	var prependPath = "";
	if (!enyo.g11n.isEnyoAvailable() && prefix){
		prependPath =  prefix;
	}
	return prependPath + enyo.path.paths.g11n + "/source";
};

/*
 * @private
 */
enyo.g11n.Utils._loadFile = function _loadFile(path) {
	var json, jsonString, platform = enyo.g11n.getPlatform();
	
	// enyo.log("Utils._loadFile: loading file from " + path);
	if (platform === 'node') {
		// enyo.log("Utils._loadFile: #2 in node.js service, loading json file via fs");
		// cache it ourselves
		try {
			if (!this.fs) {
				this.fs = IMPORTS.require("fs");
			}
			jsonString = this.fs.readFileSync(path, 'utf8');

			if (jsonString) {
				json = JSON.parse(jsonString);
			}
		} catch (e) {
			// remember that we could not load the file so that we don't spend a lot of
			// time in the future attempting to load the file. This is accomplished by
			// putting json as undefined into the cache for that path.
			// enyo.error(e);
			json = undefined;
		}
	} else {
		/* platform === 'browser' */
		try {
			json = JSON.parse(enyo.xhr.request({url: path, sync: true}).responseText);
		} catch (e3) {
		}
	}
	return json;
};

/**
getNonLocaleFile(params) - load a json file from disk and convert it to a javascript object
- params (Object): parameters controlling the loading of the file.

Return a javascript object that parsed json file. The object is kept around in the
cache until the
timeout period has elapsed, at which point it may be unloaded from memory when
a routine calls releaseAllJsonFiles, and the garbage collector runs.

Params can contain:

* root: absolute path to which the path section is relative
* path: relative path to the json file from the root, including the file name
* cache: if set to false, don't cache the resulting json. Default is true to cache the json.
*/
enyo.g11n.Utils.getNonLocaleFile = function getNonLocaleFile(params) {
	var json, rootPath, fullPath;
	if (!params || !params.path) {
		return undefined;
	}
	
	// enyo.log("getNonLocaleFile: requested " + params.path);
	// only add the root if this is not an absolute path
	if (params.path.charAt(0) !== '/') {
		rootPath = params.root || this._getRoot();
		fullPath = rootPath + "/" + params.path;
	} else {
		fullPath = params.path;
	}
	
	//enyo.log("root path: " + rootPath);
	//enyo.log("full path: " + fullPath);
	
	if (enyo.g11n.Utils._fileCache[fullPath] !== undefined) {
		// enyo.log("getNonLocaleFile: found in cache");
		json = enyo.g11n.Utils._fileCache[fullPath].json;
	} else {
		json = enyo.g11n.Utils._loadFile(fullPath);
		
		if (!(params.cache !== undefined && params.cache === false)) {
			// enyo.log("getNonLocaleFile: Storing in cache the path " + params.path);
			enyo.g11n.Utils._fileCache[fullPath] = {
				path: fullPath,
				json: json,
				locale: undefined,
				timestamp: new Date()
			};
			
			if (this.oldestStamp === undefined) {
				this.oldestStamp = enyo.g11n.Utils._fileCache[fullPath].timestamp;
			}
		} 
	}
	
	return json;
};

/**
getJsonFile(params) - load a json file from disk and convert it to a javascript object
- params (Object): parameters controlling the loading of the file.

Return a javascript object that parsed json file. The object is kept around until the
timeout period has elapsed, at which point it may be unloaded from memory when
a routine calls releaseAllJsonFiles, and the garbage collector runs.

Params can contain:

* root: root of the package, app, or library where the json files can be found. 
* path: path relative to the root underneath which the resources dir can be found
* locale: a locale instance that names which locale to load the json file for.
* prefix: an optional prefix for the file name. File names will be calculated as prefix + locale name + ".json"
* cache: if set to false, don't cache the resulting json. Default is true to cache the json.
* *merge: if set to true, will merge the variant, region and language json files according to rules defined in (define rules). Default is set to false.
* type: one of "language", "region", or "either". Default is "either". This loads files specific to the language name, the region name, or either one if they are available.

*/
enyo.g11n.Utils.getJsonFile = function getJsonFile(params) {
	var json, path, rootPath, prefix, lang, reg, reg2, variant, cachePath;
	// var start = new Date();
	
	if (!params || !params.path || !params.locale) {
		return undefined;
	}
	
	// enyo.log("getJsonFile: params is " + JSON.stringify(params) + " and default root is " + Utils._getRoot());
	
	rootPath = (params.path.charAt(0) !== '/') ? (params.root || this._getRoot()) : "";
	if (rootPath.slice(-1) !== '/') {
		rootPath += "/";
	}
	if (params.path) {
		prefix = params.path;
		if (prefix.slice(-1) !== '/') {
			prefix += "/";
		}
	} else {
		prefix = "";
	}
	prefix += params.prefix || "";
	rootPath += prefix;
	cachePath = rootPath + params.locale.toString() + ".json";
	
	if (enyo.g11n.Utils._fileCache[cachePath] !== undefined) {
		// enyo.log("getJsonFile: found in cache");
		json = enyo.g11n.Utils._fileCache[cachePath].json;
	} else {
		if (!params.merge) {
			path = rootPath + params.locale.toString() + ".json";
			json = this._loadFile(path);
			if (!json && params.type !== "region" && params.locale.language) {
				path = rootPath + params.locale.language + ".json";
				json = this._loadFile(path);
			}
			if (!json && params.type !== "language" && params.locale.region) {
				path = rootPath + params.locale.region + ".json";
				json = this._loadFile(path);
			}
			if (!json && params.type !== "language" && params.locale.region) {
				path = rootPath + "_" + params.locale.region + ".json";
				json = this._loadFile(path);
			}
		} else {
			if (params.locale.language) {
				path = rootPath + params.locale.language + ".json";
				lang = this._loadFile(path);
			}
			if (params.locale.region) {
				path = rootPath + params.locale.language + "_" + params.locale.region + ".json";
				reg = this._loadFile(path);
				if (params.locale.language !== params.locale.region){
					path = rootPath + params.locale.region + ".json";
					reg2 = this._loadFile(path);
				}
			}
			if (params.locale.variant) {
				path = rootPath + params.locale.language + "_" + params.locale.region + "_" + params.locale.variant + ".json";
				variant = this._loadFile(path);
			}
				
			json = this._merge([lang,reg2, reg, variant]);
		}
		
		if (!(params.cache !== undefined && params.cache === false)) {
			// enyo.log("getJsonFile: Caching " + cachePath);
			enyo.g11n.Utils._fileCache[cachePath] = {
				path: cachePath,
				json: json,
				locale: params.locale,
				timestamp: new Date()
			};

			if (this.oldestStamp === undefined) {
				this.oldestStamp = enyo.g11n.Utils._fileCache[cachePath].timestamp;
			}
		}
	}
	// var end = new Date();
	// enyo.log("getJsonFile: length " + (end.getTime() - start.getTime()));
	return json;
};

/**
Merge an array of string tables together into a single table where the strings from later tables
override strings with the same key from earlier tables.
*/
enyo.g11n.Utils._merge = function _merge(tables) {
	var i, len, mergedTable = {};
	for (i = 0, len = tables.length; i < len; i++) {
		mergedTable = enyo.mixin(mergedTable, tables[i]);
	}
	return mergedTable;
};

/**
releaseAllJsonFiles(timeout, all) - release json files from the cache
- timeout (Number) - only expire and purge files that are older than this number of 
milliseconds. If this parameter is not given, the default is 60000ms. (1 minute)
- all (Boolean) - if true, purges all files. If false or not defined, files that
belong to any of the current locales will be kept in memory, as they are most likely 
to be used again soon

Expires and purges all json files from the cache that are older than the timeout 
limit. cache guarantees that at least one
reference to the object will exist in memory for the length of the timeout period so that
the garbage collector will not collect it. If other code still
has a reference to an object loaded with getJsonFile, the object will stay around in 
memory until the reference to it is removed. 

The timeout parameter specifies the age in milliseconds above which object will be expired
and purged from the cache. 

Returns the number of items expired from the cache.
*/
enyo.g11n.Utils.releaseAllJsonFiles = function releaseAllJsonFiles(timeout, all) {
	var now = new Date(),
		expireList = [],
		// len,
		// start = new Date(),
		oldest,
		path,
		i,
		cacheItem;
	
	timeout = timeout || 60000;
	// enyo.log("Utils.releaseAllJsonFiles: sweep through and release everything except locale " + exceptLocale);
	
	if (this.oldestStamp !== undefined && (this.oldestStamp.getTime() + timeout) < now.getTime()) {
		// enyo.log("Utils.releaseAllJsonFiles: past oldest timeout check");
		
		oldest = now;
		for (path in enyo.g11n.Utils._fileCache) {
			if (path && enyo.g11n.Utils._fileCache[path]) {
				cacheItem = enyo.g11n.Utils._fileCache[path];
				// enyo.log("Utils.releaseAllJsonFiles: path is " + path + " and item is " + JSON.stringify(cacheItem));
				// enyo.log("Utils.releaseAllJsonFiles: testing " + cacheItem.path + " locale " + cacheItem.locale);
				if (!cacheItem.locale || all || 
						(!enyo.g11n.currentLocale().isMatch(cacheItem.locale) &&
						 !enyo.g11n.formatLocale().isMatch(cacheItem.locale) && 
						 !enyo.g11n.phoneLocale().isMatch(cacheItem.locale))) {
					// enyo.log("Utils.releaseAllJsonFiles: testing for timeout");
					// timeout is currently 60 seconds
					if ((cacheItem.timestamp.getTime() + timeout) < now.getTime()) {
						// enyo.log("Utils.releaseAllJsonFiles: #3 older than threshold, expiring file " + cacheItem.path);
						expireList.push(cacheItem.path);
					} else {
						if (cacheItem.timestamp.getTime() < oldest.getTime()) {
							oldest = cacheItem.timestamp;
						}
						// enyo.log("Utils.releaseAllJsonFiles: #4 not older than threshold, keeping file ");
					}
				} else {
					if (cacheItem.timestamp.getTime() < oldest.getTime()) {
						oldest = cacheItem.timestamp;
					}
				}
			}
		}

		// unset the oldest stamp if there were no entries left in the cache
		this.oldestStamp = (oldest.getTime() < now.getTime()) ? oldest : undefined;
		
		// enyo.log("Utils.releaseAllJsonFiles: oldestStamp is now " + this.oldestStamp + ". Expiring " + expireList.length + " files.");
		
		// do the actual expiration in a separate loop so that it doesn't screw up the iteration above
		for (i = 0; i < expireList.length; i++) {
			enyo.g11n.Utils._fileCache[expireList[i]] = undefined;
		}
	}
	
	return expireList.length;
	
	/*
	 
	var end = new Date();
	len = end.getTime() - start.getTime();
	//enyo.log("releaseAllJsonFiles: length " + len);
	
	if ( this.totalReleaseTime === undefined ) {
		this.totalReleaseTime = 0;
		this.totalReleaseAttempts = 0;
	}
	this.totalReleaseTime += len;
	this.totalReleaseAttempts++;
	
	//enyo.log("releaseAllJsonFiles: total: " + this.totalReleaseTime + " average: " + (this.totalReleaseTime/this.totalReleaseAttempts));
	*/
};

enyo.g11n.Utils._cacheSize = function _cacheSize() {
	var count = 0, k;
	for (k in enyo.g11n.Utils._fileCache) { if (enyo.g11n.Utils._fileCache[k]) { count++; }}
	return count;
};
