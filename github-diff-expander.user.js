// ==UserScript==
// @name        GitHub Diff Expander
// @version     0.1.3
// @description A userscript that adds more diff code expanding buttons
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       none
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-diff-expander.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-diff-expander.user.js
// ==/UserScript==
(() => {
	"use strict";

	// A max of 20 (0-19) rows are loaded; set by GitHub server
	const expandMax = 20;
	// The expand server call expects these parameters; but they may have no
	// setting (first expander), or be completely missing (last expander)
	const order = [
		"prev_line_num_left",
		"next_line_num_left",
		"prev_line_num_right",
		"next_line_num_right"
	];
	const regexp = order.reduce((acc, line) => {
		acc[line] = new RegExp(`${line}=\\d*`);
		return acc;
	}, {});

	const span = document.createElement("span");
	let busy = false;

	function parse(num) {
		return Number(num) || 0;
	}

	function getRange(tr, isExpander) {
		let range = [];
		if (isExpander) {
			const link = $("a.diff-expander", tr);
			// Using data-(left/right)-range because the data-url may not include all
			// the values
			[range[0], range[1]] = link.dataset.leftRange.split("-").map(parse);
			[range[2], range[3]] = link.dataset.rightRange.split("-").map(parse);
			// but dataset range[0] is equal to prev_line_num_left after expanding.
			// To get the correct number, the start needs to be increased by two
			const prev = tr.previousElementSibling;
			if (prev && prev.classList.contains("blob-expanded")) {
				range[0] = range[0] + 2;
				range[2] = range[2] + 2;
			}
		} else {
			range[0] = range[1] = parse($("td:first-child", tr).dataset.lineNumber);
			range[2] = range[3] = parse($("td:nth-child(2)", tr).dataset.lineNumber);
		}
		return range;
	}

	function removeExpanders(file) {
		$$("tr.ghdex-expander", file).forEach(tr => {
			tr.parentNode.removeChild(tr);
		});
	}

	function findGaps(file) {
		let left = 0;
		let right = 0;
		removeExpanders(file);
		// It's not efficient, but cycling through every row was found to be the
		// most reliable method of getting an accurate expander range
		$$("tr", file).forEach(row => {
			const isExpander = row.classList.contains("js-expandable-line");
			const range = getRange(row, isExpander);
			if (isExpander) {
				let max = left + expandMax;
				if (typeof row.dataset.position === "undefined") {
					// Last expander row data-url parameter doesn't include either
					// "next_line_num_(left/right)"
					return updateExpander(row, [], [
						range[0],
						Math.min(range[1], range[0] + expandMax - 1)
					]);
				} else if (max > range[1] && range[1] - left < expandMax) {
					range[0] = Math.max(1, left, range[0]);
					range[2] = Math.max(1, right, range[2]);
				} else if (range[1] > max && left < range[1] - expandMax) {
					addExpander(row, [left, max, right, right + expandMax]);
				} else if (range[1] - expandMax > left) {
					range[0] = left;
					range[2] = right;
				}
				const text = [
					Math.max(1, range[0], range[1] - expandMax + 1),
					range[1],
					Math.max(1, range[2], range[3] - expandMax + 1),
					range[3]
				];
				updateExpander(row, range, text);
			} else {
				left = range[0];
				right = range[2];
			}
		});
	}

	function updateExpander(tr, range, text = range) {
		const expander = $("a.diff-expander", tr);
		if (range.length) {
			expander.dataset.leftRange = range.slice(0, 2).join("-");
			expander.dataset.rightRange = range.slice(2).join("-");
			let result = expander.dataset.url;
			range.forEach((value, index) => {
				// prev_line_num_(left/right) requires an empty value to get line 1 (0)
				// next_line_num_(left/right) requires the *next* line number + 1, so a
				// range of 1-20 would have [0, 21, 0, 21] and a range of 20-40 would be
				// [20, 41, 20, 41]
				result = replacer(result, order[index], value + index % 2);
			});
			expander.dataset.url = result;
		}
		// The last expander won't include text[2] & text[3] values
		const [start, end] = text;
		const txt = start > end ? `${end}-${end}` : `${start}-${end}`;
		let el = $("span", expander);
		if (el) {
			el.textContent = txt;
		} else {
			span.textContent = txt;
			expander.insertAdjacentElement("beforeend", span.cloneNode(true));
		}
	}

	function replacer(url, order, value) {
		// The first expander will require a key with no value to load the first
		// line, i.e. "...&prev_line_num_left=&prev_line_num_right=&..."
		const result = `${order}=${value <= 1 ? "" : value}`;
		const regex = regexp[order];
		// The last expander row doesn't include next_line_num_(left/right);
		// it'll need to be added
		return regex.test(url) ? url.replace(regex, result) : url + result;
	}

	function addExpander(tr, range) {
		const expander = tr.cloneNode(true);
		expander.classList.add("ghdex-expander");
		$("td.blob-code", expander).textContent = "\xA0";
		expander.removeAttribute("data-position");
		tr.parentNode.insertBefore(expander, tr);
		const text = [range[0] + 1, range[1], range[2] + 1, range[3]];
		updateExpander(expander, range, text);
	}

	function processFiles() {
		busy = true;
		$$(".diff-table").forEach(findGaps);
		setTimeout(() => {
			busy = false;
		}, 500);
	}

	function init(e) {
		if (!busy && $("#diff-0")) {
			if (e) {
				setTimeout(processFiles, 100);
			} else {
				processFiles();
			}
		}
	}

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}

	function $$(selectors, el) {
		return [...(el || document).querySelectorAll(selectors)];
	}

	document.addEventListener("ghmo:container", init);
	document.addEventListener("ghmo:diff", init);
	init();

})();
