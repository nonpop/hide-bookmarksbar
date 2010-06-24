var hidebookmarksbar = 
{
	prefs: null,
	visible: true,
	
	onLoad: function()
	{
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var enumerator = wm.getEnumerator("navigator:browser");
		for(var i=0;enumerator.hasMoreElements();i++)
		{
			enumerator.getNext();
			if(i>=2)
				break;
		}
		var firstwindow = (i==1);
		
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
		                       .getService(Components.interfaces.nsIPrefService)
		                       .getBranch("extensions.hidebookmarksbar.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.prefs.addObserver("", this, false);
		
		var key = document.getElementById("hidebookmarksbarKeyset");
		key.setAttribute("modifiers", this.prefs.getCharPref("shortcut.modifiers"));
		key.setAttribute("key",       this.prefs.getCharPref("shortcut.key"));
		key.setAttribute("disabled", !this.prefs.getBoolPref("shortcut.enabled"));
		
		if(firstwindow)
			var startup = this.prefs.getIntPref("startup");
		else
			var startup = this.prefs.getIntPref("newwindow");
		
		if(startup < 2)
			this.visible = !!startup;
		else
			this.visible = this.prefs.getBoolPref("visible");
		
		if(firstwindow)
			this.prefs.setBoolPref("visible", this.visible);
		
		this.setMode();
		
		var button = document.getElementById("hidebookmarksbarButton");
		if(button)
			button.type = this.prefs.getBoolPref("popup") ? "menu-button" : "button";
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
				var button = document.getElementById("hidebookmarksbarButton");
				if(button)
					button.type = this.prefs.getBoolPref(data) ? "menu-button" : "button";
				break;
		}
	},
	
	toggle: function()
	{
		/* If the preference is already as it should be set, we must toggle it twice */
		if(this.prefs.getBoolPref("visible") != this.visible)
			this.prefs.setBoolPref("visible", this.visible);
		
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

