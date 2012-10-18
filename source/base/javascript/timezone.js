/*$
 * @name timezone.js
 * @fileOverview This file handles the implementation of the Timezone formatter object
 * 
 */

/*globals  G11n enyo */

//* @protected
enyo.g11n._TZ = enyo.g11n._TZ || {};

//* @public
/**
    Creates and returns a new timezone formatter (_TzFmt_) instance.

    The _params_ argument is a string that is a timezone id specifier. The
    specifier has the format:

        Zone name (see man tzfile), daylight savings supported, offset from UTC.
*/
enyo.g11n.TzFmt = function (params) {
	// get the system timezone info and set the current timezone name
	// will use PalmSystem.TZ when it becomes available in Dartfish
	this.setTZ();
	
	// if timezone is passed in as a parameter, we try to honor the specified timezone
	if ((params !== undefined) && (params.TZ !== undefined)) {
//		enyo.log("==============> call with TZ " + params.TZ + "<==============");
		this.setCurrentTimeZone(params.TZ);
	}
	
	enyo.g11n.Utils.releaseAllJsonFiles();
	return this;
};

enyo.g11n.TzFmt.prototype = {
	//* @public
	/**
	    Returns the time zone as a string.
	*/
	toString: function () {
    	if (this.TZ !== undefined) {
    		return this.TZ;
    	} else {
    		return this._TZ;
    	}
	},

	/**
	     This set of functions caches the current timezone name (e.g., "PST").
	     The _subscribe_ property defaults to false, since the timezone is not
	     likely to change frequently. 
	 
	     This is for use by _DateFmt_ in the globalization framework, which
	     needs the current timezone for the 'zzz' specifier.
	 */
	setTZ: function() {
		var d = new Date().toString();
		var s = enyo.indexOf("(", d);
		var e = enyo.indexOf(")", d);
		var z = d.slice(s + 1, e);
		if (z !== undefined) {
			this.setCurrentTimeZone(z);
		} else {
			this.setDefaultTimeZone();
		}
//		enyo.log("**********> enyo.g11n.date: (setTZ) this.TZ=" + this.TZ);
	},
	
	/**
	    Returns the name of the current timezone. If set manually, the timezone
	    is updated whenever the user changes it; if set automatically, it is
	    updated by the network.
	 */
	getCurrentTimeZone: function() {
		if (this.TZ !== undefined) {
			return this.TZ;
		} else if (this._TZ !== undefined) {
			return this._TZ;
		} else {
			return ("unknown");
		}
	},
	
	//* @protected
	// _TZ should always be set (default is PST)
	// TZ is the real timezone info gotten from the system
	setCurrentTimeZone: function(timeZone) {
		this._TZ = timeZone;
		this.TZ = timeZone;
	},
	
	setDefaultTimeZone: function () {
		// enyo.log("enyo.g11n.date.timezone: Setting up default timezone to PST.");
        var m = (new Date()).toString().match(/\(([A-Z]+)\)/);
        this._TZ = (m && m[1]) || 'PST';
	}
};
