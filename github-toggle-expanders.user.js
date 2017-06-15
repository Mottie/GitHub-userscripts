// ==UserScript==
// @name        GitHub Toggle Expanders
// @version     1.0.6
// @description A userscript that toggles all expanders when one expander is shift-clicked
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @icon        https://github.com/fluidicon.png
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-expanders.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-expanders.user.js
// ==/UserScript==
(() => {
	"use strict";

	function toggle(el) {
		const state = closest(".commits-list-item, .js-details-container", el)
			.classList.contains("open"),
			// target buttons inside commits_bucket - fixes #8
			selectors = `
				#commits_bucket .js-details-container,
				.commits-listing .commits-list-item,
				.discussion-item-body .js-details-container,
				.release-timeline-tags .js-details-container`;
		Array.from(document.querySelectorAll(selectors)).forEach(el => {
			el.classList.toggle("open", state);
		});
	}

	function closest(selector, el) {
		while (el && el.nodeType === 1) {
			if (el.matches(selector)) {
				return el;
			}
			el = el.parentNode;
		}
		return null;
	}

	document.body.addEventListener("click", event => {
		const target = event.target;
		if (target && event.getModifierState("Shift") && (
			target.matches(".ellipsis-expander") ||
			target.matches(".js-details-target")
		)) {
			// give GitHub time to add the class
			setTimeout(() => {
				toggle(target);
			}, 100);
		}
	});

})();
