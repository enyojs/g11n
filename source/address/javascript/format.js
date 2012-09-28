/*$
 * @name format.js
 * @fileOverview address formatting routines
 * 
 * 
 */

/*globals  G11n Template Locale enyo*/

//* @public
/**
    Creates and returns a new formatter object that can format multiple
    addresses.

    The params object may contain the following properties, both of which are
    optional:

    * locale: The locale to use to format this address. If no value is
        specified, the _formatLocale_ is used.

    * style: The style of this address. The default style for each country
        usually includes all valid fields for that country.
*/
enyo.g11n.AddressFmt = function(params) {
	var formatInfo, format;
	
	if (!params || !params.locale) {
		this.locale = enyo.g11n.formatLocale(); // can't do anything unless we know the locale
	} else if (typeof(params.locale) === 'string') {
		this.locale = new enyo.g11n.Locale(params.locale);
	} else {
		this.locale = params.locale;
	}
	
	// enyo.log("Creating formatter for region: " + this.locale.region);
	this.styleName = (params && params.style) || 'default';
	
	formatInfo = enyo.g11n.Utils.getJsonFile({
		root: enyo.g11n.Utils._getEnyoRoot(),
		path: "address/data",
		locale: new enyo.g11n.Locale("_" + this.locale.region)
	});

	if (!formatInfo) {
		formatInfo = enyo.g11n.Utils.getJsonFile({
			root: enyo.g11n.Utils._getEnyoRoot(),
			path: "address/data",
			locale: new enyo.g11n.Locale("unknown_unknown")
		});
	}
	
	this.style = formatInfo && formatInfo.formats && formatInfo.formats[this.styleName];
	
	// use generic default -- should not happen, but just in case...
	this.style = this.style || (formatInfo && formatInfo.formats["default"]) || "#{streetAddress}\n#{locality} #{region} #{postalCode}\n#{country}";
	
	enyo.g11n.Utils.releaseAllJsonFiles();
	
	return this;
};

/**
    Formats a physical address (an _enyo.g11n.Address instance_) for display and
    returns the formatted address as a string. Whitespace is trimmed from the
    beginning and end of the final result string, and multiple consecutive
    whitespace characters in the middle of the string are compressed down to one
    space character.

    If the passed-in Address instance is for a locale different from that of
    this formatter, a hybrid address is produced. The country name is located in
    the correct spot for the current formatter's locale, but the rest of the
    fields are formatted according to the default style of the locale of the
    actual address.

    For example, if a mailing address for a location in China is formatted for
    the U.S., it might produce the words "People's Republic of China" in English
    as the last line of the address, while the Chinese-style address appears in
    the first line of the address. This happens because, in the U.S., the
    country is placed on the last line, whereas in China, the country is
    typically on the first line.
*/
enyo.g11n.AddressFmt.prototype.format = function (address) {
	var ret, template, other, format;
	
	if (!address) {
		return "";
	}
	// enyo.log("formatting address: " + JSON.stringify(address));
	if (address.countryCode && address.countryCode !== this.locale.region) {
		// we are formatting an address that is sent from this country to another country,
		// so only the country should be in this locale, and the rest should be in the other
		// locale
		// enyo.log("formatting for another locale. Loading in its settings: " + address.countryCode);
		other = new enyo.g11n.AddressFmt({
			locale: new enyo.g11n.Locale("_" + address.countryCode), 
			style: this.styleName
		});
		return other.format(address);
	}
	
	format = address.format ? this.style[address.format] : this.style;
	// enyo.log("Using format: " + format);
	template = new enyo.g11n.Template(format);
	ret = template.evaluate(address);
	ret = ret.replace(/[ \t]+/g, ' ');
	return ret.replace(/\n+/g, '\n').trim();
};
