// ==UserScript==
// @name        GitHub Diff File Toggle
// @version     0.1.3
// @description A userscript that adds global diff file toggles
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @match       https://github.com/*
// @run-at      document-idle
// @grant       none
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=1108163
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=1079637
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-file-toggle.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-file-toggle.user.js
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues

// ==/UserScript==

/* global $ $$ on debounce make */
(() => {
	"use strict";

	let timer;
	let busy = false;

	const setToggleStyle = state => {
		const mainToggle = $(".ghdt-toggle");
		if (mainToggle) {
			mainToggle.classList.toggle("ghdt-selected", state);
			mainToggle.style = state ? "background-color: var(--color-btn-selected-bg);" : "";
		}
	};

	const init = () => {
		if (!$(".ghdt-toggle")) {
			const toggleButton = make({
				el: "button",
				className: "btn btn-sm ghdt-toggle tooltipped tooltipped-s float-right",
				text: "Toggle viewed",
				attrs: {
					"aria-label": "Toggle all viewed files"
				}
			});
			on(toggleButton, "click", event => {
				toggle(document, !event.target.classList.contains("ghdt-selected"));
			});
			const diffBarItem = make({
				el: "div",
				className: "diffbar-item js-batched-reviewed mr-3",
			}, [toggleButton]);
			$("diff-layout > div.pr-toolbar > div.diffbar > div.pr-review-tools")?.prepend(diffBarItem);
		}
		// Update toggle button state after initialized; timer for progressive loading
		clearTimeout(timer);
		timer = setTimeout(() => {
			if ($$(".js-reviewed-checkbox").every(el => el.checked)) {
				setToggleStyle(true);
			}
		}, 1000);
	};

	const toggle = (target, state) => {
		$$(".js-reviewed-checkbox").forEach(checkbox => {
			if (target !== checkbox && checkbox.checked !== state) {
				checkbox.click();
			}
		});
		setToggleStyle(state);
	};

	const handleChange = event => {
		const { target, altKey, shiftKey } = event;
		const anyModifier = altKey || shiftKey;
		if (!busy && anyModifier && target.matches(".js-reviewed-checkbox")) {
			busy = true;
			toggle(target, target.checked);
			setTimeout(() => {
				busy = false;
			});
		}
	};

	on(document, "ghmo:container ghmo:diff", init);
	on(document, "click", debounce(handleChange));
	on(document, "keydown", debounce(handleChange));
	init();
})();
