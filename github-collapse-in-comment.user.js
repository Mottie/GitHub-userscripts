// ==UserScript==
// @name        GitHub Collapse In Comment
// @version     1.0.20
// @description A userscript that adds a header that can toggle long code and quote blocks in comments
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-collapse-in-comment.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-collapse-in-comment.user.js
// ==/UserScript==
(() => {
	"use strict";
	/*
	Idea from: https://github.com/dear-github/dear-github/issues/166 &
		https://github.com/isaacs/github/issues/208
	examples:
		https://github.com/Mottie/tablesorter/issues/569
		https://github.com/jquery/jquery/issues/3195
	*/
	// hide code/quotes longer than this number of lines
	let minLines = GM_getValue("gcic-max-lines", 10),
		startCollapsed = GM_getValue("gcic-start-collapsed", true);
	// extract syntax type from class name
	const regex = /highlight(?:-[^\s]+)+/;

	// syntax highlight class name lookup table
	const syntaxClass = {
		basic: "HTML",
		cs: "C#",
		fsharp: "F#",
		gfm: "Markdown",
		jq: "JSONiq",
		shell: "Bash (shell)",
		tcl: "Glyph",
		tex: "LaTex"
	};

	GM_addStyle(`
		.gcic-block {
			border:#eee 1px solid;
			padding:2px 8px 2px 10px;
			border-radius:5px 5px 0 0;
			position:relative;
			top:1px;
			cursor:pointer;
			font-weight:bold;
			display:block;
		}
		.gcic-block + .highlight {
			border-top:none;
		}
		.gcic-block + .email-signature-reply {
			margin-top:0;
		}
		.gcic-block:after {
			content:"\u25bc ";
			float:right;
		}
		.gcic-block-closed {
			border-radius:5px;
			margin-bottom:10px;
		}
		.gcic-block-closed:after {
			transform: rotate(90deg);
		}
		.gcic-block-closed + .highlight, .gcic-block-closed + .email-signature-reply,
		.gcic-block-closed + pre {
			display:none;
		}
	`);

	function makeToggle(name, lines) {
		/* full list of class names from (look at "tm_scope" value)
		https://github.com/github/linguist/blob/master/lib/linguist/languages.yml
		here are some example syntax highlighted class names:
			highlight-text-html-markdown-source-gfm-apib
			highlight-text-html-basic
			highlight-source-fortran-modern
			highlight-text-tex
		*/
		let n = (name || "").match(regex);
		if (n && n[0]) {
			n = n[0].replace(
				/(highlight[-\s]|(source-)|(text-)|(html-)|(markdown-)|(-modern))/g, ""
			);
			n = (syntaxClass[n] || n).toUpperCase().trim();
		}
		return `${n || "Block"} (${lines} lines)`;
	}

	function addToggles() {
		// issue comments
		if ($("#discussion_bucket")) {
			let indx = 0;
			const block = document.createElement("a"),
				els = $$(".markdown-body pre, .email-signature-reply"),
				len = els.length;

			// "flash" = blue box styling
			block.className = `gcic-block border flash${
				startCollapsed ? " gcic-block-closed" : ""
			}`;
			block.href = "#";

			// loop with delay to allow user interaction
			const loop = () => {
				let el, wrap, node, syntaxClass, numberOfLines,
					// max number of DOM insertions per loop
					max = 0;
				while (max < 20 && indx < len) {
					if (indx >= len) {
						return;
					}
					el = els[indx];
					if (el && !el.classList.contains("gcic-has-toggle")) {
						numberOfLines = el.innerHTML.split("\n").length;
						if (numberOfLines > minLines) {
							syntaxClass = "";
							wrap = closest(".highlight", el);
							if (wrap && wrap.classList.contains("highlight")) {
								syntaxClass = wrap.className;
							} else {
								// no syntax highlighter defined (not wrapped)
								wrap = el;
							}
							node = block.cloneNode();
							node.innerHTML = makeToggle(syntaxClass, numberOfLines);
							wrap.parentNode.insertBefore(node, wrap);
							el.classList.add("gcic-has-toggle");
							if (startCollapsed) {
								el.display = "none";
							}
							max++;
						}
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
	}

	function addBindings() {
		document.addEventListener("click", event => {
			let els, indx, flag;
			const el = event.target;
			if (el && el.classList.contains("gcic-block")) {
				event.preventDefault();
				// shift + click = toggle all blocks in a single comment
				// shift + ctrl + click = toggle all blocks on page
				if (event.shiftKey) {
					els = $$(
						".gcic-block",
						event.ctrlKey || event.metaKey ? "" : closest(".markdown-body", el)
					);
					indx = els.length;
					flag = el.classList.contains("gcic-block-closed");
					while (indx--) {
						els[indx].classList.toggle("gcic-block-closed", !flag);
					}
				} else {
					el.classList.toggle("gcic-block-closed");
				}
				removeSelection();
			}
		});
	}

	function update() {
		let toggles = $$(".gcic-block"),
			indx = toggles.length;
		while (indx--) {
			toggles[indx].parentNode.removeChild(toggles[indx]);
		}
		toggles = $$(".gcic-has-toggle");
		indx = toggles.length;
		while (indx--) {
			toggles[indx].classList.remove("gcic-has-toggle");
		}
		addToggles();
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

	function removeSelection() {
		// remove text selection - https://stackoverflow.com/a/3171348/145346
		const sel = window.getSelection ? window.getSelection() : document.selection;
		if (sel) {
			if (sel.removeAllRanges) {
				sel.removeAllRanges();
			} else if (sel.empty) {
				sel.empty();
			}
		}
	}

	GM_registerMenuCommand("Set GitHub Collapse In Comment Max Lines", () => {
		let val = prompt("Minimum number of lines before adding a toggle:",
			minLines);
		val = parseInt(val, 10);
		if (val) {
			minLines = val;
			GM_setValue("gcic-max-lines", val);
			update();
		}
	});

	GM_registerMenuCommand("Set GitHub Collapse In Comment Initial State", () => {
		let val = prompt(
			"Start with blocks (c)ollapsed or (e)xpanded (first letter necessary):",
			startCollapsed ? "collapsed" : "expanded"
		);
		if (val) {
			val = /^c/.test(val || "");
			startCollapsed = val;
			GM_setValue("gcic-start-collapsed", val);
			update();
		}
	});

	document.addEventListener("ghmo:container", addToggles);
	document.addEventListener("ghmo:preview", addToggles);
	addBindings();
	addToggles();

})();
