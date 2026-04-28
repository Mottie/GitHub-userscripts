// ==UserScript==
// @name        GitHub Toggle Sidebar
// @version     1.1.3
// @description A userscript that adds a button to toggle the GitHub sidebar (repo and wiki pages)
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
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-sidebar.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-sidebar.user.js
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
		if (($("#wiki-wrapper") || ($("#repository-container-header"))) && !$(".ghtws-button")) {
			const button = make({
				el: "button",
				className: `btn btn-sm tooltipped tooltipped-s ghtws-button${isHidden ? " selected" : ""}`,
				html: toggleIcon,
				attrs: {
					type: "button",
					"aria-label": "Toggle Sidebar"
				}
			});

			let container = $(".pagehead-actions");
			if (!container) {
				let el = $(".gh-header-actions") || $(".gh-header-title");
				if (el) {
					container = make({
						el: "ul",
						className: "pagehead-actions flex-shrink-0 d-none d-md-inline",
						style: "padding: 2px 0;"
					})
					el.prepend(container);
				}
			}

			container.appendChild(document.createElement("li")).appendChild(button)

			if (isHidden) {
				toggleSidebar();
			}
		}
	}

	function toggleSidebar(button) {
		const sidebar = $(".Layout-sidebar") || $(".pr-2");
		if (sidebar) {
			const action = isHidden ? "remove" : "add";
			button?.classList.toggle("selected", isHidden);
			sidebar.style.display = isHidden ? "none" : "";

			// have content expand to fill empty space
			if (sidebar.className == "Layout-sidebar") {
				sidebar.parentNode?.classList[action]("Layout");
			} else {
				let content = sidebar.previousSibling?.firstChild;
				let value = isHidden ? "full" : "large";
				content.setAttribute("data-width", value);

				let article = $("article");
				article?.classList.toggle("container-lg");
			}

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
