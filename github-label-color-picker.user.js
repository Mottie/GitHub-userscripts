// ==UserScript==
// @name          GitHub Label Color Picker
// @version       1.0.0
// @description   A userscript that adds a color picker to the label color input
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     https://github.com/Mottie
// @include       https://github.com/*
// @grant         GM_addStyle
// @grant         GM_getValue
// @grant         GM_setValue
// @grant         GM_registerMenuCommand
// @require       https://greasyfork.org/scripts/23181-colorpicker/code/colorPicker.js?version=147862
// @run-at        document-idle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-label-color-picker.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-label-color-picker.user.js
// ==/UserScript==
/* global GM_addStyle, GM_getValue, GM_setValue, GM_registerMenuCommand, jsColorPicker */
/* jshint esnext:true, unused:true */
(() => {
	"use strict";

	GM_addStyle("div.cp-app { margin-top:65px; z-index:10; }");

	function addPicker() {
		if (document.querySelector(".js-color-editor")) {
			jsColorPicker(".js-color-editor-input", {
				customBG: "#222",
				noAlpha: true,
				renderCallback : colors => {
					let input = this && this.input;
					if (input) {
						input.value = "#" + colors.HEX;
						input.previousElementSibling.style.backgroundColor = input.value;
					}
				}
			});
		}
	}

	/* replace colorPicker storage */
	window.ColorPicker.docCookies = (key, val) => {
		if (typeof val === "undefined") {
			return GM_getValue(key);
		}
		GM_setValue(key, val);
	};

	/* colorPickerMemosNoAlpha *MUST* follow this format
	"'rgba(83,25,231,1)','rgba(86,66,66,1)','rgba(22,20,223,1)'"
	*/
	function convertColorsToRgba(values) {
		let result = [];
		// see http://stackoverflow.com/a/26196012/145346
		values
			.replace(/['"]/g, "")
			.split(/\s*,(?![^()]*(?:\([^()]*\))?\))\s*/g)
			.forEach(val => {
				let rgb = hexToRgb(val);
				if (rgb) {
					result.push(`'rgba(${rgb.r},${rgb.g},${rgb.b},1)'`);
				} else if (rgb === null && val.indexOf("rgba(") > -1) {
					// allow adding rgba() definitions
					result.push(`'${val}'`);
				}
			});
		return result.join(",");
	}

	// Modified code from http://stackoverflow.com/a/5624139/145346
	function hexToRgb(hex) {
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, (m, r, g, b) => {
			return r + r + g + g + b + b;
		});
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}

	// Add GM options
	GM_registerMenuCommand(
		"Set label ColorPicker swatches (8 HEX or RGBA Max)",
		() => {
			const colors = GM_getValue("colorPickerMemosNoAlpha", "#000000,#ffffff"),
				val = prompt("Set label default colors (8 max):", colors);
			if (val !== null && typeof val === "string") {
				GM_setValue("colorPickerMemosNoAlpha", convertColorsToRgba(val));
			}
		}
	);

	document.body.addEventListener("click", event => {
		// initialize if "Edit" or "New label" button clicked
		// because "Save changes" updates the entire item
		if (
			event.target && event.target.matches(".js-edit-label, .js-details-target")
		) {
			addPicker();
		}
	});
	addPicker();

})();
