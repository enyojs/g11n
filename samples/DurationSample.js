enyo.kind({
	name:"g11n.sample.DurationSample",
	kind: "FittableRows",
	classes: "enyo-fit",	
	components: [
		{kind: "onyx.Toolbar", content:$L("Duration")},
		{style: "padding: 10px", components: [
    		{kind: "onyx.Groupbox", style:"padding:20px 0;", components: [
    			{kind: "onyx.GroupboxHeader", content: "Duration"},
    			{content:"1 year, 2 months, 3 weeks, 27 days, 8 hours, 9 minutes & 10 seconds", style: 'padding: 8px'}
            ]},
    		{kind: "onyx.Groupbox", components: [
    			{kind: "onyx.GroupboxHeader", content: "Duration Styles"},
    			{name:"DurationExample", style: 'padding: 8px', allowHtml:true},
    			{name:"DurationExample2", style:"padding: 8px;", allowHtml:true},
    			{name:"DurationExample3", style:"padding: 8px;", allowHtml:true}				
            ]}
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
		 this.$.DurationExample.setContent("<b>short:</b>&nbsp;&nbsp;&nbsp;" + durfmt.format(duration));	
		
		 var durfmt2 = new enyo.g11n.DurationFmt({
		     style: "medium",
		     locale: new enyo.g11n.Locale(locale)
		 });
		 this.$.DurationExample2.setContent("<b>medium:</b>&nbsp;&nbsp;&nbsp;" + durfmt2.format(duration));			
	    
	     var durfmt3 = new enyo.g11n.DurationFmt({
 		     style: "long",
 		     locale: new enyo.g11n.Locale(locale)
 		 });
 		 this.$.DurationExample3.setContent("<b>long:</b>&nbsp;&nbsp;&nbsp;" + durfmt3.format(duration));
	}
});
