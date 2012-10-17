enyo.kind({
	name:"g11n.sample.NameSample",
	kind: "FittableRows",
	classes: "enyo-fit",		
	components: [
		{kind: "onyx.Toolbar", content:$L("Names")},
		{style: "padding: 10px", components: [
		    {kind: "onyx.InputDecorator", components: [
    			{name:"numberInput", kind: "onyx.Input", placeholder: "Enter a Name",  style:"width:100%;", oninput:"inputChanged"}
    		]},
    		{tag:"br"},{tag:"br"},		
    		{kind: "onyx.Groupbox", components: [
    			{kind: "onyx.GroupboxHeader", content: "Name"},
    			{name:"givenName", style: 'padding: 8px', content: "Given Name = "},
    			{name:"middleName", style: 'padding: 8px', content: "Middle Name = "},
    			{name:"familyName", style: 'padding: 8px', content: "Family Name = "}
    		]}
    	]}
	],
	inputChanged: function(inSender, inEvent) {
		var name = new enyo.g11n.Name(inSender.getValue())
				
		try {
			//note we're stripping undefined out of the result to beautify the sample
			this.$.givenName.setContent("Given Name = " + (name.givenName ? name.givenName.replace("undefined","") : ""));
			this.$.middleName.setContent("Middle Name = " + (name.middleName ? name.middleName.replace("undefined","") : ""));		
			this.$.familyName.setContent("Family Name = " + (name.familyName ? name.familyName.replace("undefined","") : ""));
		}
		catch (err){
			enyo.log(err);
		}

	},
});
