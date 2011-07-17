var disableMatch =
{
	"checkbox_button_command_toolbar":  ["pref_button_manual_dropdown", "pref_manual_enabled"],
	"checkbox_button_command_sidebar":  ["pref_button_manual_dropdown"],
	"checkbox_button_command_manager":  ["pref_button_manual_dropdown"],
	"checkbox_button_command_settings": ["pref_button_manual_dropdown"],
	"checkbox_manual_button_enabled":   ["pref_manual_enabled"],
	"checkbox_manual_button_dropdown":  ["pref_manual_enabled", "pref_manual_button_enabled"],
	"checkbox_manual_shortcut_enabled": ["pref_manual_enabled"],
	"checkbox_manual_shortcut_ctrl":    ["pref_manual_enabled", "pref_manual_shortcut_enabled"],
	"checkbox_manual_shortcut_shift":   ["pref_manual_enabled", "pref_manual_shortcut_enabled"],
	"checkbox_manual_shortcut_alt":     ["pref_manual_enabled", "pref_manual_shortcut_enabled"],
	"textbox_manual_shortcut_key":      ["pref_manual_enabled", "pref_manual_shortcut_enabled"],
	"radiogroup_hover_type":            ["pref_hover_enabled"],
	"textbox_hover_delay":              ["pref_hover_enabled"],
	"checkbox_auto_homepage":           ["pref_auto_enabled"],
	"checkbox_auto_blank":              ["pref_auto_enabled"],
	"textbox_auto_other":               ["pref_auto_enabled"]
}
var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
     getService(Components.interfaces.nsIConsoleService);


function init()
{
	if(navigator.platform.indexOf("Mac") == 0)
	{
		var label = document.getElementById("checkbox_manual_shortcut_ctrl");
		label.setAttribute("label", label.getAttribute("labelmac"));
	}
	
	var prefs = document.getElementsByTagName("preference");
	for(var i=0;i<prefs.length;i++)
	{
		prefs[i].addEventListener("change", prefChanged, false);
	}
	prefChanged();
}

function prefChanged()
{
	for(var element in disableMatch)
	{
		var enabled = true;
		var prefs = disableMatch[element];
		for(var i=0;i<prefs.length;i++)
		{
			if(document.getElementById(prefs[i]).value == false)
			{
				enabled = false
				break;
			}
		}
		document.getElementById(element).disabled = !enabled;
	}
}

function getModifier(id)
{
	if(id == "checkbox_manual_shortcut_alt")
		return "alt";
	if(id == "checkbox_manual_shortcut_shift")
		return "shift";
	
	return "accel";
}

function syncFromPreference(el)
{
	var modifier = getModifier(el.id);
	
	var preference = document.getElementById("pref_manual_shortcut_modifiers");
	return -1 != preference.value.split(",").indexOf(modifier);
}

function syncToPreference(el)
{
	var modifier = getModifier(el.id);
	
	var preference = document.getElementById("pref_manual_shortcut_modifiers");
	
	var modifiers = preference.value;
	if(modifiers == "")
		modifiers = [];
	else
		modifiers = modifiers.split(",");
	
	while(modifiers.indexOf(modifier) != -1)
		modifiers.splice(modifiers.indexOf(modifier), 1);
	
	if(el.checked)
		modifiers.push(modifier);
	
	modifiers.sort()
	
	return modifiers.join(",");
}

