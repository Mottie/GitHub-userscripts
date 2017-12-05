// ==UserScript==
// @name        GitHub Code Show Whitespace
// @version     1.1.3
// @description A userscript that shows whitespace (space, tabs and carriage returns) in code blocks
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=234970
// @icon        https://github.com/fluidicon.png
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-code-show-whitespace.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-code-show-whitespace.user.js
// ==/UserScript==
(() => {
	"use strict";

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
	toggleButton.className = "ghcw-toggle btn btn-sm tooltipped tooltipped-n";
	toggleButton.setAttribute("aria-label", "Toggle Whitespace");
	toggleButton.innerHTML = "<span class='pl-tab'></span>";

	GM_addStyle(`
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
		/* hide extra leading space added to diffs - see #27 */
		.diff-table td.blob-code-inner .pl-space:first-child,
		.diff-table .blob-code-context .pl-space:first-child {
			opacity: 0;
		}
	`);

	function addToggle() {
		$$(".file-actions").forEach(el => {
			if (!$(".ghcw-toggle", el)) {
				el.insertBefore(toggleButton.cloneNode(true), el.childNodes[0]);
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

	function addWhitespace(block) {
		let lines, indx, len;
		if (block && !block.classList.contains("ghcw-processed")) {
			block.classList.add("ghcw-processed");
			indx = 0;

			// class name of each code row
			lines = $$(".blob-code-inner:not(.blob-code-hunk)", block);
			len = lines.length;

			// loop with delay to allow user interaction
			const loop = () => {
				let line, nodes,
					// max number of DOM insertions per loop
					max = 0;
				while (max < 50 && indx < len) {
					if (indx >= len) {
						return;
					}
					line = lines[indx];
					// first node is a syntax string and may have leading whitespace
					nodes = getNodes(line);
					replaceTextNode(nodes);
					// remove end CRLF if it exists; then add a line ending
					line.innerHTML = line.innerHTML.replace(regexCR, "") + whitespace.CRLF;
					max++;
					indx++;
				}
				if (indx < len) {
					setTimeout(() => {
						loop();
					}, 100);
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

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}

	function $$(selector, el) {
		return [...(el || document).querySelectorAll(selector)];
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

	// bind whitespace toggle button
	document.addEventListener("click", event => {
		const target = event.target;
		if (
			target.nodeName === "DIV" &&
			target.classList.contains("ghcw-toggle")
		) {
			const wrap = closest(".file", target);
			const block = $(".highlight", wrap);
			if (block) {
				target.classList.toggle("selected");
				block.classList.toggle("ghcw-active");
				detectDiff(wrap);
				addWhitespace(block);
			}
		}
	});

	document.addEventListener("ghmo:container", addToggle);
	document.addEventListener("ghmo:diff", addToggle);
	// toggle added to diff & file view
	addToggle();

})();
