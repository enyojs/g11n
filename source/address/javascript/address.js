/*$
@name address.js
@fileOverview address parsing routines

Copyright 2010 HP, Inc.  All rights reserved.
 */

/*globals  G11n RegExp enyo */

//* @public
/**
    Creates a new Address instance and parses a physical address, returning a
    JavaScript object containing the extracted address data in its properties.

    * address (String): Free-form address to parse, or a JavaScript object
        containing the fields

    * params (Object): Parameters controlling the behavior of the parser

        The _params_ object's _locale_ property specifies the locale to use when
        parsing the address. If no value is specified, the current locale is
        used.

    The returned JavaScript object may contain the following properties:

    * streetAddress: The street address, including house number

    * locality: The locality of the address (usually a city or town) 

    * region: The region where the locality is located. In the U.S., this
        corresponds to the state.

    * postalCode: The country-specific code for expediting mail. In the U.S.,
        this is the zip code.

    * country: The country of the address 

    For any individual property, if the address does not contain that property,
    it is left out of the returned object.

    When an address cannot be parsed properly, the entire address is placed into
    the _streetAddress_ property.
*/
enyo.g11n.Address = function (freeformAddress, params) {
	var addressInfo,
		address,
		i, 
		countryName,
		translated,
		countries,
		localizedCountries,
		start, 
		locale,
		localeRegion,
		fieldNumber,
		match,
		fields,
		field,
		latinChars = 0,
		asianChars = 0,
		startAt,
		infoFields,
		pattern,
		matchFunction;
	
	if (!freeformAddress) {
		return undefined;
	}
	
	if (!params || !params.locale) {
		this.locale = enyo.g11n.formatLocale(); // can't do anything unless we know the locale
	} else if (typeof(params.locale) === 'string') {
		this.locale = new enyo.g11n.Locale(params.locale);
	} else {
		this.locale = params.locale;
	}
	
	// initialize from an already parsed object
	if (typeof(freeformAddress) === 'object') {
		this.streetAddress = freeformAddress.streetAddress;
		this.locality = freeformAddress.locality;
		this.region = freeformAddress.region;
		this.postalCode = freeformAddress.postalCode;
		this.country = freeformAddress.country;
		if (freeformAddress.countryCode) {
			this.countryCode = freeformAddress.countryCode;
		}
		if (freeformAddress.format) {
			this.format = freeformAddress.format;
		}
		return this;
	}

	locale = this.locale;
	
	countries = enyo.g11n.Utils.getNonLocaleFile({
		root: enyo.g11n.Utils._getEnyoRoot(),
		path: "address/data/name2reg.json"
	});
	
	//enyo.log("Loading in resources for locale " + locale.toString());
	localizedCountries = new enyo.g11n.Resources({
		locale: locale,
		root: enyo.g11n.Utils._getEnyoRoot() + "/address"
	});
	
	localeRegion = new enyo.g11n.Locale("_" + locale.region);
	addressInfo = enyo.g11n.Utils.getJsonFile({
		root: enyo.g11n.Utils._getEnyoRoot(),
		path: "address/data",
		locale: localeRegion
	});

	// enyo.log("Loading in locale " + locale.toString() + " and addressInfo is " + addressInfo);
	
	// clean it up first
	address = freeformAddress.replace(/[ \t\r]+/g, " ").trim();
	address = address.replace(/[\s\n]+$/, "");
	address = address.replace(/^[\s\n]+/, "");
	//enyo.log("\n\n-------------\nAddress is '" + address + "'");
	
	// for locales that support both latin and asian character addresses, 
	// decide if we are parsing an asian or latin script address
	if (addressInfo && addressInfo.multiformat) {
		for (i = 0; i < address.length; i++) {
			if (enyo.g11n.Char.isIdeo(address.charAt(i))) {
				asianChars++;
			} else if (enyo.g11n.Char.isLetter(address.charAt(i))) {
				latinChars++;
			}
		}
		
		this.format = (asianChars >= latinChars) ? "asian" : "latin";
		startAt = addressInfo.startAt[this.format];
		// enyo.log("multiformat locale: format is now " + this.format);
	} else {
		startAt = (addressInfo && addressInfo.startAt) || "end";
	}
	this.compare = (startAt === "end") ? this.endsWith : this.startsWith;
	
	// first break the free form string down into possible fields. These may
	// or may not be fields, but if there is a field separator char there, it
	// will probably help us
	for (countryName in countries) {
		if (countryName) {
			translated = localizedCountries.$L(countryName);
			start = this.compare(address, translated);
			if (start === -1) {
				start = this.compare(address, countryName);
			}
			if (start !== -1) {
				this.country = address.substring(start, start+translated.length);
				this.countryCode = countries[countryName];
				// enyo.log("Found country " + this.country + ", code " + this.countryCode);
				address = address.substring(0,start) + address.substring(start+translated.length);
				address = address.trim();
				if (this.countryCode !== locale.region) {
					locale = new enyo.g11n.Locale("_" + this.countryCode);
					// enyo.log("Address: found country name " + this.country + ". Switching to locale " + this.countryCode + " to parse the rest of the address:" + address);
	
					addressInfo = enyo.g11n.Utils.getJsonFile({
						root: enyo.g11n.Utils._getEnyoRoot(),
						path: "address/data",
						locale: locale
					});
					//enyo.log("Loading in locale " + locale.toString() + " and addressInfo is " + addressInfo);
					
					if (addressInfo && addressInfo.multiformat) {
						for (i = 0; i < address.length; i++) {
							if (enyo.g11n.Char.isIdeo(address.charAt(i))) {
								asianChars++;
							} else if (enyo.g11n.Char.isLetter(address.charAt(i))) {
								latinChars++;
							}
						}
						
						this.format = (asianChars >= latinChars) ? "asian" : "latin";
						//enyo.log("multiformat locale: format is now " + this.format);
					}
				//} else {
					//enyo.log("Same locale. Continuing parsing in " + this.countryCode);
				}
				break;
			}
		}
	}
	
	if (!this.countryCode) {
		this.countryCode = this.locale.region;
	}

	if (!addressInfo) {
		addressInfo = enyo.g11n.Utils.getJsonFile({
			root: enyo.g11n.Utils._getEnyoRoot(),
			path: "address/data",
			locale: new enyo.g11n.Locale("unknown_unknown")
		});
		
		//enyo.log("Loading in locale unknown and addressInfo is " + addressInfo);
	}
	
	fields = address.split(/[,，\n]/img);
	//enyo.log("fields is: " + JSON.stringify(fields));
	
	if (addressInfo.multiformat) {
		startAt = addressInfo.startAt[this.format];
		infoFields = addressInfo.fields[this.format];
	} else {
		startAt = addressInfo.startAt;
		infoFields = addressInfo.fields;
	}
	this.compare = (startAt === "end") ? this.endsWith : this.startsWith;
	
	for (i = 0; i < infoFields.length && fields.length > 0; i++) {
		field = infoFields[i];
		this.removeEmptyLines(fields);
		//enyo.log("Searching for field " + field.name);
		if (field.pattern) {
			if (typeof(field.pattern) === 'string') {
				pattern = new RegExp(field.pattern, "img");
				matchFunction = this.matchRegExp;
			} else {
				pattern = field.pattern;
				matchFunction = this.matchPattern;
			}
				
			switch (field.line) {
			case 'startAtFirst':
				for (fieldNumber = 0; fieldNumber < fields.length; fieldNumber++) {
					match = matchFunction(this, fields[fieldNumber], pattern, field.matchGroup, startAt);
					if (match) {
						break;
					}
				}
				break;
			case 'startAtLast':
				for (fieldNumber = fields.length-1; fieldNumber >= 0; fieldNumber--) {
					match = matchFunction(this, fields[fieldNumber], pattern, field.matchGroup, startAt);
					if (match) {
						break;
					}
				}
				break;
			case 'first':
				fieldNumber = 0;
				match = matchFunction(this, fields[fieldNumber], pattern, field.matchGroup, startAt);
				break;
			case 'last':
			default:
				fieldNumber = fields.length - 1;
				match = matchFunction(this, fields[fieldNumber], pattern, field.matchGroup, startAt);
				break;
			}
			if (match) {
				// enyo.log("found match for " + field.name + ": " + JSON.stringify(match));
				// enyo.log("remaining line is " + match.line);
				fields[fieldNumber] = match.line;
				this[field.name] = match.match;
			}
		} else {
			// if nothing is given, default to taking the whole field
			this[field.name] = fields.splice(fieldNumber,1)[0].trim();
			//enyo.log("typeof(this[fieldName]) is " + typeof(this[fieldName]) + " and value is " + JSON.stringify(this[fieldName]));
		}
	}
		
	// all the left overs go in the street address field
	this.removeEmptyLines(fields);
	if (fields.length > 0) {
		//enyo.log("fields is " + JSON.stringify(fields) + " and splicing to get streetAddress");
		var joinString = (this.format && this.format === "asian") ? "" : ", ";
		this.streetAddress = fields.join(joinString).trim();
	}
	
	//enyo.log("final result is " + JSON.stringify(this));
};

