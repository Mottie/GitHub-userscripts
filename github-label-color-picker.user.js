// ==UserScript==
// @name        GitHub Label Color Picker
// @version     1.0.8
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
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=952600
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-label-color-picker.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-label-color-picker.user.js
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==
/* global jsColorPicker $ on */
(() => {
	"use strict";

	GM_addStyle(`
		div.cp-app { margin:100px 0 0 -7px; z-index:10; }
		.js-new-label-color-icon { pointer-events:none; }
		.js-new-label-color-icon.color-scale-black { color:#000 !important; }
	`);

	function addPicker() {
		if ($(".js-new-label-color")) {
			jsColorPicker(".js-new-label-color-input", {
				customBG: "#222",
				noAlpha: true,
				renderCallback: function(colors) {
					const input = this && this.input;
					if (input) {
						updateSwatch(input, colors);
					}
				}
			});
		}
	}

	function updateSwatch(input, colors) {
		input.value = colors.HEX;
		const colorStyle = calcStyle(colors.rgb, colors.hsl);

		// Update color swatch next to input
		const inputSwatch = $(".js-new-label-color", input.closest("dd"));
		inputSwatch.style = colorStyle;

		// Update label preview
		const labelSwatch = $(
			".js-label-preview .IssueLabel--big",
			input.closest(".Box-row")
		);
		labelSwatch.style = colorStyle;
	}

	function calcStyle(rgb, hsl) {
		// GitHub adds CSS variables to the wrapper
		// rgb is used as the foreground (text) color
		// hsl is used to calculate a color variant for the background
		const multiplier = { h: 360, s: 100, l: 100 };
		const fg = Object.entries(rgb).map(
			([c, v]) => `--label-${c}:${(v * 255).toFixed(0)}`
		);
		const bg = Object.entries(hsl).map(
			([c, v]) => `--label-${c}:${(v * multiplier[c]).toFixed(0)}`
		);
		// --label-r:255; --label-g:255; --label-b:255; --label-h:15; --label-s:0; --label-l:100;
		return `${fg.join("; ")}; ${bg.join("; ")}`;
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
		// see http://stackoverflow.com/a/26196012/145346
		return values
			.replace(/['"]/g, "")
			.split(/\s*,(?![^()]*(?:\([^()]*\))?\))\s*/g)
			.map(val => {
				const rgb = hexToRgb(val);
				if (rgb) {
					return `'rgba(${rgb.r},${rgb.g},${rgb.b},1)'`;
				} else if (rgb === null && val.indexOf("rgba(") > -1) {
					// allow adding rgba() definitions
					return`'${val}'`;
				}
			})
			.filter(Boolean)
			.join(",");
	}

	// Modified code from http://stackoverflow.com/a/5624139/145346
	// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	function hexToRgb(hex) {
		const modHex = hex.replace(shorthandRegex, (_, r, g, b) => {
			return r + r + g + g + b + b;
		});
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(modHex);
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

	on(document.body, "click", event => {
		// initialize if "Edit" or "New label" button clicked
		// because "Save changes" updates the entire item
		if (
			event.target?.matches(".js-edit-label, .js-details-target")
		) {
			addPicker();
		}
	});
	addPicker();
})();
