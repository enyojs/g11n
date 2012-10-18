/*$
 * @name g11n.js
 * @fileOverview g11n namespace
 *
 */

/*globals G11n:true  window root enyo */

//* @protected

if(!this.enyo){
	this.enyo = {};
	var empty = {};
	enyo.mixin = function(target, source) {
		target = target || {};
		if (source) {
			var name, s;
			for (name in source) {
				// the "empty" conditional avoids copying properties in "source"
				// inherited from Object.prototype.  For example, if target has a custom
				// toString() method, don't overwrite it with the toString() method
				// that source inherited from Object.prototype
				s = source[name];
				if (empty[name] !== s) {
					target[name] = s;
				}
			}
		}
		return target; 
	};
}

// Add trim method if not supported (IE8)
if (!('trim' in String.prototype)) {
	String.prototype.trim = function() {
		return this.replace(/^\s+|\s+$/g, ''); 
	}
}
	
enyo.g11n = function () {
};

enyo.g11n._init = function _init(){
	if (!enyo.g11n._initialized){
		
		if  (typeof(window) !== 'undefined') {
			enyo.g11n._platform = "browser";
			enyo.g11n._enyoAvailable = true;
		} else{
			enyo.g11n._platform = "node";
			enyo.g11n._enyoAvailable = false;
		}

		/* device === 'browser' */
		/* Old browsers might not have a navigator object */
		if (navigator) {
			/* Everyone uses navigator.language, except for IE which uses navigator.userLanguage. Of course they do. */
			var locale = (navigator.language || navigator.userLanguage).replace(/-/g,'_').toLowerCase();
			enyo.g11n._locale = new enyo.g11n.Locale(locale);
			enyo.g11n._formatLocale = enyo.g11n._locale;
			enyo.g11n._phoneLocale = enyo.g11n._locale;
		}

		if (enyo.g11n._locale === undefined) {
			// we don't know where we're running, so just use US English as the default -- should not happen
			enyo.warn("enyo.g11n._init: could not find current locale, so using default of en_us.");
			enyo.g11n._locale = new enyo.g11n.Locale("en_us");
		}
		
		if (enyo.g11n._formatLocale === undefined) {
			enyo.warn("enyo.g11n._init: could not find current formats locale, so using default of us.");
			enyo.g11n._formatLocale = new enyo.g11n.Locale("en_us");
		} 

		if (enyo.g11n._phoneLocale === undefined) {
			enyo.warn("enyo.g11n._init: could not find current phone locale, so defaulting to the same thing as the formats locale.");
			enyo.g11n._phoneLocale = enyo.g11n._formatLocale;
		}
		
		if (enyo.g11n._sourceLocale === undefined){
			enyo.g11n._sourceLocale = new enyo.g11n.Locale("en_us");
		}
		
		enyo.g11n._initialized = true;
	}
	
};

enyo.g11n.getPlatform = function getPlatform(){
	if (!enyo.g11n._platform){
		enyo.g11n._init();
	}
	return enyo.g11n._platform;
};

enyo.g11n.isEnyoAvailable = function isEnyoAvailable(){
	if (!enyo.g11n._enyoAvailable){
		enyo.g11n._init();
	}
	return enyo.g11n._enyoAvailable;
};

//* @public
/**
    Returns an _enyo.g11n.Locale_ instance containing the current locale for the
    user interface.. 
*/
enyo.g11n.currentLocale = function currentLocale(){
	if (!enyo.g11n._locale){
		enyo.g11n._init();
	}
	return enyo.g11n._locale;
};

/**
    Returns an _enyo.g11n.Locale_ instance containing the current device locale,
    for use while formatting the following items:

    * dates and times
    * numbers, percentages, and currency
    * names
    * addresses
*/
enyo.g11n.formatLocale = function formatLocale(){
	if (!enyo.g11n._formatLocale){
		enyo.g11n._init();
	}
	return enyo.g11n._formatLocale;
};

/**
    Returns an _enyo.g11n.Locale_ instance containing the current phone locale.
    The phone locale acts as a "home" locale for parsing and formatting phone
    numbers that do not contain an explicit country code. The phone number of
    the current device should be issued by a carrier in this locale.
*/
enyo.g11n.phoneLocale = function phoneLocale(){
	if (!enyo.g11n._phoneLocale){
		enyo.g11n._init();
	}
	return enyo.g11n._phoneLocale;
};

//* @protected
enyo.g11n.sourceLocale = function sourceLocale(){
	if (!enyo.g11n._sourceLocale){
		enyo.g11n._init();
	}
	return enyo.g11n._sourceLocale;
};

//* @public
/**
    Sets the framework's understanding of the currently active locales.

    The _params_ object may contain one or more of the following properties:

    * uiLocale: Locale specifier for the UI locale
    * formatLocale: Locale specifier for the format locale
    * phoneLocale: Locale specifier for the phone locale

    The value of each property should be a string that is the specifier for that
    locale.
*/
enyo.g11n.setLocale = function setLocale(params) {
	if (params) {
		enyo.g11n._init();
		if (params.uiLocale) {
			enyo.g11n._locale = new enyo.g11n.Locale(params.uiLocale);
		}
		if (params.formatLocale) {
			enyo.g11n._formatLocale = new enyo.g11n.Locale(params.formatLocale);
		}
		if (params.phoneLocale) {
			enyo.g11n._phoneLocale = new enyo.g11n.Locale(params.phoneLocale);
		}
		if (params.sourceLocale) {
			enyo.g11n._sourceLocale = new enyo.g11n.Locale(params.sourceLocale);
		}
		if (enyo.g11n._enyoAvailable){
			enyo.reloadG11nResources();
		}
		
	}
};
