// ==UserScript==
// @name        GitHub Table of Contents
// @version     1.3.1
// @description A userscript that adds a table of contents to readme & wiki pages
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM.getValue
// @grant       GM_setValue
// @grant       GM.setValue
// @grant       GM_addStyle
// @grant       GM.addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toc.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toc.user.js
// ==/UserScript==
(async () => {
	"use strict";

	GM.addStyle(`
		/* z-index > 1000 to be above the */
		.ghus-toc { position:fixed; z-index:1001; min-width:200px; top:64px; right:10px; }
		.ghus-toc h3 { cursor:move; }
		/* icon toggles TOC container & subgroups */
		.ghus-toc h3 svg, .ghus-toc li.collapsible .ghus-toc-icon { cursor:pointer; vertical-align:baseline; }
		.ghus-toc .ghus-toc-docs { float:right; }
		/* move collapsed TOC to top right corner */
		.ghus-toc.collapsed {
			width:30px; height:30px; min-width:auto; overflow:hidden; top:16px !important; left:auto !important;
			right:10px !important; border:1px solid rgba(128, 128, 128, 0.5); border-radius:3px;
		}
		.ghus-toc.collapsed > h3 { cursor:pointer; padding-top:5px; border:none; background:#222; color:#ddd; }
		.ghus-toc.collapsed .ghus-toc-docs { display:none; }
		.ghus-toc.collapsed ~ .Header,
		.ghus-toc.collapsed ~ .js-header-wrapper { padding-right: 30px !important; }
		/* move header text out-of-view when collapsed */
		.ghus-toc.collapsed > h3 svg { margin-bottom: 10px; }
		.ghus-toc-hidden, .ghus-toc.collapsed .boxed-group-inner,
			.ghus-toc li:not(.collapsible) .ghus-toc-icon { display:none; }
		.ghus-toc .boxed-group-inner { max-width:250px; max-height:400px; overflow-y:auto; overflow-x:hidden; }
		.ghus-toc ul { list-style:none; }
		.ghus-toc li { max-width:230px; white-space:nowrap; overflow-x:hidden; text-overflow:ellipsis; }
		.ghus-toc .ghus-toc-h1 { padding-left:15px; }
		.ghus-toc .ghus-toc-h2 { padding-left:30px; }
		.ghus-toc .ghus-toc-h3 { padding-left:45px; }
		.ghus-toc .ghus-toc-h4 { padding-left:60px; }
		.ghus-toc .ghus-toc-h5 { padding-left:75px; }
		.ghus-toc .ghus-toc-h6 { padding-left:90px; }
		/* anchor collapsible icon */
		.ghus-toc li.collapsible .ghus-toc-icon {
			width:16px; height:16px; display:inline-block; margin-left:-16px;
			background: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGNsYXNzPSdvY3RpY29uJyBoZWlnaHQ9JzE0JyB2aWV3Qm94PScwIDAgMTIgMTYnPjxwYXRoIGQ9J00wIDVsNiA2IDYtNkgweic+PC9wYXRoPjwvc3ZnPg==) left center no-repeat;
		}
		/* on rotate, height becomes width, so this is keeping things lined up */
		.ghus-toc li.collapsible.collapsed .ghus-toc-icon { -webkit-transform:rotate(-90deg); transform:rotate(-90deg); height:10px; width:12px; margin-right:2px; }
		.ghus-toc-no-selection { -webkit-user-select:none !important; -moz-user-select:none !important; user-select:none !important; }
	`);

	let tocInit = false;

	// modifiable title
	let title = await GM.getValue("github-toc-title", "Table of Contents");

	const container = document.createElement("div"),

		// keyboard shortcuts
		keyboard = {
			toggle  : "g+t",
			restore : "g+r",
			timer   : null,
			lastKey : null,
			delay   : 1000 // ms between keyboard shortcuts
		},

		// drag variables
		drag = {
			el   : null,
			pos  : [0, 0],
			elm  : [0, 0],
			time : 0,
			unsel: null
		};

	// drag code adapted from http://jsfiddle.net/tovic/Xcb8d/light/
	function dragInit() {
		if (!container.classList.contains("collapsed")) {
			drag.el = container;
			drag.elm[0] = drag.pos[0] - drag.el.offsetLeft;
			drag.elm[1] = drag.pos[1] - drag.el.offsetTop;
			selectionToggle(true);
		} else {
			drag.el = null;
		}
		drag.time = new Date().getTime() + 500;
	}

	function dragMove(event) {
		drag.pos[0] = document.all ? window.event.clientX : event.pageX;
		drag.pos[1] = document.all ? window.event.clientY : event.pageY;
		if (drag.el !== null) {
			drag.el.style.left = (drag.pos[0] - drag.elm[0]) + "px";
			drag.el.style.top = (drag.pos[1] - drag.elm[1]) + "px";
			drag.el.style.right = "auto";
		}
	}

	function dragStop() {
		if (drag.el !== null) {
			dragSave();
			selectionToggle();
		}
		drag.el = null;
	}

	async function dragSave(clear) {
		let val = clear ? null : [container.style.left, container.style.top];
		await GM.setValue("github-toc-location", val);
	}

	// stop text selection while dragging
	function selectionToggle(disable) {
		const body = $("body");
		if (disable) {
			// save current "unselectable" value
			drag.unsel = body.getAttribute("unselectable");
			body.setAttribute("unselectable", "on");
			body.classList.add("ghus-toc-no-selection");
			on(body, "onselectstart", () => false);
		} else {
			if (drag.unsel) {
				body.setAttribute("unselectable", drag.unsel);
			}
			body.classList.remove("ghus-toc-no-selection");
			body.removeEventListener("onselectstart", () => false);
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
	function tocView(mode) {
		const toc = $(".ghus-toc");
		if (toc) {
			toc.style.display = mode || "none";
		}
	}

	function tocAdd() {
		if (!tocInit) {
			return;
		}
		if ($("#wiki-content, #readme")) {
			let indx, header, anchor, txt;
			let content = "<ul>";
			const anchors = $$(".markdown-body .anchor");
			const len = anchors.length;
			if (len > 1) {
				for (indx = 0; indx < len; indx++) {
					anchor = anchors[indx];
					if (anchor.parentNode) {
						header = anchor.parentNode;
						// replace single & double quotes with right angled quotes
						txt = header.textContent.trim().replace(/'/g, "&#8217;").replace(/"/g, "&#8221;");
						content += `
							<li class="ghus-toc-${header.nodeName.toLowerCase()}">
								<span class="ghus-toc-icon octicon ghd-invert"></span>
								<a href="${anchor.hash}" title="${txt}">${txt}</a>
							</li>
						`;
					}
				}
				$(".boxed-group-inner", container).innerHTML = content + "</ul>";
				tocView("block");
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
			next = el && el.nextElementSibling;
			if (next) {
				num = el.className.match(/\d/)[0];
				while (next && !next.classList.contains("ghus-toc-h" + num)) {
					if (next.className.match(/\d/)[0] > num) {
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
		on(container, "click", event => {
			// click on icon, then target LI parent
			let els, name, indx;
			const el = event.target.parentNode;
			const collapse = el.classList.contains("collapsed");
			if (event.target.classList.contains("ghus-toc-icon")) {
				if (event.shiftKey) {
					name = el.className.match(/ghus-toc-h\d/);
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
		});
	}

	function collapseChildren(el, collapse) {
		const name = el && el.className.match(/collapsible-(\d+)/);
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
		const tocToggle = keyboard.toggle.split("+");
		const tocReset = keyboard.restore.split("+");
		const key = String.fromCharCode(event.which).toLowerCase();
		const panelHidden = container.classList.contains("collapsed");

		// press escape to close the panel
		if (event.which === 27 && !panelHidden) {
			tocHide();
			return;
		}
		// prevent opening panel while typing in comments
		if (/(input|textarea)/i.test(document.activeElement.nodeName)) {
			return;
		}
		// toggle TOC (g+t)
		if (keyboard.lastKey === tocToggle[0] && key === tocToggle[1]) {
			if (panelHidden) {
				tocShow();
			} else {
				tocHide();
			}
		}
		// reset TOC window position (g+r)
		if (keyboard.lastKey === tocReset[0] && key === tocReset[1]) {
			container.setAttribute("style", "");
			dragSave(true);
		}
		keyboard.lastKey = key;
		keyboard.timer = setTimeout(() => {
			keyboard.lastKey = null;
		}, keyboard.delay);
	}

	async function init() {
		// there is no ".header" on github.com/contact; and some other pages
		if (!$(".header, .Header, .js-header-wrapper") || tocInit) {
			return;
		}
		// insert TOC after header
		const location = await GM.getValue("github-toc-location", null);
		// restore last position
		if (location) {
			container.style.left = location[0];
			container.style.top = location[1];
			container.style.right = "auto";
		}

		// TOC saved state
		const hidden = await GM.getValue("github-toc-hidden", false);
		container.className = "ghus-toc boxed-group wiki-pages-box readability-sidebar" + (hidden ? " collapsed" : "");
		container.setAttribute("role", "navigation");
		container.setAttribute("unselectable", "on");
		container.innerHTML = `
			<h3 class="js-wiki-toggle-collapse wiki-auxiliary-content" data-hotkey="g t">
				<svg class="octicon ghus-toc-icon" height="14" width="14" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 16 12">
					<path d="M2 13c0 .6 0 1-.6 1H.6c-.6 0-.6-.4-.6-1s0-1 .6-1h.8c.6 0 .6.4.6 1zm2.6-9h6.8c.6 0 .6-.4.6-1s0-1-.6-1H4.6C4 2 4 2.4 4 3s0 1 .6 1zM1.4 7H.6C0 7 0 7.4 0 8s0 1 .6 1h.8C2 9 2 8.6 2 8s0-1-.6-1zm0-5H.6C0 2 0 2.4 0 3s0 1 .6 1h.8C2 4 2 3.6 2 3s0-1-.6-1zm10 5H4.6C4 7 4 7.4 4 8s0 1 .6 1h6.8c.6 0 .6-.4.6-1s0-1-.6-1zm0 5H4.6c-.6 0-.6.4-.6 1s0 1 .6 1h6.8c.6 0 .6-.4.6-1s0-1-.6-1z"/>
				</svg>
				<span>${title}</span>
				<a class="ghus-toc-docs tooltipped tooltipped-w" aria-label="Go to documentation" href="https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-table-of-contents">
					<svg class="octicon" xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 16 14">
						<path d="M6 10h2v2H6V10z m4-3.5c0 2.14-2 2.5-2 2.5H6c0-0.55 0.45-1 1-1h0.5c0.28 0 0.5-0.22 0.5-0.5v-1c0-0.28-0.22-0.5-0.5-0.5h-1c-0.28 0-0.5 0.22-0.5 0.5v0.5H4c0-1.5 1.5-3 3-3s3 1 3 2.5zM7 2.3c3.14 0 5.7 2.56 5.7 5.7S10.14 13.7 7 13.7 1.3 11.14 1.3 8s2.56-5.7 5.7-5.7m0-1.3C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7S10.86 1 7 1z" />
					</svg>
				</a>
			</h3>
			<div class="boxed-group-inner wiki-auxiliary-content wiki-auxiliary-content-no-bg"></div>
		`;

		// add container
		const el = $(".header, .js-header-wrapper");
		el.parentNode.insertBefore(container, el);

		// make draggable
		on($("h3", container), "mousedown", dragInit);
		on(document, "mousemove", dragMove);
		on(document, "mouseup", dragStop);
		// toggle TOC
		on($(".ghus-toc-icon", container), "mouseup", tocToggle);
		// prevent container content selection
		on(container, "onselectstart", () => false );
		// keyboard shortcuts
		on(document, "keydown", keyboardCheck);

		tocInit = true;
	  tocAdd();
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	function $$(str, el) {
		return Array.from((el || document).querySelectorAll(str));
	}

	function on(el, name, handler) {
		el.addEventListener(name, handler);
	}

	function addClass(els, name) {
		let indx;
		const len = els.length;
		for (indx = 0; indx < len; indx++) {
			els[indx].classList.add(name);
		}
	}

	function removeClass(els, name) {
		let indx;
		const len = els.length;
		for (indx = 0; indx < len; indx++) {
			els[indx].classList.remove(name);
		}
	}

	// Add GM options
	GM.registerMenuCommand("Set Table of Contents Title", async () => {
		title = prompt("Table of Content Title:", title);
		await GM.setValue("github-toc-title", title);
		$("h3 span", container).textContent = title;
	});

	on(document, "ghmo:container", tocAdd);
	on(document, "ghmo:preview", tocAdd);
	init();

})();
