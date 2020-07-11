// ==UserScript==
// @name        GitHub RTL Comments
// @version     1.3.0
// @description A userscript that adds a button to insert RTL text blocks in comments
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM.addStyle
// @connect     github.com
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @require     https://greasyfork.org/scripts/28239-rangy-inputs-mod-js/code/rangy-inputs-modjs.js?version=181769
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-rtl-comments.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-rtl-comments.user.js
// ==/UserScript==
(() => {
	"use strict";

	const icon = `
		<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
			<path d="M14 3v8l-4-4m-7 7V6C1 6 0 5 0 3s1-3 3-3h7v2H9v12H7V2H5v12H3z"/>
		</svg>`,

		// maybe using &#x2067; RTL text &#x2066; (isolates) is a better combo?
		openRTL = "&rlm;",  // https://en.wikipedia.org/wiki/Right-to-left_mark
		closeRTL = "&lrm;", // https://en.wikipedia.org/wiki/Left-to-right_mark

		regexOpen = /\u200f/ig,
		regexClose = /\u200e/ig,
		regexSplit = /(\u200f|\u200e)/ig;

	GM.addStyle(`
		.ghu-rtl-css { direction:rtl; text-align:right; }
		/* delegated binding; ignore clicks on svg & path */
		.ghu-rtl > * { pointer-events:none; }
		/* override RTL on code blocks */
		.js-preview-body pre, .markdown-body pre,
		.js-preview-body code, .markdown-body code {
			direction:ltr;
			text-align:left;
			unicode-bidi:normal;
		}
	`);

	// Add RTL button
	function addRtlButton() {
		let el, button,
			toolbars = $$(".toolbar-commenting"),
			indx = toolbars.length;
		if (indx) {
			button = document.createElement("button");
			button.type = "button";
			button.className = "ghu-rtl toolbar-item tooltipped tooltipped-n";
			button.setAttribute("aria-label", "RTL");
			button.setAttribute("tabindex", "-1");
			button.innerHTML = icon;
			while (indx--) {
				el = toolbars[indx];
				if (!$(".ghu-rtl", el)) {
					el.insertBefore(button.cloneNode(true), el.childNodes[0]);
				}
			}
		}
		checkRTL();
	}

	function checkContent(el) {
		// check the contents, and wrap in either a span or div
		let indx, // useDiv,
			html = el.innerHTML,
			parts = html.split(regexSplit),
			len = parts.length;
		for (indx = 0; indx < len; indx++) {
			if (regexOpen.test(parts[indx])) {
				// check if the content contains HTML
				// useDiv = regexTestHTML.test(parts[indx + 1]);
				// parts[indx] = (useDiv ? "<div" : "<span") + " class='ghu-rtl-css'>";
				parts[indx] = "<div class='ghu-rtl-css'>";
			} else if (regexClose.test(parts[indx])) {
				// parts[indx] = useDiv ? "</div>" : "</span>";
				parts[indx] = "</div>";
			}
		}
		el.innerHTML = parts.join("");
		// remove empty paragraph wrappers (may have previously contained the mark)
		return el.innerHTML.replace(/<p><\/p>/g, "");
	}

	function checkRTL() {
		let clone,
			indx = 0,
			div = document.createElement("div"),
			containers = $$(".js-preview-body, .markdown-body"),
			len = containers.length,
			// main loop
			loop = () => {
				let el, tmp,
					max = 0;
				while (max < 10 && indx < len) {
					if (indx > len) {
						return;
					}
					el = containers[indx];
					tmp = el.innerHTML;
					if (regexOpen.test(tmp) || regexClose.test(tmp)) {
						clone = div.cloneNode();
						clone.innerHTML = tmp;
						// now we can replace all instances
						el.innerHTML = checkContent(clone);
						max++;
					}
					indx++;
				}
				if (indx < len) {
					setTimeout(() => {
						loop();
					}, 200);
				}
			};
		loop();
	}

	function addBindings() {
		window.rangyInput.init();
		$("body").addEventListener("click", event => {
			let textarea,
				target = event.target;
			if (target && target.classList.contains("ghu-rtl")) {
				textarea = closest(".previewable-comment-form", target);
				textarea = $(".comment-form-textarea", textarea);
				textarea.focus();
				// add extra white space around the tags
				window.rangyInput.surroundSelectedText(
					textarea,
					" " + openRTL + " ",
					" " + closeRTL + " "
				);
				return false;
			}
		});
	}

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}

	function $$(selector, el) {
		return Array.from((el || document).querySelectorAll(selector));
	}

	function closest(selector, el) {
		while (el && el.nodeType === 1) {
			if (el.matches(selector)) {
				return el;
			}
			el = el.parentNode;
		}
		return null;
	}

	document.addEventListener("ghmo:container", addRtlButton);
	document.addEventListener("ghmo:preview", checkRTL);
	addBindings();
	addRtlButton();

})();
