/*$
 * @name name.js
 * @fileOverview This file has the implementation of the Name formatter object
 * 
 */

/*globals  G11n enyo*/

//* @public
/**
    Identifiers for use with the length property of the formatter parameters.
*/
enyo.g11n.Name.shortName = 'short';
enyo.g11n.Name.mediumName = 'medium';
enyo.g11n.Name.longName = 'long';

/**
    Creates a formatter object that formats personal names for display.

    The params object can contain the following properties:

    * style (String): The format style to use with this name.

        The style parameter should be passed as one of the following contants:

        * enyo.g11n.Name.shortName (the default): Formats the shortest unique
            name. For most locales, this is the first given name and the family
            name.

        * enyo.g11n.Name.mediumName: Formats the most common parts of the name.
            For most locales, this is the short name plus a middle name.

        * enyo.g11n.Name.longName: Formats all parts of the name that are
            available.

    * locale (String): Locale to use to format the name. If no value is
        specified, this function will use the current formatLocale.


*/
enyo.g11n.NameFmt = function (params) {
	//enyo.g11n.Name.formatPersonalName = function (nameModel, style, locale)
	var locale, style;
	
	if (!params) {
		return undefined;
	}
	
	if (!params.locale) {
		locale = enyo.g11n.currentLocale();
	} else if (typeof(params.locale) === 'string') {
		locale = new enyo.g11n.Locale(params.locale);
	} else {
		locale = params.locale;
	}
	
	style = params.style || enyo.g11n.Name.mediumName;
	
	this.langInfo = enyo.g11n.Utils.getJsonFile({
		root: enyo.g11n.Utils._getEnyoRoot(),
		path: "name/data",
		locale: locale
	});
	
	if (!this.langInfo || !this.langInfo.name) {
		this.langInfo = enyo.g11n.Utils.getJsonFile({
			root: enyo.g11n.Utils._getEnyoRoot(),
			path: "name/data",
			locale: new enyo.g11n.Locale("en")
		});
	}
	
	if (this.langInfo && this.langInfo.name) {
		this.template = new enyo.g11n.Template(this.langInfo.name.formats[style]);
	}
	
	if (locale.language === "es" && style !== enyo.g11n.Name.longName) {
		this.useFirstFamilyName = true;	// in spain, they have 2 family names, the maternal and paternal
	}
	
	// set up defaults in case we need them
	switch (style) {
		case enyo.g11n.Name.shortName:
			this.defaultEuroTemplate = new enyo.g11n.Template("#{givenName} #{familyName}");
			this.defaultAsianTemplate = new enyo.g11n.Template("#{familyName}#{givenName}");
			break;
		case enyo.g11n.Name.longName:
			this.defaultEuroTemplate = new enyo.g11n.Template("#{prefix} #{givenName} #{middleName} #{familyName}#{suffix}");
			this.defaultAsianTemplate = new enyo.g11n.Template("#{prefix}#{familyName}#{givenName}#{middleName}#{suffix}");
			this.useFirstFamilyName = false;
			break;
		case enyo.g11n.Name.mediumName:
		default:
			this.defaultEuroTemplate = new enyo.g11n.Template("#{givenName} #{middleName} #{familyName}");
			this.defaultAsianTemplate = new enyo.g11n.Template("#{prefix}#{familyName}#{givenName}#{middleName}");
			break;
	}
	
	this.isAsianLocale = this.langInfo.name.isAsianLocale;
	
	enyo.g11n.Utils.releaseAllJsonFiles();
	
	return this;
};

enyo.g11n.NameFmt.prototype = {
	//* @protected
	getTemplate: function () {
		return this.template;
	},
	
	//* @public
	/**
	    Formats an enyo.g11n.Name instance for display and returns a string
	    containing the formatted name.

	    If the name does not contain all the parts required for the style, the
	    missing parts will be left blank.

	    There are two basic styles of formatting: European and Asian. If this
	    formatter object is set for European style, but an Asian name is passed
	    into the format method, this method will format the Asian name with a
	    generic Asian template. Similarly, if the formatter is set for an Asian
	    style, and a European name is passed to the format method, the formatter
	    will use a generic European template.

	    This means it is always safe to format any name with a formatter for any
	    locale. You should always get something reasonable as output.
	*/
	format: function (name) {
		var formatted, temp, modified, isAsianName;
		
		if (!name || typeof(name) !== 'object') {
			return undefined;
		}
		
		if ((!name.givenName || enyo.g11n.NamePriv._isEuroName(name.givenName)) &&
				 (!name.middleName || enyo.g11n.NamePriv._isEuroName(name.middleName)) &&
				 (!name.familyName || enyo.g11n.NamePriv._isEuroName(name.familyName))) {
			isAsianName = false;	// this is a euro name, even if the locale is asian
			modified = name.clone();
			
			// handle the case where there is no space if there is punctuation in the suffix like ", Phd". 
			// Otherwise, put a space in to transform "PhD" to " PhD"
			/*
			enyo.log("suffix is " + modified.suffix);
			if ( modified.suffix ) {
				enyo.log("first char is " + modified.suffix.charAt(0));
				enyo.log("enyo.g11n.Char.isPunct(modified.suffix.charAt(0)) is " + enyo.g11n.Char.isPunct(modified.suffix.charAt(0)));
			}
			*/
			if (modified.suffix && enyo.g11n.Char.isPunct(modified.suffix.charAt(0)) === false) {
				modified.suffix = ' ' + modified.suffix; 
			}
			
			if (this.useFirstFamilyName && name.familyName) {
				var familyNameParts = modified.familyName.trim().split(' ');
				if (familyNameParts.length > 1) {
					familyNameParts = modified._adjoinAuxillaries(familyNameParts, this.langInfo.name);
				}	//in spain and mexico, we parse names differently than in the rest of the world
	
				modified.familyName = familyNameParts[0];
			}
		
			modified._joinNameArrays();
		} else {
			isAsianName = true;
			modified = name;
		}
		
		if (!this.template || isAsianName !== this.isAsianLocale) {
			temp = isAsianName ? this.defaultAsianTemplate : this.defaultEuroTemplate;
		} else {
			temp = this.template;
		}

		try {
			formatted = temp.evaluate(modified);
		} catch (e) {
			enyo.error("Could not format name: " + e);
			temp = new enyo.g11n.Template("#{givenName} #{middleName} #{familyName}");
			formatted = temp.evaluate(modified);
		}
		return formatted.replace(/\s+/g, ' ').trim();
	}
};
