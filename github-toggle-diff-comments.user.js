// ==UserScript==
// @name        GitHub Toggle Diff Comments
// @version     0.2.0
// @description A userscript that toggles diff/PR and commit comments
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM.addStyle
// @grant       GM_addStyle
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=785415
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-toggle-diff-comments.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-toggle-diff-comments.user.js
// ==/UserScript==
/* global $ $$ on debounce make */
(() => {
	"use strict";

	const selectors = {
		// PR has notes (added to <div id="diff-00" class="file ...">)
		headerHasNotes: ".has-inline-notes:not(.hide-file-notes-toggle)",
		// show comments wrapper for each file
		headerComment: ".has-inline-notes .file-actions > .d-flex",
		// show comments checkbox
		headerCheckbox: "js-toggle-file-notes",
		// button active
		activeClass: "ghtc-active",
		// td wrapper
		tdWrapper: "js-quote-selection-container",
		// first div inside td wrapper
		tdDiv: "js-resolvable-timeline-thread-container",
		// has row comments
		rowComment: "tr.inline-comments",
		// button class names
		button: "btn btn-sm BtnGroup-item ghtc-toggle tooltipped tooltipped-s"
	};

	const actions = {
		// Show or hide all comments on the page
		toggleAllShowComments: {
			check: (event, el) => {
				const button = el.matches(`button.${selectors.headerCheckbox}`);
				return el.id === "ghtc-show-toggle-all" || event.shiftKey && button;
			},
			exec: el => {
				const state = getState(el);
				$$(`#ghtc-show-toggle-all, button.${selectors.headerCheckbox}`).forEach(
					el => el.classList.toggle(selectors.activeClass, state)
				);
				// Use built-in "Show comments" checkbox
				$$(`#files input.${selectors.headerCheckbox}`).forEach(el => {
					el.checked = state;
					el.dispatchEvent(new Event("change", {bubbles: true}));
				});
			}
		},
		// Show or hide all comments in a file
		toggleFileShowComments: {
			check: (_, el) => {
				return el.matches(`button.${selectors.headerCheckbox}`);
			},
			exec: el => {
				const state = getState(el);
				const box = $(`input.${selectors.headerCheckbox}`, el.closest(".d-flex"));
				if (box) {
					box.checked = state;
					box.dispatchEvent(new Event("change", {bubbles: true}));
				}
			}
		},
		// Collapse or expand all comments on the page
		collapsePageComments: {
			check: (event, el) => {
				const toggleAll = el.id === "ghtc-collapse-toggle-all";
				const toggle = el.classList.contains("ghtc-collapse-toggle-file");
				return toggleAll || (event.shiftKey && toggle);
			},
			exec: el => {
				const state = getState(el);
				$("#ghtc-collapse-toggle-all").classList.toggle(selectors.activeClass, state);
				toggleMultipleComments(el.closest("#files_bucket"), state);
				$$(".ghtc-collapse-toggle-file").forEach(el => {
					el.classList.toggle(selectors.activeClass, state);
				});
			}
		},
		// Collapse or expand all comments within a file
		collapseFileComments: {
			check: (event, el) => {
				const toggle = el.classList.contains("ghtc-collapse-toggle-file");
				const container = el.classList.contains(selectors.tdDiv);
				return toggle || (event.shiftKey && container);
			},
			exec: el => {
				const state = getState(el);
				toggleMultipleComments(el.closest(".file"), state);
			}
		},
		// Collapse or expand single comment
		collapseComment: {
			check: (_, el) => el.classList.contains(selectors.tdDiv),
			exec: el => el.closest("tr").classList.toggle("ghtc-collapsed"),
		}
	};

	const icons = {
		"show": `<svg xmlns="http://www.w3.org/2000/svg" class="octicon ghtc-primary ghtc-comment-hide" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><g fill="#777"><path d="M6 9h1L6 8 5 7v1c0 .6.5 1 1 1z"/><path d="M9 11H4.5L3 12.5V11H1V5h2L2 4H1a1 1 0 0 0-1 1v6c0 .6.5 1 1 1h1v3l3-3h4c.3 0 .6-.1.7-.3l-.7-.8v.1zM15 1H6a1 1 0 0 0-1 1v.3l1 1V2h9v6h-2v1.5L11.5 8h-.8l3.3 3.2V9h1c.6 0 1-.5 1-1V2c0-.6-.4-1-1-1z"/></g><path d="M.4.9L13.7 14h1.7L2 .9z"/></svg>
		<svg xmlns="http://www.w3.org/2000/svg" class="octicon ghtc-secondary ghtc-comment-show" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M15 1H6c-.55 0-1 .45-1 1v2H1c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h1v3l3-3h4c.55 0 1-.45 1-1V9h1l3 3V9h1c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zM9 11H4.5L3 12.5V11H1V5h4v3c0 .55.45 1 1 1h3v2zm6-3h-2v1.5L11.5 8H6V2h9v6z"></path></svg>`,
		"collapse": `<svg xmlns="http://www.w3.org/2000/svg" class="octicon ghtc-primary ghtc-collapse" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><g fill="#777"><path d="M4.2 12.8L5.6 11H4.5L3 12.5V11H1V5h4v3c0 .6.5 1 1 1h1.2L8 8H6V5.4L5 4H1a1 1 0 0 0-1 1v6c0 .6.5 1 1 1h1v3l2.2-2.2zM6 2.2V2h.6V1H6a1 1 0 0 0-1 1v.2h1zM15 1h-4.6v1H15v6h-2v1.5L11.5 8H9.1l.9 1.2V9h1l3 3V9h1c.6 0 1-.5 1-1V2c0-.6-.4-1-1-1z"/></g><path d="M11.5 3h-2V1h-2v2h-2l3 4zM5.5 13h2v2h2v-2h2l-3-4z"/></svg><svg xmlns="http://www.w3.org/2000/svg" class="octicon ghtc-secondary ghtc-expand" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><g fill="#777"><path d="M6 5.8H5V8c0 .6.5 1 1 1h.8V8H6V5.8z"/><path d="M4.6 11h-.1L3 12.5V11H1V5h3.3L6 2.9V2h.7l.8-1H6a1 1 0 0 0-1 1v2H1a1 1 0 0 0-1 1v6c0 .6.5 1 1 1h1v3l3-3h.3l-.7-1zM15 1h-5l.7 1H15v6h-2v1.5L11.5 8h-1v1h.5l.8.8h1.8l-.8 1L14 12V9h1c.6 0 1-.5 1-1V2c0-.6-.4-1-1-1z"/></g><path d="M11.7 11h-2V9h-2v2h-2l3 4zM11.7 5h-2v2h-2V5h-2l3-4z"/></svg>`
	};

	// Using small black triangles because Windows doesn't
	// replace them with ugly emoji images
	GM.addStyle(`
		td.${selectors.tdWrapper} {
			position: relative;
		}
		.${selectors.tdDiv} {
			cursor: pointer;
		}
		.js-resolvable-thread-contents {
			cursor: default;
		}
		.${selectors.tdDiv}:before {
			content: "\\25be";
			font-size: 40px;
			position: absolute;
			right: 10px;
			top: -10px;
			pointer-events: none;
		}
		.ghtc-collapsed .${selectors.tdDiv}:before {
			content: "\\25c2";
			top: -20px;
		}
		.ghtc-collapsed .${selectors.tdDiv} {
			padding: 10px;
			border: 0;
			min-height: 26px;
		}
		.ghtc-collapsed .${selectors.tdDiv}:last-child {
			margin-bottom: 16px;
		}
		.ghtc-toggle .ghtc-secondary,
		.ghtc-toggle.${selectors.activeClass} .ghtc-primary,
		.ghtc-toggle input ~ .ghtc-secondary,
		.ghtc-toggle input:checked ~ .ghtc-primary,
		.ghtc-collapsed .${selectors.tdDiv} > *,
		.ghtc-collapsed .last-${selectors.tdDiv},
		.ghtc-collapsed .inline-comment-form-container {
			display: none;
		}
		.diff-table .ghtc-collapsed td.line-comments {
			padding: 0;
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
		.ghtc-toggle.${selectors.activeClass} .ghtc-secondary,
		.ghtc-toggle input:checked ~ .ghtc-secondary {
			display: block;
		}`
	);

	function toggleMultipleComments(wrapper, state) {
		$(".ghtc-collapse-toggle-file", wrapper).classList.toggle(
			selectors.activeClass, state
		);
		$$(selectors.rowComment, wrapper).forEach(el => {
			el.classList.toggle("ghtc-collapsed", state);
		});
	}

	function getState(el) {
		el.classList.toggle(selectors.activeClass);
		return el.classList.contains(selectors.activeClass);
	}

	function addListeners() {
		const mainContent = $(".repository-content");
		if (!mainContent.classList.contains("ghtc-listeners")) {
			mainContent.classList.add("ghtc-listeners");
			on(mainContent, "change", debounce(event => {
				const el = event.target;
				if (el && el.classList.contains(selectors.headerCheckbox)) {
					const button = $(selectors.headerCheckbox, el.closest(".d-flex"));
					if (button) {
						button.classList.toggle(selectors.activeClass, el.checked);
					}
				}
			}));
			on(mainContent, "click", debounce(event => {
				const el = event.target;
				if (el) {
					Object.keys(actions).some(action => {
						if (actions[action].check(event, el)) {
							event.stopPropagation();
							event.preventDefault();
							actions[action].exec(el);
							return true;
						}
						return false;
					});
				}
			}));
		}
	}

	function addButtons() {
		$$(selectors.headerComment).forEach(wrapper => {
			if (!wrapper.classList.contains("ghtc-show-comments")) {
				wrapper.classList.add("ghtc-show-comments", "BtnGroup");
				// Add a "Show Comments" button outside the dropdown
				const show = make({
					el: "button",
					className: `${selectors.button} ${selectors.headerCheckbox} ${selectors.activeClass}`,
					html: icons.show,
					attrs: {
						"aria-label": "Show or hide all comments in this file"
					}
				});
				wrapper.prepend(show);
				// Add collapse all file comments button before label
				const collapse = make({
					el: "button",
					className: `${selectors.button} ghtc-collapse-toggle-file`,
					html: icons.collapse,
					attrs: {
						type: "button",
						"aria-label": "Expand or collapse all comments in this file"
					},
				});
				wrapper.prepend(collapse);
			}
		});
		// Add collapse all comments on the page - test adding global toggle on
		// https://github.com/openstyles/stylus/pull/150/files (edit.js)
		if (!$("#ghtc-collapse-toggle-all")) {
			// insert before Unified/Split button group
			const diffmode = $(".pr-review-tools .diffbar-item, #toc .toc-diff-stats");
			const wrapper = make({
				className: "BtnGroup " +
					// PR: diffbar-item; commit: toc-diff-stats
					(diffmode.classList.contains("diffbar-item")
						? "diffbar-item"
						: "float-right pr-2"
					)
			}, [
				// collapse/expand all comments
				make({
					html: icons.collapse,
					className: selectors.button,
					attrs: {
						id: "ghtc-collapse-toggle-all",
						type: "button",
						"aria-label": "Expand or collapse all comments"
					}
				}),
				// show/hide all comments
				make({
					className: `${selectors.button} ${selectors.activeClass}`,
					html: icons.show,
					attrs: {
						id: "ghtc-show-toggle-all",
						type: "button",
						"aria-label": "Show or hide all comments"
					}
				})
			]);
			diffmode.parentNode.insertBefore(wrapper, diffmode);
		}
	}

	function init() {
		if ($("#files") && $(selectors.headerHasNotes)) {
			addListeners();
			addButtons();
		}
	}

	on(document, "ghmo:container", init);
	on(document, "ghmo:diff", init);
	init();

})();
