// ==UserScript==
// @name        GitHub Sort Reactions
// @version     0.1.0
// @description A userscript that sorts comments by reaction
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=198500
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-reactions.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-reactions.user.js
// ==/UserScript==
(() => {
	"use strict";

	const nonInteger = /[^\d]/g,
		reactionValues = {
			"THUMBS_UP": 1,
			"HOORAY": 1,
			"HEART": 1,
			"LAUGH": 0.5,
			"CONFUSED": -0.5,
			"THUMBS_DOWN": -1
		},
		currentSort = {
			init: false,
			el: null,
			dir: 0, // 0 = unsorted, 1 = desc, 2 = asc
			busy: false
		},

		sortBlock = `
<div class="timeline-comment-wrapper ghsc-sort-block">
	<div class="timeline-comment">
		<div class="avatar-parent-child timeline-comment-avatar position-relative">
			<svg aria-hidden="true" class="octicon ghsc-sort-icon" xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 16 16">
				<path d="M15 8 1 8 8 0zM15 9 1 9 8 16z"/>
			</svg>
		</div>
		<div class="timeline-comment-header comment comment-body">
			<h3 class="timeline-comment-header-text f5 text-normal">
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n" type="button" aria-label="Sort by +1 reaction" data-sort="THUMBS_UP">
					<g-emoji alias="+1" class="emoji mr-1" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f44d.png">👍</g-emoji>
				</button>
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n" type="button" aria-label="Sort by -1 reaction" data-sort="THUMBS_DOWN">
					<g-emoji alias="-1" class="emoji mr-1" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f44e.png">👎</g-emoji>
				</button>
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n" type="button" aria-label="Sort by laugh reaction" data-sort="LAUGH">
					<g-emoji alias="smile" class="emoji mr-1" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f604.png">😄</g-emoji>
				</button>
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n" type="button" aria-label="Sort by hooray reaction" data-sort="HOORAY">
					<g-emoji alias="tada" class="emoji mr-1" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f389.png">🎉</g-emoji>
				</button>
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n" type="button" aria-label="Sort by confused reaction" data-sort="CONFUSED">
					<g-emoji alias="thinking_face" class="emoji mr-1" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f615.png">😕</g-emoji>
				</button>
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n" type="button" aria-label="Sort by heart reaction" data-sort="HEART">
					<g-emoji alias="heart" class="emoji mr-1" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/2764.png">❤️</g-emoji>
				</button>
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n tooltipped-multiline" type="button" aria-label="Sort by reaction evaluation
(thumbs up, hooray & heart = +1;
laugh = +0.5; confused = -0.5;
thumbs down = -1)" data-sort="ACTIVE">
					<g-emoji class="g-emoji" alias="speak_no_evil" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f64a.png" ios-version="6.0">🙊</g-emoji>
				</button>
			</h3>
		</div>
	</div>
</div>`;

	function sumOfReactions(el) {
		return Object.keys(reactionValues).reduce((sum, item) => {
			const elm = $(`.comment-reactions-options button[value*="${item}"]`, el);
			return sum + (getValue(elm) * reactionValues[item]);
		}, 0);
	}

	function getValue(elm) {
		return elm ?
			parseInt(elm.textContent.replace(nonInteger, "") || "0", 10) :
			0;
	}

	function extractSortValue(elm, type) {
		if (type === "NONE" || type === "ACTIVE") {
			return parseFloat(
				elm.dataset[`sortComment${type === "NONE" ? "Date" : "Sum"}`]
			);
		}
		return getValue($(`.comment-reactions button[value*="${type}"]`, elm));
	}

	function stableSortValue(elm) {
		return parseInt(elm.dataset.sortCommentDate, 10);
	}

	function sort() {
		currentSort.busy = true;
		const fragment = document.createDocumentFragment(),
			container = $(".js-discussion"),
			sortBlock = $(".ghsc-sort-block"),
			loadMore = $("#progressive-timeline-item-container"),
			dir = currentSort.dir !== 1,
			type = currentSort.el ? currentSort.el.dataset.sort : "NONE";
		$$(".js-timeline-item")
			.sort((a, b) => {
				const av = extractSortValue(a, type),
					bv = extractSortValue(b, type);
				if (av === bv) {
					return stableSortValue(a) - stableSortValue(b);
				}
				return dir ? av - bv : bv - av;
			})
			.forEach(el => {
				fragment.appendChild(el);
			});
		container.appendChild(fragment);
		if (loadMore) {
			// Move load more comments to top
			sortBlock.parentNode.insertBefore(loadMore, sortBlock.nextSibling);
		}
		setTimeout(() => {
			currentSort.busy = false;
		}, 100);
	}

	function update() {
		if (!currentSort.init || $$(".has-reactions").length < 2) {
			return toggleSortBlock(false);
		}
		toggleSortBlock(true);
		const items = $$(".js-timeline-item:not([data-sort-comment-date])");
		if (items) {
			items.forEach(el => {
				let date = $("[datetime]", el);
				if (date) {
					date = date.getAttribute("datetime");
					el.setAttribute("data-sort-comment-date", Date.parse(date));
				}
				// Add reset date & most active summation
				el.setAttribute("data-sort-comment-sum", sumOfReactions(el));
			});
		}
		if (currentSort.el && !currentSort.busy) {
			sort();
		}
	}

	function initSort(event) {
		const target = event.target;
		if (target.classList.contains("ghsc-sort-button")) {
			event.preventDefault();
			event.stopPropagation();
			$$(".ghsc-sort-button").forEach(el => {
				el.classList.toggle("selected", el === target);
				el.classList.remove("asc", "desc");
			});
			if (currentSort.el === target) {
				currentSort.dir = (currentSort.dir + 1) % 3;
			} else {
				currentSort.el = target;
				currentSort.dir = 1;
			}
			if (currentSort.dir === 0) {
				currentSort.el.classList.remove("asc", "desc", "selected");
				currentSort.el = null;
			} else {
				currentSort.el.classList.add(currentSort.dir === 1 ? "desc" : "asc");
			}
			sort();
		}
	}

	function toggleSortBlock(status) {
		if (status) {
			if ($(".ghsc-sort-block")) {
				$(".ghsc-sort-block").style.display = "block";
			} else {
				addSortBlock();
			}
		} else {
			if ($(".ghsc-sort-block")) {
				$(".ghsc-sort-block").style.display = "none";
			}
		}
	}

	function addSortBlock() {
		currentSort.busy = true;
		const first = $(".timeline-comment-wrapper");
		first.classList.add("ghsc-skip-sort");
		first.insertAdjacentHTML("afterEnd", sortBlock);
		currentSort.busy = false;
	}

	function init() {
		if (!currentSort.init) {
			GM_addStyle(`
				.ghsc-sort-icon { padding-left: 5px; }
				.ghsc-sort-block .comment-body { padding: 0 10px; }
				.ghsc-sort-block g-emoji { vertical-align: baseline; pointer-events: none; }
				.ghsc-sort-block .btn.asc g-emoji:after { content: "▲"; }
				.ghsc-sort-block .btn.desc g-emoji:after { content: "▼"; }
			`);
			document.addEventListener("ghmo:container", update);
			document.addEventListener("ghmo:comments", update);
			document.addEventListener("click", initSort);
			currentSort.init = true;
			update();
		}
	}

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}

	function $$(selector, el) {
		return [...(el || document).querySelectorAll(selector)];
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", update, {once: true});
	} else {
		init();
	}
})();
