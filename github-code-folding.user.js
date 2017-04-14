// ==UserScript==
// @name        GitHub Code Folding
// @version     1.0.3
// @description A userscript that adds code folding to GitHub files
// @license     https://opensource.org/licenses/MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=188090
// @icon        https://github.com/fluidicon.png
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-code-folding.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-code-folding.user.js
// ==/UserScript==
/**
 * This userscript has been heavily modified from the "github-code-folding"
 * Chrome extension Copyright 2016 by Noam Lustiger; under an MIT license
 * https://github.com/noam3127/github-code-folding
 */
(() => {
	"use strict";

	GM_addStyle(`
		td.blob-code.blob-code-inner { padding-left:13px; }
		.collapser { position:absolute; left:2px; width:22px; opacity:.5;
			transition:.15s; cursor:pointer; }
		.collapser:after { content:"\u25bc"; }
		.collapser:hover { opacity:1; }
		.sideways { transform:rotate(-90deg); transform-origin:16% 49%; opacity:.8; }
		.hidden-line { display:none; }
		.ellipsis { padding:1px 2px; margin-left:2px; cursor:pointer;
			background:rgba(255,235,59,.4); }
		.ellipsis:hover { background:rgba(255,235,59,.7); }
	`);

	const pairs = new Map(),
		ellipsis = document.createElement("span"),
		triangle = document.createElement("span");

	triangle.className = "collapser";
	ellipsis.className = "pl-smi ellipsis";
	ellipsis.innerHTML = "&hellip;";

	function countInitialWhiteSpace(arr) {
		const getWhiteSpaceIndex = i => {
			if (arr[i] !== " " && arr[i] !== "\t") {
				return i;
			}
			i++;
			return getWhiteSpaceIndex(i);
		};
		return getWhiteSpaceIndex(0);
	}

	function getPreviousSpaces(map, lineNum) {
		let prev = map.get(lineNum - 1);
		return prev === -1 ?
			getPreviousSpaces(map, lineNum - 1) : {
				lineNum: lineNum - 1,
				count: prev
			};
	}

	function getLineNumber(el) {
		let elm = closest("td", el),
			index = elm ? elm.id : "";
		if (index) {
			return parseInt(index.slice(2), 10);
		}
		return "";
	}

	function toggleCode(action, index, depth) {
		let els, lineNums;
		const codeLines = $$(".file table.highlight .blob-code-inner");
		// depth is a string containing a specific depth number to toggle
		if (depth) {
			els = $$(`.collapser[data-depth="${depth}"]`);
			lineNums = els.map(el => {
				el.classList.toggle("sideways", action === "hide");
				return getLineNumber(el);
			});
		} else {
			lineNums = [index];
		}

		if (action === "hide") {
			lineNums.forEach(start => {
				let end = pairs.get(start - 1);
				codeLines.slice(start, end).forEach(el => {
					let elm = closest("tr", el);
					if (elm) {
						elm.classList.add("hidden-line");
					}
				});
				if (!$(".ellipsis", codeLines[start - 1])) {
					codeLines[start - 1].appendChild(ellipsis.cloneNode(true));
				}
			});
		} else if (action === "show") {
			lineNums.forEach(start => {
				let end = pairs.get(start - 1);
				codeLines.slice(start, end).forEach(el => {
					let elm = closest("tr", el);
					if (elm) {
						elm.classList.remove("hidden-line");
						remove(".ellipsis", elm);
					}
					elm = $(".sideways", elm);
					if (elm) {
						elm.classList.remove("sideways");
					}
				});
				remove(".ellipsis", codeLines[start - 1]);
			});
		}
		// shift ends up selecting text on the page, so clear it
		if (lineNums.length > 1) {
			removeSelection();
		}
	}

	function addBindings() {
		document.addEventListener("click", event => {
			let index, elm, isCollapsed;
			const el = event.target;

			// click on collapser
			if (el && el.classList.contains("collapser")) {
				isCollapsed = el.classList.contains("sideways");
				index = getLineNumber(el);
				// Shift + click to toggle them all
				if (index && event.getModifierState("Shift")) {
					return toggleCode(
						isCollapsed ? "show" : "hide",
						index,
						el.getAttribute("data-depth")
					);
				}
				if (index) {
					if (isCollapsed) {
						el.classList.remove("sideways");
						toggleCode("show", index);
					} else {
						el.classList.add("sideways");
						toggleCode("hide", index);
					}
				}
				return;
			}

			// click on ellipsis
			if (el && el.classList.contains("ellipsis")) {
				elm = $(".sideways", el.parentNode);
				if (elm) {
					elm.classList.remove("sideways");
				}
				index = getLineNumber(el);
				if (index) {
					toggleCode("show", index);
				}
			}
		});
	}

	function addCodeFolding() {
		if ($(".file table.highlight")) {
			// In case this script has already been run and modified the DOM on a
			// previous page in github, make sure to reset it.
			remove("span.collapser");
			pairs.clear();

			const codeLines = $$(".file table.highlight .blob-code-inner"),
				spaceMap = new Map(),
				stack = [];

			codeLines.forEach((el, lineNum) => {
				let prevSpaces,
					line = el.textContent,
					count = line.trim().length ?
						countInitialWhiteSpace(line.split("")) :
						-1;
				spaceMap.set(lineNum, count);

				function tryPair() {
					let el,
						top = stack[stack.length - 1];
					if (count !== -1 && count <= spaceMap.get(top)) {
						pairs.set(top, lineNum);
						// prepend triangle
						el = triangle.cloneNode();
						el.setAttribute("data-depth", count + 1);
						codeLines[top].insertBefore(el, codeLines[top].childNodes[0]);
						stack.pop();
						return tryPair();
					}
				}
				tryPair();

				prevSpaces = getPreviousSpaces(spaceMap, lineNum);
				if (count > prevSpaces.count) {
					stack.push(prevSpaces.lineNum);
				}
			});
		}
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

	function remove(selector, el) {
		let els = $$(selector, el),
			index = els.length;
		while (index--) {
			els[index].parentNode.removeChild(els[index]);
		}
	}

	function removeSelection() {
		// remove text selection - https://stackoverflow.com/a/3171348/145346
		const sel = window.getSelection ?
			window.getSelection() :
			document.selection;
		if (sel) {
			if (sel.removeAllRanges) {
				sel.removeAllRanges();
			} else if (sel.empty) {
				sel.empty();
			}
		}
	}

	document.addEventListener("ghmo:container", addCodeFolding);
	addCodeFolding();
	addBindings();

})();
