// ==UserScript==
// @name        GitHub Diff Links
// @version     1.1.2
// @description A userscript that adds links to diff and pull request headers to jump back & forth between files
// @license     https://creativecommons.org/licenses/by-sa/4.0/
// @namespace   http://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @author      Rob Garrison
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-links.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-links.user.js
// ==/UserScript==
/* jshint esnext:true, unused:true */
(() => {
	"use strict";

	// sometimes tooltips are too narrow...
	GM_addStyle(".gh-diff-links:after { min-width: 120px; }");

	const button = document.createElement("a"),
		// button [ InnerHTML, tooltip ]
		nextBtn = ["Next", "Jump to next file\n("],
		prevBtn = ["Prev", "Jump to previous file\n(" ];

	button.className = "btn btn-sm tooltipped tooltipped-s tooltipped-multiline" +
		"gh-diff-links";
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
		let last,
			diffLinks = $$(".gh-diff-links"),
			links = $$(`
				#toc ol.content li > a,
				.pr-toolbar .toc-select .select-menu-item
			`);
		// add diff links if they don't already exist
		if (links.length !== diffLinks.length) {
			// remove old links (just in case)
			diffLinks.forEach(el => {
				el.parentNode.removeChild(el);
			});
			// links & file-actions "should" be the same length
			last = links.length - 1;
			$$(".file-actions").forEach((el, indx) => {
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

	document.addEventListener("pjax:end", init);
	init();

})();
