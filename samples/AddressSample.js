enyo.kind({
	name:"g11n.sample.AddressSample",
	kind: "FittableRows",
	classes: "enyo-fit",
	components: [
		{kind: "onyx.Toolbar", content:$L("Addresses")},
		{style: "padding: 10px", components: [
    		{kind: "onyx.InputDecorator",  components: [
    			{name:"numberInput", kind: "onyx.Input", placeholder: "Enter Address String",  
    			    style:"width:100%;", oninput:"inputChanged"}
    		]},
    		{tag:"br"},{tag:"br"},		
    		{kind: "onyx.Groupbox", components: [
    			{kind: "onyx.GroupboxHeader", content: "Address"},
    			{name:"streetAddress", style: 'padding: 8px', content: "Street Address ="},
    			{name:"locality", style: 'padding: 8px', content: "Locality = "},
    			{name:"postalCode", style: 'padding: 8px', content: "Postal Code = "},
    			{name:"region", style: 'padding: 8px', content: "Region = "},
    			{name:"country", style: 'padding: 8px', content: "Country Code = "}
    		]}
    	]}
	],
	inputChanged: function(inSender, inEvent) {
		var address = new enyo.g11n.Address(inSender.getValue())

		try {
			//note we're stripping undefined out of the result to beautify the sample
			this.$.streetAddress.setContent("Street Address = " + address.streetAddress.replace("undefined",""));
			this.$.locality.setContent("Locality = " + address.locality.replace("undefined",""));
			this.$.postalCode.setContent("Postal Code = " + address.postalCode.replace("undefined",""));
			this.$.region.setContent("Region = " + address.region.replace("undefined",""));				
			this.$.country.setContent("Country Code = " + address.countryCode.replace("undefined",""));	
		}
		catch (err){
			enyo.log(err);
		}	
	},
});
