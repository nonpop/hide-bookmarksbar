var hidebookmarksbar = 
{
	prefs: null,         // pref system
	visible: false,      // if the toolbar should be visible according to the preferences (manual mode)
	popups: 0,           // if there are any popups (menus) open (which should prevent the toolbar from hiding)
	hovered: false,      // if the toolbar should be visible because of the mouse position (hover mode)
	hoverEnabled: false, // hover mode enabled?
	hoverType: 0,        // which hover type (complete toolbox or only button)
	hoverDelay: 0,       // delay between mouseout and hiding (only in hover mode)
	timeout: null,       // timeout for delay
	lastURI: null,       // for detecting tab changes
	
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
			if(this.prefs.getBoolPref("shortcut.enabled"))
			{
				var menuitem = document.getElementById("BMB_viewBookmarksToolbar");
				
				var label = [];
				var modifiers = this.prefs.getCharPref("shortcut.modifiers");
				if(modifiers.indexOf("accel") != -1)
				{
					if(navigator.platform.indexOf("Mac") == 0)
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
			}
			
			this.oldOnViewToolbarCommand = window.onViewToolbarCommand
			window.onViewToolbarCommand = function(aEvent)
			{
				hidebookmarksbar.oldOnViewToolbarCommand(aEvent);
				if(!hidebookmarksbar.hoverEnabled)
				{
					var visible = aEvent.originalTarget.getAttribute("checked") == "true";
					
					// If the preference is already as it should be set, we must toggle it twice
					if(hidebookmarksbar.prefs.getBoolPref("visible") == visible)
						hidebookmarksbar.prefs.setBoolPref("visible", !visible);
					hidebookmarksbar.prefs.setBoolPref("visible", visible);
				}
				
				hidebookmarksbar.setVisible();
			}
		}
		
		// Show the toolbar for a short moment to load the bookmarks
		this.visible = true;
		this.hovered = true;
		this.setVisible();
		this.hovered = false;
		
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
		
		var button = document.getElementById("hidebookmarksbarButton");
		if(button)
			button.type = this.prefs.getBoolPref("popup") ? "menu-button" : "button";
		
		this.hoverSetup();
		
		this.setVisible();
		
		gBrowser.addEventListener("load", this.tabChange, true);
		gBrowser.tabContainer.addEventListener("TabOpen", this.tabChange, false);
		gBrowser.tabContainer.addEventListener("TabMove", this.tabChange, false);
		gBrowser.tabContainer.addEventListener("TabClose", this.tabChange, false);
		gBrowser.tabContainer.addEventListener("TabSelect", this.tabChange, false);
		
		var locationListener =
		{
			QueryInterface: function(aIID)
			{
				if (aIID.equals(Components.interfaces.nsIWebProgressListener) || aIID.equals(Components.interfaces.nsISupportsWeakReference) || aIID.equals(Components.interfaces.nsISupports)) return this;
				throw Components.results.NS_NOINTERFACE;
			},
			onLocationChange: this.tabChange
		}
		gBrowser.addProgressListener(locationListener);
		this.tabChange();
	},
	
	tabChange: function()
	{
		var uri = gBrowser.getBrowserForTab(gBrowser.selectedTab).currentURI.spec;
		
		if(uri == hidebookmarksbar.lastURI)
			return;
		hidebookmarksbar.lastURI = uri;
		
		var isHomePage = gHomeButton.getHomePage().split("|").indexOf(uri) != -1;
		var isBlank = (uri == "about:blank");
		
		var display = isHomePage || isBlank;
		
		var pref = hidebookmarksbar.prefs.getBoolPref(display ? "autoShow" : "autoHide");
		if(pref)
		{
			hidebookmarksbar.visible = display;
			hidebookmarksbar.setVisible();
		}
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
				this.setVisible();
				break;
			
			case "popup":
				var button = document.getElementById("hidebookmarksbarButton");
				if(button)
					button.type = this.prefs.getBoolPref(data) ? "menu-button" : "button";
				break;
			
			case "hover.enabled":
			case "hover.type":
			case "hover.delay":
				this.hoverSetup();
				this.setVisible();
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
	
	setVisible: function()
	{
		if(this.timeout)
			clearTimeout(this.timeout);
		this.timeout = null;
		
		var display = this.hoverEnabled ? (this.hovered || 0 != this.popups) : this.visible;
		
		if(this.hoverEnabled && !display)
		{
			this.timeout = setTimeout(function()
			{
				var toolbar = document.getElementById("PersonalToolbar");
				if(window.setToolbarVisibility)
					window.setToolbarVisibility(toolbar, display); // Firefox 4
				else
					toolbar.collapsed = !display; // pre Firefox 4
			}, this.hoverDelay);
		}
		else
		{
			var toolbar = document.getElementById("PersonalToolbar");
			if(window.setToolbarVisibility)
				window.setToolbarVisibility(toolbar, display); // Firefox 4
			else
				toolbar.collapsed = !display; // pre Firefox 4
		}
	},
	
	openOptions: function()
	{
		window.open("chrome://hidebookmarksbar/content/options.xul", "hidebooksmarksoptions", "chrome, dialog, centerscreen, alwaysRaised")
	},
	
	
	hoverSetup: function()
	{
		this.popups = 0;
		
		this.hoverType    = this.prefs.getIntPref ("hover.type");
		this.hoverEnabled = this.prefs.getBoolPref("hover.enabled");
		this.hoverDelay   = this.prefs.getIntPref ("hover.delay");
		
		/* Firefox 4 only */
		var buttonView = document.getElementById("BMB_viewBookmarksToolbar");
		if(buttonView)
			buttonView.setAttribute("hoverMode", this.hoverEnabled?"true":"false");
		
		var buttonHide = document.getElementById("hidebookmarksbarButton");
		var buttonMenu = document.getElementById("bookmarks-menu-button-container"); // Firefox 4 only
		var toolbox    = document.getElementById("navigator-toolbox");
		var menuitem   = document.getElementById("PersonalToolbar");
		
		/* Remove all handlers first (in case the preference was changed) */
		buttonHide.removeEventListener("mouseover", this.onMouseOver, false);
		if(buttonMenu)
			buttonMenu.removeEventListener("mouseover",   this.onMouseOver,   false);
		toolbox.removeEventListener(     "mouseover",   this.onMouseOver,   false);
		toolbox.removeEventListener(     "mouseout",    this.onMouseOut,    false);
		menuitem.removeEventListener(    "popupshown",  this.onPopupshown,  false);
		menuitem.removeEventListener(    "popuphidden", this.onPopuphidden, false);
		
		/* Now add the appropriate handlers */
		switch(this.hoverType)
		{
			case 0:
				if(buttonMenu)
					buttonMenu.addEventListener("mouseover",   this.onMouseOver,   false);
				buttonHide.addEventListener(  "mouseover",   this.onMouseOver,   false);
				toolbox.addEventListener(     "mouseout",    this.onMouseOut,    false);
				menuitem.addEventListener(    "mouseover",   this.onMouseOver,   false);
				menuitem.addEventListener(    "mouseup",     this.onMouseOver,   false);
				menuitem.addEventListener(    "popupshown",  this.onPopupshown,  false);
				menuitem.addEventListener(    "popuphidden", this.onPopuphidden, false);
				break;
			
			case 1:
				toolbox.addEventListener( "mouseover",   this.onMouseOver,   false);
				toolbox.addEventListener( "mouseout",    this.onMouseOut,    false);
				menuitem.addEventListener("mouseover",   this.onMouseOver,   false);
				menuitem.addEventListener("mouseup",     this.onMouseOver,   false);
				menuitem.addEventListener("popupshown",  this.onPopupshown,  false);
				menuitem.addEventListener("popuphidden", this.onPopuphidden, false);
				break;
		}
	},
	
	onMouseOver: function(ev)
	{
		hidebookmarksbar.hovered = true;
		hidebookmarksbar.setVisible();
	},
	
	onMouseOut: function(ev)
	{
		var toolbox = document.getElementById("navigator-toolbox");
		
		if(ev.relatedTarget != null) // if relatedTarget is null, the cursor just left the window
		{
			// check if relatedTarget is within navigator-toolbox
			var el = ev.relatedTarget;
			
			while(el)
			{
				if(el == toolbox) // it is. Ignore the event
					return;
				el = el.parentNode;
			}
		}
		
		hidebookmarksbar.hovered = false;
		hidebookmarksbar.setVisible();
	},
	
	onPopupshown: function(ev)
	{
		hidebookmarksbar.popups++;
		hidebookmarksbar.setVisible();
	},
	
	onPopuphidden: function(ev)
	{
		hidebookmarksbar.popups--;
		hidebookmarksbar.setVisible();
	}
};

window.addEventListener("load",   function(e){hidebookmarksbar.onLoad();  }, false);
window.addEventListener("unload", function(e){hidebookmarksbar.onUnload();}, false);

