// ==UserScript==
// @name        GitHub Diff Links
// @version     1.2.0
// @description A userscript that adds links to diff and pull request headers to jump back & forth between files
// @license     https://creativecommons.org/licenses/by-sa/4.0/
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @author      Rob Garrison
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-links.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-links.user.js
// ==/UserScript==
(() => {
	"use strict";

	// sometimes tooltips are too narrow...
	GM_addStyle(".gh-diff-links:after { min-width: 120px; }");

	let debounce,
		busy = false,
		observers = [];

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
		busy = true;
		let last,
			links = $$("#toc ol.content li > a, .pr-toolbar .toc-select .select-menu-item");
		// links & file-actions "should" be the same length
		last = links.length - 1;
		$$(".file-actions").forEach((el, indx) => {
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
		busy = false;
	}

	function removeObservers() {
		observers.forEach(observer => {
			if (observer) {
				observer.disconnect();
			}
		});
		observers = [];
	}

	function addObservers() {
		// Observe progressively loaded content
		$$(".js-diff-progressive-container, .js-diff-load-container").forEach(target => {
			const obsrvr = new MutationObserver(mutations => {
				mutations.forEach(mutation => {
					// preform checks before adding code wrap to minimize function calls
					const tar = mutation.target;
					if (!busy && tar && (
							tar.classList.contains("js-diff-load-container") ||
							tar.classList.contains("blob-wrapper")
						)
					) {
						clearTimeout(debounce);
						debounce = setTimeout(() => {
							addLinks();
						}, 500);
					}
				});
			});
			obsrvr.observe(target, {
				childList: true,
				subtree: true
			});
			observers.push(obsrvr);
		});
	}

	function init() {
		removeObservers();
		if ($("#files.diff-view") || $(".pr-toolbar")) {
			addObservers();
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
	document.addEventListener("pjax:end", init);
	init();
})();
