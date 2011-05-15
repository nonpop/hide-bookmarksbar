function init()
{
	if(1||/^Mac/.test(navigator.platform))
	{
		var label = document.getElementById("checkbox_ctrl");
		label.setAttribute("label", label.getAttribute("labelmac"));
	}
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


function syncFromCtrl()
{
	var preference = document.getElementById("pref_key_modifiers");
	return contains(preference.value, "accel");
}
function syncFromShift()
{
	var preference = document.getElementById("pref_key_modifiers");
	return contains(preference.value, "shift");
}
function syncFromAlt()
{
	var preference = document.getElementById("pref_key_modifiers");
	return contains(preference.value, "alt");
}

function syncToCtrl()
{
	var preference = document.getElementById("pref_key_modifiers");
	var checkbox = document.getElementById("checkbox_ctrl");
	
	if(checkbox.checked)
		return add(preference.value, "accel");
	else
		return remove(preference.value, "accel");
}
function syncToShift()
{
	var preference = document.getElementById("pref_key_modifiers");
	var checkbox = document.getElementById("checkbox_shift");
	
	if(checkbox.checked)
		return add(preference.value, "shift");
	else
		return remove(preference.value, "shift");
}
function syncToAlt()
{
	var preference = document.getElementById("pref_key_modifiers");
	var checkbox = document.getElementById("checkbox_alt");
	
	if(checkbox.checked)
		return add(preference.value, "alt");
	else
		return remove(preference.value, "alt");
}


function contains(hay, needle)
{
	var arr = hay.split(",");
	for(var i=0;i<arr.length;i++)
		if(arr[i] == needle)
			return true;
	return false;
}

function remove(hay, needle)
{
	var arr1 = hay.split(",");
	var arr2 = [];
	for(var i=0;i<arr1.length;i++)
		if(arr1[i] != needle)
			arr2.push(arr1[i]);
	arr2.sort();
	return arr2.join(",");
}

function add(hay, needle)
{
	remove(hay, needle);
	var arr = hay.split(",");
	if(arr[0]=="")
		arr = [];
	arr.push(needle);
	arr.sort();
	return arr.join(",");
}

