// ==UserScript==
// @name        GitHub Diff Filename
// @version     1.1.1
// @description A userscript that highlights filename & permission alterations
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-end
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=785415
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-filename.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-filename.user.js
// ==/UserScript==
/* global $ $$ on */
(() => {
	"use strict";

	const arrow = "\u2192"; // "→"
	const regex = new RegExp(`\\s${arrow}\\s`);

	function processFileInfo(el) {
		let node;
		if (!$(".ghdfn", el)) {
			// A file can be moved AND include permission changes
			// e.g. main.js → scripts/main.js 100755 → 100644
			// see https://github.com/openstyles/stylus/pull/110/files#diff-5186ece9a52b5e8b0d2e221fdf139ae963ae774267b2f52653c7e45e2a0bda52

			const link = $("a[title]", el);
			// file name/location changes are inside the link
			if (link && regex.test(link.textContent)) {
				modifyLinkText(link);
			}
			// permission changes in a text node as a direct child of the wrapper
			// process permission change (if it exists)
			node = findTextNode(el)[0];
			processNode(node);
		}
	}

	function modifyLinkText(link) {
		if (link) {
			const [oldFile, newFile] = (link.title || "").split(regex);
			link.innerHTML = `
				<span class="ghdfn text-red">${oldFile}</span> ${arrow}
				<span class="ghdfn text-green">${newFile}</span>`;
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

	function findTextNode(el) {
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

	function init() {
		if ($("#files")) {
			$$("#files .file-info").forEach(processFileInfo);
		}
	}

	on(document, "ghmo:container", init);
	on(document, "ghmo:diff", init);
	init();

})();
