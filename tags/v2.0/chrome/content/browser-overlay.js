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
		
		document.getElementById("PersonalToolbar").setAttribute("fullscreentoolbar", "true");
		
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
		                       .getService(Components.interfaces.nsIPrefService)
		                       .getBranch("extensions.hidebookmarksbar.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.prefs.addObserver("", this, false);
		
		var key = document.getElementById("hidebookmarksbarKeyset");
		key.setAttribute("modifiers", this.prefs.getCharPref("shortcut.modifiers"));
		key.setAttribute("key",       this.prefs.getCharPref("shortcut.key"));
		key.setAttribute("disabled", !this.prefs.getBoolPref("shortcut.enabled"));
		
		// Firefox 4: Dropdown of Bookmarks-Button
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
				// If the preference is already as it should be set, we must toggle it twice
				if(self.prefs.getBoolPref("visible") == visible)
					self.prefs.setBoolPref("visible", !visible);
				self.prefs.setBoolPref("visible", visible);
			}
		}
		
		// Show the toolbar for a short moment to load the bookmarks
		this.visible = true;
		this.setMode();
		
		
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
		
		this.hoverModeSetup();
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
			
			case "hover":
				this.hoverModeSetup();
				break;
		}
	},
	
	toggle: function()
	{
		// If the preference is already as it should be set, we must toggle it twice
		if(this.prefs.getBoolPref("visible") != this.visible)
			this.prefs.setBoolPref("visible", this.visible);
		
		this.prefs.setBoolPref("visible", !this.visible);
		
		if(window.fullScreen)
			FullScreen.mouseoverToggle(true);
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
	},
	
	hoverModePopup: 0,
	
	hoverModeSetup: function()
	{
		this.hoverMode = this.prefs.getIntPref("hover");
		
		var buttonHide = document.getElementById("hidebookmarksbarButton");
		var buttonMenu = document.getElementById("bookmarks-menu-button-container"); // Firefox 4 only
		var toolbox    = document.getElementById("navigator-toolbox");
		var menuitem   = document.getElementById("personal-bookmarks");
		
		buttonHide.removeEventListener("mouseover", this.hoverModeMouseOver, false);
		if(buttonMenu)
			buttonMenu.removeEventListener("mouseover", this.hoverModeMouseOver, false);
		toolbox.removeEventListener("mouseover", this.hoverModeMouseOver, false);
		toolbox.removeEventListener("mouseout", this.hoverModeMouseOut, false);
		menuitem.removeEventListener("popupshown", this.hoverModePopupshown, false);
		menuitem.removeEventListener("popuphidden", this.hoverModePopuphidden, false);
		
		toolbox.removeAttribute("bookmarksbarHover");
		
		
		switch(this.hoverMode)
		{
			case 1:
				buttonHide.addEventListener("mouseover", this.hoverModeMouseOver, false);
				if(buttonMenu)
					buttonMenu.addEventListener("mouseover", this.hoverModeMouseOver, false);
				toolbox.addEventListener("mouseout", this.hoverModeMouseOut, false);
				menuitem.addEventListener("popupshown", this.hoverModePopupshown, false);
				menuitem.addEventListener("popuphidden", this.hoverModePopuphidden, false);
				break;
			
			case 2:
				toolbox.addEventListener("mouseover", this.hoverModeMouseOver, false);
				toolbox.addEventListener("mouseout", this.hoverModeMouseOut, false);
				menuitem.addEventListener("popupshown", this.hoverModePopupshown, false);
				menuitem.addEventListener("popuphidden", this.hoverModePopuphidden, false);
				break;
		}
	},
	
	hoverModeMouseOver: function(ev)
	{
		var toolbox = document.getElementById("navigator-toolbox");
		toolbox.setAttribute("bookmarksbarHover", "true");
	},
	
	hoverModeMouseOut: function(ev)
	{
		var toolbox = document.getElementById("navigator-toolbox");
		
		if(hidebookmarksbar.hoverModePopup > 0) // a menu is opened, don't hide
			return;
		
		if(ev.relatedTarget != null) // if relatedTarget is null, the cursor just left the window
		{
			// check if relatedTarget is within navigator-toolbox
			var el = ev.relatedTarget;
			while(el)
			{
				if(el == toolbox)
					return;
				el = el.parentNode;
			}
		}
		
		toolbox.removeAttribute("bookmarksbarHover");
	},
	
	hoverModePopupshown: function(ev)
	{
		hidebookmarksbar.hoverModePopup++;
	},
	
	hoverModePopuphidden: function(ev)
	{
		hidebookmarksbar.hoverModePopup--;
	}
};

window.addEventListener("load",   function(e){hidebookmarksbar.onLoad();  }, false);
window.addEventListener("unload", function(e){hidebookmarksbar.onUnload();}, false);

