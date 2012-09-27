enyo.kind({
	name:"g11n.sample.NameSample",
	kind: "FittableRows",
	components: [
		{kind: "onyx.Toolbar", content:$L("Names")},
		{tag:"br"},
		{kind: "onyx.InputDecorator", components: [
			{name:"numberInput", kind: "onyx.Input", placeholder: "Enter a Name",  style:"width:250px;", oninput:"inputChanged"}
		]},
		{tag:"br"},{tag:"br"},		
		{style:"width:100%;height:5px;background-color:black;margin-bottom:5px;"},
		{caption: "Strings", components: [
			{name:"familyName"},
			{name:"givenName"},
			{name:"middleName"}
		]}
	],
	inputChanged: function(inSender, inEvent) {
		var name = new enyo.g11n.Name(inSender.getValue())

		try {
			this.$.familyName.setContent("Family Name = " + name.familyName);
			this.$.givenName.setContent("Given Name = " + name.givenName);
			this.$.middleName.setContent("Middle Name = " + name.middleName);
		}
		catch (err){
			enyo.log(err);
		}	
	},
});
