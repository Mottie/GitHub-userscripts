// ==UserScript==
// @name        GitHub Hide Own Feed Meta
// @version     0.1.6
// @description A userscript that hides your own repo metadata in the GitHub feed
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/
// @run-at      document-idle
// @grant       none
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-hide-own-feed-meta.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-hide-own-feed-meta.user.js
// ==/UserScript==
(() => {
	"use strict";

	const feedClass = ".watch_started"; // starred; not sure about watch event
	// Set up user string as "/{user}/" to match the link's href
	const user = `/${document.querySelector('meta[name="user-login"]').getAttribute("content")}/`;

	function init() {
		if (document.getElementById("dashboard")) {
			[...document.querySelectorAll(feedClass)].forEach(el => {
				// This is really fragile
				// div.border.rounded-1.p-3.my-2
				//  > div (no class)
				//   > span.f3.lh-condensed.text-bold.text-gray-dark
				//    > a.link-gray-dark.text-bold.wb-break-all[data-ga-click]
				const link = el.querySelector("div.border a[data-ga-click]");
				if (link.href.indexOf(user) > 0) {
					link.closest("div.border").style.display = "none";
				}
			});
			// ghmo observer isn't set up to watch the feed... we'll work around it for now
			document.querySelector(".ajax-pagination-btn").addEventListener("click", () => {
				setTimeout(() => {
					init();
				}, 1500);
			});
		}
	}

	document.addEventListener("ghmo:container", init);
	init();
})();
