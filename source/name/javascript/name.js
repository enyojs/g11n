/*$
 * @name name.js
 * @fileOverview This file has the implementation of the Name object
 * 
 */

/*globals  G11n */

//* @protected
enyo.g11n.NamePriv = {
	/*$ private 
	    Returns an array of the auxiliary words found at the beginning of the
	    name string.
	 */
	_findPrefix: function _findPrefix(parts, hash, isAsian) {
		var prefix, prefixLower, prefixArray, aux = [], i;
		
		if (parts.length > 0 && hash) {
			//enyo.log("_findPrefix: finding prefixes");
			for ( i = parts.length; i > 0; i-- ) {
				prefixArray = parts.slice(0, i);
				prefix = prefixArray.join(isAsian ? '' : ' ');
				prefixLower = prefix.toLowerCase();
				prefixLower = prefixLower.replace(/[,\.]/g, '');  // ignore commas and periods
				
				//enyo.log("_findPrefix: checking prefix: '" + prefixLower + "'");
				
				if ( prefixLower in hash ) {
					aux = aux.concat(isAsian ? prefix : prefixArray);
					parts = parts.slice(i);
					i = parts.length + 1;
					//enyo.log("_findPrefix: Found prefix '" + prefix + "' New parts list is " + JSON.stringify(parts));
				}
			}
		}
	
		return aux;
	},

	/*$ private
	 * Returns true if any Latin letters are found in the string. Returns false
	 * if all the characters are non-Latin.
	 */
	_isEuroName: function _isEuroName(name) {
		var c, i;
		
		for (i = 0; i < name.length; i++) {
			c = name.charAt(i);
			
			if (!enyo.g11n.Char.isIdeo(c) && 
				 !enyo.g11n.Char.isPunct(c) &&
				 !enyo.g11n.Char.isSpace(c)) {
				return true;
			}
		}
		
		return false;
	},
	
	/*$ private
	 * find the last instance of 'and' in the name
	 * @param {Array} parts
	 * @returns {integer}
	 */
	_findLastConjunction: function _findLastConjunction(parts, locale) {
		var conjunctionIndex = -1, index, part, rb;
		
		rb = new enyo.g11n.Resources({
			locale: locale,
			root: enyo.g11n.Utils._getEnyoRoot() + "/name",
		});
		
		for (index = 0; index < parts.length; index++) {
			part = parts[index];
			if (typeof(part) === 'string') { 
				if ("and" === part.toLowerCase() || "or" === part.toLowerCase() || "&" === part || "+" === part) {
					conjunctionIndex = index;
				}
				if ((rb.$L({key: "and1", value: "and"}).toLowerCase() === part.toLowerCase()) || 
					(rb.$L({key: "and2", value: "and"}).toLowerCase() === part.toLowerCase()) || 
					(rb.$L({key: "or1", value: "or"}).toLowerCase() === part.toLowerCase()) || 
					(rb.$L({key: "or2", value: "or"}).toLowerCase() === part.toLowerCase()) || 
					("&" === part) || 
					("+" === part)) {
					conjunctionIndex = index;
					//enyo.log("_findLastConjunction: found conjunction " + parts[index] + " at index " + index);
				}
			}
		}
		return conjunctionIndex;
	},
	
	_joinArrayOrString: function _joinArrayOrString(part) {
		var i;
		if (typeof(part) === 'object') {
			for (i = 0; i < part.length; i++) {
				part[i] = enyo.g11n.NamePriv._joinArrayOrString(part[i]);
			}
			return part.join(' ');
		}
		return part;
	},
	
	_shallowCopy: function _shallowCopy(from, to) {
		var prop;
		for ( prop in from ) {
			if ( prop !== undefined && from[prop] ) {
				to[prop] = from[prop];
			}
		}
	}
};

