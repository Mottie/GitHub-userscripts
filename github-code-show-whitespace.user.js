// ==UserScript==
// @name        GitHub Code Show Whitespace
// @version     1.0.0
// @description A userscript that shows whitespace (space, tabs and carriage returns) in code blocks
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=189706
// @icon        https://github.com/fluidicon.png
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-code-show-whitespace.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-code-show-whitespace.user.js
// ==/UserScript==
(() => {
	"use strict";

	// include em-space & en-space?
	const whitespace = {
			"%20"  : "<span class='pl-space ghcw-whitespace'> </span>",
			"%A0"  : "<span class='pl-nbsp ghcw-whitespace'>&nbsp;</span>",
			"%09"  : "<span class='pl-tab ghcw-whitespace'>\x09</span>",
			// non-matching key; applied manually
			"CRLF" : "<span class='pl-crlf ghcw-whitespace'></span>\n"
		},
		span = document.createElement("span"),
		// ignore +/- in diff code blocks
		regexWS = /(\x20|&nbsp;|\x09)/g,
		regexCR = /\r*\n$/,
		regexTabSize = /\btab-size-\d\b/g,

		toggleButton = document.createElement("div");
	toggleButton.className = "ghcw-toggle btn btn-sm tooltipped tooltipped-n";
	toggleButton.setAttribute("aria-label", "Toggle Whitespace");
	toggleButton.innerHTML = "<span class='pl-tab'></span>";

	GM_addStyle(`
		.highlight .blob-code-inner { tab-size: 2; }
		/* GitHub-Dark overrides the above setting */
		.highlight.ghcw-active.tab-size-2 .pl-tab { width: 1.1em; }
		.highlight.ghcw-active.tab-size-4 .pl-tab { width: 2.2em; }
		.highlight.ghcw-active.tab-size-6 .pl-tab { width: 3.3em; }
		.highlight.ghcw-active.tab-size-8 .pl-tab { width: 4.4em; }

		.ghcw-active .ghcw-whitespace,
		.gist-content-wrapper .file-actions .btn-group {
			position: relative;
			display: inline-block;
		}
		.ghcw-active .ghcw-whitespace:before {
			position: absolute;
			opacity: .5;
			user-select: none;
			font-weight: bold;
			color: #777 !important;
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
			top: -.75em;
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
			node => NodeFilter.FILTER_ACCEPT
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
			updateTabSize(block);
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

	function updateTabSize(block) {
		// remove previous tab-size setting
		block.className = block.className.replace(regexTabSize, " ");
		// calculate tab-size; GitHub-Dark allows user modification
		const len = window.getComputedStyle($(".blob-code-inner", block)).tabSize;
		block.classList.add(`tab-size-${len}`);
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
			let block = $(".highlight", closest(".file", target));
			if (block) {
				target.classList.toggle("selected");
				block.classList.toggle("ghcw-active");
				updateTabSize(block);
				addWhitespace(block);
			}
		}
	});

	document.addEventListener("ghmo:container", addToggle);
	document.addEventListener("ghmo:diff", addToggle);
	// toggle added to diff & file view
	addToggle();

})();
