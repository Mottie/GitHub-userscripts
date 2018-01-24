// ==UserScript==
// @name        GitHub Copy Code Snippet
// @version     0.2.0
// @description A userscript adds a copy to clipboard button on hover of markdown code snippets
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=234970
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-copy-code-snippet.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-copy-code-snippet.user.js
// ==/UserScript==
(() => {
	"use strict";

	const markdown = ".markdown-body, .markdown-format",
		code = `:any(${markdown}) pre:not(.gh-csc-pre)`,

		copyButton = document.createElement("button");

	addAttr(copyButton, {
		"aria-label": "Copy to clipboard",
		className: "js-zeroclipboard btn btn-sm zeroclipboard-button tooltipped tooltipped-w gh-csc-button",
		"data-copied-hint": "Copied!",
		type: "button",
		innerHTML: `
			<svg aria-hidden="true" class="octicon octicon-clippy" height="16" viewBox="0 0 14 16" width="14">
				<path fill-rule="evenodd" d="M2 13h4v1H2v-1zm5-6H2v1h5V7zm2 3V8l-3 3 3 3v-2h5v-2H9zM4.5 9H2v1h2.5V9zM2 12h2.5v-1H2v1zm9 1h1v2c-.02.28-.11.52-.3.7-.19.18-.42.28-.7.3H1c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h3c0-1.11.89-2 2-2 1.11 0 2 .89 2 2h3c.55 0 1 .45 1 1v5h-1V6H1v9h10v-2zM2 5h8c0-.55-.45-1-1-1H8c-.55 0-1-.45-1-1s-.45-1-1-1-1 .45-1 1-.45 1-1 1H3c-.55 0-1 .45-1 1z"></path>
			</svg>`
	});

	GM_addStyle(`
		.gh-csc-wrap {
			position: relative;
		}
		.gh-csc-wrap:hover .gh-csc-button {
			display: block;
		}
		.gh-csc-button {
			display: none;
			position: absolute;
			top: 3px;
			right: 3px;
		}
	`);

	// https://caniuse.com/#search=%3Aany
	function fixAnySelector(sel) {
		const prefix = document.head.style.MozOrient === "" ? "-moz-" : "-webkit-";
		return sel.replace(/:any\(/g, `:${prefix}any(`);
	}

	function addAttr(el, attrs) {
		Object.keys(attrs).forEach(attr => {
			const value = attrs[attr];
			switch(attr) {
			case "className":
				el.className = value;
				break;
			case "innerHTML":
				el.innerHTML = value;
				break;
			default:
				el.setAttribute(attr, value);
			}
		});
	}

	function addButton(wrap, code) {
		wrap.classList.add("gh-csc-wrap", "js-zeroclipboard-container");
		code.classList.add("gh-csc-code", "js-zeroclipboard-target");
		wrap.insertBefore(copyButton.cloneNode(true), wrap.childNodes[0]);
	}

	function init() {
		if (document.querySelector(markdown)) {
			[...document.querySelectorAll(fixAnySelector(code))].forEach(pre => {
				let code = pre.firstElementChild;
				let wrap = pre.parentNode;
				if (code && code.nodeName === "CODE") {
					// pre > code
					addButton(pre, code);
				} else if (wrap.classList.contains("highlight")) {
					// div.highlight > pre
					addButton(wrap, pre);
				}
			});
		}
	}

	document.addEventListener("ghmo:container", init);
	document.addEventListener("ghmo:comments", init);
	init();
})();
