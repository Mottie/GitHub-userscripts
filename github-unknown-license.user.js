// ==UserScript==
// @name        GitHub unknown license
// @version     0.1.1
// @description A userscript that adds "unknown license" message in repos with no license set
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       none
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=785415
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-unknown-license.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-unknown-license.user.js
// ==/UserScript==
(() => {
	"use strict";
	/* global $ on */

	// Example page with no license
	// https://github.com/isaacs/github
	const lawIcon = `
		<svg
			class="octicon octicon-law"
			viewBox="0 0 14 16"
			width="14"
			height="16"
			aria-hidden="true"
		>
			<path
				fill-rule="evenodd"
				fill="currentColor"
				class="text-yellow"
				d="M7 4c-.83 0-1.5-.67-1.5-1.5S6.17 1 7 1s1.5.67 1.5 1.5S7.83 4 7 4zm7
					6c0 1.11-.89 2-2 2h-1c-1.11 0-2-.89-2-2l2-4h-1c-.55
					0-1-.45-1-1H8v8c.42 0 1 .45 1 1h1c.42 0 1 .45 1 1H3c0-.55.58-1
					1-1h1c0-.55.58-1 1-1h.03L6 5H5c0 .55-.45 1-1 1H3l2 4c0 1.11-.89 2-2
					2H2c-1.11 0-2-.89-2-2l2-4H1V5h3c0-.55.45-1 1-1h4c.55 0 1 .45 1
					1h3v1h-1l2 4zM2.5 7L1 10h3L2.5 7zM13 10l-1.5-3-1.5 3h3z"
			/>
		</svg>`;

	const entry = document.createElement("li");
	entry.innerHTML = `
		<a href="https://choosealicense.com/" class="text-yellow">
			${lawIcon} unknown license
		</a>`;

	function init() {
		const summary = $(".numbers-summary");
		if (summary && !$(".octicon-law", summary)) {
			summary.append(entry.cloneNode(true));
		}
	}

	on(document, "ghmo:container", init);
	init();

})();
