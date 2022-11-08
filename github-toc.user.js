// ==UserScript==
// @name        GitHub Table of Contents
// @version     2.1.6
// @description A userscript that adds a table of contents to readme & wiki pages
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @match       https://github.com/*
// @match       https://gist.github.com/*
// @run-at      document-idle
// @grant       GM_registerMenuCommand
// @grant       GM.registerMenuCommand
// @grant       GM_getValue
// @grant       GM.getValue
// @grant       GM_setValue
// @grant       GM.setValue
// @grant       GM_addStyle
// @grant       GM.addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=1108163
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=1079637
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toc.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toc.user.js
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==
/* global $ $$ on addClass removeClass */
(async () => {
	"use strict";

	const defaults = {
		title: "Table of Contents", // popup title
		top: "64px", // popup top position when reset
		left: "auto", // popup left position when reset
		right: "10px", // popup right position when reset
		headerPad: "48px", // padding added to header when TOC is collapsed
		headerSelector: [".header", ".Header", ".header-logged-out > div"],
		wrapperSelector: "#wiki-body, #readme, [id^='file-'][id$='-md']",
		headerWrap: ".js-header-wrapper",
		toggle: "g+t", // keyboard toggle shortcut
		restore: "g+r", // keyboard reset popup position shortcut
		delay: 1000, // ms between keyboard shortcuts
	};

	GM.addStyle(`
		/* z-index > 1000 to be above the */
		.ghus-toc { position:fixed; z-index:1001; min-width:200px; min-height:100px; top:${defaults.top};
			right:${defaults.right}; resize:both; overflow:hidden; padding: 0 3px 38px 0; margin:0; }
		.ghus-toc h3 { cursor:move; }
		.ghus-toc-title { padding-left:20px; }
		/* icon toggles TOC container & subgroups */
		.ghus-toc .ghus-toc-icon { vertical-align:baseline; }
		.ghus-toc h3 .ghus-toc-icon, .ghus-toc li.collapsible .ghus-toc-icon { cursor:pointer; }
		.ghus-toc .ghus-toc-toggle { position:absolute; width:28px; height:38px; top:0px; left:0px; }
		.ghus-toc .ghus-toc-toggle svg { margin-top:10px; margin-left:9px; }
		.ghus-toc .ghus-toc-docs { float:right; }
		/* move collapsed TOC to top right corner */
		.ghus-toc.collapsed {
			width:30px !important; height:34px !important; min-width:auto; min-height:auto; overflow:hidden;
			top:16px !important; left:auto !important; right:10px !important; margin:0; padding:0;
			border:1px solid rgba(128, 128, 128, 0.5); border-radius:3px; resize:none;
		}
		.ghus-toc.collapsed > h3 { cursor:pointer; padding-top:5px; border:none; background:#222; color:#ddd; }
		.ghus-toc.collapsed .ghus-toc-docs, .ghus-toc.collapsed .ghus-toc-title { display:none; }
		.ghus-toc:not(.ghus-toc-hidden).collapsed + .Header { padding-right: ${defaults.headerPad} !important; }
		/* move header text out-of-view when collapsed */
		.ghus-toc.collapsed > h3 svg { margin-top:6px; }
		.ghus-toc-hidden, .ghus-toc.collapsed .boxed-group-inner { display:none; }
		.ghus-toc .boxed-group-inner { width:100%; height:100%; overflow-x:hidden; overflow-y:auto;
			margin-bottom:50px; }
		.ghus-toc ul { list-style:none; }
		.ghus-toc li { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; position:relative; }
		.ghus-toc .ghus-toc-h1 { padding-left:15px; }
		.ghus-toc .ghus-toc-h2 { padding-left:30px; }
		.ghus-toc .ghus-toc-h3 { padding-left:45px; }
		.ghus-toc .ghus-toc-h4 { padding-left:60px; }
		.ghus-toc .ghus-toc-h5 { padding-left:75px; }
		.ghus-toc .ghus-toc-h6 { padding-left:90px; }
		/* anchor collapsible icon */
		.ghus-toc li.collapsible .ghus-toc-icon:before {
			content:' '; position:absolute; width:20px; height:20px; display:inline-block; left:-16px; top:-14px;
			background: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSdvY3RpY29uJyBoZWlnaHQ9JzE0JyB2aWV3Qm94PScwIDAgMTIgMTYnPjxwYXRoIGQ9J00wIDVsNiA2IDYtNkgweic+PC9wYXRoPjwvc3ZnPg==) left center no-repeat;
		}
		.ghus-toc li.collapsible.collapsed .ghus-toc-icon:before { -webkit-transform:rotate(-90deg);
			transform:rotate(-90deg); top:-20px; left:-20px; }
		.ghus-toc-icon svg, .ghus-toc-docs svg { pointer-events:none; }
		.ghus-toc-no-selection { -webkit-user-select:none !important; -moz-user-select:none !important;
			user-select:none !important; }
		/* prevent google translate from breaking links */
		.ghus-toc li a font { pointer-events:none; }
	`);

	let tocInit = false;

	// modifiable title
	let title = await GM.getValue("github-toc-title", defaults.title);

	const container = document.createElement("div");

	// keyboard shortcuts
	const keyboard = {
		timer: null,
		lastKey: null
	};

	// drag variables
	const drag = {
		el: null,
		elmX: 0,
		elmY: 0,
		time: 0,
		unsel: null
	};

	const regex = {
		quote: /'/g,
		doubleQuote: /"/g,
		number: /\d/,
		toggle: /\+/g,
		header: /ghus-toc-h\d/,
		collapsible: /collapsible-(\d+)/,
		ignore: /(input|textarea)/i,
	};

	const stopPropag = event => {
		event.preventDefault();
		event.stopPropagation();
	};

	// drag code adapted from http://jsfiddle.net/tovic/Xcb8d/light/
	function dragInit(event) {
		if (!container.classList.contains("collapsed")) {
			drag.el = container;
			drag.elmX = event.pageX - drag.el.offsetLeft;
			drag.elmY = event.pageY - drag.el.offsetTop;
			selectionToggle(true);
		} else {
			drag.el = null;
		}
		drag.time = new Date().getTime() + 500;
	}

	function dragMove(event) {
		if (drag.el !== null) {
			drag.el.style.left = `${event.pageX - drag.elmX}px`;
			drag.el.style.top = `${event.pageY - drag.elmY}px`;
			drag.el.style.right = "auto";
		}
	}

	async function dragStop(event) {
		if (drag.el !== null) {
			dragSave();
			selectionToggle();
		}
		drag.el = null;

		if (event.target === container) {
			// save container size on mouseup
			await GM.setValue(
				"github-toc-size",
				[container.clientWidth, container.clientHeight]
			);
		}
	}

	async function dragSave(restore) {
		let adjLeft = null;
		let top = null;
		let val = null;
		if (restore) {
			// position restore (reset) popup to default position
			setPosition(defaults.left, defaults.top, defaults.right);
		} else {
			// Adjust saved left position to be measured from the center of the window
			// See issue #102
			const winHalf = window.innerWidth / 2;
			const left = winHalf - parseInt(container.style.left, 10);
			adjLeft = left * (left > winHalf ? 1 : -1);
			top = parseInt(container.style.top, 10);
			val = [adjLeft, top];
		}
		drag.elmX = adjLeft;
		drag.elmY = top;
		await GM.setValue("github-toc-location", val);
	}

	function resize(_, left = drag.elmX, top = drag.elmY) {
		if (left !== null) {
			drag.elmX = left;
			drag.elmY = top;
			setPosition(((window.innerWidth / 2) + left) + "px", top + "px");
		}
	}

	function setPosition(left, top, right = "auto") {
		container.style.left = left;
		container.style.right = right;
		container.style.top = top;
	}

	async function setSize() {
		const size = await GM.getValue("github-toc-size", [250, 250]);
		container.style.width = `${size[0]}px`;
		container.style.height = `${size[1]}px`;
	}

	// stop text selection while dragging
	function selectionToggle(disable) {
		const body = $("body");
		if (disable) {
			// save current "unselectable" value
			drag.unsel = body.getAttribute("unselectable");
			body.setAttribute("unselectable", "on");
			body.classList.add("ghus-toc-no-selection");
			on(body, "onselectstart", stopPropag);
		} else {
			if (drag.unsel) {
				body.setAttribute("unselectable", drag.unsel);
			}
			body.classList.remove("ghus-toc-no-selection");
			off(body, "onselectstart", stopPropag);
		}
		removeSelection();
	}

	function removeSelection() {
		// remove text selection - http://stackoverflow.com/a/3171348/145346
		const sel = window.getSelection ? window.getSelection() : document.selection;
		if (sel) {
			if (sel.removeAllRanges) {
				sel.removeAllRanges();
			} else if (sel.empty) {
				sel.empty();
			}
		}
	}

	async function tocShow() {
		container.classList.remove("collapsed");
		await GM.setValue("github-toc-hidden", false);
	}

	async function tocHide() {
		container.classList.add("collapsed");
		await GM.setValue("github-toc-hidden", true);
	}

	function tocToggle() {
		// don't toggle content on long clicks
		if (drag.time > new Date().getTime()) {
			if (container.classList.contains("collapsed")) {
				tocShow();
			} else {
				tocHide();
			}
		}
	}
	// hide TOC entirely, if no rendered markdown detected
	function tocView(isVisible) {
		const toc = $(".ghus-toc");
		if (toc) {
			toc.classList.toggle("ghus-toc-hidden", !isVisible);
		}
	}

	function tocAdd() {
		if (!tocInit) {
			return;
		}
		const wrapper = $(defaults.wrapperSelector);
		if (wrapper) {
			let indx, header, anchor, txt;
			let content = "<ul>";
			const anchors = $$(".markdown-body .anchor", wrapper);
			const len = anchors.length;
			if (len > 1) {
				for (indx = 0; indx < len; indx++) {
					anchor = anchors[indx];
					if (anchor.parentElement) {
						header = anchor.parentElement;
						// replace single & double quotes with right angled quotes
						txt = header.textContent
							.trim()
							.replace(regex.quote, "&#8217;")
							.replace(regex.doubleQuote, "&#8221;");
						content += `
							<li class="ghus-toc-${header.nodeName.toLowerCase()}">
								<span class="ghus-toc-icon octicon ghd-invert"></span>
								<a href="${anchor.hash}" title="${txt}">${txt}</a>
							</li>
						`;
					}
				}
				$(".boxed-group-inner", container).innerHTML = content + "</ul>";
				tocView(true);
				listCollapsible();
			} else {
				tocView();
			}
		} else {
			tocView();
		}
	}

	function listCollapsible() {
		let indx, el, next, count, num, group;
		const els = $$("li", container);
		const len = els.length;
		for (indx = 0; indx < len; indx++) {
			count = 0;
			group = [];
			el = els[indx];
			next = el?.nextElementSibling;
			if (next) {
				num = el.className.match(regex.number)[0];
				while (next && !next.classList.contains("ghus-toc-h" + num)) {
					if (next.className.match(regex.number)[0] > num) {
						count++;
						group[group.length] = next;
					}
					next = next.nextElementSibling;
				}
				if (count > 0) {
					el.className += " collapsible collapsible-" + indx;
					addClass(group, "ghus-toc-childof-" + indx);
				}
			}
		}
		group = [];
	}

	function toggleChildrenHandler(event) {
		// Allow doc link to work
		if (event.target.nodeName === "A") {
			return;
		}
		stopPropag(event);
		// click on icon, then target LI parent
		let els, name, indx;
		const el = event.target.closest("li");
		const collapse = el?.classList.contains("collapsed");
		if (event.target.classList.contains("ghus-toc-icon")) {
			if (event.shiftKey) {
				name = el.className.match(regex.header);
				els = name ? $$("." + name, container) : [];
				indx = els.length;
				while (indx--) {
					collapseChildren(els[indx], collapse);
				}
			} else {
				collapseChildren(el, collapse);
			}
			removeSelection();
		}
	}

	function collapseChildren(el, collapse) {
		const name = el?.className.match(regex.collapsible);
		const children = name ? $$(".ghus-toc-childof-" + name[1], container) : null;
		if (children) {
			if (collapse) {
				el.classList.remove("collapsed");
				removeClass(children, "ghus-toc-hidden");
			} else {
				el.classList.add("collapsed");
				addClass(children, "ghus-toc-hidden");
			}
		}
	}

	// keyboard shortcuts
	// GitHub hotkeys are set up to only go to a url, so rolling our own
	function keyboardCheck(event) {
		clearTimeout(keyboard.timer);
		// use "g+t" to toggle the panel; "g+r" to reset the position
		// keypress may be needed for non-alphanumeric keys
		const tocToggleKeys = defaults.toggle.split("+");
		const tocReset = defaults.restore.split("+");
		const key = String.fromCharCode(event.which).toLowerCase();
		const panelHidden = container.classList.contains("collapsed");

		// press escape to close the panel
		if (event.which === 27 && !panelHidden) {
			tocHide();
			return;
		}
		// prevent opening panel while typing in comments
		if (regex.ignore.test(document.activeElement.nodeName)) {
			return;
		}
		// toggle TOC (g+t)
		if (keyboard.lastKey === tocToggleKeys[0] && key === tocToggleKeys[1]) {
			if (panelHidden) {
				tocShow();
			} else {
				tocHide();
			}
		}
		// reset TOC window position (g+r)
		if (keyboard.lastKey === tocReset[0] && key === tocReset[1]) {
			container.setAttribute("style", "");
			setSize();
			dragSave(true);
		}
		keyboard.lastKey = key;
		keyboard.timer = setTimeout(() => {
			keyboard.lastKey = null;
		}, defaults.delay);
	}

	async function init() {
		// there is no ".header" on github.com/contact; and some other pages
		const header = $([...defaults.headerSelector, defaults.headerWrap].join(","));
		if (!header || tocInit) {
			return;
		}
		// insert TOC after header
		const location = await GM.getValue("github-toc-location", null);
		// restore last position
		resize(null, ...(location ? location : [null]));

		// TOC saved state
		const hidden = await GM.getValue("github-toc-hidden", false);
		setSize();
		container.className = "ghus-toc boxed-group wiki-pages-box readability-sidebar" + (hidden ? " collapsed" : "");
		container.setAttribute("role", "navigation");
		container.setAttribute("unselectable", "on");
		container.setAttribute("index", "0");
		container.innerHTML = `
			<h3 class="js-wiki-toggle-collapse wiki-auxiliary-content" data-hotkey="${defaults.toggle.replace(regex.toggle, " ")}">
				<span class="ghus-toc-toggle ghus-toc-icon">
					<svg class="octicon" height="14" width="14" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 16 12">
						<path d="M2 13c0 .6 0 1-.6 1H.6c-.6 0-.6-.4-.6-1s0-1 .6-1h.8c.6 0 .6.4.6 1zm2.6-9h6.8c.6 0 .6-.4.6-1s0-1-.6-1H4.6C4 2 4 2.4 4 3s0 1 .6 1zM1.4 7H.6C0 7 0 7.4 0 8s0 1 .6 1h.8C2 9 2 8.6 2 8s0-1-.6-1zm0-5H.6C0 2 0 2.4 0 3s0 1 .6 1h.8C2 4 2 3.6 2 3s0-1-.6-1zm10 5H4.6C4 7 4 7.4 4 8s0 1 .6 1h6.8c.6 0 .6-.4.6-1s0-1-.6-1zm0 5H4.6c-.6 0-.6.4-.6 1s0 1 .6 1h6.8c.6 0 .6-.4.6-1s0-1-.6-1z"/>
					</svg>
				</span>
				<span class="ghus-toc-title">${title}</span>
				<a class="ghus-toc-docs tooltipped tooltipped-w" aria-label="Go to documentation" href="https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-table-of-contents">
					<svg class="octicon" xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 16 14">
						<path d="M6 10h2v2H6V10z m4-3.5c0 2.14-2 2.5-2 2.5H6c0-0.55 0.45-1 1-1h0.5c0.28 0 0.5-0.22 0.5-0.5v-1c0-0.28-0.22-0.5-0.5-0.5h-1c-0.28 0-0.5 0.22-0.5 0.5v0.5H4c0-1.5 1.5-3 3-3s3 1 3 2.5zM7 2.3c3.14 0 5.7 2.56 5.7 5.7S10.14 13.7 7 13.7 1.3 11.14 1.3 8s2.56-5.7 5.7-5.7m0-1.3C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7S10.86 1 7 1z" />
					</svg>
				</a>
			</h3>
			<div class="boxed-group-inner wiki-auxiliary-content wiki-auxiliary-content-no-bg"></div>
		`;

		// add container
		const el = $(defaults.headerSelector.join(","));
		el.parentElement.insertBefore(container, el);

		// make draggable
		on($("h3", container), "mousedown", dragInit);
		on(document, "mousemove", dragMove);
		on(document, "mouseup", dragStop);
		// toggle TOC
		on($(".ghus-toc-icon", container), "mouseup", tocToggle);
		on($("h3", container), "dblclick", tocHide);
		// prevent container content selection
		on(container, "onselectstart", stopPropag);
		on(container, "click", toggleChildrenHandler);
		// keyboard shortcuts
		on(document, "keydown", keyboardCheck);
		// keep window relative to middle on resize
		on(window, "resize", resize);

		tocInit = true;
		tocAdd();
	}

	// Add GM options
	GM.registerMenuCommand("Set Table of Contents Title", async () => {
		title = prompt("Table of Content Title:", title);
		await GM.setValue("github-toc-title", title);
		$("h3 .ghus-toc-title", container).textContent = title;
	});

	on(document, "ghmo:container", tocAdd);
	on(document, "ghmo:preview", tocAdd);
	init();

})();
