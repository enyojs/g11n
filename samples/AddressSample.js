enyo.kind({
	name:"g11n.sample.AddressSample",
	kind: "FittableRows",
	components: [
		{kind: "onyx.Toolbar", content:$L("Addresses")},
		{tag:"br"},
		{kind: "onyx.InputDecorator", components: [
			{name:"numberInput", kind: "onyx.Input", placeholder: "Enter Address String",  style:"width:310px;", oninput:"inputChanged"}
		]},
		{tag:"br"},{tag:"br"},		
		{style:"width:100%;height:5px;background-color:black;margin-bottom:5px;"},
		{caption: "Strings", components: [
			{name:"streetAddress"},
			{name:"locality"},
			{name:"postalCode"},
			{name:"region"},
			{name:"country"}
		]}
	],
	inputChanged: function(inSender, inEvent) {
		var address = new enyo.g11n.Address(inSender.getValue())

		try {
			this.$.streetAddress.setContent("Street Address = " + address.streetAddress);
			this.$.locality.setContent("Locality = " + address.locality);
			this.$.postalCode.setContent("Postal Code = " + address.postalCode);
			this.$.region.setContent("Region = " + address.region);				
			this.$.country.setContent("Country Code = " + address.countryCode);	
		}
		catch (err){
			enyo.log(err);
		}	
	},
});
