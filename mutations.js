/* GitHub mutations observer library script v0.1.6
 * Detect changes to various elements and trigger an event
 * Copyright © 2017 Rob Garrison
 * License: MIT
 */
/* jshint esnext:true, unused:true */
(() => {
	"use strict";

	// prefix for event & document body class name, e.g. "ghmo:container"
	const prefix = "ghmo",
		targets = {
			// pjax container (covers general, repo & gists)
			"[data-pjax-container]": {
				count: 0,
				name: "container"
			},
			// comment preview active
			".js-preview-body": {
				count: 0,
				name: "preview"
			},
			// progressively loaded comments; "# items not shown"
			// example: https://github.com/isaacs/github/issues/18
			".js-discussion": {
				count: 0,
				name: "comments"
			},
			// progressively loaded content (diff files)
			".js-diff-progressive-container, .data.blob-wrapper, .js-diff-load-container": {
				count: 0,
				name: "diff"
			}
		},
		list = Object.keys(targets),
		container = document.querySelector("body");

	let timer;

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

	// prevent script from installing more than once
	if (!container.classList.contains(prefix + "-enabled")) {
		container.classList.add(prefix + "-enabled");

		// bound to document.body... this may be bad for performance
		// http://stackoverflow.com/a/39332340/145346
		new MutationObserver(mutations => {
			clearTimeout(timer);
			let mindx, target, lindx,
				llen = list.length,
				mlen = mutations.length;
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
				}, 200);
			}
		}).observe(container, {
			childList: true,
			subtree: true
		});

	}

})();
