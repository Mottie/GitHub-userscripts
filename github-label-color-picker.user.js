// ==UserScript==
// @name        GitHub Label Color Picker
// @version     1.0.5
// @description A userscript that adds a color picker to the label color input
// @license     MIT
// @author      Rob Garrison
// @contributor darkred
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @require     https://greasyfork.org/scripts/23181-colorpicker/code/colorPicker.js?version=147862
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// ==/UserScript==
(() => {
	"use strict";

	GM_addStyle("div.cp-app { margin-top:110px; margin-left:-8px; z-index:10; }");

	function addPicker() {
		if (document.querySelector(".js-new-label-color")) {
			jsColorPicker(".js-new-label-color-input", {
				customBG: "#222",
				noAlpha: true,
				renderCallback: function(colors) {
					let input = this && this.input;
					if (input) {
						input.value = "#" + colors.HEX;
						input.parentNode.previousElementSibling.style.backgroundColor = input.value;
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
		let result,
			// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
			shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, (m, r, g, b) => {
			return r + r + g + g + b + b;
		});
		result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
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
