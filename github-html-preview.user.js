// ==UserScript==
// @name        GitHub HTML Preview
// @version     1.0.0
// @description A userscript that adds preview links to HTML files
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       none
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=785415
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-html-preview.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-html-preview.user.js
// ==/UserScript==
/* global $ $$ on */
(() => {
	"use strict";
	// Example page: https://github.com/codrops/DecorativeLetterAnimations
	// Source: https://github.com/htmlpreview/htmlpreview.github.com
	const prefix = "https://htmlpreview.github.io/?";
	// html & htm extensions
	const regex = /\.html?$/;

	const link = document.createElement("a");
	link.className = "ghhp-btn py-0 v-align-baseline tooltipped tooltipped-e";
	link.setAttribute("aria-label", "Open in new tab");
	link.target = "_blank";
	link.innerHTML = `
		<svg class="octicon v-align-text-bottom" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
			<path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
		</svg>`;

	function addLink(el) {
		const cell = el.closest(".js-navigation-item div[role='rowheader']");
		if (cell && !$(".ghhp-btn", cell)) {
			const preview = link.cloneNode(true);
			preview.href = prefix + el.href;
			cell.appendChild(preview);
		}
	}

	function init() {
		if ($("#files")) {
			const files = $("#files").parentElement;
			$$(".js-navigation-item div[role='rowheader'] .js-navigation-open", files).forEach(el => {
				if (regex.test(el.title)) {
					addLink(el);
				}
			});
		}
	}

	on(document, "ghmo:container", () => {
		// init after a short delay to allow rendering of file list
		setTimeout(() => {
			init();
		}, 200);
	});
	init();

})();
