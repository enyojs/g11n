/*$
 * @name name.js
 * @fileOverview This file has the implementation of the Phone Number formatter object
 * 
 */

/*globals  G11n PhoneLoc NumPlan new enyo.g11n.FmtStyles PhoneUtils */

//* @public
/**
    Creates and returns a new phone number formatter object, which formats
    numbers according to the passed-in parameters.

    * params (Object): Parameters controlling the formatting

    The _params_ object may contain zero or more of the following properties:

    * locale (String): The locale to use to format this number. If undefined,
        the default locale is used.

    * style (String): The name of style to use to format this number. If
        undefined, the default style is used.

    * mcc (String): The MCC of the country to use if the number is a local
        number and the country code is not known

    Some regions have more than one style of formatting, with the style
    parameter reflecting the style that the user prefers. The style names may be
    obtained by calling _FmtStyles.getExamples()_.

    If the MCC is given, numbers will be formatted after the manner of the
    country specified by the MCC. If it is not given, but the locale is, the
    manner of the country in the locale is followed. If neither the MCC nor the
    locale is given, the formatter follows the manner of the country of the
    device's _phoneLocale_.
*/
enyo.g11n.PhoneFmt = function(params) {
	this.locale = new enyo.g11n.PhoneLoc(params);
	
	this.style = (params && params.style) || "default";
	this.plan = new enyo.g11n.NumPlan({locale: this.locale});
	this.styles = new enyo.g11n.FmtStyles(this.locale);
	
	enyo.g11n.Utils.releaseAllJsonFiles();
	return this;
};

