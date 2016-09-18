// ==UserScript==
// @name          GitHub Toggle Expanders
// @version       1.0.1
// @description   A userscript that toggles all expanders when one expander is shift-clicked
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     https://github.com/Mottie
// @include       https://github.com/*
// @run-at        document-idle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-expanders.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-expanders.user.js
// ==/UserScript==
/* jshint esnext:true, unused:true */
(() => {
	"use strict";

	function toggle(el) {
		const selector = ".commits-list-item, .js-details-container",
			state = closest(el, selector).classList.contains("open");
		Array.from(document.querySelectorAll(selector)).forEach(el => {
			el.classList[state ? "add" : "remove"]("open");
		});
	}

	function closest(el, selector) {
		while (el && el.nodeName !== "BODY" && !el.matches(selector)) {
			el = el.parentNode;
		}
		return el && el.matches(selector) ? el : [];
	}

	document.body.addEventListener("click", event => {
		const target = event.target;
		if (
			target && event.getModifierState("Shift") &&
			target.matches(".ellipsis-expander")
		) {
			// give GitHub time to add the class
			setTimeout(() => {
				toggle(target);
			}, 100);
		}
	});

})();
