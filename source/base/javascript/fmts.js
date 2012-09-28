/*$
 * @name fmts.js
 * @fileOverview basic handling of the format info files
 * 
 */

/*globals EnvironmentUtils  G11n enyo*/

//* @public
/**
    Creates and returns an instance of a formats information object.  The
    instance contains various pieces of information about the given locale.

    * params: Currently, the only parameter used is _locale_. Leave this
        argument undefined to cause this instance to use the current device
        formats locale. 
*/
enyo.g11n.Fmts = function Fmts(params){
	 var locale;
	 if (typeof(params) === 'undefined' || !params.locale) {
		 this.locale = enyo.g11n.formatLocale();
	 } else if (typeof(params.locale) === 'string') {
		 this.locale = new enyo.g11n.Locale(params.locale);
	 } else {
		 this.locale = params.locale;
	 }
	
	 this.dateTimeFormatHash = enyo.g11n.Utils.getJsonFile({
		 root: enyo.g11n.Utils._getEnyoRoot(),
		 path: "base/formats",
		 locale: this.locale,
		 type: "region"
	 });
	 
	 this.dateTimeHash = enyo.g11n.Utils.getJsonFile({
		 root: enyo.g11n.Utils._getEnyoRoot(),
		 path: "base/datetime_data",
		 locale: this.locale
	 });
	 
	 if (!this.dateTimeHash) {
		 this.dateTimeHash = enyo.g11n.Utils.getJsonFile({
			 root: enyo.g11n.Utils._getEnyoRoot(),
			 path: "base/datetime_data",
			 locale: enyo.g11n.currentLocale()
		 });
	 }

	 if (!this.dateTimeHash) {
		 this.dateTimeHash = enyo.g11n.Utils.getJsonFile({
			 root: enyo.g11n.Utils._getEnyoRoot(),
			 path: "base/datetime_data",
			 locale: new enyo.g11n.Locale('en_us')	// should always exist
		 });
	 }
};

//* @public
/**
    Returns true if a 12-hour clock is currently in use; false if a 24-hour
    clock is in use.
*/
enyo.g11n.Fmts.prototype.isAmPm = function(){
	if (typeof(this.twelveHourFormat) === 'undefined') {
		this.twelveHourFormat = this.dateTimeFormatHash.is12HourDefault;
	}
	
	return this.twelveHourFormat;
};

//* @public
/**
    Returns true if the current locale uses a 12-hour clock to format times;
    false if it uses a 24-hour clock.
*/
enyo.g11n.Fmts.prototype.isAmPmDefault = function(){
	return this.dateTimeFormatHash.is12HourDefault;
};

//* @public
/**
    Returns an integer representing the first day of the week in the current
    locale. The numbers correspond to the days of the week as follows:

    * 0: Sunday
    * 1: Monday
    * 2: Tuesday
    * 3: Wednesday
    * 4: Thursday
    * 5: Friday
    * 6: Saturday
*/
enyo.g11n.Fmts.prototype.getFirstDayOfWeek = function(){
	return this.dateTimeFormatHash.firstDayOfWeek;
};

//* @public
/**
    Returns the order of the fields in a formatted date for the current locale.
    This function returns an array of three strings--with the values "month",
    "day", and "year"--arranged in the proper order for the locale.
*/
enyo.g11n.Fmts.prototype.getDateFieldOrder = function(){
	if (!this.dateTimeFormatHash){
		enyo.warn("Failed to load date time format hash");
		return "mdy";
	}

	return this.dateTimeFormatHash.dateFieldOrder;
};

//* @public
/**
    Returns the order of the fields in a formatted time for the current locale.
    This function returns an array of three strings--with the values "minute",
    "hour", and "ampm"--arranged in the proper order for the locale.

    The position of "ampm" in the array indicates where the AM or PM marker
    should go for 12-hour clocks.
*/
enyo.g11n.Fmts.prototype.getTimeFieldOrder = function(){

	if (!this.dateTimeFormatHash){
		enyo.warn("Failed to load date time format hash");
		return "hma";
	}
	
	return this.dateTimeFormatHash.timeFieldOrder;
};

