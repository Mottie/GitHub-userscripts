// ==UserScript==
// @name        GitHub Remove Diff Signs
// @version     1.1.5
// @description A userscript that removes the "+" and "-" from code diffs
// @license     https://creativecommons.org/licenses/by-sa/4.0/
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       none
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=189706
// @icon        https://github.com/fluidicon.png
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-remove-diff-signs.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-remove-diff-signs.user.js
// ==/UserScript==
(() => {
	"use strict";

	function processDiff() {
		if (document.querySelector(".highlight")) {
			let indx = 0,

				els = document.querySelectorAll(`
					.blob-code-deletion .blob-code-inner,
					.blob-code-addition .blob-code-inner`
				),
				len = els.length,

				// target "+" and "-" at start
				regex = /^[+-]/,

				// loop with delay to allow user interaction
				loop = () => {
					let el, txt,
						// max number of DOM insertions per loop
						max = 0;
					while ( max < 50 && indx < len ) {
						if (indx >= len) {
							return;
						}
						el = els[indx];
						txt = el.childNodes[0].textContent;
						el.childNodes[0].textContent = txt.replace(regex, " ");
						max++;
						indx++;
					}
					if (indx < len) {
						setTimeout(() => {
							loop();
						}, 200);
					}
				};
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