//* @protected
enyo.g11n.Address.prototype = {
	endsWith: function (subject, query) {
		var start = subject.length-query.length,
			i,
			pat;
		//enyo.log("endsWith: checking " + query + " against " + subject);
		for (i = 0; i < query.length; i++) {
			if (subject.charAt(start+i).toLowerCase() !== query.charAt(i).toLowerCase()) {
				return -1;
			}
		}
		if (start > 0) {
			pat = /\s/;
			if (!pat.test(subject.charAt(start-1))) {
				// make sure if we are not at the beginning of the string, that the match is 
				// not the end of some other word
				return -1;
			}
		}
		return start;
	},
	
	startsWith: function (subject, query) {
		var i;
		// enyo.log("startsWith: checking " + query + " against " + subject);
		for (i = 0; i < query.length; i++) {
			if (subject.charAt(i).toLowerCase() !== query.charAt(i).toLowerCase()) {
				return -1;
			}
		}
		return 0;
	},
	
	removeEmptyLines: function (arr) {
		var i = 0;
		
		while (i < arr.length) {
			if (!arr[i] || arr[i].length === 0) {
				arr.splice(i,1);
			} else {
				arr[i] = arr[i].trim();
				i++;
			}
		}
	},
	
	matchRegExp: function(address, line, expression, matchGroup, startAt) {
		var start,
			lastMatch,
			match,
			j,
			ret = {},
			last;
		
		//enyo.log("searching for regexp " + expression.source + " in line " + line);
		
		match = expression.exec(line);
		if (startAt === 'end') {
			while (match !== null && match.length > 0) {
				//enyo.log("found matches " + JSON.stringify(match));
				lastMatch = match;
				match = expression.exec();
			}
			match = lastMatch;
		}
		
		if (match && match !== null) {
			//enyo.log("found matches " + JSON.stringify(match));
			matchGroup = matchGroup || 0;
			if (match[matchGroup] !== undefined) {
				ret.match = match[matchGroup].trim();
				last = (startAt === 'end') ? line.lastIndexOf(match[matchGroup]) : enyo.indexOf(match[matchGroup], line); 				
				// enyo.log("last is " + last);
				ret.line = line.slice(0,last);
				if (address.format !== "asian") {
					ret.line += " ";
				}
				ret.line += line.slice(last+match[matchGroup].length);
				ret.line = ret.line.trim();
				//enyo.log("found match " + ret.match + " from matchgroup " + matchGroup + " and rest of line is " + ret.line);
				return ret;
			}
		//} else {
			//enyo.log("no match");
		}
		
		return undefined;
	},
	
	matchPattern: function(address, line, pattern, matchGroup) {
		var regexp,
			start,
			match,
			j,
			ret = {},
			last;
		
		//enyo.log("searching in line " + line);
		
		// search an array of possible fixed strings
		//enyo.log("Using fixed set of strings.");
		for (j = 0; j < pattern.length; j++) {
			start = address.compare(line, pattern[j]); 
			if (start !== -1) {
				ret.match = line.substring(start, start+pattern[j].length);
				ret.line = line.substring(0,start).trim();
				//enyo.log("found match " + ret.match + " and rest of line is " + ret.line);
				return ret;
			}
		}
		
		return undefined;
	}
};