enyo.g11n.PhoneFmt.prototype = {
	//* @protected
	_substituteDigits: function _substituteDigits(part, formats, mustUseAll) {
		var formatString,
			formatted = "",
			partIndex = 0,
			i;
		
		// enyo.log("Globalization.Phone._substituteDigits: typeof(formats) is " + typeof(formats));
		
		if (!part) {
			return formatted;
		}
		
		if (typeof(formats) === "object") {
			if (part.length > formats.length) {
				// too big, so just use last resort rule.
				throw "part " + part + " is too big. We do not have a format template to format it.";
			}
			// use the format in this array that corresponds to the digit length of this
			// part of the phone number
			formatString = formats[part.length-1];
			// enyo.log("Globalization.Phone._substituteDigits: formats is an Array: " + JSON.stringify(formats));
		} else {
			formatString = formats;
		}
		// enyo.log("Globalization.Phone._substituteDigits: part is " + part + " format is " + formatString);
		
		for (i = 0; i < formatString.length; i++) {
			if (formatString.charAt(i) === "X") {
				formatted += part.charAt(partIndex);
				partIndex++;
			} else {
				formatted += formatString.charAt(i);
			}
		}
		
		if (mustUseAll && partIndex < part.length-1) {
			// didn't use the whole thing in this format? Hmm... go to last resort rule
			throw "too many digits in " + part + " for format " + formatString;
		}
		
		return formatted;
	},
	
	//* @public
	/**
	    Formats the parts of a phone number according to the settings in the
	    current formatter instance.  The formatted number is returned as a
	    string.

	    * number (Object): Object containing the phone number to format

	    * params (Object): Parameters controlling the formatting
	    
	    The _params_ object may contain the _partial_ property, a Boolean
	    indicating whether or not the passed-in phone number represents a
	    partial number. The default is false, meaning that the number
	    represents a whole number.

	    The _partial_ property exists because certain phone numbers--in
	    particular, SMS short codes--should be formatted differently depending
	    on whether or not they represent whole numbers.

	    For example, a subscriber number of "48773" in the U.S. would be
	    formatted as:

	    * partial: 487-73  (Perhaps the user is in the middle of typing a whole
	        phone number, such as "487-7379")

	    * whole:   48773   (SMS short code)

	    Any place in the UI where the user types in phone numbers (e.g., the
	    keypad in the phone app) should pass in _partial: true_ to this
	    formatter. All other places (e.g., the call log in the phone app) should
	    pass in _partial: false_, or else leave the _partial_ flag out of the
	    _params_ object entirely.
	 */
	format: function format(number, params) {
		var temp, 
			templates, 
			fieldName, 
			countryCode, 
			isWhole, 
			style,
			field,
			formatted = "",
			styles,
			locale,
			styleTemplates;
		
		// enyo.log("PhoneFmt.format: formatting " + JSON.stringify(number));
		
		try {
			style = this.style;		// default style for this formatter
			
			// figure out what style to use for this type of number
			if (number.countryCode) {
				// dialing from outside the country
				// check to see if it to a mobile number because they are often formatted differently
				style = (number.mobilePrefix) ? "internationalmobile" : "international";
			} else if (number.mobilePrefix !== undefined) {
				style = "mobile";
			} else if (number.serviceCode !== undefined && this.styles.hasStyle("service")) {
				// iff there is a special format for service numbers, then use it
				style = "service";
			}
			
			isWhole = (!params || !params.partial);
			styleTemplates = this.styles.getStyle(style);
			locale = this.locale;
			
			// enyo.log("Style ends up being " + style + " and using subtype " + (isWhole ? "whole" : "partial"));
			
			styleTemplates = (isWhole ? styleTemplates.whole : styleTemplates.partial) || styleTemplates;
	
			for (field in enyo.g11n.PhoneUtils.fieldOrder) {
				if (typeof field === 'string' && typeof enyo.g11n.PhoneUtils.fieldOrder[field] === 'string') {
					fieldName = enyo.g11n.PhoneUtils.fieldOrder[field];
					// enyo.log("format: formatting field " + fieldName + " value: " + number[fieldName]);
					if (number[fieldName] !== undefined) {
						if (styleTemplates[fieldName] !== undefined) {
							templates = styleTemplates[fieldName];
							if (fieldName === "trunkAccess") {
								if (number.areaCode === undefined && number.serviceCode === undefined && number.mobilePrefix === undefined) {
									templates = "X";
								}
							}
							// enyo.log("format: formatting field " + fieldName + " with templates " + JSON.stringify(templates));
							temp = this._substituteDigits(number[fieldName], templates, (fieldName === "subscriberNumber"));
							// enyo.log("format: formatted is: " + temp);
							formatted += temp;
			
							if ( fieldName === "countryCode" ) {
								// switch to the new country to format the rest of the number
								countryCode = number.countryCode.replace(/[wWpPtT\+#\*]/g, '');	// fix for NOV-108200
								locale = new enyo.g11n.PhoneLoc({countryCode: countryCode});
								styles = new enyo.g11n.FmtStyles(locale);
								styleTemplates = styles.getStyle((number.mobilePrefix !== undefined) ? "internationalmobile" : "international");
			
								// enyo.log("format: switching to region " + locale.region + " and style " + style + " to format the rest of the number ");
							}
						} else {
							enyo.warn("PhoneFmt.format: cannot find format template for field " + fieldName + ", region " + locale.region + ", style " + style);
							// use default of "minimal formatting" so we don't miss parts because of bugs in the format templates
							formatted += number[fieldName];
						}
					}
				}
			}
		} catch (e) {
			if (typeof(e) === 'string') { 
				// enyo.warn("caught exception: " + e + ". Using last resort rule.");
				// if there was some exception, use this last resort rule
				formatted = "";
		
				for (field in enyo.g11n.PhoneUtils.fieldOrder) {
					if (typeof field === 'string' && typeof enyo.g11n.PhoneUtils.fieldOrder[field] === 'string' && number[enyo.g11n.PhoneUtils.fieldOrder[field]] !== undefined) {
						// just concatenate without any formatting
						formatted += number[enyo.g11n.PhoneUtils.fieldOrder[field]];
						if (enyo.g11n.PhoneUtils.fieldOrder[field] === 'countryCode') {
							formatted += ' ';		// fix for NOV-107894
						}
					}
				}
			} else {
				throw e;
			}
		}
		// enyo.log("format: final result is " + formatted );
	
		enyo.g11n.Utils.releaseAllJsonFiles();
		
		return formatted;
	},
	
	/**
	    Evaluates whether the passed-in string can be reformatted as a phone
	    number. If so, the formatted number is returned; if not, the original
	    string is returned unmodified.

	    * phoneNumber (String): A string that probably contains a phone number

	    * params (Object): Parameters for use in parsing and reformatting
	        (optional)

	    The function does a character count to determine whether the string
	    contains enough digits for a phone number, also checking for the
	    presence of too many non-dialable characters. If it looks like the
	    string is just some text rather than a phone number, the original string
	    is returned.

	    Another reason why it may not be possible to reformat is if the digits
	    in the phone number form an invalid number in the active numbering plan.
	    If so, the function will not attempt to reformat the number (which
	    would just be invalid) and will just return the original string.

	    The _params_ object is passed to the _enyo.g11n.PhoneNumber()_
	    constructor function, so it should contain the properties expected by
	    that function. Please see the documentation for _PhoneNumber_ for more
	    details on the expected properties.
	*/
	reformat: function (phoneNumber, params) {
		var ret = "",
			i,
			ch,
			dialableCount = 0,
			formatCount = 0,
			otherCount = 0,
			countryCode,
			formatsRegion,
			parsedLocale,
			region,
			regionSettings,
			formatChars;
		
		if (!phoneNumber || typeof(phoneNumber) !== 'string') {
			return phoneNumber;
		}
		
		// enyo.log("PhoneFmt.reformat: reformatting number: " + phoneNumber);

		formatChars = (this.plan && this.plan.commonFormatChars) || " ()-/.";
		
		for (i = 0; i < phoneNumber.length; i++) {
			ch = phoneNumber.charAt(i);
			if (enyo.g11n.PhoneUtils._getCharacterCode(ch) > -1) {
				dialableCount++;
			} else if (enyo.indexOf(ch, formatChars) > -1) {				
				formatCount++;
			} else {
				otherCount++; 
			}
		}
	
		// enyo.log("PhoneFmt.reformat: dialable: " + dialableCount + " format: " + formatCount + " other: " + otherCount);
		
		if (this.plan && 
			this.plan.fieldLengths && 
			this.plan.fieldLengths.minLocalLength && 
			dialableCount < this.plan.fieldLengths.minLocalLength &&
			otherCount > 0) {
			// not enough digits for a local number, and there are other chars in there? well, probably not a real phone number then
			return phoneNumber;
		} 
		
		if (dialableCount < otherCount) {
			// if the ratio of other chars to dialable digits is too high, assume it is not a real phone number
			return phoneNumber;
		}
	
		var temp = new enyo.g11n.PhoneNumber(phoneNumber, {locale: this.locale});
		
		if (temp.invalid) {
			// could not be parsed properly, so return the original
			return phoneNumber;
		}
		
		return this.format(temp, params);
	}
};
