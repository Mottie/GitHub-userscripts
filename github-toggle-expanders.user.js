// ==UserScript==
// @name        GitHub Toggle Expanders
// @version     2.1.0
// @description A userscript that toggles all expanders when one expander is shift-clicked
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=1079637
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==
(() => {
	/* global $ $$ on */
	"use strict";

	// Commit history toggle
	// https://github.com/torvalds/linux/commits/master
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
			?
			".repository-content"
			// shift+click = expand all in date
			:
			".Box--condensed"
		);

		if (parentNode) {
			const containers = parentNode.querySelectorAll(".js-details-container");
			[...containers].forEach(node => {
				node.classList.toggle("open", state);
				node.classList.toggle("Details--on", state);
			});
		}
	}

	// Toggle resolved/outdated comments
	// https://github.com/PowerShell/PowerShell/pull/18210
	function toggleDetails(el, modKey) {
		// clicked button has the previous state
		const state = el && el.classList.contains("Details-content--closed");
		const parentNode = el.closest(modKey
			// shift+ctrl+click = expand all on page
			?
			".js-discussion"
			// shift+click = expand all in date
			:
			".js-timeline-item"
		);

		if (parentNode) {
			$$("turbo-frame", parentNode).forEach(node => {
				const details = $("details", node);
				if (state) {
					details.setAttribute("open", state);
				} else {
					details.removeAttribute("open");
				}
			});
		}
	}

	on($("body"), "click", event => {
		const target = event.target;
		const mod = event.ctrlKey ||
			event.metaKey ||
			window.location.pathname.includes("/compare/");

		if (target && event.getModifierState("Shift")) {
			// give GitHub time to update the elements
			setTimeout(() => {
				if (target.matches(".js-details-target")) {
					toggleButton(target, mod);
				} else if (
					target.matches(".Details-content--closed, .Details-content--open")
				) {
					toggleDetails(target, mod);
				}
			}, 100);
		}
	});

})();
