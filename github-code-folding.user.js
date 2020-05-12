// ==UserScript==
// @name        GitHub Code Folding
// @version     1.1.1
// @description A userscript that adds code folding to GitHub files
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       GM.addStyle
// @grant       GM_addStyle
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
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

	GM.addStyle(`
		td.blob-code.blob-code-inner { position:relative; padding-left:10px; }
		.ghcf-collapser { position:absolute; left:2px; width:10px; cursor:pointer; }
		.ghcf-collapser:after { display: inline-block; vertical-align: middle;
			content:"\u25bc"; opacity:.5; transition:.15s; }
		.ghcf-collapser:hover:after { opacity:1; }
		.ghcf-collapsed.ghcf-collapser:after { transform:rotate(-90deg);
			opacity:.8; }
		.ghcf-hidden-line { display:none; }
		.ghcf-ellipsis { padding:1px 2px; margin-left:2px; cursor:pointer;
			background:rgba(255,235,59,.4); position:relative; z-index:1; }
		.ghcf-ellipsis:hover { background:rgba(255,235,59,.7); }
	`);

	const blocks = {};
	const ellipsis = document.createElement("span");
	const triangle = document.createElement("span");

	triangle.className = "ghcf-collapser";
	ellipsis.className = "pl-smi ghcf-ellipsis";
	ellipsis.innerHTML = "&hellip;";

	function countInitialWhiteSpace(arr) {
		const getWhiteSpaceIndex = i => {
			if (arr[i] !== " " && arr[i] !== "\t" && arr[i] !== "\xa0") {
				return i;
			}
			return getWhiteSpaceIndex(++i);
		};
		return getWhiteSpaceIndex(0);
	}

	function getPreviousSpaces(map, lineNum) {
		let prev = map.get(lineNum - 1);
		return prev === -1
			? getPreviousSpaces(map, lineNum - 1)
			: {
				lineNum: lineNum - 1,
				count: prev
			};
	}

	function getLineNumber(el) {
		let elm = el.closest("tr");
		if (elm) {
			elm = elm.querySelector("[data-line-number]");
			return elm ? parseInt(elm.dataset.lineNumber, 10) : "";
		}
		return "";
	}

	function getCodeLines(codeBlock) {
		return $$(".blob-code-inner", codeBlock);
	}

	function toggleCode({ action, codeBlock, index, depth }) {
		let els, lineNums;
		const codeLines = getCodeLines(codeBlock) || [];
		const pairs = blocks[codeBlock.dataset.blockIndex];
		if (!pairs || codeLines.length === 0) {
			return;
		}
		// depth is a string containing a specific depth number to toggle
		if (depth) {
			els = $$(`.ghcf-collapser[data-depth="${depth}"]`, codeBlock);
			lineNums = els.map(el => {
				el.classList.toggle("ghcf-collapsed", action === "hide");
				return getLineNumber(el);
			});
		} else {
			lineNums = [index];
		}

		if (action === "hide") {
			lineNums.forEach(start => {
				let elm;
				let end = pairs.get(start - 1);
				codeLines.slice(start, end).forEach(el => {
					elm = el.closest("tr");
					if (elm) {
						elm.classList.add("ghcf-hidden-line");
					}
				});
				if (!$(".ghcf-ellipsis", codeLines[start - 1])) {
					elm = $(".ghcf-collapser", codeLines[start - 1]);
					elm.parentNode.insertBefore(
						ellipsis.cloneNode(true),
						elm.nextSibling
					);
				}
			});
		} else if (action === "show") {
			lineNums.forEach(start => {
				let end = pairs.get(start - 1);
				codeLines.slice(start, end).forEach(el => {
					let elm = el.closest("tr");
					if (elm) {
						elm.classList.remove("ghcf-hidden-line");
						removeEls(".ghcf-ellipsis", elm);
					}
					elm = $(".ghcf-collapsed", elm);
					if (elm) {
						elm.classList.remove("ghcf-collapsed");
					}
				});
				removeEls(".ghcf-ellipsis", codeLines[start - 1]);
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
			const codeBlock = el.closest(".highlight");

			// click on collapser
			if (el && el.classList.contains("ghcf-collapser")) {
				isCollapsed = el.classList.contains("ghcf-collapsed");
				index = getLineNumber(el);
				// Shift + click to toggle them all
				if (index && event.getModifierState("Shift")) {
					return toggleCode({
						action: isCollapsed ? "show" : "hide",
						codeBlock,
						index,
						depth: el.dataset.depth
					});
				}
				if (index) {
					if (isCollapsed) {
						el.classList.remove("ghcf-collapsed");
						toggleCode({ action: "show", codeBlock, index });
					} else {
						el.classList.add("ghcf-collapsed");
						toggleCode({ action: "hide", codeBlock, index });
					}
				}
				return;
			}

			// click on ellipsis
			if (el && el.classList.contains("ghcf-ellipsis")) {
				elm = $(".ghcf-collapsed", el.parentNode);
				if (elm) {
					elm.classList.remove("ghcf-collapsed");
				}
				index = getLineNumber(el);
				if (index) {
					toggleCode({ action: "show", codeBlock, index });
				}
			}
		});
	}

	function addCodeFolding() {
		// Keep .file in case someone needs this userscript for GitHub Enterprise
		if ($(".file table.highlight, .blob-wrapper table.highlight")) {
			$$("table.highlight").forEach((codeBlock, blockIndex) => {
				if (codeBlock && codeBlock.classList.contains("ghcf-processed")) {
					// Already processed
					return;
				}
				const codeLines = getCodeLines(codeBlock);
				removeEls("span.ghcf-collapser", codeBlock);
				if (codeLines) {
					// In case this script has already been run and modified the DOM on a
					// previous page in github, make sure to reset it.
					codeBlock.classList.add("ghcf-processed");
					codeBlock.dataset.blockIndex = blockIndex;

					const spaceMap = new Map();
					const stack = [];
					const pairs = blocks[blockIndex] = new Map();

					codeLines.forEach((el, lineNum) => {
						let prevSpaces;
						let line = el.textContent;
						let count = line.trim().length
							? countInitialWhiteSpace(line.split(""))
							: -1;
						spaceMap.set(lineNum, count);

						function tryPair() {
							let el;
							let top = stack[stack.length - 1];
							if (count !== -1 && count <= spaceMap.get(top)) {
								pairs.set(top, lineNum);
								// prepend triangle
								el = triangle.cloneNode();
								el.dataset.depth = count + 1;
								codeLines[top].appendChild(el, codeLines[top].childNodes[0]);
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
			});
		}
	}

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}

	function $$(selector, el) {
		return Array.from((el || document).querySelectorAll(selector));
	}

	function removeEls(selector, el) {
		let els = $$(selector, el);
		let index = els.length;
		while (index--) {
			els[index].parentNode.removeChild(els[index]);
		}
	}

	function removeSelection() {
		// remove text selection - https://stackoverflow.com/a/3171348/145346
		const sel = window.getSelection
			? window.getSelection()
			: document.selection;
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
