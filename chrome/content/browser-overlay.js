var hidebookmarksbar = 
{
	prefs: null,
	visible: true,
	
	onLoad: function()
	{
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("extensions.hidebookmarksbar.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.prefs.addObserver("", this, false);
		
		var key = document.getElementById("hidebookmarksbarKeyset");
		key.setAttribute("modifiers", this.prefs.getCharPref("shortcut.modifiers"));
		key.setAttribute("key",       this.prefs.getCharPref("shortcut.key"));
		key.setAttribute("disabled", !this.prefs.getBoolPref("shortcut.enabled"));
		
		var startup = this.prefs.getIntPref("startup");
		if(startup < 2)
			this.visible = !!startup;
		else
			this.visible = this.prefs.getBoolPref("visible");
		
		this.setMode();
		
		var popup = document.getElementById("hidebookmarksbarButton");
		popup.type = this.prefs.getBoolPref(data) ? "menu-button" : "button";
	},
	
	onUnload: function()
	{
		this.prefs.removeObserver("", this);
	},
	
	observe: function(subject, topic, data)
	{
		if (topic != "nsPref:changed")
		{
			return;
		}
		
		switch(data)
		{
			case "visible":
				this.visible = this.prefs.getBoolPref(data);
				this.setMode();
				break;
			
			case "popup":
				var popup = document.getElementById("hidebookmarksbarButton");
				popup.type = this.prefs.getBoolPref(data) ? "menu-button" : "button";
				break;
		}
	},
	
	toggle: function()
	{
		this.prefs.setBoolPref("visible", !this.visible);
	},
	
	setMode: function()
	{
		var toolbar = document.getElementById("PersonalToolbar");
		toolbar.collapsed = !this.visible;
	},
	
	openOptions: function()
	{
		window.open("chrome://hidebookmarksbar/content/options.xul", "hidebooksmarksoptions", "chrome, dialog, centerscreen, alwaysRaised")
	}
};

window.addEventListener("load",   function(e){hidebookmarksbar.onLoad();  }, false);
window.addEventListener("unload", function(e){hidebookmarksbar.onUnload();}, false);

