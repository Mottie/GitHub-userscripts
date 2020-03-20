// ==UserScript==
// @name        GitHub Issue Add Details
// @version     1.0.7
// @description A userscript that adds a button to insert a details block into comments
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       none
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @require     https://greasyfork.org/scripts/28239-rangy-inputs-mod-js/code/rangy-inputs-modjs.js?version=181769
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-issue-add-details.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-issue-add-details.user.js
// ==/UserScript==
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
	function addDetailsButton() {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "ghad-details toolbar-item tooltipped tooltipped-n";
		button.setAttribute("aria-label", "Add a details/summary block");
		button.setAttribute("tabindex", "-1");
		button.innerHTML = icon;
		[...document.querySelectorAll(".toolbar-commenting")].forEach(el => {
			if (el && !$(".ghad-details", el)) {
				const btn = $("[aria-label='Add a task list']", el);
				btn.parentNode.insertBefore(button.cloneNode(true), btn.nextSibling);
			}
		});
	}

	function addBindings() {
		window.rangyInput.init();
		$("body").addEventListener("click", event => {
			const target = event.target;
			if (target && target.classList.contains("ghad-details")) {
				let textarea = target.closest(".previewable-comment-form");
				textarea = $(".comment-form-textarea", textarea);
				textarea.focus();
				window.rangyInput.surroundSelectedText(
					textarea,
					detailsBlock[0], // prefix
					detailsBlock[1] // suffix
				);
				return false;
			}
		});
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	document.addEventListener("ghmo:container", addDetailsButton);
	document.addEventListener("ghmo:comments", addDetailsButton);

	addDetailsButton();
	addBindings();

})();
