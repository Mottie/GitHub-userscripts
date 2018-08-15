// ==UserScript==
// @name        GitHub Toggle Expanders
// @version     1.1.3
// @description A userscript that toggles all expanders when one expander is shift-clicked
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-expanders.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-expanders.user.js
// ==/UserScript==
(() => {
	"use strict";

	function toggle(el, modKey) {
		const stateNode = el.closest(".js-details-container, details");
		const state = stateNode.nodeName === "DETAILS" ?
			stateNode.open :
			stateNode.classList.contains("open");
		const parentNode = stateNode.closest(modKey ?
			".container, .js-discussion" :
			".commit-group, .js-timeline-item"
		);
		const containers = parentNode.querySelectorAll(
			".js-details-container, .outdated-comment"
		);

		[...containers].forEach(node => {
			if (node.nodeName === "DETAILS") {
				node.open = state;
			} else {
				node.classList.toggle("open", state);
			}
		});
	}

	document.body.addEventListener("click", event => {
		const target = event.target;
		const mod = event.ctrlKey || event.metaKey;
		if (target && event.getModifierState("Shift")) {
			// give GitHub time to update the elements
			setTimeout(() => {
				if (target.matches(".js-details-target")) {
					toggle(target, mod);
				} else if (target.matches(".btn-link, .js-toggle-outdated-comments")) {
					toggle(target.closest("details"), mod);
				}
			}, 100);
		}
	});

})();
