// ==UserScript==
// @name        GitHub Sort Content
// @version     1.2.6
// @description A userscript that makes some lists & markdown tables sortable
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM.addStyle
// @grant       GM_addStyle
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @require     https://cdnjs.cloudflare.com/ajax/libs/tinysort/2.3.6/tinysort.min.js
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=264157
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-content.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-content.user.js
// ==/UserScript==
(() => {
	"use strict";
	/* example pages:
	tables - https://github.com/Mottie/GitHub-userscripts
	Contribute repos, Your Repos & Your Teams - https://github.com/
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
				unsorted: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDhIMWw3LTh6bTAgMUgxbDcgN3oiIGZpbGw9IiNkZGQiIG9wYWNpdHk9Ii4yIi8+PC9zdmc+",
				asc: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDhIMWw3LTh6IiBmaWxsPSIjZGRkIi8+PHBhdGggZD0iTTE1IDlIMWw3IDd6IiBmaWxsPSIjZGRkIiBvcGFjaXR5PSIuMiIvPjwvc3ZnPg==",
				desc: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDhIMWw3LTh6IiBmaWxsPSIjZGRkIiBvcGFjaXR5PSIuMiIvPjxwYXRoIGQ9Ik0xNSA5SDFsNyA3eiIgZmlsbD0iI2RkZCIvPjwvc3ZnPg=="
			},
			black: {
				unsorted: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDhIMWw3LTh6bTAgMUgxbDcgN3oiIGZpbGw9IiMyMjIiIG9wYWNpdHk9Ii4yIi8+PC9zdmc+",
				asc: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDhIMWw3LTh6IiBmaWxsPSIjMjIyIi8+PHBhdGggZD0iTTE1IDlIMWw3IDd6IiBmaWxsPSIjMjIyIiBvcGFjaXR5PSIuMiIvPjwvc3ZnPg==",
				desc: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTE1IDhIMWw3LTh6IiBmaWxsPSIjMjIyIiBvcGFjaXR5PSIuMiIvPjxwYXRoIGQ9Ik0xNSA5SDFsNyA3eiIgZmlsbD0iIzIyMiIvPjwvc3ZnPg=="
			}
		},
		// toolbars - target for sort arrows
		regexBars = new RegExp(
			"\\b(" +
			[
				"TableObject",          // org repos
				"org-toolbar",          // org people
				"sort-bar",             // https://github.com/stars
				"tabnav-tabs",          // https://github.com/:user/follower(s|ing)
				"Box-header|flex-auto", // watching
				"user-profile-nav"      // user repos
			].join("|") +
			")\\b"
		);

	function addRepoFileThead() {
		const $table = $("table.files");
		if ($table && !$(".ghsc-header", $table)) {
			const thead = document.createElement("thead");
			thead.innerHTML = `<tr class="ghsc-header">
					<td></td>
					<th>Content</th>
					<th>Message</th>
					<th class="ghsc-age">Age</th>
				</tr>`;
			$table.insertBefore(thead, $table.childNodes[0]);
		}
	}

	function initSortTable(el) {
		removeSelection();
		const dir = el.classList.contains(sorts[0]) ? sorts[1] : sorts[0],
			table = el.closest("table"),
			options = {
				order: dir,
				natural: true,
				selector: `td:nth-child(${el.cellIndex + 1})`
			};
		if (el.classList.contains("ghsc-age")) {
			// sort repo age column using ISO 8601 datetime format
			options.selector += " [datetime]";
			options.attr = "datetime";
		}
		tinysort($$("tbody tr:not(.up-tree)", table), options);
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
		// color will be "rgb(#, #, #)" or "rgba(#, #, #, #)"
		let color = window.getComputedStyle(document.body).backgroundColor;
		const rgb = (color || "")
			.replace(/\s/g, "")
			.match(/^rgba?\((\d+),(\d+),(\d+)/i);
		if (rgb) {
			// remove "rgb.." part from match & parse
			const colors = rgb.slice(1).map(Number);
			// http://stackoverflow.com/a/15794784/145346
			const brightest = Math.max.apply(null, colors);
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
		return [...(el || document).querySelectorAll(str)];
	}

	function removeSelection() {
		// remove text selection - http://stackoverflow.com/a/3171348/145346
		const sel = window.getSelection ?
			window.getSelection() :
			document.selection;
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

		GM.addStyle(`
			/* unsorted icon */
			.markdown-body table thead th, table.files thead th {
				cursor:pointer;
				padding-right:22px !important;
				background-image:url(${styles.unsorted}) !important;
				background-repeat:no-repeat !important;
				background-position:calc(100% - 5px) center !important;
				text-align:left;
			}
			tr.ghsc-header th, tr.ghsc-header td {
				border-bottom:#eee 1px solid;
				padding:2px 2px 2px 10px;
			}
			div.js-pinned-repos-reorder-container > h3,
			.dashboard-sidebar .boxed-group > h3,
			.sort-bar, h2 + .tabnav > .tabnav-tabs, .org-toolbar,
			.org-profile .TableObject-item--primary,
			.subscriptions-content .Box-header, div.user-profile-nav.js-sticky {
				cursor:pointer;
				padding-right:10px;
				background-image:url(${styles.unsorted}) !important;
				background-repeat:no-repeat !important;
				background-position:calc(100% - 5px) center !important;
			}
			/* https://github.com/ -> your repositories */
			#your_repos h3 {
				background-position: 175px 10px !important;
			}
			/* https://github.com/:user?tab=repositories */
			div.user-profile-nav.js-sticky {
				background-position:calc(100% - 80px) 22px !important;
			}
			/* https://github.com/:organization repos & people */
			.org-profile .TableObject-item--primary, .org-toolbar {
				background-position:calc(100% - 5px) 10px !important;
			}
			.TableObject-item--primary input {
				width: 97.5% !important;
			}
			/* https://github.com/stars */
			.sort-bar {
				background-position:525px 10px !important;
			}
			/* https://github.com/watching */
			.subscriptions-content .Box-header {
				 background-position:160px 15px !important;
			}
			/* asc/dec icons */
			table thead th.asc, div.boxed-group h3.asc, div.user-profile-nav.asc,
			div.js-repo-filter.asc, .org-toolbar.asc,
			.TableObject-item--primary.asc, .sort-bar.asc,
			h2 + .tabnav > .tabnav-tabs.asc,
			.subscriptions-content .Box-header.asc {
				background-image:url(${styles.asc}) !important;
				background-repeat:no-repeat !important;
			}
			table thead th.desc, div.boxed-group h3.desc, div.user-profile-nav.desc,
			div.js-repo-filter.desc, .org-toolbar.desc,
			.TableObject-item--primary.desc, .sort-bar.desc,
			h2 + .tabnav > .tabnav-tabs.desc,
			.subscriptions-content .Box-header.desc {
				background-image:url(${styles.desc}) !important;
				background-repeat:no-repeat !important;
			}
			/* remove sort arrows */
			.popular-repos + div.boxed-group h3 {
				background-image:none !important;
				cursor:default;
			}
			/* move "Customize your pinned..." - https://github.com/:self */
			.pinned-repos-setting-link {
				margin-right:14px;
			}
		`);

		document.body.addEventListener("click", event => {
			let el;
			const target = event.target,
				name = target.nodeName;
			if (target && target.nodeType === 1 && (
				// nodes th|h3 & form for stars page
				name === "H3" || name === "TH" || name === "FORM" ||
				// https://github.com/:organization filter bar
				//   filter: .TableObject-item--primary, repo wrapper: .org-profile
				// https://github.com/stars (sort-bar)
				// https://github.com/:user/followers (tabnav-tabs)
				// https://github.com/:user/following (tabnav-tabs)
				// https://github.com/:user?tab=repositories (user-profile-nav)
				// https://github.com/:user?tab=stars (user-profile-nav)
				// https://github.com/:user?tab=followers (user-profile-nav)
				// https://github.com/:user?tab=followering (user-profile-nav)
				regexBars.test(target.className)
			)) {
				// don't sort tables not inside of markdown,
				// except for the repo "code" tab file list
				if (name === "TH" && target.closest(".markdown-body, table.files")) {
					return initSortTable(target);
				}

				// following
				el = $("ol.follow-list", target.closest(".container"));
				if (el) {
					return initSortUl(target, el, ".follow-list-name a");
				}

				// organization people - https://github.com/orgs/:organization/people
				el = $("ul.member-listing-next", target.parentNode);
				if (el) {
					return initSortUl(target, el, ".member-info a");
				}

				// stars - https://github.com/stars
				el = target.closest(".sort-bar");
				if (el && $(".repo-list", el.parentNode)) {
					return initSortUl(el, $(".repo-list", el.parentNode), "h3 a");
				}

				// org repos - https://github.com/:organization
				el = target.closest(".org-profile");
				if (el && $(".repo-list", el)) {
					return initSortUl(target, $(".repo-list", el), "h3 a");
				}

				// https://github.com/watching
				el = target.closest(".subscriptions-content");
				if (el && $(".repo-list", el)) {
					return initSortUl($(".Box-header", el), $(".repo-list", el), "li a");
				}

				// mini-repo listings with & without filter - https://github.com/
				// and pinned repo lists
				el = target.closest(".boxed-group");
				// prevent clicking on the H3 header of filtered repos
				if (el && name === "H3" && (
					el.parentNode.id === "your_teams" ||
					el.parentNode.id === "your_repos" ||
					el.classList.contains("js-repos-container") ||
					el.classList.contains("js-repo-filter") || // still valid?
					el.classList.contains("js-pinned-repos-reorder-container")
				)) {
					return initSortUl(target, $(".mini-repo-list", el));
				}

				// user sticky navigation
				if (target.classList.contains("user-profile-nav")) {
					el = $(".underline-nav-item.selected", target);
					if (el) {
						if (el.textContent.indexOf("Overview") > -1) {
							return initSortUl(target, $(".pinned-repos-list"), ".repo");
						} else if (el.href.indexOf("tab=repo") > -1) {
							return initSortUl(target, $("#user-repositories-list ul"), "h3 a");
						} else if (el.href.indexOf("tab=stars") > -1) {
							return initSortUl(target, target.nextElementSibling, "h3 a");
						} else if (el.href.indexOf("tab=follow") > -1) {
							return initSortUl(target, target.nextElementSibling, "a .f4");
						}
					}
				}
			}
		});
		addRepoFileThead();
	}

	document.addEventListener("ghmo:container", () => {
		// init after a short delay to allow rendering of file list
		setTimeout(() => {
			addRepoFileThead();
		}, 200);
	});
	init();
})();