//* @public
/**
    Returns an array of the medium-sized abbreviations for the month names in
    this locale.  In most cases, these will be the three-letter abbreviations of
    the month names.
*/
enyo.g11n.Fmts.prototype.getMonthFields = function(){
	if (this.dateTimeHash){
		return this.dateTimeHash.medium.month;
	}else{
		return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	}
};

/**
    Returns the string for AM in the current locale, or the default "AM" if it
    cannot be found.
*/
enyo.g11n.Fmts.prototype.getAmCaption = function(){
	if (this.dateTimeHash){
		return this.dateTimeHash.am;
	}else{
		enyo.error("Failed to load dateTimeHash.");
		return "AM";
	}
};

/**
    Returns the string for PM in the current locale, or the default "PM" if it
    cannot be found.
*/
enyo.g11n.Fmts.prototype.getPmCaption = function(){
	if (this.dateTimeHash){
		return this.dateTimeHash.pm;
	}else{
		enyo.error("Failed to load dateTimeHash.");
		return "PM";
	}
};

/**
    Returns the measurement system for the current locale. The possible values
    are "uscustomary", "imperial", and "metric". Defaults to "metric" if not
    otherwise specified in the formats config file.
*/
enyo.g11n.Fmts.prototype.getMeasurementSystem = function(){
	return (this.dateTimeFormatHash && this.dateTimeFormatHash.measurementSystem) || "metric";
};

/**
    Returns the default paper size for printers in the current locale. The
    possible values are "letter" (i.e., 8.5" x 11") and "A4" (210mm × 297mm).
    Defaults to "A4" if not otherwise specified in the formats config file.
*/
enyo.g11n.Fmts.prototype.getDefaultPaperSize = function(){
	return (this.dateTimeFormatHash && this.dateTimeFormatHash.defaultPaperSize) || "A4";
};

/**
    Returns the default photo size for printers in the current locale. The
    possible values are "10X15CM" (i.e., 10 by 15 cm), "4x6" (4 x 6 inches), and
    "L" (roughly 9 × 13 cm). Defaults to "10X15CM" if not otherwise specified in
    the formats config file.
*/
enyo.g11n.Fmts.prototype.getDefaultPhotoSize = function(){
	return (this.dateTimeFormatHash && this.dateTimeFormatHash.defaultPhotoSize) || "10X15CM";
};

/**
    Returns the zone ID of the default time zone for the locale. For many
    locales, there are multiple time zones. This function returns the one that
    is either the most important or contains the largest population. If the
    current formats object is for an unknown locale, the default time zone is
    GMT (Europe/London).
*/
enyo.g11n.Fmts.prototype.getDefaultTimeZone = function(){
	return (this.dateTimeFormatHash && this.dateTimeFormatHash.defaultTimeZone) || "Europe/London";
};

/**
    Returns true if the current locale uses an Asian-style script--i.e., one in
    which words are written without spaces between them--otherwise, false. Most
    locales use a Western-style script, in which words are written with spaces
    between them.
*/
enyo.g11n.Fmts.prototype.isAsianScript = function(){
	if (this.dateTimeFormatHash && typeof(this.dateTimeFormatHash.asianScript) !== 'undefined') {
		return this.dateTimeFormatHash.asianScript;
	}
	return false;
};

/**
    Returns true if the locale uses traditional Han Chinese characters, as
    opposed to simplified characters.  Returns false for locales that use
    simplified characters, as well as for locales that do not use Han Chinese
    characters at all.
*/
enyo.g11n.Fmts.prototype.isHanTraditional = function(){
	if (this.dateTimeFormatHash && typeof(this.dateTimeFormatHash.scriptStyle) !== 'undefined') {
		return this.dateTimeFormatHash.scriptStyle === 'traditional';
	}
	return false;
}

/**
    Returns a string indicating the direction of written text in this locale.
    Possible values are:

    * ltr - left to right (Western and Asian languages)
    * rtl - right to left (Arabic, Farsi, and Hebrew)
*/
enyo.g11n.Fmts.prototype.textDirection = function(){
	return this.dateTimeFormatHash && this.dateTimeFormatHash.scriptDirection || 'ltr';
}
