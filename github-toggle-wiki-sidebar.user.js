// ==UserScript==
// @name        GitHub Toggle Wiki Sidebar
// @version     1.1.3
// @description A userscript that adds a button to toggle the GitHub Wiki sidebar
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @match       https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=1108163
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=1079637
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-wiki-sidebar.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-wiki-sidebar.user.js
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==

/* global $ make on */
(() => {
	"use strict";

	// disable click targeting of button SVG internals
	// classes "mr-1" = 4px & "mr-2" = 8px; silly GitHub
	GM_addStyle(`
		.ghtws-button > * { pointer-events: none; }
		.ghtws-button { margin-right: 6px; }`
	);

	// sidebar state
	let isHidden = false;

	const toggleIcon = `
		<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
			<path fill="none" stroke="currentColor" stroke-miterlimit="10" d="M.5 3.5h10v9H.5z"/>
			<path fill="currentColor" stroke="currentColor" stroke-miterlimit="10" d="M7 7.8l1.5-1.2V9zM10.5 3.5h5v9h-5v-9zm4.3 4.3l-4.3-3V11l4.3-3.2z"/>
		</svg>`;

	function addToggle() {
		if ($("#wiki-wrapper") && !$(".ghtws-button")) {
			let el = $(".gh-header-actions") || $(".gh-header-title");
			const button = make({
				el: "button",
				className: `btn btn-sm tooltipped tooltipped-s ghtws-button${isHidden ? " selected" : ""}`,
				html: toggleIcon,
				attrs: {
					type: "button",
					"aria-label": "Toggle Sidebar"
				}
			});
			if (el.nodeName === "H1") {
				// non-editable wiki pages
				button.style.float = "right";
				el = el.parentNode;
			}
			// editable wikis have a "header-actions" area
			el.prepend(button);
			if (isHidden) {
				toggleSidebar();
			}
		}
	}

	function toggleSidebar(button) {
		const sidebar = $(".wiki-rightbar");
		const wrapper = sidebar?.parentNode;
		if (sidebar && wrapper) {
			const action = isHidden ? "remove" : "add";
			button?.classList.toggle("selected", isHidden);
			wrapper.style.display = isHidden ? "none" : "";
			wrapper.classList[action]("has-rightbar");
			wrapper.previousElementSibling?.classList[action]("col-md-9");
			GM_setValue("sidebar-state", isHidden);
		}
	}

	function toggleEvent(event) {
		const target = event.target;
		if (target && target.classList.contains("ghtws-button")) {
			isHidden = !isHidden;
			toggleSidebar(target);
		}
	}

	function init() {
		isHidden = GM_getValue("sidebar-state", false);
		$("body").addEventListener("click", toggleEvent);
		addToggle();
	}

	on(document, "ghmo:container", addToggle);
	init();
})();
