/* GitHub mutations observer library script v0.3.0
 * Detect changes to various elements and trigger an event
 * This script is meant to be used as a library for GitHub-based userscripts
 * Copyright © 2020 Rob Garrison
 * License: MIT
 */
(() => {
	"use strict";

	// prefix for event & document body class name, e.g. "ghmo:container"
	const prefix = "ghmo",
		disableAttr = `data-${prefix}-disable`,
		debounceInterval = 200,
		targets = {
			// pjax container (covers general, repo & gists)
			// .news = newsfeed layout
			"[data-pjax-container], .news": {
				count: 0,
				name: "container"
			},
			// comment preview active
			".js-preview-body": {
				count: 0,
				name: "preview"
			},
			// .js-discussion = wrapper for progressively loaded comments;
			// "# items not shown" example: https://github.com/isaacs/github/issues/18
			// .discussion-item = issue status changed (github-issue-show-status)
			// #progressive-timeline-item-container = load hidden items (old?)
			// #js-progressive-timeline-item-container = load hidden items
			".js-discussion, .discussion-item, .toolbar-item, #progressive-timeline-item-container, #js-progressive-timeline-item-container": {
				count: 0,
				name: "comments"
			},
			// progressively loaded content (diff files)
			".js-diff-progressive-container, .data.blob-wrapper, .js-diff-load-container, .diff-table tbody": {
				count: 0,
				name: "diff"
			}
		},
		list = Object.keys(targets);

	function fireEvents() {
		list.forEach(selector => {
			if (targets[selector].count > 0) {
				// event => "ghmo:container", "ghmo:comments"
				const event = new Event(prefix + ":" + targets[selector].name);
				document.dispatchEvent(event);
			}
			targets[selector].count = 0;
		});
	}

	function init() {
		// prevent error when library is loaded at document-start & no body exists
		const container = document.querySelector("body");
		let timer;
		// prevent script from installing more than once
		if (container && !container.classList.contains(prefix + "-enabled")) {
			container.classList.add(prefix + "-enabled");
			// bound to document.body... this may be bad for performance
			// http://stackoverflow.com/a/39332340/145346
			new MutationObserver(mutations => {
				clearTimeout(timer);
				/* document.body attribute used to disable updates; it *should not*
				 * be used regularly as multiple scripts may enable or disable the
				 * observers at inappropriate times. It is best that each script handles
				 * the mutation events triggered by this library on its own
				 */
				if (container.getAttribute(disableAttr)) {
					return;
				}
				let mindx, target, lindx,
					llen = list.length,
					mlen = mutations.length;
				// avoiding use of forEach loops for performance reasons
				for (mindx = 0; mindx < mlen; mindx++) {
					target = mutations[mindx].target;
					if (target) {
						for (lindx = 0; lindx < llen; lindx++) {
							if (target.matches(list[lindx])) {
								targets[list[lindx]].count++;
							}
						}
					}
					timer = setTimeout(() => {
						fireEvents();
					}, debounceInterval);
				}
			}).observe(container, {
				childList: true,
				subtree: true
			});
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => init);
	} else {
		init();
	}

})();
