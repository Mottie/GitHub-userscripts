// ==UserScript==
// @name        GitHub Toggle Diff Comments
// @version     0.1.1
// @description A userscript that toggles diff/PR comments
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       none
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=234970
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-toggle-diff-comments.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-toggle-diff-comments.user.js
// ==/UserScript==
(() => {
	"use strict";

	let timer,
		ignoreEvents = false;
	const targets = {
			// PR has notes (added to <div id="diff-00" class="file ...">)
			headerHasNotes: ".has-inline-notes:not(.hide-file-notes-toggle)",
			// show comments wrapper for each file
			headerComment: "show-file-notes",
			// show comments checkbox
			headerCheckbox: "js-toggle-file-notes",
			// comment block row - class added to TR containing the comment
			rowComment: "inline-comments"
		},
		icons = {
			"show": `<svg xmlns="http://www.w3.org/2000/svg" class="octicon ghtc-primary ghtc-comment-hide" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><g fill="#777"><path d="M6 9h1L6 8 5 7v1c0 .6.5 1 1 1z"/><path d="M9 11H4.5L3 12.5V11H1V5h2L2 4H1a1 1 0 0 0-1 1v6c0 .6.5 1 1 1h1v3l3-3h4c.3 0 .6-.1.7-.3l-.7-.8v.1zM15 1H6a1 1 0 0 0-1 1v.3l1 1V2h9v6h-2v1.5L11.5 8h-.8l3.3 3.2V9h1c.6 0 1-.5 1-1V2c0-.6-.4-1-1-1z"/></g><path d="M.4.9L13.7 14h1.7L2 .9z"/></svg>
			<svg xmlns="http://www.w3.org/2000/svg" class="octicon ghtc-secondary ghtc-comment-show" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M15 1H6c-.55 0-1 .45-1 1v2H1c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h1v3l3-3h4c.55 0 1-.45 1-1V9h1l3 3V9h1c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zM9 11H4.5L3 12.5V11H1V5h4v3c0 .55.45 1 1 1h3v2zm6-3h-2v1.5L11.5 8H6V2h9v6z"></path></svg>`,
			"collapse": `<svg xmlns="http://www.w3.org/2000/svg" class="octicon ghtc-primary ghtc-collapse" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><g fill="#777"><path d="M4.2 12.8L5.6 11H4.5L3 12.5V11H1V5h4v3c0 .6.5 1 1 1h1.2L8 8H6V5.4L5 4H1a1 1 0 0 0-1 1v6c0 .6.5 1 1 1h1v3l2.2-2.2zM6 2.2V2h.6V1H6a1 1 0 0 0-1 1v.2h1zM15 1h-4.6v1H15v6h-2v1.5L11.5 8H9.1l.9 1.2V9h1l3 3V9h1c.6 0 1-.5 1-1V2c0-.6-.4-1-1-1z"/></g><path d="M11.5 3h-2V1h-2v2h-2l3 4zM5.5 13h2v2h2v-2h2l-3-4z"/></svg><svg xmlns="http://www.w3.org/2000/svg" class="octicon ghtc-secondary ghtc-expand" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><g fill="#777"><path d="M6 5.8H5V8c0 .6.5 1 1 1h.8V8H6V5.8z"/><path d="M4.6 11h-.1L3 12.5V11H1V5h3.3L6 2.9V2h.7l.8-1H6a1 1 0 0 0-1 1v2H1a1 1 0 0 0-1 1v6c0 .6.5 1 1 1h1v3l3-3h.3l-.7-1zM15 1h-5l.7 1H15v6h-2v1.5L11.5 8h-1v1h.5l.8.8h1.8l-.8 1L14 12V9h1c.6 0 1-.5 1-1V2c0-.6-.4-1-1-1z"/></g><path d="M11.7 11h-2V9h-2v2h-2l3 4zM11.7 5h-2v2h-2V5h-2l3-4z"/></svg>`
		},
		activeClass = "ghtc-active",
		button = document.createElement("div");
	button.className = "btn btn-sm BtnGroup-item ghtc-toggle tooltipped tooltipped-s";

	// Using small black triangles because Windows doesn't
	// replace them with ugly emoji images
	GM.addStyle(`
		td.js-quote-selection-container {
			position: relative;
		}
		.review-thread:before {
			content: "\\25be";
			font-size: 2rem;
			position: absolute;
			right: 10px;
			top: -1rem;
			pointer-events: none;
		}
		.ghtc-collapsed .review-thread:before {
			content: "\\25c2";
		}
		.ghtc-collapsed .review-thread {
			padding: 0 0 5px;
			border: 0;
		}
		.ghtc-toggle .ghtc-secondary,
		.ghtc-toggle.${activeClass} .ghtc-primary,
		.ghtc-toggle input ~ .ghtc-secondary,
		.ghtc-toggle input:checked ~ .ghtc-primary,
		.ghtc-collapsed .review-thread > *,
		.ghtc-collapsed .last-review-thread,
		.ghtc-collapsed .inline-comment-form-container {
			display: none;
		}
		.ghtc-collapsed td.line-comments {
			padding: 0 5px;
			cursor: pointer;
		}
		.pr-toolbar .pr-review-tools.float-right .diffbar-item + .diffbar-item {
			margin-left: 10px;
		}
		.ghtc-toggle {
			height: 28px;
		}
		.ghtc-toggle svg {
			display: inline-block;
			max-height: 16px;
			pointer-events: none;
			vertical-align: baseline !important;
		}
		.ghtc-toggle.${activeClass} .ghtc-secondary,
		.ghtc-toggle input:checked ~ .ghtc-secondary {
			display: block;
		}`
	);

	function toggleSingleComment(el) {
		// Toggle individual inline comment
		el.parentNode.classList.toggle("ghtc-collapsed");
	}

	function toggleMultipleComments(wrapper, state) {
		$(".ghtc-collapse-toggle-file", wrapper).classList.toggle(activeClass, state);
		$$(`tr.${targets.rowComment}`, wrapper).forEach(el => {
			el.classList.toggle("ghtc-collapsed", state);
		});
	}

	function getState(el) {
		el.classList.toggle(activeClass);
		return el.classList.contains(activeClass);
	}

	function toggleFile(el) {
		// Toggle all inline comments for one file
		const state = getState(el);
		toggleMultipleComments(el.closest(".file"), state);
	}

	function toggleAll(el) {
		// Toggle all comments on page
		const state = getState(el);
		$("#ghtc-collapse-toggle-all").classList.toggle(activeClass, state);
		toggleMultipleComments(el.closest("#files_bucket"), state);
		$$(".ghtc-collapse-toggle-file").forEach(el => {
			el.classList.toggle(activeClass, state);
		});
	}

	function showAll(el) {
		// Show/hide all comments on page
		const state = getState(el);
		$("#ghtc-show-toggle-all").classList.toggle(activeClass, state);
		$$("#files_bucket .js-toggle-file-notes").forEach(el => {
			el.checked = state;
			el.dispatchEvent(new Event("change", {bubbles: true}));
		});
	}

	function createButton({id, className, icon, title}) {
		const btn = button.cloneNode(true);
		if (id) {
			btn.id = id;
		}
		btn.className += ` ${className || ""}`;
		btn.setAttribute("aria-label", title);
		btn.innerHTML = icons[icon];
		return btn;
	}

	function execFunction(event, callback) {
		clearTimeout(timer);
		ignoreEvents = true;
		event.stopPropagation();
		event.preventDefault();
		callback(event.target);
		timer = setTimeout(() => {
			ignoreEvents = false;
		}, 250);
	}

	function addListeners() {
		$("#files_bucket").addEventListener("change", event => {
			const el = event.target;
			if (el && el.classList.contains(targets.headerCheckbox)) {
				el.parentNode.classList.toggle(activeClass, el.checked);
			}
		});
		$("#files_bucket").addEventListener("click", event => {
			const el = event.target;
			if (!ignoreEvents && el) {
				const shift = event.shiftKey,
					toggle = el.classList.contains("ghtc-collapse-toggle-file"),
					show = el.nodeName === "LABEL",
					comment = el.classList.contains("js-quote-selection-container");
				if (el.id === "ghtc-collapse-toggle-all" || toggle && shift) {
					execFunction(event, toggleAll);
				} else if (el.id === "ghtc-show-toggle-all" || show && shift) {
					execFunction(event, showAll);
				} else if (toggle || comment && shift) {
					execFunction(event, toggleFile);
				} else if (comment) {
					execFunction(event, toggleSingleComment);
				}
			}
		});
	}

	function addButtons() {
		$$(`.${targets.headerComment}`).forEach(wrapper => {
			if (!wrapper.classList.contains("ghtc-hidden")) {
				const label = $("label", wrapper),
					checkbox = $("input", wrapper);
				let btn;
				// Make span wrapper a button group
				wrapper.classList.add("ghtc-hidden", "BtnGroup");
				// Remove top margin
				wrapper.classList.remove("pt-1");

				// Convert "Show Comments" label wrapping checkbox into a button
				label.className = "btn btn-sm BtnGroup-item ghtc-toggle tooltipped tooltipped-s";
				label.setAttribute("aria-label", "Show or hide all comments in this file");
				label.innerHTML = `
					<input type="checkbox" checked="checked" class="js-toggle-file-notes" hidden="true">
					${icons.show}`;

				// Add collapse all file comments button before label
				btn = createButton({
					className: "ghtc-collapse-toggle-file",
					icon: "collapse",
					title: "Expand or collapse all comments in this file"
				});
				label.parentNode.insertBefore(btn, label);
				// Hide checkbox
				checkbox.setAttribute("hidden", true);
			}
		});
		// Add collapse all comments on the page - test adding global toggle on
		// https://github.com/openstyles/stylus/pull/150/files (edit.js)
		if (!$("#ghtc-collapse-toggle-all") && $(targets.headerHasNotes)) {
			const wrapper = document.createElement("div"),
				// insert before Unified/Split button group
				diffmode = $(".pr-review-tools .diffbar-item");
			let btn;
			wrapper.className = "BtnGroup diffbar-item";
			diffmode.parentNode.insertBefore(wrapper, diffmode);
			// collapse/expand all comments
			btn = createButton({
				id: "ghtc-collapse-toggle-all",
				icon: "collapse",
				title: "Expand or collapse all comments"
			});
			wrapper.appendChild(btn);
			// show/hide all comments
			btn = createButton({
				id: "ghtc-show-toggle-all",
				icon: "show",
				className: activeClass,
				title: "Show or hide all comments"
			});
			wrapper.appendChild(btn);
		}
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	function $$(str, el) {
		return [...(el || document).querySelectorAll(str)];
	}

	function init() {
		if ($("#files_bucket") && $(".pr-toolbar")) {
			addButtons();
			addListeners();
		}
	}

	document.addEventListener("ghmo:container", init);
	document.addEventListener("ghmo:diff", init);
	init();

})();
