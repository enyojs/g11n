enyo.kind({
	name: "g11n.sample.DateSample",
	kind: "FittableRows",
	classes: "enyo-fit",	
	components: [
		{kind: "onyx.Toolbar", content:$L("Dates")},
		{kind: "FittableColumns", style: "padding: 10px", components:[
			{components: [
				{content:$L("Choose Locale"), classes: "g11n-sample-divider"},		
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
			{kind: "onyx.GroupboxHeader", content: "Date"},
			{name:"dateExample", style: 'padding: 8px', content: "Current date"},
		]}
	],
	initComponents: function() {
		this.inherited(arguments);
		var locale = enyo.g11n.currentLocale().getLocale();
		this.format(locale);
	},
	pickerHandler: function(inSender, inEvent){
		this.format(inEvent.selected.content);
	},
	format: function(locale){
		this.formatDates(locale);
	},
	formatDates: function(locale){
		var fmt = new enyo.g11n.DateFmt({
		     date: "short",
		     time: "short",
		     locale: new enyo.g11n.Locale(locale)
		});
		this.$.dateExample.setContent("Current date in " + locale + " = " + fmt.format(new Date()));
	}
});
