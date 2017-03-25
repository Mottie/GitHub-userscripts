// ==UserScript==
// @name          GitHub Issue Highlighter
// @version       1.0.3
// @description   A userscript that highlights the linked-to comment
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     https://github.com/Mottie
// @include       https://github.com/*
// @run-at        document-idle
// @grant         GM_addStyle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-highlight-comment.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-highlight-comment.user.js
// ==/UserScript==
(() => {
	"use strict";

	// !important needed to override styles added by
	// https://github.com/StylishThemes/GitHub-Dark
	GM_addStyle(`
		.timeline-comment.selected,
		.timeline-comment.current-user.selected {
			border-color: #4183C4 !important;
		}
		.timeline-comment.selected:before,
		.timeline-comment.current-user.selected:before {
			border-right-color: #4183C4 !important;
		}
	`);

	function init(event) {
		if (document.querySelector("#discussion_bucket")) {
			let target, indx,
				hash = window.location.hash;
			// remove "selected" class on hashchange
			if (event) {
				target = document.querySelectorAll(".timeline-comment");
				indx = target.length;
				while (indx--) {
					target[indx].classList.remove("selected");
				}
			}
			// add "selected" class
			if (/^#issue(comment)?-\d+/.test(hash)) {
				target = document.querySelector(hash);
				if (target) {
					target.classList.add("selected");
				}
			}
		}
	}

	window.addEventListener("hashchange", init);
	init();

})();