//* @public
/**
    Parses a personal name written in a free-form string. Returns a JavaScript
    object with extracted name data in its properties.

    * name (String): Name of a person to parse

    * params (Object): Parameters controlling the parsing of the name
 
    The returned object may contain the following properties:

    * prefix: Any titles, such as "President" or "Dr.", or honorifics, such as
        "Don" in Spanish or "Mister" in English, that precede the name.
    * givenName: The given name(s) of the person, which is often unique to that
        person within a family or group.
    * familyName: The family name(s) of a person, which is shared with other
        family members
    * middleName: Auxiliary given name(s)
    * suffix: Any suffixes that are attached to a name, such as "Jr." or "M.D."
        in English, or honorifics like "-san" in Japanese. 

    Some properties (e.g., "middleName") may contain multiple names.  The value
    of a property with multiple names will be returned as a single string with
    the original punctuation preserved. For example, if the name is "John Jacob
    Jingleheimer Schmidt", there are two middle names and they will be returned
    as the string: "Jacob Jingleheimer".

    Suffixes may be optionally appended to names using a comma. If commas appear
    in the original name, they will be preserved in the output of the suffix
    property so that they can be reassembled again later by NameFmt.format().

    For any titles or honorifics that are considered as whole, the name is
    returned as a single string. For example, if the name to parse is "The Right
    Honourable James Clawitter", the honorific would be returned as a prefix
    with the whole string "The Right Honourable".

    When a compound name is found in the name string, the conjunction is placed
    in the givenName property. For example, "John and Mary Smith" gets parsed
    into the following output:

        {
            givenName: "John and Mary",
            familyName: "Smith"
        }

    This can be considered to be two names: "John Smith and Mary Smith".
    Without the compound name rule, the words "and Mary" would be considered
    middle names of the person "John Smith".

    There are a few special cases in which a name will be parsed differently
    from what the rules of the given locale would imply. If the name is composed
    entirely of Asian characters, it is parsed as an Asian name, even in
    non-Asian locales. If the locale is an Asian locale, and the name is 
    composed entirely of Latin alphabet characters, the name is parsed as a 
    generic Western name (using US/English rules). This way, Asian and western
    names can be mixed in the same list, and they will all be parsed reasonably
    correctly.

    When a name cannot be parsed properly, the entire name will be placed
    into the givenName property.
*/
enyo.g11n.Name = function(name, params) {
	var locale, langInfo, nameInfo, langInfoEn, parts = [], 
		i, prefixArray, prefix, prefixLower,
		suffixArray, suffix, suffixLower, 
		asianName, hpSuffix, conjunctionIndex;
	
	if (!name || name === "") {
		return this;
	} 
	
	if (!params || !params.locale) {
		locale = enyo.g11n.currentLocale();
	} else if (typeof(params.locale) === 'string') {
		locale = new enyo.g11n.Locale(params.locale);
	} else {
		locale = params.locale;
	}
	
	this.locale = locale;	// save for later
	
	// enyo.log("new Name: locale was determined to be " + locale.toString());
	// construct a name object out of a json object that contains 
	// the parts already broken down
	if (typeof(name) === 'object') {
		this.prefix = name.prefix;
		this.givenName = name.givenName;
		this.middleName = name.middleName;
		this.familyName = name.familyName;
		this.suffix = name.suffix;
		return this;
	}
	
	// else the name is a string that needs to be parsed. 
	// First break the name into parts, and extract all the parts
	// that are not really part of the name
	
	langInfoEn = enyo.g11n.Utils.getJsonFile({
		root: enyo.g11n.Utils._getEnyoRoot(),
		path: "name/data",
		locale: new enyo.g11n.Locale("en")
	});
	
	langInfo = enyo.g11n.Utils.getJsonFile({
		root: enyo.g11n.Utils._getEnyoRoot(),
		path: "name/data",
		locale: locale
	});

	// enyo.log("parsePersonalName: parsing name '" + name + "'");
	
	// for DFISH-12905, pick off the part that the LDAP server automatically adds to our names in HP emails
	i = name.search(/\s*[,\(\[\{<]/);
	if (i !== -1) {
		hpSuffix = name.substring(i);
		hpSuffix = hpSuffix.replace(/\s+/g, ' ');	// compress multiple whitespaces
		suffixArray = hpSuffix.split(" ");
		conjunctionIndex = enyo.g11n.NamePriv._findLastConjunction(suffixArray, locale);
		if (conjunctionIndex > -1) {
			// it's got conjunctions in it, so this is not really a suffix
			hpSuffix = undefined;
		} else {
			name = name.substring(0,i);
		}
	}
	
	if ( !langInfo || !langInfo.name || (langInfo.name.isAsianLocale && enyo.g11n.NamePriv._isEuroName(name))) {
		// default to English if there is no info on the particular language, or if
		// we are parsing a euro name in an asian locale
		langInfo = langInfoEn;
	}
	
	nameInfo = langInfo.name;

	if (!nameInfo.isAsianLocale || enyo.g11n.NamePriv._isEuroName(name)) {
		name = name.replace(/\s+/g, ' ');	// compress multiple whitespaces
		parts = name.trim().split(' ');
		asianName = false;
	} else {
		// all-asian names
		name = name.replace(/\s+/g, '');	// eliminate all whitespaces
		parts = name.trim().split('');
		asianName = true;
	}
	
	// next, we are left with only name parts. Parse these
	// according to the locale. Search for the various lengths of
	// prefix in the name in the various tables. The tables are 
	// much longer than the name prefixes, so there are less 
	// iterations if we do it this way.
	
	//enyo.log("parsePersonalName: parsing name '" + name + "'");
	
	// check for prefixes
	if (parts.length > 1) {
		//enyo.log("parsePersonalName: finding prefixes");
		for ( i = parts.length; i > 0; i-- ) {
			prefixArray = parts.slice(0, i);
			prefix = prefixArray.join(asianName ? '' : ' ');
			prefixLower = prefix.toLowerCase();
			prefixLower = prefixLower.replace(/[,\.]/g, '');  // ignore commas and periods
			
			//enyo.log("checking prefix: '" + prefixLower + "'");
			
 			if ( (nameInfo.titles && enyo.indexOf(prefixLower, nameInfo.titles) > -1) || 						
					(nameInfo.honorifics && enyo.indexOf(prefixLower, nameInfo.honorifics) > -1) ) {
				if ( this.prefix  ) {
					if ( !asianName ) {
						this.prefix += ' ';
					} 
					this.prefix += prefix;
				} else {
					this.prefix = prefix;
				}
				parts = parts.slice(i);
				i = parts.length;
				//enyo.log("Found prefix '" + prefix + "' New parts list is " + JSON.stringify(parts));
			}
		}
	}
	
	// check for suffixes
	if (parts.length > 1) {
		//enyo.log("parsePersonalName: finding suffixes");
		for ( i = parts.length; i > 0; i-- ) {
			suffixArray = parts.slice(-i);
			suffix = suffixArray.join(asianName ? '' : ' ');
			suffixLower = suffix.toLowerCase();
			suffixLower = suffixLower.replace(/[,\.]/g, '');  // ignore commas and periods
			
			//enyo.log("checking suffix: '" + suffixLower + "'");
			
			if ( nameInfo.suffixes && enyo.indexOf(suffixLower, nameInfo.suffixes) > -1 ) {				
				if ( this.suffix ) {
					if ( !asianName ) {
						this.suffix = ' ' + this.suffix;
					}
					this.suffix = suffix + this.suffix;
				} else {
					this.suffix = suffix;
				}
				parts = parts.slice(0, parts.length-i);
				//enyo.log("Found suffix '" + suffix + "' New parts list is " + JSON.stringify(parts));
				i = parts.length;
			}
		}
	}
	
	if (hpSuffix) {
		this.suffix = (this.suffix && this.suffix + hpSuffix) || hpSuffix;
	}
	
	// adjoin auxillary words to their headwords
	if (parts.length > 1 && !asianName ) {
		parts = this._adjoinAuxillaries(parts, nameInfo);
		//enyo.log("parsePersonalName: parts is now " + JSON.stringify(parts));
	}
	
	if ( asianName ) {
		this._parseAsianName(parts, nameInfo);
	} else if (locale.language === "es") {
		// in spain and mexico, we parse names differently than in the rest of the world because of the double family names
		this._parseSpanishName(parts, locale);
	} else {
		this._parseNameDefaultLocale(parts, locale);
	}
	
	this._joinNameArrays();
	
	// clean up
	enyo.g11n.Utils.releaseAllJsonFiles();
	
	return this;
};

//* @protected
enyo.g11n.Name.prototype = {
	/*
	 * This is how names are parsed for Spanish names:
	 *    1
	 *    F
	 *
	 *    1 2
	 *    F L
	 *
	 *    1 2 3
	 *    F L L
	 *
	 *    1 2 3 4
	 *    F M L L 
	 *
	 *    1 2 3 4 5
	 *    F M M L L
	 * 
	 * Unless there's one of { 'and', 'or', '&', '+' }, in which case it's:
	 *     1
	 *     F
	 * 
	 *     1 2
	 *     F L
	 * 
	 *     1 2 3
	 *     F A F
	 *     A L L
	 *     F L L
	 * 
	 *     1 2 3 4
	 *     F A F L
	 *     F F A F
	 * 
	 *     1 2 3 4 5
	 *     F A F L L
	 *     F F A F L
	 *     F F F A F
	 */
	_parseSpanishName: function (parts, locale) {
		var conjunctionIndex;
		
		if (parts.length === 1) {
			if ( this.prefix || typeof(parts[0]) === 'object' ) {
				this.familyName = parts[0];
			} else {
				this.givenName = parts[0];
			}
		} else if (parts.length === 2) {
			//we do FL
			this.givenName = parts[0];
			this.familyName = parts[1];
		} else if (parts.length === 3) {
			conjunctionIndex = enyo.g11n.NamePriv._findLastConjunction(parts, locale);
			//if there's an 'and' in the middle spot, put everything in the first name
			if (conjunctionIndex === 1) {
				this.givenName = parts;
			} else {
				//else, do FLL
				this.givenName = parts[0];
				this.familyName = parts.slice(1);
			}
		} else if (parts.length > 3) {
			//there are at least 4 parts to this name
			
			conjunctionIndex = enyo.g11n.NamePriv._findLastConjunction(parts, locale);
			if (conjunctionIndex > 0) {
				// if there's a conjunction that's not the first token, put everything up to and 
				// including the token after it into the first name, the last 2 tokens into
				// the family name (if they exist) and everything else in to the middle name
				// 0 1 2 3 4 5
				// F A F
				// F A F L
				// F F A F
				// F A F L L
				// F F A F L
				// F F F A F
				// F A F M L L
				// F F A F L L
				// F F F A F L
				// F F F F A F
				this.givenName = parts.splice(0,conjunctionIndex+2);
				if ( parts.length > 1 ) {
					this.familyName = parts.splice(parts.length-2, 2);
					if ( parts.length > 0 ) {
						this.middleName = parts;
					}
				} else if ( parts.length === 1 ) {
					this.familyName = parts[0];
				}
			} else {
				this.givenName = parts.splice(0,1);
				this.familyName = parts.splice(parts.length-2, 2);
				this.middleName = parts;
			}
		}
	},
	
	/*
	 * This is how names are parsed for names by default (the English case):
	 * 
	 * F stands for a first name
	 * M is a middle name
	 * L is a last name
	 * numbers are position
	 * 
	 *     1
	 *     F
	 * 
	 *     1 2
	 *     F L
	 * 
	 *     1 2 3
	 *     F M L
	 * 
	 *     1 2 3 4
	 *     F M M L 
	 * 
	 *     1 2 3 4 5
	 *     F M M M L
	 * 
	 * Unless there's one of { 'and', 'or', '&', '+' }, in which case it's:
	 *     1
	 *     F
	 * 
	 *     1 2
	 *     F L
	 * 
	 *     1 2 3
	 *     F A F
	 * 
	 *     1 2 3 4
	 *     F A F L
	 *     F F A F
	 * 
	 *     1 2 3 4 5
	 *     F A F M L
	 *     F F A F L
	 *     F F F A F
	 */
	
	/*$ private
	 * Helper function for enyo.g11n.Name constructor
	 */
	_parseNameDefaultLocale: function (parts, locale) {
		var conjunctionIndex;
	
		if (parts.length === 1) {
			if ( this.prefix || typeof(parts[0]) === 'object' ) {
				// already has a prefix, so assume it goes with the family name like "Dr. Roberts" or
				// it is a name with auxillaries, which is almost always a family name
				this.familyName = parts[0];
			} else {
				this.givenName = parts[0];
			}
		} else if (parts.length === 2) {
			//we do FL
			this.givenName = parts[0];
			this.familyName = parts[1];
		} else if (parts.length >= 3) {
			//find the first instance of 'and' in the name
			conjunctionIndex = enyo.g11n.NamePriv._findLastConjunction(parts, locale);
	
			if (conjunctionIndex > 0) {
				// if there's a conjunction that's not the first token, put everything up to and 
				// including the token after it into the first name, the last token into
				// the family name (if it exists) and everything else in to the middle name
				// 0 1 2 3 4 5
				// F A F M M L
				// F F A F M L
				// F F F A F L
				// F F F F A F
				this.givenName = parts.slice(0,conjunctionIndex+2);
				if ( conjunctionIndex + 1 < parts.length - 1 ) {
					this.familyName = parts.splice(parts.length-1, 1);
					if ( conjunctionIndex + 2 < parts.length - 1 ) {
						this.middleName = parts.slice(conjunctionIndex + 2, parts.length - conjunctionIndex - 3);
					}
				}
			} else {
				this.givenName = parts[0];
				this.middleName = parts.slice(1, parts.length-1);
				this.familyName = parts[parts.length-1];
			}
		}
	},
	
	/*$ private
	 * Helper function for enyo.g11n.Name constructor
	 */
	_parseAsianName: function(parts, nameInfo) {
		var familyNameArray = enyo.g11n.NamePriv._findPrefix(parts, nameInfo.knownFamilyNames, true);
		
		if ( familyNameArray && familyNameArray.length > 0 ) {
			this.familyName = familyNameArray.join('');
			this.givenName = parts.slice(this.familyName.length).join('');
		} else if ( this.suffix || this.prefix ) {
			this.familyName = parts.join('');
		} else {
			this.givenName = parts.join('');
		}
	},
	
	/*$ private
	 * Helper function for enyo.g11n.Name constructor
	 */
	_joinNameArrays: function _joinNameArrays() {
		var prop;
		for (prop in this) {
			if (this[prop] !== undefined && typeof(this[prop]) === 'object' && this[prop] instanceof Array) {
				this[prop] = enyo.g11n.NamePriv._joinArrayOrString(this[prop]);
			}
		}
	},
	
	/*$ private
	 * Helper function for enyo.g11n.Name constructor 
	 * adjoin auxillary words to their head words
	 */
	_adjoinAuxillaries: function (parts, nameInfo) {
		var start, i, prefixArray, prefix, prefixLower;
		
		//enyo.log("_adjoinAuxillaries: finding and adjoining aux words in " + parts.join(' '));
		
		if ( nameInfo.auxillaries && (parts.length > 2 || this.prefix) ) {
			for ( start = 0; start < parts.length-1; start++ ) {
				for ( i = parts.length; i > start; i-- ) {
					prefixArray = parts.slice(start, i);
					prefix = prefixArray.join(' ');
					prefixLower = prefix.toLowerCase();
					prefixLower = prefixLower.replace(/[,\.]/g, '');  // ignore commas and periods
					
					//enyo.log("_adjoinAuxillaries: checking aux prefix: '" + prefixLower + "' which is " + start + " to " + i);
					
					if ( prefixLower in nameInfo.auxillaries ) {
						//enyo.log("Found! Old parts list is " + JSON.stringify(parts));
						parts.splice(start, i+1-start, prefixArray.concat(parts[i]));
						//enyo.log("_adjoinAuxillaries: Found! New parts list is " + JSON.stringify(parts));
						i = start;
					}
				}
			}
		}
		
		//enyo.log("_adjoinAuxillaries: done. Result is " + JSON.stringify(parts));
	
		return parts;
	},

	//* @public
	/**
	    Returns the portion of a person's family name that should be used for
	    sorting.

	    * locale (String): locale to use to decide the part to use

	    In English, we almost always sort by the first letter of the last
	    name--for example, the name "van der Heyden" would be sorted under "V".
	    Thus, if this function is called on a Name instance for someone with
	    that surname, the original string ("van der Heyden") will be returned
	    unmodified.

	    In other cultures, it is common to sort by the head word of a family
	    name containing auxiliaries like "van der". Returning to our example,
	    this function would return "Heyden" for Dutch, German, and other
	    Germanic languages.

	    If no value is specified, the locale defaults to the locale of the
	    current Name instance.
	*/
	getSortName: function (locale) {
		var loc,
			name,
			auxillaries, 
			langInfo, 
			auxString, 
			nameInfo, 
			parts,
			i;
		
		// no name to sort by
		if (!this.familyName) {
			return undefined;
		}
		
		if (!locale) {
			// default to the locale used to parse the name in the first place
			loc = this.locale;
		} else if (typeof(locale) === 'string') {
			loc = new enyo.g11n.Locale(locale);
		} else {
			loc = locale;
		}

		// first break the name into parts
		langInfo = enyo.g11n.Utils.getJsonFile({
			root: enyo.g11n.Utils._getEnyoRoot(),
			path: "name/data",
			locale: loc
		});
		
		if ( !langInfo ) {
			// default to English if there is no info on the particular locale
			// this should never happen because you can't pick a language in the 
			// language picker that we don't already support
			langInfo = enyo.g11n.Utils.getJsonFile({
				root: enyo.g11n.Utils._getEnyoRoot(),
				path: "name/data",
				locale: new enyo.g11n.Locale("en")
			});
		}
		nameInfo = langInfo.name;

		if (nameInfo) {
			if (nameInfo.sortByHeadWord) {
				if (typeof(this.familyName) === 'string') {
					name = this.familyName.replace(/\s+/g, ' ');	// compress multiple whitespaces
					parts = name.trim().split(' ');
				} else {
					// already split
					parts = this.familyName;
				}
				
				auxillaries = enyo.g11n.NamePriv._findPrefix(parts, nameInfo.auxillaries, false);
				if ( auxillaries && auxillaries.length > 0 ) {
					if (typeof(this.familyName) === 'string') {
						auxString = auxillaries.join(' ');
						name = this.familyName.substring(auxString.length+1) + ', ' + auxString;
					} else {
						name = this.familyName.slice(auxillaries.length).join(' ') + 
							', ' + 
							this.familyName.slice(0,auxillaries.length).join(' ');
					}
				}
			} else if (nameInfo.knownFamilyNames && this.familyName) {
				parts = this.familyName.split('');
				var familyNameArray = enyo.g11n.NamePriv._findPrefix(parts, nameInfo.knownFamilyNames, true);
				name = "";
				for (i = 0; i < familyNameArray.length; i++) {
					name += (nameInfo.knownFamilyNames[familyNameArray[i]] || "");
				}
			}
		}

		// clean up
		enyo.g11n.Utils.releaseAllJsonFiles();

		return name || this.familyName;
	},
	
	//* @protected
	/**
	    Returns a shallow copy of the current instance.
	 */
	clone: function () {
		var other = new enyo.g11n.Name();
		enyo.g11n.NamePriv._shallowCopy(this, other);
		return other;
	}
};

