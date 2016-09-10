// ==UserScript==
// @name         GitHub Code Guides
// @version      1.0.1
// @description  A userscript that allows you to add one or more vertical guidelines to the code
// @license      https://creativecommons.org/licenses/by-sa/4.0/
// @namespace    http://github.com/Mottie
// @include      https://github.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @author       Rob Garrison
// @updateURL    https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-guides.user.js
// @downloadURL  https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-guides.user.js
// ==/UserScript==
/* copy into textarea to check the guides
         1         2         3         4         5         6         7         8
1234567890123456789012345678901234567890123456789012345678901234567890123456789012345
*/
/* global document, prompt, GM_getValue, GM_setValue, GM_registerMenuCommand */
/* jshint esnext:true, unused:true */
(() => {
	"use strict";
	const style = document.createElement("style");
	// eslint-disable-next-line one-var
	let guides = GM_getValue("ghcg-guides", [{
			chars: 80,
			color: "rgba(0, 0, 0, .3)",
			width: 0.2
		}]),
		font = GM_getValue("ghcg-font", "Menlo");

	function addGuides(vals) {
		let css = "";
		// to align the guides *after* the setting, we need to add 1, then add
		// another 0.1 to give the guide a tiny bit of white space to the left
		vals.forEach(guide => {
			let start = parseFloat(guide.chars) + 1.1;
			// eslint-disable-next-line one-var
			const size = parseFloat(guide.width) || 0.2,
				// each line needs to be at least 0.2ch in width to be visible
				end = (start + (size > 0.2 ? size : 0.2)).toFixed(1),
				color = guide.color || "rgba(0, 0, 0, .3)";
			start = start.toFixed(1);
			css += `transparent ${start}ch, ${color} ${start}ch, ${color} ${end}ch, transparent ${end}ch, `;
		});
		style.textContent = `
			textarea, span.blob-code-inner {
				font-family: "${font}", Consolas, "Liberation Mono", Menlo, Courier, monospace !important;
			}
			span.blob-code-inner, td.blob-code-inner, textarea[name="comment[body]"] {
				display: block !important;
				background: linear-gradient(to right, transparent 0%, ${css} transparent 100%) !important;
			}
		`;
	}

	function validateGuides(vals) {
		let last = 0;
		const valid = [];
		if (!Array.isArray(vals)) {
			console.log("Code-Guides Userscript: Invalid guidelines", vals);
			return;
		}
		// Object.keys() creates an array of string values
		const lines = vals.sort((a, b) => parseFloat(a.chars) - parseFloat(b.chars));
		lines.forEach(line => {
			const num = parseFloat(line.chars);
			// 0.2 is the width of the "ch" in CSS to make it visible
			if (num >= last + line.width) {
				valid.push(line);
				last = num;
			}
		});
		if (valid.length) {
			guides = valid;
			GM_setValue("ghcg-guides", valid);
			GM_setValue("ghcg-font", font);
			addGuides(valid);
		}
	}

	document.querySelector("head").appendChild(style);
	validateGuides(guides);

	// Add GM options
	GM_registerMenuCommand("Set code guideline position & color", () => {
		let val = prompt(`Enter valid JSON [{ "chars":80, "color":"#f00", "width":0.2 }, ...}`, JSON.stringify(guides));
		if (val !== null) {
			try {
				val = JSON.parse(val);
				validateGuides(val);
			} catch (err) {
				console.log(err);
			}
		}
	});

	GM_registerMenuCommand("Set code guideline default font", () => {
		const val = prompt("Enter code font (monospaced)", font);
		if (val !== null) {
			font = val;
			validateGuides(guides);
		}
	});
})();
