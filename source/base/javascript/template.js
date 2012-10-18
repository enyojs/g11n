/*$
 * @name template.js
 * @fileOverview basic string template formatting routines used by the whole g11n package.
 * 
 */

/*globals G11n  enyo*/

//* @public
/**
    Creates and returns a Template object that substitutes the strings into a
    specified string template.

    The _template_ parameter is a string to substitute into. The optional
    _pattern_ parameter overrides the normal #{foo} substitution format.
*/

enyo.g11n.Template = function(template, pattern) {
	this.template = template;
	this.pattern = pattern || /(.?)(#\{(.*?)\})/;
};

//* @protected
enyo.g11n.Template.prototype._evalHelper = function(template, data) {
	var parts = [];
	var pattern = this.pattern;
	var nextKey;
	
	if(!data || !template) {
		return '';
	}
	
	function identify(str) {
		return (str === undefined || str === null) ? '' : str;
	}
	
	function nextValue(prev, wrappedKey, key) {
		var currentNode = data;
		var propChain, nextProp;
		
		prev = identify(prev);
		
		if(prev === '\\') {
			return wrappedKey;
		}
		
		propChain = key.split('.');
		nextProp = propChain.shift();

		while(currentNode && nextProp) {
			currentNode = currentNode[nextProp];
			nextProp = propChain.shift();
			if(!nextProp) {
				//other falsey values should appear to maintain consistency.
				return (prev + identify(currentNode)) || prev || '';
			}
		}
		return prev || '';
	}
	
	
	while(template.length) {
		nextKey = template.match(pattern);
		if(nextKey) {
			parts.push(template.slice(0, nextKey.index));
			parts.push(nextValue(nextKey[1], nextKey[2], nextKey[3]));
			template = template.slice(nextKey.index + nextKey[0].length);
		} else {
			parts.push(template);
			template = '';
		}
	}

	return parts.join('');
};

//* @public
/**
    Substitutes the strings into a specified string template.

    The _data_ parameter is an object giving values to interpolate into the
    template string.

        var source = '\\#{zero} #{zero} #{woot.blah}...';
        var model = {zero:0, woot:{blah: "Zeta"}};
        var template = new enyo.g11n.Template(source);

        // should return ---> '#{zero} 0 Zeta...'
        template.evaluate(model);
*/
enyo.g11n.Template.prototype.evaluate = function (data) {
	return this._evalHelper(this.template, data);
};

/**
    Formats a string template as a choice string according to the given value
    and model.

    A choice string is a sequence of choices separated by a vertical bar
    character. Each choice has a value to match, followed by a hash character,
    followed by the string to use if the value matches. The string cannot
    contain a vertical bar.

    The strings may contain references (such as #{num}) to objects in the given
    model that are used to format the final string. The syntax "2>" means
    "greater than 2". Similarly, the syntax "2<" means "less than 2". If the
    value of a choice is empty, that means to use that choice as the default
    string.

    Here is an example choice string:

        0#There are no files|1#There is one file|9>#There are #{num} files.|#There are some files.

    Here, if the value passed in with the first parameter is 0, then the first
    string ("There are no files") is used. If the value passed in with the first
    parameter is 1, then the second string ("There is one file") is used. If the
    value is greater than 9, the string "There are #{num} files." is used. If no
    other choices match, then the default string ("There are some files.") is used.

    When the function is called in the following way...

        var files = 2185;
        var model = { num: files };
        var template = new enyo.g11n.Template("0#There are no files|1#There is one file|1<#There are #{num} files.");
        var str = template.formatChoice(files, model);

    ...the result in _str_ will be:

        There are 2185 files.
*/
enyo.g11n.Template.prototype.formatChoice = function(value, model) {
	try {
		// first split the choices on the vertical bar
		var choices = this.template ? this.template.split('|') : [];
		var limits = [];
		var strings = [];
		var defaultChoice = '';
		var i;
		
		model = model || {};
		
		// the syntax for each choice is <number> # <string>
		// where the number (called a "limit") is separated from the string 
		// by a hash. 
		for (i = 0; i < choices.length; i++) {
			// Note that the string can contain more hashes for 
			// replacement parameters, so only search for the first one with indexOf.
			var index = enyo.indexOf('#', choices[i]);			
			if ( index !== -1 ) {
				limits[i] = choices[i].substring(0,index);
				strings[i] = choices[i].substring(index+1);
				if ( value == limits[i] ) {
					// found exact match, so short circuit the parsing and
					// just format and return the final string right now
					return this._evalHelper(strings[i], model);
				}
				if ( limits[i] === '' ) {
					defaultChoice = strings[i];
				}
			}
			// else ... no hash sign in the choice? Well, just ignore that 
			// choice then because it doesn't conform to the proper syntax
		}
		
		// no exact match, so now check ranges
		for (i = 0; i < limits.length; i++) {
			var theLimit = limits[i];
			if (theLimit) {
				var lastChar = theLimit.charAt(theLimit.length-1);
				var num = parseFloat(theLimit);
				if ( (lastChar === '<' && value < num) || (lastChar === '>' && value > num) ) {
					// take the first range that matches
					return this._evalHelper(strings[i], model);
				}
			}
		}
		
		// no ranges matched, so just use the default choice if there is one.
		return this._evalHelper(defaultChoice, model);
	} catch(e) {
		enyo.error("formatChoice error : ", e);
		return '';
	}
};
