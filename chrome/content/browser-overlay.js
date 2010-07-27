var hidebookmarksbar = 
{
	prefs: null,
	visible: true,
	
	onLoad: function()
	{
		var self = this;
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
		
		/* Firefox 4: Dropdown of Bookmarks-Button */
		if(document.getElementById("BMB_viewBookmarksToolbar"))
		{
			var menuitem = document.getElementById("BMB_viewBookmarksToolbar");
			var label = [];
			var modifiers = this.prefs.getCharPref("shortcut.modifiers");
			if(modifiers.indexOf("accel") != -1)
			{
				if(/^Mac/.test(navigator.platform))
					label.push(key.getAttribute("cmdlabel"));
				else
					label.push(key.getAttribute("ctrllabel"));
			}
			if(modifiers.indexOf("shift") != -1)
				label.push(key.getAttribute("shiftlabel"));
			if(modifiers.indexOf("alt") != -1)
				label.push(key.getAttribute("altlabel"));
			label.push(this.prefs.getCharPref("shortcut.key"));
			menuitem.setAttribute("acceltext", label.join("+"));
			
			this.oldOnViewToolbarCommand = window.onViewToolbarCommand
			window.onViewToolbarCommand = function(aEvent)
			{
				self.oldOnViewToolbarCommand(aEvent);
				
				var visible = aEvent.originalTarget.getAttribute("checked") == "true";
				/* If the preference is already as it should be set, we must toggle it twice */
				if(self.prefs.getBoolPref("visible") == visible)
					self.prefs.setBoolPref("visible", !visible);
				self.prefs.setBoolPref("visible", visible);
			}
		}
		
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
		if(window.setToolbarVisibility)
			window.setToolbarVisibility(toolbar, this.visible); // Firefox 4
		else
			toolbar.collapsed = !this.visible; // pre Firefox 4
	},
	
	openOptions: function()
	{
		window.open("chrome://hidebookmarksbar/content/options.xul", "hidebooksmarksoptions", "chrome, dialog, centerscreen, alwaysRaised")
	}
};

window.addEventListener("load",   function(e){hidebookmarksbar.onLoad();  }, false);
window.addEventListener("unload", function(e){hidebookmarksbar.onUnload();}, false);

