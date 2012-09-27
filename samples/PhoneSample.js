enyo.kind({
	name:"g11n.sample.PhoneSample",
	kind: "FittableRows",
	components: [
		{kind: "onyx.Toolbar", content:$L("Phone Numbers")},
		{tag:"br"},
		{kind: "onyx.InputDecorator", components: [
			{name:"numberInput", kind: "onyx.Input", placeholder: "Enter phone #", oninput:"inputChanged"}
		]},
		{tag:"br"},{tag:"br"},		
		{style:"width:100%;height:5px;background-color:black;margin-bottom:5px;"},
		{caption: "Strings", components: [
			{name:"formattedNumber"},
			{name:"areaCode"},
			{name:"subscriberNumber"},
			{name:"locale"},
			{name:"location"},
			{name:"country"}
		]}
	],
	inputChanged: function(inSender, inEvent) {
		var geo = new enyo.g11n.GeoLocator();
		
		var phoneNumber = new enyo.g11n.PhoneNumber(inSender.getValue())
		
		var phoneFormat = new enyo.g11n.PhoneFmt()
		
		try {
			this.$.formattedNumber.setContent("formatted # = " + phoneFormat.format(phoneNumber));
			this.$.areaCode.setContent("Area Code = " + phoneNumber.areaCode);
			this.$.subscriberNumber.setContent("Subscriber Number = " + phoneNumber.subscriberNumber);
			this.$.locale.setContent("Locale = " + phoneNumber.locale.language + "_" + phoneNumber.locale.region);
		
			var location = geo.locate(phoneNumber);
			this.$.location.setContent("Area = " + location.area.ln);
			this.$.country.setContent("Country = " + location.country.sn);	
		}
		catch (err){
			enyo.log(err);
		}	
	},
});
