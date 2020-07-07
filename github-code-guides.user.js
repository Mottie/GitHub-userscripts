// ==UserScript==
// @name        GitHub Code Guides
// @version     1.1.14
// @description A userscript that allows you to add one or more vertical guidelines to the code
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-guides.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-guides.user.js
// ==/UserScript==
/* copy into textarea to check the guides
         1         2         3         4         5         6         7         8
1234567890123456789012345678901234567890123456789012345678901234567890123456789012345
*/
(() => {
	"use strict";
	const style = document.createElement("style");
	// eslint-disable-next-line one-var
	let guides = GM_getValue("ghcg-guides", [{
			chars: 80,
			color: "rgba(0, 0, 0, .3)",
			width: 0.2
		}]),
		font = GM_getValue("ghcg-font", "Menlo"),
		tabSize = GM_getValue("ghcg-tabs", 2);

	function adjust(val) {
		return `${val.toFixed(1)}ch`;
	}

	function addDefinition(start, end, color) {
		return `
			transparent ${start},
			${color} ${start},
			${color} ${end},
			transparent ${end},
		`;
	}

	function addGuides(vals) {
		let css = "";
		// to align the guides *after* the setting, we need to subtract 0.5, then
		// add another 0.1 to give the guide a tiny bit of white space to the left
		vals.forEach(guide => {
			let start = parseFloat(guide.chars) - 0.5,
				size = parseFloat(guide.width) || 0.2;
			const color = guide.color || "rgba(0, 0, 0, .3)";
			// each line needs to be at least 0.2ch in width to be visible
			size = size > 0.2 ? size : 0.2;
			css += addDefinition(adjust(start), adjust(start + size), color);
		});
		style.textContent = `
			table.tab-size[data-tab-size] {
				tab-size: ${tabSize};
				-moz-tab-size: ${tabSize};
			}
			span.blob-code-inner:before,
			td.blob-code-inner:not(.blob-code-hunk):before,
			.blob-code-context .blob-code-inner:before,
			.blob-code-addition .blob-code-inner:before,
			.blob-code-deletion .blob-code-inner:before {
				display: block;
				position: absolute;
				top: 0;
				left: 1em;
				width: 100%;
				height: 100%;
				text-indent: -1em;
			}
			.blob-code span.blob-code-inner {
				display: block !important;
			}
			span.blob-code-inner,
			td.blob-code-inner:not(.blob-code-hunk),
			.blob-code-inner:before {
				font-family: "${font}", Consolas, "Liberation Mono", Menlo, Courier, monospace !important;
			}
			span.blob-code-inner:before,
			td.blob-code-inner:not(.blob-code-hunk):before {
				background: linear-gradient(to right, transparent 0%, ${css} transparent 100%) !important;
				pointer-events: none;
				content: '';
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
			GM_setValue("ghcg-tabs", tabSize);
			addGuides(valid);
		}
	}

	document.querySelector("head").appendChild(style);
	validateGuides(guides);

	// Add GM options
	GM_registerMenuCommand("Set code guideline position & color", () => {
		let val = prompt(
			`Enter valid JSON [{ "chars":80, "color":"#f00", "width":0.2 }, ...}]`,
			JSON.stringify(guides)
		);
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

	GM_registerMenuCommand("Set code guideline tab size", () => {
		const val = prompt("Enter code guideline tab size", tabSize);
		if (val !== null) {
			tabSize = val;
			validateGuides(guides);
		}
	});

})();
