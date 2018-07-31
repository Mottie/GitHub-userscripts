// ==UserScript==
// @name        GitHub Code Show Whitespace
// @version     1.2.0
// @description A userscript that shows whitespace (space, tabs and carriage returns) in code blocks
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       GM_registerMenuCommand
// @grant       GM.registerMenuCommand
// @grant       GM.addStyle
// @grant       GM_addStyle
// @grant       GM.getValue
// @grant       GM_getValue
// @grant       GM.setValue
// @grant       GM_setValue
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=597950
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-code-show-whitespace.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-code-show-whitespace.user.js
// ==/UserScript==
(() => {
	"use strict";

	const showWhiteSpace = GM_getValue("show-whitespace", "false");

	// include em-space & en-space?
	const whitespace = {
			// Applies \xb7 (·) to every space
			"%20"  : "<span class='pl-space ghcw-whitespace'> </span>",
			// Applies \xb7 (·) to every non-breaking space (alternative: \u2423 (␣))
			"%A0"  : "<span class='pl-nbsp ghcw-whitespace'>&nbsp;</span>",
			// Applies \xbb (») to every tab
			"%09"  : "<span class='pl-tab ghcw-whitespace'>\x09</span>",
			// non-matching key; applied manually
			// Applies \u231d (⌝) to the end of every line
			// (alternatives: \u21b5 (↵) or \u2938 (⤸))
			"CRLF" : "<span class='pl-crlf ghcw-whitespace'></span>\n"
		},
		span = document.createElement("span"),
		// ignore +/- in diff code blocks
		regexWS = /(\x20|&nbsp;|\x09)/g,
		regexCR = /\r*\n$/,
		regexExceptions = /(\.md)$/i,

		toggleButton = document.createElement("div");
	toggleButton.className = "ghcw-toggle btn btn-sm tooltipped tooltipped-s";
	toggleButton.setAttribute("aria-label", "Toggle Whitespace");
	toggleButton.innerHTML = "<span class='pl-tab'></span>";

	GM.addStyle(`
		.ghcw-active .ghcw-whitespace,
		.gist-content-wrapper .file-actions .btn-group {
			position: relative;
			display: inline;
		}
		.ghcw-active .ghcw-whitespace:before {
			position: absolute;
			opacity: .5;
			user-select: none;
			font-weight: bold;
			color: #777 !important;
			top: -.25em;
			left: 0;
		}
		.ghcw-toggle .pl-tab {
			pointer-events: none;
		}
		.ghcw-active .pl-space:before {
			content: "\\b7";
		}
		.ghcw-active .pl-nbsp:before {
			content: "\\b7";
		}
		.ghcw-active .pl-tab:before,
		.ghcw-toggle .pl-tab:before {
			content: "\\bb";
		}
		.ghcw-active .pl-crlf:before {
			content: "\\231d";
			top: .1em;
		}
		/* weird tweak for diff markdown files - see #27 */
		.ghcw-adjust .ghcw-active .ghcw-whitespace:before {
			left: .6em;
		}
	`);

	function addToggle() {
		$$(".file-actions").forEach(el => {
			if (!$(".ghcw-toggle", el)) {
				el.insertBefore(toggleButton.cloneNode(true), el.childNodes[0]);
			}
			if (showWhiteSpace) {
				// Let the page render a bit before going nuts
				setTimeout(show(el, true), 200);
			}
		});
	}

	function getNodes(line) {
		const nodeIterator = document.createNodeIterator(
			line,
			NodeFilter.SHOW_TEXT,
			() => NodeFilter.FILTER_ACCEPT
		);
		let currentNode,
			nodes = [];
		while ((currentNode = nodeIterator.nextNode())) {
			nodes.push(currentNode);
		}
		return nodes;
	}

	function escapeHTML(html) {
		return html.replace(/[<>"'&]/g, m => ({
			"<": "&lt;",
			">": "&gt;",
			"&": "&amp;",
			"'": "&#39;",
			"\"": "&quot;"
		}[m]));
	}

	function replaceWhitespace(html) {
		return escapeHTML(html).replace(regexWS, s => {
			let idx = 0,
				ln = s.length,
				result = "";
			for (idx = 0; idx < ln; idx++) {
				result += whitespace[encodeURI(s[idx])] || s[idx] || "";
			}
			return result;
		});
	}

	function replaceTextNode(nodes) {
		let node, indx, el,
			ln = nodes.length;
		for (indx = 0; indx < ln; indx++) {
			node = nodes[indx];
			if (
				node &&
				node.nodeType === 3 &&
				node.textContent &&
				node.textContent.search(regexWS) > -1
			) {
				el = span.cloneNode();
				el.innerHTML = replaceWhitespace(node.textContent.replace(regexCR, ""));
				node.parentNode.insertBefore(el, node);
				node.parentNode.removeChild(node);
			}
		}
	}

	function* modifyLine(lines) {
		while (lines.length) {
			const line = lines.shift();
			// first node is a syntax string and may have leading whitespace
			replaceTextNode(getNodes(line));
			// remove end CRLF if it exists; then add a line ending
			const html = line.innerHTML;
			const update = html.replace(regexCR, "") + whitespace.CRLF;
			if (update !== html) {
				line.innerHTML = update;
			}
		}
		yield lines;
	}

	function addWhitespace(block) {
		if (block && !block.classList.contains("ghcw-processed")) {
			block.classList.add("ghcw-processed");
			let status;

			// class name of each code row
			const lines = $$(".blob-code-inner:not(.blob-code-hunk)", block);
			const iter = modifyLine(lines);

			// loop with delay to allow user interaction
			const loop = () => {
				for (let i = 0; i < 40; i++) {
					status = iter.next();
				}
				if (!status.done) {
					requestAnimationFrame(loop);
				}
			};
			loop();
		}
	}

	function detectDiff(wrap) {
		const header = $(".file-header", wrap);
		if ($(".diff-table", wrap) && header) {
			const file = header.getAttribute("data-path");
			if (
				// File Exceptions that need tweaking (e.g. ".md")
				regexExceptions.test(file) ||
				// files with no extension (e.g. LICENSE)
				file.indexOf(".") === -1
			) {
				// This class is added to adjust the position of the whitespace
				// markers for specific files; See issue #27
				wrap.classList.add("ghcw-adjust");
			}
		}
	}

	function showAll() {
		$$(".file .highlight").forEach(target => {
			show(target, true);
		});
	}

	function show(target, state) {
		const wrap = target.closest(".file");
		const block = $(".highlight", wrap);
		if (block) {
			wrap.querySelector(".ghcw-toggle").classList.toggle("selected", state);
			block.classList.toggle("ghcw-active", state);
			detectDiff(wrap);
			addWhitespace(block);
		}
	}

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}

	function $$(selector, el) {
		return [...(el || document).querySelectorAll(selector)];
	}

	// bind whitespace toggle button
	document.addEventListener("click", event => {
		const target = event.target;
		if (
			target.nodeName === "DIV" &&
			target.classList.contains("ghcw-toggle")
		) {
			show(target);
		}
	});

	GM_registerMenuCommand("GitHub Code White Space", () => {
		const val = prompt("Always show on page load?", showWhiteSpace);
		if (val !== null) {
			GM_getValue("show-whitespace", showWhiteSpace);
			showAll();
		}
	});

	document.addEventListener("ghmo:container", addToggle);
	document.addEventListener("ghmo:diff", addToggle);
	// toggle added to diff & file view
	addToggle();

})();
