// ==UserScript==
// @name        GitHub Issue Highlighter
// @version     1.1.1
// @description A userscript that highlights the linked-to comment
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM.addStyle
// @grant       GM_addStyle
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-issue-highlighter.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-issue-highlighter.user.js
// ==/UserScript==
(() => {
	"use strict";

	// !important needed to override styles added by
	// https://github.com/StylishThemes/GitHub-Dark
	GM.addStyle(`
		.timeline-comment.selected,
		.timeline-comment.current-user.selected {
			border-color: #4183C4 !important;
		}
		.timeline-comment.selected .comment:before,
		.timeline-comment.current-user.selected:before {
			border-right-color: #4183C4 !important;
		}
	`);

	const regex = /^#issue(comment)?-\d+/;

	function init(event) {
		if (document.querySelector("#discussion_bucket")) {
			let target, indx,
				hash = window.location.hash;
			// remove "selected" class on hashchange
			if (event) {
				target = document.querySelectorAll(".timeline-comment");
				indx = target.length;
				while (indx--) {
					target[indx].classList.remove("selected");
				}
			}
			// add "selected" class
			if (regex.test(hash)) {
				target = document.querySelector(hash.match(regex)[0]);
				if (target) {
					target.querySelector(".timeline-comment").classList.add("selected");
				}
			}
		}
	}

	window.addEventListener("hashchange", init);
	document.addEventListener("pjax:end", init);
	init();

})();
