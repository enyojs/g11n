enyo.kind({
	name:"g11n.sample.NumberSample",
	kind: "FittableRows",
	classes: "enyo-fit",
	components: [
		{kind: "onyx.Toolbar", content:$L("Numbers")},
		{kind: "FittableColumns", style: "padding: 10px", components:[
			{components: [
				{content:$L("Choose Locale:"), classes: "g11n-sample-divider"},		
				{kind: "onyx.PickerDecorator", style:"padding:10px;", onSelect: "pickerHandler", components: [
					{content: "Pick One...", style: "width: 200px"},
					{kind: "onyx.Picker", components: [
						{content: 'en_us', active:true},
						{content: 'en_ca'},
						{content: 'en_ie'},
						{content: 'en_gb'},
						{content: 'en_mx'},
						{content: 'de_de'},
						{content: 'fr_fr'},
						{content: 'fr_ca'},
						{content: 'it_it'},
						{content: 'es_es'},
						{content: 'es_mx'},
						{content: 'es_us'}																																																								
					]}
				]}
			]}			
		]},
		{kind: "onyx.Groupbox", style: "padding: 10px", components: [
			{kind: "onyx.GroupboxHeader", content: "Number"},
			{name:"NumberExample", style: 'padding: 8px'}
		]}
	],
	initComponents: function() {
		this.inherited(arguments);
		var locale = enyo.g11n.currentLocale().getLocale();
		this.formatNumbers(locale);
	},
	pickerHandler: function(inSender, inEvent){
		this.formatNumbers(inEvent.selected.content);		
	},
	formatNumbers: function(locale){
		 var numfmt = new enyo.g11n.NumberFmt({
		     fractionDigits: 1,
		     locale: new enyo.g11n.Locale(locale)
		 });
		 this.$.NumberExample.setContent("33333.3 in " + locale + " = " + numfmt.format(33333.3));		
	}
});
