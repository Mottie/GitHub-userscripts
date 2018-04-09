// ==UserScript==
// @name        GitHub Sort Reactions
// @version     0.2.2
// @description A userscript that sorts comments by reaction
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=264157
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
			busy: false,
			type: GM_getValue("selected-reaction", "NONE")
		},

		sortBlock = `
<div class="timeline-comment-wrapper ghsc-sort-block ghsc-is-collapsed">
	<div class="timeline-comment">
		<div class="avatar-parent-child timeline-comment-avatar border ghsc-sort-avatar ghsc-no-selection">
			<div class="ghsc-icon-wrap tooltipped tooltipped-n" aria-label="Click to toggle reaction sort menu">
				<svg aria-hidden="true" class="octicon ghsc-sort-icon" xmlns="http://www.w3.org/2000/svg" width="25" height="40" viewBox="0 0 16 16">
					<path d="M15 8 1 8 8 0zM15 9 1 9 8 16z"/>
				</svg>
			</div>
			<g-emoji></g-emoji>
			<button class="ghsc-sort-button ghsc-avatar-sort btn btn-sm tooltipped tooltipped-n" aria-label="Toggle selected reaction sort direction">
				<span></span>
			</button>
		</div>
		<div class="timeline-comment-header comment comment-body">
			<h3 class="timeline-comment-header-text f5 text-normal">
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n" type="button" aria-label="Sort by +1 reaction" data-sort="THUMBS_UP">
					<g-emoji alias="+1" class="emoji" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f44d.png">👍</g-emoji>
				</button>
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n" type="button" aria-label="Sort by -1 reaction" data-sort="THUMBS_DOWN">
					<g-emoji alias="-1" class="emoji" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f44e.png">👎</g-emoji>
				</button>
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n" type="button" aria-label="Sort by laugh reaction" data-sort="LAUGH">
					<g-emoji alias="smile" class="emoji" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f604.png">😄</g-emoji>
				</button>
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n" type="button" aria-label="Sort by hooray reaction" data-sort="HOORAY">
					<g-emoji alias="tada" class="emoji" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f389.png">🎉</g-emoji>
				</button>
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n" type="button" aria-label="Sort by confused reaction" data-sort="CONFUSED">
					<g-emoji alias="thinking_face" class="emoji" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f615.png">😕</g-emoji>
				</button>
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n" type="button" aria-label="Sort by heart reaction" data-sort="HEART">
					<g-emoji alias="heart" class="emoji" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/2764.png">❤️</g-emoji>
				</button>
				<button class="ghsc-sort-button btn btn-sm tooltipped tooltipped-n tooltipped-multiline" type="button" aria-label="Sort by reaction evaluation
(thumbs up, hooray & heart = +1;
laugh = +0.5; confused = -0.5;
thumbs down = -1)" data-sort="ACTIVE">
					<g-emoji alias="speak_no_evil" class="emoji" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f64a.png">🙊</g-emoji>
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

	function updateAvatar() {
		GM_setValue("selected-reaction", currentSort.type);
		const block = $(".ghsc-sort-block"),
			avatar = $(".ghsc-sort-avatar", block),
			icon = $(".ghsc-sort-button span", avatar);
		if (avatar) {
			let current = $(`.comment-body [data-sort=${currentSort.type}]`, block);
			avatar.classList.remove("ghsc-no-selection");
			avatar.replaceChild(
				$("g-emoji", current).cloneNode(true),
				$("g-emoji", avatar)
			);
			if (currentSort.dir === 0) {
				// use unsorted svg in sort button
				current = $(".ghsc-sort-icon", avatar).cloneNode(true);
				current.classList.remove("ghsc-sort-icon");
				icon.textContent = "";
				icon.appendChild(current);
			} else {
				icon.textContent = currentSort.dir !== 1 ? "▲" : "▼";
			}
		}
	}

	function sort() {
		currentSort.busy = true;
		const fragment = document.createDocumentFragment(),
			container = $(".js-discussion"),
			sortBlock = $(".ghsc-sort-block"),
			loadMore = $("#progressive-timeline-item-container"),
			dir = currentSort.dir !== 1,
			type = currentSort.el ? currentSort.el.dataset.sort : "NONE";

		currentSort.type = type;
		updateAvatar();

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
		let direction,
			target = event.target;
		if (target.classList.contains("ghsc-sort-button")) {
			event.preventDefault();
			event.stopPropagation();
			if (target.classList.contains("ghsc-avatar-sort")) {
				// Using avatar sort button; retarget button
				target = $(`.ghsc-sort-button[data-sort="${currentSort.type}"]`);
				currentSort.el = target;
			}
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
			if (currentSort.dir !== 0) {
				direction = currentSort.dir === 1 ? "desc" : "asc";
				currentSort.el.classList.add(direction);
				$(".ghsc-avatar-sort").classList.add(direction);
			}
			sort();
		} else if (target.matches(".ghsc-sort-avatar, .ghsc-icon-wrap")) {
			$(".ghsc-sort-block").classList.toggle("ghsc-is-collapsed");
		}
	}

	function toggleSortBlock(show) {
		const block = $(".ghsc-sort-block");
		if (block) {
			block.style.display = show ? "block" : "none";
		} else if (show) {
			addSortBlock();
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
				.ghsc-sort-block .comment-body { padding: 0 10px; }
				.ghsc-sort-block .emoji { vertical-align: baseline; pointer-events: none; }
				.ghsc-sort-block .btn.asc .emoji:after { content: "▲"; }
				.ghsc-sort-block .btn.desc .emoji:after { content: "▼"; }
				.ghsc-sort-avatar, .ghsc-icon-wrap { height: 44px; width: 44px; text-align: center; }
				.ghsc-sort-avatar { background: rgba(128, 128, 128, 0.2); border: #777 1px solid; }
				.ghsc-sort-avatar .emoji { position: relative; top: -36px; }
				.ghsc-sort-avatar svg { pointer-events: none; }
				.ghsc-sort-avatar.ghsc-no-selection { cursor: pointer; padding: 0 4px 0 0; }
				.ghsc-sort-avatar.ghsc-no-selection .emoji,
				.ghsc-sort-avatar.ghsc-no-selection .btn,
				.ghsc-sort-avatar:not(.ghsc-no-selection) svg.ghsc-sort-icon { display: none; }
				.ghsc-sort-avatar .btn { border-radius: 20px; width: 20px; height: 20px; position: absolute; bottom: -5px; right: -5px; }
				.ghsc-sort-avatar .btn span { position: absolute; left: 5px; top: 0; pointer-events: none; }
				.ghsc-sort-avatar .btn.asc span { top: -3px; }
				.ghsc-sort-avatar .btn span svg { height: 10px; width: 10px; vertical-align: unset; }
				.ghsc-sort-block.ghsc-is-collapsed h3,
				.ghsc-sort-block.ghsc-is-collapsed .timeline-comment:before,
				.ghsc-sort-block.ghsc-is-collapsed .timeline-comment:after { display: none; }
				.ghsc-sort-block.ghsc-is-collapsed .timeline-comment { margin: 10px 0; }
				.ghsc-sort-block.ghsc-is-collapsed .timeline-comment-avatar { top: -22px; }
			`);
			document.addEventListener("ghmo:container", update);
			document.addEventListener("ghmo:comments", update);
			document.addEventListener("click", initSort);
			currentSort.init = true;
			update();
			// "NONE" can only be seen on userscript init/factory reset
			if ($(".ghsc-sort-block") && currentSort.type !== "NONE") {
				updateAvatar();
			}
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
