// ==UserScript==
// @name        GitHub Sort Content
// @version     3.1.0
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
// @require     https://cdnjs.cloudflare.com/ajax/libs/tinysort/3.2.5/tinysort.min.js
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
	 * watching - https://github.com/watching
	 * User subscriptions - https://github.com/notifications/subscriptions
	 * Repo stargazers - https://github.com/:user/:repo/stargazers
	 * Repo watchers - https://github.com/:user/:repo/watchers
	 */
	/**
	 * sortables[entry].setup - exec on userscript init (optional);
	 *  param = window.location
	 * sortables[entry].check - exec on doc.body click; return truthy/falsy or
	 *  header element (passed to the sort);
	 *  param = (event.target, window.location)
	 * sortables[entry].sort - exec if check returns true or a header element;
	 *  param = (el) - the element returned by check or original click target
	 * sortables[entry].css - specific css as an array of selectors, applied to
	 *  the entry elements; "unsorted", "ascending" (optional),
	 *  "descending" (optional), "tweaks" (optional)
	 */
	const sortables = {
		// markdown tables
		"tables": {
			check: el => el.nodeName === "TH" &&
				el.matches(".markdown-body table thead th"),
			sort: el => initSortTable(el),
			css: {
				unsorted: [
					".markdown-body table thead th",
					".markdown-body table.csv-data thead th"
				],
				tweaks: [
					`body .markdown-body table thead th {
						text-align: left;
						background-position: 3px center !important;
					}`
				]
			}
		},
		// repo files
		"repo-files": {
			check: el => el.classList.contains("ghsc-header-cell"),
			// init after a short delay to allow rendering of file list
			setup: () => setTimeout(() => addRepoFileHeader(), 1e3),
			sort: el => initSortFiles(el),
			css: {
				unsorted: [
					".ghsc-header-cell"
				],
				tweaks: [
					`body .ghsc-header-cell {
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
				]
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
			setup: loc => {
				if (loc.search.includes("tab=follow")) {
					const tab = $("nav.UnderlineNav-body");
					if (tab) {
						tab.classList.add("ghsc-follow-nav");
					}
				}
			},
			check: (el, loc) => loc.search.indexOf("tab=follow") > -1 &&
				el.matches(".ghsc-follow-nav"),
			sort: el => {
				initSortList(
					el,
					$$(".position-relative .d-table"),
					{ selector: ".col-9 .link-gray" } // GitHub user name
				);
				movePaginate(wrap);
			},
			css: {
				unsorted: [
					"nav.ghsc-follow-nav"
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
		// github.com/notifications/subscriptions
		"user-subscriptions": {
			setup: loc => {
				if (loc.href.indexOf("/subscriptions") > -1) {
					const header = $(".tabnav");
					header.classList.add("ghsc-subs-header");
					header.title = "Sort list by repo name plus issue title";
				}
			},
			check: el => el.matches(".ghsc-subs-header"),
			sort: el => {
				const list = $$("li.notification-thread-subscription");
				initSortList(el, list, { selector: ".flex-auto" });
			},
			css: {
				unsorted: [
					".ghsc-subs-header"
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
		ascending: color => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="${color}">
			<path d="M15 8H1l7-8z"/>
			<path d="M15 9H1l7 7z" opacity=".2"/>
		</svg>`,
		descending: color => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="${color}">
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

	function getDirection(el) {
		return (el.getAttribute("aria-sort") || "").includes(sorts[0])
			? sorts[1]
			: sorts[0];
	}

	function setDirection(els, currentElm, dir) {
		els.forEach(elm => {
			// aria-sort uses "ascending", "descending" or "none"
			const cellDir = currentElm === elm ? `${dir}ending` : "none";
			elm.setAttribute("aria-sort", cellDir);
		});
	}

	function initSortTable(el) {
		removeSelection();
		const dir = getDirection(el);
		const table = el.closest("table");
		const options = {
			order: dir,
			natural: true,
			selector: `td:nth-child(${el.cellIndex + 1})`
		};
		tinysort($$("tbody tr", table), options);
		setDirection($$("th", table), el, dir);
	}

	function addRepoFileHeader() {
		const $header = $("#files");
		// h2#files is a sibling of the grid wrapper
		const $target = $("div[role='grid'] .sr-only", $header.parentElement);
		if ($header && $target) {
			$target.className = "Box-row Box-row--focus-gray py-2 d-flex position-relative js-navigation-item ghsc-header";
			$target.innerHTML = `
				<div role="gridcell" class="mr-3 flex-shrink-0" style="width: 16px;"></div>
				<div role="columnheader" aria-sort="none" data-index="2" class="flex-auto min-width-0 col-md-2 mr-3 ghsc-header-cell">
					Content
				</div>
				<div role="columnheader" aria-sort="none" data-index="3" class="flex-auto min-width-0 d-none d-md-block col-5 mr-3 ghsc-header-cell">
					Message
				</div>
				<div role="columnheader" aria-sort="none" data-index="4" class="text-gray-light ghsc-age ghsc-header-cell" style="width:100px;">
					Age&nbsp;
				</div>
			`;
		}
	}

	function initSortFiles(el) {
		removeSelection();
		const dir = getDirection(el);
		const grid = el.closest("[role='grid']");
		const options = {
			order: dir,
			natural: true,
			selector: `div:nth-child(${el.dataset.index})`
		};
		if (el.classList.contains("ghsc-age")) {
			// sort repo age column using ISO 8601 datetime format
			options.selector += " [datetime]";
			options.attr = "datetime";
		}
		// check for parent directory link; don't sort it
		const parentDir = $("a[title*='parent dir']", grid);
		if (parentDir) {
			parentDir.closest("div[role='row']").classList.add("ghsc-header");
		}
		tinysort($$(".Box-row:not(.ghsc-header)", grid), options);
		setDirection($$(".ghsc-header-cell", grid), el, dir);
	}

	function initSortList(header, list, opts = {}) {
		if (list) {
			removeSelection();
			const dir = getDirection(header);
			const options = {
				order: dir,
				natural: true,
				place: "first", // Fixes nested ajax of main feed
				...opts
			};
			tinysort(list, options);
			setDirection([header], header, dir);
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
					// if "ascending" or "descending" isn't defined, then append
					// that class to the unsorted value
					acc.push(
						`${useUnsorted.join(`[aria-sort='${type}'],`)}[aria-sort='${type}']`
					);
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
			${getCss("ascending")} {
				background-image: url(${getIcon("ascending", color)}) !important;
				background-repeat: no-repeat !important;
			}
			${getCss("descending")} {
				background-image: url(${getIcon("descending", color)}) !important;
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
