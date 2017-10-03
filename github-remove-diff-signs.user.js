// ==UserScript==
// @name        GitHub Remove Diff Signs
// @version     1.2.0
// @description A userscript that removes the "+" and "-" from code diffs
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=198500
// @icon        https://github.com/fluidicon.png
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-remove-diff-signs.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-remove-diff-signs.user.js
// ==/UserScript==
(() => {
	"use strict";

	GM_addStyle(`.diff-table .blob-code-inner:before {
		user-select: none;
		content: "\\a0";
	}`);

	function processDiff() {
		if (document.querySelector(".highlight")) {
			let indx = 0,
				els = document.querySelectorAll(`span.blob-code-inner:not([data-ghrds])`),
				len = els.length;

			// loop with delay to allow user interaction
			function loop() {
				let el, txt, firstNode,
					// max number of DOM insertions per loop
					max = 0;
				while ( max < 50 && indx < len ) {
					if (indx >= len) {
						return;
					}
					el = els[indx];
					if (!el.getAttribute("data-ghrds")) {
						firstNode = el.childNodes[0];
						txt = firstNode.textContent || "";
						// remove the leading +, - or first space
						// the github-code-show-whitespace.user.js script is applied
						firstNode.textContent = txt.slice(1);
						el.setAttribute("data-ghrds", true);
					}
					max++;
					indx++;
				}
				if (indx < len) {
					setTimeout(() => {
						loop();
					}, 200);
				}
			}
			loop();
		}
	}

	// Observe GitHub dynamic content
	document.addEventListener("ghmo:container", init);
	document.addEventListener("ghmo:diff", processDiff);

	function init() {
		if (document.querySelector("#files.diff-view")) {
			processDiff();
		}
	}

	init();

})();
