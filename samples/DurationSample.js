enyo.kind({
	name:"g11n.sample.DurationSample",
	kind: "FittableRows",
	components: [
		{kind: "onyx.Toolbar", content:$L("Duration")},
		{kind: "FittableColumns", components:[
			{components: [
				{content:$L("Pick a Locale to use:")},		
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
			]},
			{style:"padding-left:60px;", components:[
				{name:"currentLocale"},			
				{name:"language"},
				{name:"dialect"},
				{name:"timezone"}				
			]},					
		]},
		{style:"width:100%;height:5px;background-color:black;margin-bottom:5px;"},
		{caption: "Duration", components: [
			{name:"DurationExample", allowHtml:true},
			{name:"DurationExample2", style:"padding-top:10px;", allowHtml:true}				
		]}
	],
	initComponents: function() {
		this.inherited(arguments);
			
		var locale = enyo.g11n.currentLocale().getLocale();
       	this.$.currentLocale.setContent("System locale = " + locale);
        this.$.language.setContent("System language = " + locale.language);
        this.$.dialect.setContent("System region = " + locale.region);
		this.$.timezone.setContent("System timezone = " + (new enyo.g11n.TzFmt()).getCurrentTimeZone());

		this.format(locale);
	},
	pickerHandler: function(inSender, inEvent){
		this.format(inEvent.selected.content);
	},
	format: function(locale){
		this.formatDuration(locale);
	},
	formatDuration: function(locale){
		 var durfmt = new enyo.g11n.DurationFmt({
		     style: "short",
		     locale: new enyo.g11n.Locale(locale)
		 });
		 var duration = {
			years: 1,
			months: 2,
			weeks: 3,
			days: 27,
			hours: 8,
			minutes: 9,
			seconds: 10
		}
		 this.$.DurationExample.setContent("1 year, 2 months, 3 weeks, 27 days, 8 hours, 9 minutes & 10 seconds in " + locale + " in short form = <br>" + durfmt.format(duration));	
		
		 var durfmt2 = new enyo.g11n.DurationFmt({
		     style: "long",
		     locale: new enyo.g11n.Locale(locale)
		 });
		 this.$.DurationExample2.setContent("1 year, 2 months, 3 weeks, 27 days, 8 hours, 9 minutes & 10 seconds in " + locale + " in medium form = <br>" + durfmt2.format(duration));			
	}
});
