var hidebookmarksbar = 
{
	onLoad: function()
	{
		document.getElementById("PersonalToolbar").setAttribute("fullscreentoolbar", "true");
		
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
		                       .getService(Components.interfaces.nsIPrefService)
		                       .getBranch("extensions.hidebookmarksbar.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.prefs.addObserver("", this, false);
		
		
		// don't move bookmarks button
		if(window.BookmarksMenuButton && window.BookmarksMenuButton.updatePosition)
		{
			this.oldBMBupdatePosition = window.BookmarksMenuButton.updatePosition;
			window.BookmarksMenuButton.updatePosition = this.BMBupdatePosition;
		}
		
		/* changes to toolbar layout */
		window.addEventListener("aftercustomization", this.onToolbarChange, false);
		this.onToolbarChange();
		
		this.manual.visible = this.prefs.getBoolPref("manual.visible");
		this.manual.enabled = this.prefs.getBoolPref("manual.enabled");
		this.hover.enabled  = this.prefs.getBoolPref("hover.enabled");
		this.auto.enabled   = this.prefs.getBoolPref("auto.enabled");
		
		hidebookmarksbar.manual.onLoad();
		hidebookmarksbar.auto.onLoad();
		hidebookmarksbar.hover.onLoad();
		
		// Show the toolbar for a short moment to load the bookmarks
		this.setVisibility(true);
		this.setVisibility();
	},
	
	openOptions: function()
	{
		window.open("chrome://hidebookmarksbar/content/options.xul", "hidebooksmarksoptions", "alwaysRaised, centerscreen, chrome, dialog, titlebar, toolbar")
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
			case "button.disableMove":
			case "button.type":
			case "button.commands.toolbar":
			case "button.commands.sidebar":
			case "button.commands.manager":
			case "button.commands.settings":
				this.onToolbarChange();
				break;
			
			case "manual.enabled":
				this.manual.enabled = this.prefs.getBoolPref(data);
				this.setVisibility();
				break;
			case "manual.visible":
				this.manual.visible = this.prefs.getBoolPref(data);
				this.setVisibility();
				break;
			
			case "hover.enabled":
				this.auto.enabled = this.prefs.getBoolPref(data);
				this.setVisibility();
				break;
			case "hover.type":
				this.hover.setEventListener();
				break;
			
			case "auto.enabled":
				this.auto.enabled = this.prefs.getBoolPref(data);
				this.setVisibility();
				break;
			case "auto.homepage":
			case "auto.blank":
			case "auto.other":
				this.auto.lastURI = -1;
				this.auto.locationChange();
				break;
		}
	},
	
	setVisibility: function(forceVisible)
	{
		var visible =
		(  forceVisible
		|| (hidebookmarksbar.manual.enabled && hidebookmarksbar.manual.visible)
		|| (hidebookmarksbar.hover.enabled  && hidebookmarksbar.hover.visible)
		|| (hidebookmarksbar.auto.enabled   && hidebookmarksbar.auto.visible)
		)
		
		var toolbar = document.getElementById("PersonalToolbar");
		setToolbarVisibility(toolbar, visible);
	},
	
	onToolbarChange: function()
	{
		hidebookmarksbar.BMBupdatePosition();
		
		var button = document.getElementById("bookmarks-menu-button");
		if(button)
		{
			button.removeEventListener("command", hidebookmarksbar.onToolbarButtonClick, false);
			button.   addEventListener("command", hidebookmarksbar.onToolbarButtonClick, false);
			
			switch(hidebookmarksbar.prefs.getIntPref("button.type"))
			{
				case 0:
					button.setAttribute("type", "menu");
					break;
				
				case 1:
					button.removeAttribute("type");
					break;
				
				default:
					button.setAttribute("type", "menu-button");
			}
		}
	},
	
	onToolbarButtonClick: function(ev)
	{
		if(ev.target != this)
			return
		
		if(hidebookmarksbar.prefs.getBoolPref("manual.enabled"))
			hidebookmarksbar.manual.toggle();
		else
			toggleSidebar('viewBookmarksSidebar');
	},
	
	BMBupdatePosition: function()
	{
		if(!window.BookmarksMenuButton)
			return;
		
		hidebookmarksbar.oldBMBupdatePosition.call(window.BookmarksMenuButton);
		
		var container = window.BookmarksMenuButton.buttonContainer;
		var button = window.BookmarksMenuButton.button;
		
		var disableMove = hidebookmarksbar.prefs.getBoolPref("button.disableMove");
		
		if(disableMove && container && button)
		{
			if(button.parentNode != container)
			{
				if(button.parentNode)
					button.parentNode.removeChild(button);
				container.appendChild(button);
				
				window.BookmarksMenuButton._updateStyle();
			}
		}
	},
	
	manual:
	{
		onLoad: function()
		{
			var key = document.getElementById("hidebookmarksbarKey");
			key.setAttribute("modifiers", hidebookmarksbar.prefs.getCharPref("manual.shortcut.modifiers"));
			key.setAttribute("key",       hidebookmarksbar.prefs.getCharPref("manual.shortcut.key"));
			key.setAttribute("disabled", !hidebookmarksbar.prefs.getBoolPref("manual.shortcut.enabled"));
		
			hidebookmarksbar.manual.oldOnViewToolbarCommand = window.onViewToolbarCommand
			window.onViewToolbarCommand = function(aEvent)
			{
				if(aEvent.originalTarget.getAttribute("toolbarId") == "PersonalToolbar")
					hidebookmarksbar.manual.toggle();
				else
					hidebookmarksbar.manual.oldOnViewToolbarCommand(aEvent);
			}
		},
		
		toggle: function()
		{
			var visible = hidebookmarksbar.prefs.getBoolPref("manual.visible");
			hidebookmarksbar.prefs.setBoolPref("manual.visible", !visible);
		}
	},
	
	hover:
	{
		popups: 0,
		timeout: null,
		
		onLoad: function()
		{
			var toolbar = document.getElementById("PersonalToolbar");
			var toolbox = document.getElementById("navigator-toolbox");
			
			toolbox.addEventListener("mouseout",    this.onMouseOut,    false);
			toolbar.addEventListener("popupshown",  this.onPopupshown,  false);
			toolbar.addEventListener("popuphidden", this.onPopuphidden, false);
			
			this.setEventListener();
		},
		
		setEventListener: function()
		{
			var hoverType    = hidebookmarksbar.prefs.getIntPref ("hover.type");
			
			var toolbox = document.getElementById("navigator-toolbox");
			var hoverItems =
			[
				[ /* button only */
					document.getElementById("bookmarks-menu-button-container"),
					document.getElementById("bookmarks-button")
				],
				[ /* any toolbar */
					toolbox
				]
			];
			
			/* Remove all handlers first (in case the preference was changed) */
			for(let i=0;i<hoverItems.length;i++)
			{
				for(let j=0;j<hoverItems[i].length;j++)
				{
					var element = hoverItems[i][j];
					if(element && element.removeEventListener)
						element.removeEventListener("mouseover", this.onMouseOver, false);
				}
			}
			
			/* Now add the appropriate handlers */
			if(hoverItems[hoverType])
			{
				for(let j=0;j<hoverItems[hoverType].length;j++)
				{
					var element = hoverItems[hoverType][j];
					if(element && element.addEventListener)
						element.addEventListener("mouseover", this.onMouseOver, false);
				}
			}
		},
		
		onMouseOver: function(ev)
		{
			hidebookmarksbar.hover.hovered = true;
			hidebookmarksbar.hover.setVisibility();
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
			
			hidebookmarksbar.hover.hovered = false;
			hidebookmarksbar.hover.setVisibility();
		},
		
		onPopupshown: function(ev)
		{
			hidebookmarksbar.hover.popups++;
			hidebookmarksbar.hover.setVisibility();
		},
		
		onPopuphidden: function(ev)
		{
			hidebookmarksbar.hover.popups--;
			hidebookmarksbar.hover.setVisibility();
		},
		
		setVisibility: function()
		{
			if(this.timeout)
			{
				clearTimeout(this.timeout);
				this.timeout = null;
			}
			
			var visible = (this.popups > 0 || this.hovered)
			if(visible)
			{
				this.visible = true;
				hidebookmarksbar.setVisibility();
			}
			else
			{
				this.timeout = setTimeout(function()
				{
					hidebookmarksbar.hover.visible = false;
					hidebookmarksbar.setVisibility();
				}, hidebookmarksbar.prefs.getIntPref("hover.delay"));
			}
		}
	},
	
	auto:
	{
		lastURI: -1,
		onLoad: function()
		{
			gBrowser.addEventListener("load", this.locationChange, true);
			gBrowser.tabContainer.addEventListener("TabOpen", this.locationChange, false);
			gBrowser.tabContainer.addEventListener("TabMove", this.locationChange, false);
			gBrowser.tabContainer.addEventListener("TabClose", this.locationChange, false);
			gBrowser.tabContainer.addEventListener("TabSelect", this.locationChange, false);
		
			var locationListener =
			{
				QueryInterface: function(aIID)
				{
					if (aIID.equals(Components.interfaces.nsIWebProgressListener) || aIID.equals(Components.interfaces.nsISupportsWeakReference) || aIID.equals(Components.interfaces.nsISupports)) return this;
					throw Components.results.NS_NOINTERFACE;
				},
				onLocationChange: this.locationChange
			}
			gBrowser.addProgressListener(locationListener);
			this.locationChange();
		},
		
		locationChange: function()
		{
			var uri = gBrowser.getBrowserForTab(gBrowser.selectedTab).currentURI.spec;
			
			if(uri == hidebookmarksbar.auto.lastURI)
				return;
			
			hidebookmarksbar.auto.lastURI = uri;
			
			var other = hidebookmarksbar.prefs.getCharPref("auto.other");
			if(other == "")
				other = [];
			else
				other = other.split("\n");
			
			var isOther    = -1 != other.indexOf(uri);
			var isHomePage = -1 != gHomeButton.getHomePage().split("|").indexOf(uri);
			var isBlank    = (uri == "about:blank");
			
			hidebookmarksbar.auto.visible =
			(isOther
			|| (hidebookmarksbar.prefs.getBoolPref("auto.homepage") && isHomePage)
			|| (hidebookmarksbar.prefs.getBoolPref("auto.blank")    && isBlank)
			)
			
			hidebookmarksbar.setVisibility();
		}
	}
};

window.addEventListener("load",   function(e){hidebookmarksbar.onLoad();  }, false);
window.addEventListener("unload", function(e){hidebookmarksbar.onUnload();}, false);

