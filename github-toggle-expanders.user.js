// ==UserScript==
// @name        GitHub Toggle Expanders
// @version     1.1.1
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

	function toggle(el, ctrlKeyPressed) {
		const stateNode = closest(".js-details-container", el),
			state = stateNode.classList.contains("open"),
			parentNode = closest(ctrlKeyPressed ?
				".container, .js-discussion" :
				".commits-listing, .discussion-item-body, .release-timeline-tags",
			stateNode
			),
			containerNodes = parentNode.querySelectorAll(".js-details-container");

		Array.from(containerNodes).forEach(node => {
			node.classList.toggle("open", state);
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
		if (
			target && event.getModifierState("Shift") &&
			target.matches(".js-details-target")
		) {
			// give GitHub time to add the class
			setTimeout(() => {
				toggle(target, event.ctrlKey || event.metaKey);
			}, 100);
		}
	});

})();
