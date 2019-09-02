// ==UserScript==
// @name        GitHub Toggle Expanders
// @version     2.0.0
// @description A userscript that toggles all expanders when one expander is shift-clicked
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-expanders.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-expanders.user.js
// ==/UserScript==
(() => {
	"use strict";

	function toggleButton(el, modKey) {
		const stateNode = el.closest(".js-details-container");
		const state = stateNode && (
			// Resolved expander
			stateNode.classList.contains("open") ||
			// compare detail expander
			stateNode.classList.contains("Details--on")
		);
		const parentNode = stateNode && stateNode.closest(modKey
			// shift+ctrl+click = expand all on page
			? ".repository-content"
			// shift+click = expand all in date
			: ".commit-group"
		);
		if (parentNode) {
			const containers = parentNode.querySelectorAll(".js-details-container");
			[...containers].forEach(node => {
				node.classList.toggle("open", state);
				node.classList.toggle("Details--on", state);
			});
		}
	}

	function toggleDetails(el, modKey) {
		const state = el && el.open;
		const parentNode = el && el.closest(modKey
			? "#discussion_bucket" // .js-discussion
			: ".discussion-item-body" // .container?
		);
		if (parentNode) {
			const containers = parentNode.querySelectorAll(
				".outdated-comment, .js-comment-container"
			);
			[...containers].forEach(node => {
				node.open = state;
			});
		}
	}

	document.body.addEventListener("click", event => {
		const target = event.target;
		const mod = event.ctrlKey
			|| event.metaKey
			|| window.location.pathname.includes("/compare/");

		if (target && event.getModifierState("Shift")) {
			// give GitHub time to update the elements
			setTimeout(() => {
				if (target.matches(".js-details-target")) {
					toggleButton(target, mod);
				} else if (
					target.matches(".Details-content--closed, .Details-content--open")
				) {
					toggleDetails(target.closest("details"), mod);
				}
			}, 100);
		}
	});

})();
