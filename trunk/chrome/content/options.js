function init()
{
	document.getElementById("pref_hover_enabled").addEventListener("change", hoverChanged, false);
	hoverChanged();
	
	document.getElementById("pref_autoShow").addEventListener("change", autoShowChanged, false);
	autoShowChanged();
	
	if(navigator.platform.indexOf("Mac") == 0)
	{
		var label = document.getElementById("checkbox_ctrl");
		label.setAttribute("label", label.getAttribute("labelmac"));
	}
}

function hoverChanged()
{
	var hover = document.getElementById("pref_hover_enabled").value;
	
	document.getElementById("typeDeck").selectedIndex = hover?0:1;
}

function autoShowChanged()
{
	var show = document.getElementById("pref_autoShow").value;
	
	document.getElementById("newwindow").disabled = show;
	document.getElementById("startup").disabled = show;
}

function keyEnabledChanged()
{
	var disable = !document.getElementById("checkbox_enabled").checked;
	var controls = ["checkbox_ctrl", "checkbox_shift", "checkbox_alt", "textbox_key"];
	for(var i=0;i<controls.length;i++)
	{
		document.getElementById(controls[i]).disabled = disable;
	}
}

function getModifier(id)
{
	if(id == "checkbox_alt")
		return "alt";
	if(id == "checkbox_shift")
		return "shift";
	
	return "accel";
}

function syncFromPreference(el)
{
	var modifier = getModifier(el.id);
	
	var preference = document.getElementById("pref_key_modifiers");
	return -1 != preference.value.split(",").indexOf(modifier);
}

function syncToPreference(el)
{
	var modifier = getModifier(el.id);
	
	var preference = document.getElementById("pref_key_modifiers");
	
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

