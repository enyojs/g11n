enyo.kind({
	name:"g11n.sample.PhoneSample",
	kind: "FittableRows",
	classes: "enyo-fit",
	components: [
		{kind: "onyx.Toolbar", content:$L("Phone Numbers")},
		{style: "padding: 10px", components: [
    		{kind: "onyx.InputDecorator", components: [
    			{name:"numberInput", kind: "onyx.Input", placeholder: "Enter phone #", oninput:"inputChanged"}
    		]},
    		{tag:"br"},{tag:"br"},		
    		{kind: "onyx.Groupbox", components: [
    			{kind: "onyx.GroupboxHeader", content: "Phone"},
    			{name:"formattedNumber", style: 'padding: 8px', content: "Formatted Number ="},
    			{name:"areaCode", style: 'padding: 8px', content: "Area Code = "},
    			{name:"subscriberNumber", style: 'padding: 8px', content: "Subscriber Number = "},
    			{name:"locale", style: 'padding: 8px', content: "Locale = "},
    			{name:"location", style: 'padding: 8px', content: "Area = "},
    			{name:"country", style: 'padding: 8px', content: "Country = "}
    		]}
    	]}
	],
	inputChanged: function(inSender, inEvent) {
		var geo = new enyo.g11n.GeoLocator();
		
		var phoneNumber = new enyo.g11n.PhoneNumber(inSender.getValue())
		
		var phoneFormat = new enyo.g11n.PhoneFmt()
		
		try {
			//note we're stripping undefined out of the result to beautify the sample
			this.$.formattedNumber.setContent("Formatted Number = " + phoneFormat.format(phoneNumber));
			this.$.areaCode.setContent("Area Code = " + phoneNumber.areaCode.replace("undefined",""));
			this.$.subscriberNumber.setContent("Subscriber Number = " +
				phoneNumber.subscriberNumber.replace("undefined",""));
			this.$.locale.setContent("Locale = " + phoneNumber.locale.language + "_" +
				phoneNumber.locale.region.replace("undefined",""));
		
			var location = geo.locate(phoneNumber);
			this.$.location.setContent("Area = " + location.area.ln.replace("undefined",""));
			this.$.country.setContent("Country = " + location.country.sn.replace("undefined",""));	
		}
		catch (err){
			enyo.log(err);
		}	
	},
});
