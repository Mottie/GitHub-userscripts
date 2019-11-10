// ==UserScript==
// @name        GitHub Sort Content
// @version     3.0.2
// @description A userscript that makes some lists & markdown tables sortable
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       GM.addStyle
// @grant       GM_addStyle
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @require     https://cdnjs.cloudflare.com/ajax/libs/tinysort/2.3.6/tinysort.min.js
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-content.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-content.user.js
// ==/UserScript==
/* global tinysort */
(() => {
	"use strict";
	/** Example pages:
	 * Tables (Readme & wikis) - https://github.com/Mottie/GitHub-userscripts
	 * Repo files table - https://github.com/Mottie/GitHub-userscripts (sort content, message or age)
	 * Activity - https://github.com (recent & all)
	 * Sidebar - https://github.com/ (Repositories & Your teams)
	 * Pinned repos (user & org)- https://github.com/(:user|:org)
	 * Org Repos - https://github.com/:org
	 * Org people - https://github.com/orgs/:org/people
	 * Org outside collaborators (own orgs) - https://github.com/orgs/:org/outside-collaborators
	 * Org teams - https://github.com/orgs/:org/teams & https://github.com/orgs/:org/teams/:team/teams
	 * Org team repos - https://github.com/orgs/:org/teams/:team/repositories
	 * Org team members - https://github.com/orgs/:org/teams/:team/members
	 * Org projects - https://github.com/:org/projects
	 * User repos - https://github.com/:user?tab=repositories
	 * User stars - https://github.com/:user?tab=stars
	 * User Followers - https://github.com/:user?tab=followers & https://github.com/:user/followers(/you_know)
	 * User Following - https://github.com/:user?tab=following & https://github.com/:user/following(/you_know)
	 * watching - https://github.com/watching
	 * Repo stargazers - https://github.com/:user/:repo/stargazers
	 * Repo watchers - https://github.com/:user/:repo/watchers
	 */
	/**
	 * sortables[entry].setup - exec on userscript init (optional)
	 * sortables[entry].check - exec on doc.body click; return truthy/falsy or
	 *  header element (passed to the sort)
	 * sortables[entry].sort - exec if check returns true or a header element;
	 *  el param is the element returned by check or original click target
	 * sortables[entry].css - specific css as an array of selectors, applied to
	 *  the entry elements; "unsorted", "asc" (optional), "desc" (optional),
	 *  "tweaks" (optional)
	 */
	const sortables = {
		// markdown tables
		"tables": {
			// init after a short delay to allow rendering of file list
			setup: () => setTimeout(() => addRepoFileThead(), 200),
			check: el => el.nodeName === "TH" &&
				el.matches(".markdown-body table thead th, table.files thead th"),
			sort: el => initSortTable(el),
			css: {
				unsorted: [
					".markdown-body table thead th",
					".markdown-body table.csv-data thead th",
					"table.files thead th"
				],
				tweaks: [
					`body .markdown-body table thead th, body table.files thead th {
						text-align: left;
						background-position: 3px center !important;
					}`
				]
			}
		},
		// github.com (all activity list)
		"all-activity": {
			check: el => $("#dashboard") &&
				el.classList.contains("js-all-activity-header"),
			sort: el => {
				const list = $$("div[data-repository-hovercards-enabled]:not(.js-details-container) > div");
				const wrap = list.parentElement;
				initSortList(
					el,
					list,
					{ selector: "relative-time", attr: "datetime" }
				);
				// Move "More" button to bottom
				setTimeout(() => {
					movePaginate(wrap);
				});
			},
			css: {
				unsorted: [
					".js-all-activity-header"
				],
				extras: [
					"div[data-repository-hovercards-enabled] div:empty { display: none; }"
				]
			}
		},
		// github.com (recent activity list)
		"recent-activity": {
			check: el => $("#dashboard") &&
				el.matches(".news > h2:not(.js-all-activity-header)"),
			sort: el => {
				initSortList(
					el,
					$$(".js-recent-activity-container ul li"),
					{ selector: "relative-time", attr: "datetime" }
				);
				// Not sure why, but sorting shows all recent activity; so, hide the
				// "Show more" button
				$(".js-show-more-recent-items").classList.add("d-none");
			},
			css: {
				unsorted: [
					".news h2:not(.js-all-activity-header)"
				]
			}
		},
		// github.com (sidebar repos & teams)
		"sidebar": {
			check: el => $(".dashboard-sidebar") &&
				el.matches(".dashboard-sidebar h2"),
			sort: el => initSortList(
				el,
				$$(".list-style-none li", el.closest(".js-repos-container")),
				{ selector: "a" }
			),
			css: {
				unsorted: [
					".dashboard-sidebar h2"
				],
				tweaks: [
					`.dashboard-sidebar h2.pt-3 {
						background-position: left bottom !important;
					}`
				]
			}
		},
		// github.com/(:user|:org) (pinned repos)
		"pinned": {
			check: el => el.matches(".js-pinned-items-reorder-container h2"),
			sort: el => initSortList(
				el,
				// org li, own repos li
				$$(".js-pinned-items-reorder-list li, #choose-pinned-repositories ~ ol li"),
				{ selector: "a.text-bold" }
			),
			css: {
				unsorted: [
					".js-pinned-items-reorder-container h2"
				],
				// tweaks: [
				// 	`.js-pinned-items-reorder-container h2 {
				// 		padding-left: 22px;
				// 		background-position: left center !important;
				// 	}`
				// ]
			}
		},
		// github.com/:org
		"org-repos": {
			setup: () => {
				const form = $("form[data-autosearch-results-container='org-repositories']");
				if (form) {
					form.parentElement.classList.add("ghsc-org-repos-header");
				}
			},
			check: el => el.matches(".ghsc-org-repos-header"),
			sort: el => initSortList(
				el,
				$$(".org-repos li"),
				{ selector: "a[itemprop*='name']" }
			),
			css: {
				unsorted: [
					".ghsc-org-repos-header"
				],
				tweaks: [
					`form[data-autosearch-results-container='org-repositories'] {
						cursor: default;
					}`
				]
			}
		},
		// github.com/orgs/:org/people
		// github.com/orgs/:org/outside-collaborators
		// github.com/orgs/:org/teams
		// github.com/orgs/:org/teams/:team/teams
		// github.com/orgs/:org/teams/:team/repositories
		"org-people+teams": {
			check: el => el.matches(".org-toolbar"),
			sort: el => {
				const lists = [
					"#org-members-table li",
					"#org-outside-collaborators li",
					"#org-teams li", // for :org/teams & :org/teams/:team/teams
					"#org-team-repositories li"
				].join(",");
				// Using a[id] returns a (possibly) truncated full name instead of
				// the GitHub handle
				initSortList(el, $$(lists), { selector: "a[id], a.f4" });
			},
			css: {
				unsorted: [
					".org-toolbar"
				]
			}
		},
		// github.com/orgs/:org/teams/:team/members
		"team-members": {
			// no ".org-toolbar" on this page :(
			setup: () => {
				const form = $("form[data-autosearch-results-container='team-members']");
				if (form) {
					form.parentElement.classList.add("ghsc-team-members-header");
				}
			},
			check: el => el.matches(".ghsc-team-members-header"),
			sort: el => initSortList(el, $$("#team-members li")),
			css: {
				unsorted: [
					".ghsc-team-members-header"
				]
			}
		},
		// github.com/orgs/:org/projects
		"org-projects": {
			setup: () => {
				const form = $("form[action$='/projects']");
				if (form) {
					form.parentElement.classList.add("ghsc-project-header");
				}
			},
			check: el => el.matches(".ghsc-project-header"),
			sort: el => initSortList(
				el,
				$$("#projects-results > div"),
				{ selector: "h4 a" }
			),
			css: {
				unsorted: [
					".ghsc-project-header"
				]
			}
		},
		// github.com/:user?tab=repositories
		"user-repos": {
			setup: () => {
				const form = $("form[data-autosearch-results-container='user-repositories-list']");
				if (form) {
					form.parentElement.classList.add("ghsc-repos-header");
				}
			},
			check: el => el.matches(".ghsc-repos-header"),
			sort: el => initSortList(
				el,
				$$("#user-repositories-list li"),
				{ selector: "a[itemprop*='name']" }
			),
			css: {
				unsorted: [
					".ghsc-repos-header"
				],
				tweaks: [
					`form[data-autosearch-results-container='user-repositories-list'] {
						cursor: default;
					}`
				]
			}
		},
		// github.com/:user?tab=stars
		"user-stars": {
			setup: () => {
				const form = $("form[action$='?tab=stars']");
				if (form) {
					// filter form is wrapped in a details/summary
					const details = form.closest("details");
					if (details) {
						details.parentElement.classList.add("ghsc-stars-header");
						details.parentElement.title = "Sort list by repo name";
					}
				}
			},
			check: el => el.matches(".ghsc-stars-header"),
			sort: el => {
				const wrap = el.parentElement;
				const list = $$(".d-block", wrap);
				list.forEach(elm => {
					const a = $("h3 a", elm);
					a.dataset.text = a.textContent.split("/")[1];
				});
				initSortList(el, list, { selector: "h3 a", attr: "data-text" });
				movePaginate(wrap);
			},
			css: {
				unsorted: [
					".ghsc-stars-header"
				],
				tweaks: [
					`.ghsc-stars-header {
						background-position: left top !important;
					}`
				]
			}
		},
		// github.com/:user?tab=follow(ers|ing)
		"user-tab-follow": {
			setup: () => {
				const tab = $("a[href*='?tab=follow'].selected");
				if (tab) {
					tab.parentElement.parentElement.classList.add("ghsc-follow-nav");
				}
			},
			check: (el, loc) => loc.search.indexOf("tab=follow") > -1 &&
				el.matches(".ghsc-follow-nav"),
			sort: el => {
				const wrap = el.parentElement;
				initSortList(
					el,
					$$(".position-relative .d-table", wrap),
					{ selector: ".col-9 a" }
				);
				movePaginate(wrap);
			},
			css: {
				unsorted: [
					"div.ghsc-follow-nav"
				]
			}
		},
		// github.com/:user/follow(ers|ing)
		// github.com/:user/follow(ers|ing)/you_know
		"user-follow": {
			setup: loc => {
				if (loc.href.indexOf("/follow") > -1) {
					const list = $(".follow-list");
					const wrap = list && list.closest(".container");
					if (wrap) {
						$("h2", wrap).classList.add("ghsc-follow-header");
					}
				}
			},
			check: el => el.matches(".ghsc-follow-header"),
			sort: el => initSortList(
				el,
				$$(".follow-list li"),
				{ selector: ".follow-list-name span", attr: "title" }
			),
			css: {
				unsorted: [
					".ghsc-follow-header"
				]
			}
		},
		// github.com/watching (watching table only)
		"user-watch": {
			setup: loc => {
				if (loc.href.indexOf("/watching") > -1) {
					const header = $(".tabnav");
					header.classList.add("ghsc-watching-header");
					header.title = "Sort list by repo name";
				}
			},
			check: el => el.matches(".ghsc-watching-header"),
			sort: el => {
				const list = $$(".standalone.repo-list li");
				list.forEach(elm => {
					const link = $("a", elm);
					link.dataset.sort = link.title.split("/")[1];
				});
				initSortList(el, list, { selector: "a", attr: "data-sort" });
			},
			css: {
				unsorted: [
					".ghsc-watching-header"
				]
			}
		},
		// github.com/(:user|:org)/:repo/(stargazers|watchers)
		"repo-stars-or-watchers": {
			setup: loc => {
				if (
					loc.href.indexOf("/stargazers") > -1 ||
					loc.href.indexOf("/watchers") > -1
				) {
					$("#repos > h2").classList.add("ghsc-gazer-header");
				}
			},
			check: el => el.matches(".ghsc-gazer-header"),
			sort: el => initSortList(
				el,
				$$(".follow-list-item"),
				{ selector: ".follow-list-name" }
			),
			css: {
				unsorted: [
					".ghsc-gazer-header"
				]
			}
		}
	};

	const sorts = ["asc", "desc"];

	const icons = {
		unsorted: color => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="${color}">
			<path d="M15 8H1l7-8zm0 1H1l7 7z" opacity=".2"/>
		</svg>`,
		asc: color => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="${color}">
			<path d="M15 8H1l7-8z"/>
			<path d="M15 9H1l7 7z" opacity=".2"/>
		</svg>`,
		desc: color => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="${color}">
			<path d="M15 8H1l7-8z" opacity=".2"/>
			<path d="M15 9H1l7 7z"/>
		</svg>`
	};

	function getIcon(type, color) {
		return "data:image/svg+xml;charset=UTF-8," +
			encodeURIComponent(icons[type](color));
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
			const brightest = Math.max(...colors);
			// return true if we have a dark background
			return brightest < 128;
		}
		// fallback to bright background
		return false;
	}

	function addRepoFileThead() {
		const $table = $("table.files");
		if ($table) {
			// GitHub now adds an invisible thead (for screen readers)
			if (!$("thead", $table)) {
				$table.prepend(document.createElement("thead"));
			}
			$("thead", $table).innerHTML = `<tr class="ghsc-header">
				<td></td>
				<th>Content</th>
				<th>Message</th>
				<th class="ghsc-age">Age</th>
			</tr>`;
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

	function initSortList(header, list, opts = {}) {
		if (list) {
			removeSelection();
			const dir = header.classList.contains(sorts[0]) ? sorts[1] : sorts[0];
			const options = {
				order: dir,
				natural: true,
				place: "first", // Fixes nested ajax of main feed
				...opts
			};
			tinysort(list, options);
			header.classList.remove(...sorts);
			header.classList.add(dir);
		}
	}

	function getCss(type) {
		return Object.keys(sortables).reduce((acc, block) => {
			const css = sortables[block].css || {};
			const selectors = css[type];
			if (selectors) {
				acc.push(...selectors);
			} else if (type !== "unsorted" && type !== "tweaks") {
				const useUnsorted = css.unsorted || [];
				if (useUnsorted.length) {
					// if "asc" or "desc" isn't defined, then append that class to the
					// unsorted value
					acc.push(`${useUnsorted.join(`.${type},`)}.${type}`);
				}
			}
			return acc;
		}, []).join(type === "tweaks" ? "" : ",");
	}

	// The paginate block is a sibling along with the items in the list...
	// it needs to be moved to the end
	function movePaginate(wrapper) {
		const pager = wrapper &&
			$(".paginate-container, .ajax-pagination-form", wrapper);
		if (pager) {
			wrapper.append(pager);
		}
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

	function update() {
		Object.keys(sortables).forEach(item => {
			if (sortables[item].setup) {
				sortables[item].setup(window.location);
			}
		});
	}

	function init() {
		const color = needDarkTheme() ? "#ddd" : "#222";

		GM.addStyle(`
			/* Added table header */
			tr.ghsc-header th, tr.ghsc-header td {
				border-bottom: #eee 1px solid;
				padding: 2px 2px 2px 10px;
			}
			/* sort icons */
			${getCss("unsorted")} {
				cursor: pointer;
				padding-left: 22px !important;
				background-image: url(${getIcon("unsorted", color)}) !important;
				background-repeat: no-repeat !important;
				background-position: left center !important;
			}
			${getCss("asc")} {
				background-image: url(${getIcon("asc", color)}) !important;
				background-repeat: no-repeat !important;
			}
			${getCss("desc")} {
				background-image: url(${getIcon("desc", color)}) !important;
				background-repeat: no-repeat !important;
			}
			/* specific tweaks */
			${getCss("tweaks")}`
		);

		document.body.addEventListener("click", event => {
			const target = event.target;
			if (target && target.nodeType === 1) {
				Object.keys(sortables).some(item => {
					const el = sortables[item].check(target, window.location);
					if (el) {
						sortables[item].sort(el instanceof HTMLElement ? el : target);
						event.preventDefault();
						return true;
					}
					return false;
				});
			}
		});
		update();
	}

	document.addEventListener("ghmo:container", () => update());
	init();
})();
