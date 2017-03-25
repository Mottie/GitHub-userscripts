// ==UserScript==
// @name          GitHub Remove Diff Signs
// @version       1.1.0
// @description   A userscript that removes the "+" and "-" from code diffs
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     https://github.com/Mottie
// @include       https://github.com/*
// @grant         none
// @run-at        document-idle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-remove-diff-signs.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-remove-diff-signs.user.js
// ==/UserScript==
(() => {
	"use strict";

	let debounce,
		busy = false,
		observers = [];

	function processDiff() {
		busy = true;
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
		busy = false;
	}

	// GitHub pjax
	document.addEventListener("pjax:end", init);

	function removeObservers() {
		observers.forEach(observer => {
			if (observer) {
				observer.disconnect();
			}
		});
		observers = [];
	}

	function addObservers() {
		// DOM targets - to detect GitHub dynamic ajax page loading
		Array.from(
			// Observe progressively loaded content
			document.querySelectorAll(`
				.js-diff-progressive-container,
				.js-diff-load-container`
			)
		).forEach(target => {
			const obsrvr = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					// preform checks before adding code wrap to minimize function calls
					const tar = mutation.target;
					if (!busy && tar && (
							tar.classList.contains("js-diff-load-container") ||
							tar.classList.contains("blob-wrapper")
						)
					) {
						clearTimeout(debounce);
						debounce = setTimeout(() => {
							processDiff();
						}, 500);
					}
				});
			});
			obsrvr.observe(target, {
				childList: true,
				subtree: true
			});
			observers.push(obsrvr);
		});
	}

	function init() {
		removeObservers();
		if (document.querySelector("#files.diff-view")) {
			addObservers();
			processDiff();
		}
	}

	init();

})();
