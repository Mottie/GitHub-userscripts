// ==UserScript==
// @name          GitHub Sort Content
// @version       1.1.1
// @description   A userscript that makes some lists & markdown tables sortable
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     https://github.com/Mottie
// @include       https://github.com/*
// @grant         GM_addStyle
// @require       https://cdnjs.cloudflare.com/ajax/libs/tinysort/2.3.6/tinysort.min.js
// @run-at        document-idle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-content.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-content.user.js
// ==/UserScript==
/* global GM_addStyle, tinysort */
/* jshint unused:true, esnext:true */
(() => {
	"use strict";
	/* example pages:
	tables - https://github.com/Mottie/GitHub-userscripts
	Contribute repos & Your Repos - https://github.com/
	organization repos - https://github.com/jquery
	organization members - https://github.com/orgs/jquery/people
	pinned & no pinned repos - https://github.com/addyosmani
	repos - https://github.com/addyosmani?tab=repositories
	stars - https://github.com/stars
	watching - https://github.com/watching
	*/
	const sorts = ["asc", "desc"],
		icons = {
			white: {
				unsorted: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDggMSA4IDggMHpNMTUgOSAxIDkgOCAxNnoiIHN0eWxlPSJmaWxsOiNkZGQ7b3BhY2l0eTowLjIiLz48L3N2Zz4=",
				asc: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDggMSA4IDggMHoiIHN0eWxlPSJmaWxsOiNkZGQiLz48cGF0aCBkPSJNMTUgOSAxIDkgOCAxNnoiIHN0eWxlPSJmaWxsOiNkZGQ7b3BhY2l0eTowLjIiLz48L3N2Zz4=",
				desc: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDggMSA4IDggMHoiIHN0eWxlPSJmaWxsOiNkZGQ7b3BhY2l0eTowLjIiLz48cGF0aCBkPSJNMTUgOSAxIDkgOCAxNnoiIHN0eWxlPSJmaWxsOiNkZGQiLz48L3N2Zz4="
			},
			black: {
				unsorted: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDggMSA4IDggMHpNMTUgOSAxIDkgOCAxNnoiIHN0eWxlPSJmaWxsOiMyMjI7b3BhY2l0eTowLjIiLz48L3N2Zz4=",
				asc: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDggMSA4IDggMHoiIHN0eWxlPSJmaWxsOiMyMjIiLz48cGF0aCBkPSJNMTUgOSAxIDkgOCAxNnoiIHN0eWxlPSJmaWxsOiMyMjI7b3BhY2l0eTowLjIiLz48L3N2Zz4=",
				desc: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDggMSA4IDggMHoiIHN0eWxlPSJmaWxsOiMyMjI7b3BhY2l0eTowLjIiLz48cGF0aCBkPSJNMTUgOSAxIDkgOCAxNnoiIHN0eWxlPSJmaWxsOiMyMjIiLz48L3N2Zz4="
			}
		},
		// toolbars - target for sort arrows
		regexBars = /\b(filter-bar|org-toolbar|sort-bar|tabnav-tabs|user-profile-nav)\b/;

	function initSortTable(el) {
		removeSelection();
		const dir = el.classList.contains(sorts[0]) ? sorts[1] : sorts[0],
			table = closest(el, "table");
		tinysort($$("tbody tr", table), {
			order: dir,
			natural: true,
			selector: `td:nth-child(${el.cellIndex + 1})`
		});
		$$("th", table).forEach(elm => {
			elm.classList.remove(...sorts);
		});
		el.classList.add(dir);
	}

	function initSortUl(arrows, list, selector) {
		if (list && list.children) {
			removeSelection();
			const dir = arrows.classList.contains(sorts[0]) ? sorts[1] : sorts[0],
				options = {
					order: dir,
					natural: true
				};
			if (selector) {
				options.selector = selector;
			}
			// using children because the big repo contains UL > DIV
			tinysort(list.children, options);
			arrows.classList.remove(...sorts);
			arrows.classList.add(dir);
		}
	}

	function needDarkTheme() {
		let brightest = 0,
			// color will be "rgb(#, #, #)" or "rgba(#, #, #, #)"
			color = window.getComputedStyle(document.body).backgroundColor;
		const rgb = (color || "").replace(/\s/g, "").match(/^rgba?\((\d+),(\d+),(\d+)/i);
		if (rgb) {
			color = rgb.slice(1); // remove "rgb.." part from match
			color.forEach(c => {
				// http://stackoverflow.com/a/15794784/145346
				brightest = Math.max(brightest, parseInt(c, 10));
			});
			// return true if we have a dark background
			return brightest < 128;
		}
		// fallback to bright background
		return false;
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	function $$(str, el) {
		return Array.from((el || document).querySelectorAll(str));
	}

	function closest(el, selector) {
		while (el && el.nodeName !== "BODY" && !el.matches(selector)) {
			el = el.parentNode;
		}
		return el && el.matches(selector) ? el : null;
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

	function init() {
		const styles = needDarkTheme() ? icons.white : icons.black;

		GM_addStyle(`
			/* unsorted icon */
			.markdown-body table thead th {
				cursor:pointer;
				padding-right:22px !important;
				background:url(${styles.unsorted}) no-repeat calc(100% - 5px) center !important;
			}
			div.js-pinned-repos-reorder-container > h3, .dashboard-sidebar .boxed-group > h3,
			div.filter-repos, div.js-repo-filter .filter-bar, .org-toolbar, .sort-bar,
			h2 + .tabnav > .tabnav-tabs, .subscriptions-content .boxed-group > h3,
			div.user-profile-nav {
				cursor:pointer;
				padding-right:10px;
				background-image:url(${styles.unsorted}) !important;
				background-repeat:no-repeat !important;
				background-position:calc(100% - 5px) center !important;
			}
			/* https://github.com/ -> your repositories */
			.dashboard-sidebar .user-repos h3 { background-position: 175px 10px !important; }
			/* https://github.com/:user?tab=repositories */
			div.user-profile-nav { background-position:calc(100% - 80px) 22px !important; }
			/* https://github.com/:organization */
			.org-toolbar { background-position:calc(100% - 5px) 10px !important; }
			/* https://github.com/stars */
			.sort-bar { background-position:525px 10px !important; }
			/* https://github.com/watching */
			.subscriptions-content .boxed-group > h3 {
				 background-position:150px 10px !important;
			}
			/* asc/dec icons */
			table thead th.asc, div.boxed-group h3.asc, div.user-profile-nav.asc,
			div.js-repo-filter.asc, div.filter-bar.asc, .org-toolbar.asc,
			.sort-bar.asc, h2 + .tabnav > .tabnav-tabs.asc,
			.subscriptions-content .boxed-group > h3.asc {
				background-image:url(${styles.asc}) !important;
				background-repeat:no-repeat !important;
			}
			table thead th.desc, div.boxed-group h3.desc, div.user-profile-nav.desc,
			div.js-repo-filter.desc, div.filter-bar.desc, .org-toolbar.desc,
			.sort-bar.desc, h2 + .tabnav > .tabnav-tabs.desc,
			.subscriptions-content .boxed-group > h3.desc {
				background-image:url(${styles.desc}) !important;
				background-repeat:no-repeat !important;
			}
			/* remove sort arrows */
			.popular-repos + div.boxed-group h3, .dashboard-sidebar div.filter-bar {
				background-image:none !important;
				cursor:default;
			}
			/* move "Customize your pinned..." - https://github.com/:self */
			.pinned-repos-setting-link { margin-right:14px; }
		`);

		document.body.addEventListener("click", event => {
			let el;
			const target = event.target,
				name = target.nodeName;
			if (target && target.nodeType === 1 && (
					// nodes th|h3 - form for stars page
					name === "H3" || name === "TH" || name === "FORM" ||
					// mini-repo & https://github.com/:user?tab=repositories (filter-bar)
					// https://github.com/:organization filter bar (org-toolbar)
					// https://github.com/stars (sort-bar)
					// https://github.com/:user/followers (tabnav-tabs)
					// https://github.com/:user/following (tabnav-tabs)
					// https://github.com/:user?tab=repositories (user-profile-nav)
					// https://github.com/:user?tab=stars (user-profile-nav)
					// https://github.com/:user?tab=followers (user-profile-nav)
					// https://github.com/:user?tab=followering (user-profile-nav)
					regexBars.test(target.className)
			)) {
				// don't sort tables not inside of markdown
				if (name === "TH" && closest(target, ".markdown-body")) {
					return initSortTable(target);
				}

				// following
				el = $("ol.follow-list", closest(target, ".container"));
				if (el) {
					return initSortUl(target, el, ".follow-list-name a");
				}

				// organization people - https://github.com/orgs/:organization/people
				el = $("ul.member-listing", target.parentNode);
				if (el) {
					return initSortUl(target, el, ".member-link");
				}

				// big repo list - https://github.com/:user?tab=repositories
				// stars - https://github.com/stars
				el = closest(target, ".sort-bar, .filter-bar, .org-toolbar");
				if (el && $(".repo-list", el.parentNode)) {
					return initSortUl(el, $(".repo-list", el.parentNode), ".repo-list-name a");
				}

				// https://github.com/watching
				el = closest(target, ".subscriptions-content");
				if (el && $(".repo-list", el)) {
					return initSortUl(target, $(".repo-list", el), "li a");
				}

				// mini-repo listings with & without filter - https://github.com/
				// and pinned repo lists
				el = closest(target, ".boxed-group");
				// prevent clicking on the H3 header of filtered repos
				if (el && name === "H3" && (
						el.classList.contains("js-repo-filter") ||
						el.classList.contains("js-pinned-repos-reorder-container")
					)) {
					return initSortUl(target, $(".mini-repo-list", el));
				}

				// user sticky navigation
				if (target.classList.contains("user-profile-nav")) {
					el = $(".underline-nav-item.selected", target);
					if (el) {
						console.log(el.textContent.trim(), el.href);
						if (el.textContent.indexOf("Overview") > -1) {
							return initSortUl(target, $(".pinned-repos-list"), ".repo");
						} else if (el.href.indexOf("tab=repo") > -1) {
							return initSortUl(target, $(".js-repo-list"), "h3 a");
						} else if (el.href.indexOf("tab=stars") > -1) {
							return initSortUl(target, $(".js-repo-filter"), "h3 a");
						} else if (el.href.indexOf("tab=follow") > -1) {
							return initSortUl(target, $(".js-repo-filter"), "a .f4");
						}
					}
				}
			}
		});
	}

	init();
})();
