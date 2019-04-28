// ==UserScript==
// @name        GitHub Diff Links
// @version     1.2.15
// @description A userscript that adds links to diff and pull request headers to jump back & forth between files
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-links.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-links.user.js
// ==/UserScript==
(() => {
	"use strict";

	// sometimes tooltips are too narrow...
	// and move diff anchors below sticky header
	GM_addStyle(`
		.gh-diff-links:after { min-width: 120px; }
		a[name*="diff-"]:before {
			padding-top: 60px !important;
			margin-top: -60px !important;
			content: "";
			position: absolute;
		}
		div.file-actions > div {
			display: inline;
		}`
	);

	const button = document.createElement("a"),
		// button [ InnerHTML, tooltip ]
		nextBtn = ["Next", "Jump to next file\n("],
		prevBtn = ["Prev", "Jump to previous file\n(" ];

	button.className = "btn btn-sm tooltipped tooltipped-s tooltipped-multiline gh-diff-links";
	button.setAttribute("rel", "nofollow");

	function addButton(el, content, link) {
		let btn = button.cloneNode(),
			txt = el.classList.contains("select-menu-item") ?
				$(".description", el).textContent :
				link.textContent || "";
		// clean up whitespace
		txt = txt.replace(/\s+/g, " ").trim();
		// only add file name to tooltip
		txt = txt.substring(txt.lastIndexOf("/") + 1, txt.length);
		btn.innerHTML = content[0];
		btn.setAttribute("aria-label", content[1] + txt + ")" );
		btn.href = link.hash;
		// prepend button
		el.insertBefore(btn, el.childNodes[0]);
	}

	function addSpace(el, content) {
		let btn = button.cloneNode();
		btn.disabled = true;
		btn.className = "btn btn-sm gh-diff-links disabled";
		btn.innerHTML = content[0];
		el.insertBefore(btn, el.childNodes[0]);
	}

	function addLinks() {
		let last, temp,
			links = $$(".file-header .file-info a");
		if (links.length) {
			// links & file-actions "should" be the same length
			last = links.length - 1;
			$$(".file-actions").forEach((el, indx) => {
				// remove disabled buttons added before progressive
				// content has completed loading
				temp = $(".gh-diff-links.disabled", el);
				if (temp) {
					temp.parentNode.removeChild(temp);
					// remove both buttons to allow updating
					temp = $(".gh-diff-links", el);
					temp.parentNode.removeChild(temp);
				}
				if (!$(".gh-diff-links", el)) {
					if (indx === 0) {
						addButton(el, nextBtn, links[indx + 1]);
						addSpace(el, prevBtn);
					} else if (indx === last) {
						// add dummy "next" button to keep spacing
						addSpace(el, nextBtn);
						addButton(el, prevBtn, links[indx - 1]);
					} else {
						addButton(el, nextBtn, links[indx + 1]);
						addButton(el, prevBtn, links[indx - 1]);
					}
				}
			});
		}
	}

	function init() {
		if ($("#files.diff-view") || $(".pr-toolbar")) {
			addLinks();
		}
	}

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}

	function $$(selector, el) {
		return Array.from((el || document).querySelectorAll(selector));
	}

	// DOM targets - to detect GitHub dynamic ajax page loading
	document.addEventListener("ghmo:container", init);
	document.addEventListener("ghmo:diff", addLinks);
	init();

})();
