enyo.kind({
	name:"g11n.sample.LocalizedCssSample",
	kind: "FittableRows",
	classes:"enyo-fit g11n-text-color",
	components: [
		{kind: "onyx.Toolbar", content:$L("Localized CSS")},
		{style: "padding: 10px", components: [
        	{content:"If your current language is on this list then this text should be one of the following colors."},
        	{tag:"br"},
        	{content:"English: Blue"},
        	{content:"Spanish: Red"},
        	{content:"French: Yellow"},
        	{content:"Italian: Green"},
        	{content:"German: Purple"},								
        	{tag:"br"},
        	{content:"If your language is not on this list then the text will be black."}
        ]}
	]
});
