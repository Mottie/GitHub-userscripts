// ==UserScript==
// @name        GitHub Issue Add Details
// @version     1.0.12
// @description A userscript that adds a button to insert a details block into comments
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @match       https://github.com/*
// @run-at      document-idle
// @grant       none
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=1108163
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=1079637
// @require     https://greasyfork.org/scripts/28239-rangy-inputs-mod-js/code/rangy-inputs-modjs.js?version=181769
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-issue-add-details.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-issue-add-details.user.js
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==

/* global $ $$ on make */
(() => {
	"use strict";

	const icon = `
		<svg class="octicon" style="pointer-events:none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
			<path d="M15.5 9h-7C8 9 8 8.6 8 8s0-1 .5-1h7c.5 0 .5.4.5 1s0 1-.5 1zm-5-5c-.5 0-.5-.4-.5-1s0-1 .5-1h5c.5 0 .5.4.5 1s0 1-.5 1h-5zM0 2h8L4 7 0 2zm8.5 10h7c.5 0 .5.4.5 1s0 1-.5 1h-7c-.5 0-.5-.4-.5-1s0-1 .5-1z"/>
		</svg>`,

		detailsBlock = [
			// start details block
			"<details>\n<summary>Title</summary>\n\n<!-- leave a blank line above -->\n",
			// selected content/caret will be placed here
			"\n</details>\n"
		];

	// Add insert details button
	const addDetailsButton = () => {
		const button = make({
			el: "button",
			className: "ghad-details btn-link toolbar-item btn-octicon no-underline tooltipped tooltipped-n",
			attrs: {
				"aria-label": "Add a details/summary block",
				tabindex: "-1",
				type: "button"
			},
			html: icon
		});
		$$(".toolbar-commenting").forEach(el => {
			if (el && !$(".ghad-details", el)) {
				const btn = $("md-quote", el);
				btn.before(button.cloneNode(true));
			}
		});
	};

	const addBindings = () => {
		window.rangyInput.init();
		on($("body"), "click", event => {
			const { target } = event;
			if (target?.classList.contains("ghad-details")) {
				event.preventDefault();
				const form = target.closest(".previewable-comment-form");
				const textarea = $(".comment-form-textarea", form);
				setTimeout(() => {
					textarea.focus();
					window.rangyInput.surroundSelectedText(
						textarea,
						detailsBlock[0], // prefix
						detailsBlock[1] // suffix
					);
				}, 100);
				return false;
			}
		});
	};

	on(document, "ghmo:container, ghmo:comments", addDetailsButton);

	addDetailsButton();
	addBindings();

})();
