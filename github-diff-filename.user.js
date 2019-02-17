// ==UserScript==
// @name        GitHub Diff Filename
// @version     1.0.6
// @description A userscript that highlights filename & permission alterations
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-end
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-filename.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-filename.user.js
// ==/UserScript==
(() => {
	"use strict";

	const arrow = "\u2192", // "→"
		regex = new RegExp(`\\s${arrow}\\s`);

	function processFileInfo(el) {
		let node;
		if (!$(".ghdfn", el)) {
			const link = $("a", el);
			// A file can be moved AND include permission changes
			// e.g. main.js → scripts/main.js 100755 → 100644
			// with file name inside link and permission changes outside in a text node
			if (link && regex.test(link.textContent)) {
				node = findMatchingNode(link)[0];
				processNode(node);
			}
			node = findMatchingNode(el)[0];
			processNode(node);
		}
	}

	function processNode(node) {
		if (node) {
			let txt = node.textContent,
				// modify right node first to maintain node text indexing
				middle = txt.indexOf(arrow);
			if (middle > -1) {
				wrapParts({
					start: middle + 2,
					end: txt.length,
					name: "ghdfn text-green",
					node
				});
			}
			middle = node.textContent.indexOf(arrow);
			if (middle > -1) {
				wrapParts({
					start: 0,
					end: middle - 1,
					name: "ghdfn text-red",
					node
				});
			}
		}
	}

	function findMatchingNode(el) {
		return [...el.childNodes].filter(
			node => regex.test(node.textContent) && node.nodeType === 3
		);
	}

	function wrapParts(data) {
		let newNode, tmpNode;
		const {start, end, name, node} = data;
		if (node && node.nodeType === 3) {
			tmpNode = node.splitText(start);
			tmpNode.splitText(end - start);
			newNode = document.createElement("span");
			newNode.className = name;
			newNode.textContent = tmpNode.textContent;
			tmpNode.parentNode.replaceChild(newNode, tmpNode);
		}
	}

	function $(str, el = document) {
		return el.querySelector(str);
	}

	function $$(str, el = document) {
	  return [...el.querySelectorAll(str)];
	}

	function init() {
		if ($("#files")) {
			$$("#files .file-info").forEach(el => {
				processFileInfo(el);
			});
		}
	}

	document.addEventListener("ghmo:container", init);
	document.addEventListener("ghmo:diff", init);
	init();

})();
