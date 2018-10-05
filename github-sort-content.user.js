// ==UserScript==
// @name        GitHub Sort Content
// @version     2.0.1
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
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=634242
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-content.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-sort-content.user.js
// ==/UserScript==
(() => {
	"use strict";
	/** Example pages:
	 * Tables (Readme & wikis) - https://github.com/Mottie/GitHub-userscripts
	 * Repo files - https://github.com/Mottie/GitHub-userscripts (sort content, message or age)
	 * Your Repos & Your Teams - https://github.com/
	 * Pinned repos (org & user)- https://github.com/:org
	 * Organization repos - https://github.com/:org
	 * Organization people - https://github.com/orgs/:org/people
	 * Organization outside collaborators (own orgs) - https://github.com/orgs/:org/outside-collaborators
	 * Organization teams - https://github.com/orgs/:org/teams
	 * Repo stargazers - https://github.com/:user/:repo/stargazers
	 * Repo watchers - https://github.com/:user/:repo/watchers
	 * User repos - https://github.com/:user?tab=repositories
	 * User stars - https://github.com/:user?tab=stars
	 * User Followers - https://github.com/:user?tab=followers & https://github.com/:user/followers(/you_know)
	 * User Following - https://github.com/:user?tab=following & https://github.com/:user/following(/you_know)
	 * watching - https://github.com/watching
	*/
	/**
	 * sortables[entry].setup - exec on userscript init (optional)
	 * sortables[entry].check - exec on doc.body click; return truthy/falsy or
	 *  header element (passed to the sort)
	 * sortables[entry].sort - exec if check returns true or a header element;
	 *  el param is the element returned by check or original click target
	 */
	const sortables = {
		// markdown tables
		"tables": {
			// init after a short delay to allow rendering of file list
			setup: () => setTimeout(() => addRepoFileThead(), 200),
			check: el => el.nodeName === "TH" &&
				el.matches(".markdown-body table thead th, table.files thead th"),
			sort: el => initSortTable(el)
		},
		// https://github.com (repo list & teams list)
		"feed": {
			check: el => el.classList.contains("Box-title") &&
				el.closest(".Box.js-repos-container"),
			sort: el => initSortUl(el, $$(".Box-body li", el.closest(".Box")))
		},
		// https://github.com/orgs/:org/dashboard (repo list)
		"org-feed": {
			check: el => el.classList.contains("Box-title") &&
				el.closest("#org_your_repos.js-repos-container"),
			sort: el => initSortUl(el, $$(".boxed-group-inner li", el))
		},
		// https://github.com/(:user|:org) (pinned repos)
		"pinned": {
			check: el => $(".js-pinned-repos-reorder-container") &&
				el.matches(".org-profile.js-pinned-repos-reorder-container h2, .user-profile-nav"),
			sort: el => initSortUl(el, $(".pinned-repos-list").children)
		},
		// https://github.com/:org
		"org-repos": {
			check: el => {
				// Org repos have weirdly nested forms if there are pinned repos
				let wrap = false;
				if ($(".org-repos.repo-list") && el.matches(".TableObject, .TableObject-item")) {
					wrap = el.closest("form[data-pjax='#org-repositories']");
					if (wrap) {
						wrap = wrap.parentNode;
					} else {
						wrap = el;
					}
					return wrap && wrap.classList.contains("TableObject") ? wrap : false;
				}
				return wrap;
			},
			sort: el => {
				const list = $(".org-repos.repo-list");
				initSortUl(el, list.children);
				movePaginate(list);
			}
		},
		// https://github.com/orgs/:org/people
		"org-people": {
			setup: () => checkOwnOrg(),
			check: (el, loc) => loc.href.indexOf("/people") > -1 &&
				$("#org-members-table") && el.matches(".org-toolbar.ghsc-org-people"),
			sort: el => initSortUl(el, $$("#org-members-table li"), ".member-info a")
		},
		// https://github.com/orgs/:org/outside-collaborators (own org)
		"org-collab-own": {
			check: (el, loc) => loc.href.indexOf("/outside-collaborators") > -1 &&
				$("#org-outside-collaborators") && el.matches(".org-toolbar.ghsc-org-outside_collaborators"),
			sort: el => initSortUl(el, $$("#org-outside-collaborators li"), ".member-info a")
		},
		// https://github.com/orgs/:org/teams
		"org-teams": {
			check: el => $("#org-teams") && el.matches(".ghsc-org-teams.subnav.org-toolbar"),
			sort: el => initSortUl(el, $$("#org-teams li"), ".team-name")
		},
		// https://github.com/:user?tab=repositories
		"user-repos": {
			check: (el, loc) => loc.search.indexOf("tab=repositories") > -1 &&
				el.classList.contains("user-profile-nav"),
			sort: el => initSortUl(el, $$("#user-repositories-list li"))
		},
		// https://github.com/:user?tab=stars
		"user-stars": {
			check: (el, loc) => loc.search.indexOf("tab=stars") > -1 &&
				el.classList.contains("user-profile-nav"),
			sort: el => {
				const list = $(".TableObject").parentNode;
				initSortUl(el, $$(".col-12", list), "h3 a");
				movePaginate(list);
			}
		},
		// https://github.com/:user?tab=follow(ers|ing)
		"user-tab-follow": {
			check: (el, loc) => loc.search.indexOf("tab=follow") > -1 &&
				el.classList.contains("user-profile-nav"),
			sort: el => {
				const list = $(".table-fixed").parentNode;
				initSortUl(el, $$(".col-12", list), ".col-9 a.no-underline");
				movePaginate(list);
			}
		},
		// https://github.com/:user/follow(ers|ing)
		// https://github.com/:user/follow(ers|ing)/you_know
		"user-follow": {
			setup: () => {
				if (window.location.href.indexOf("/follow") > -1) {
					const repo = $(".userrepos, .follow-list");
					const wrap = repo && repo.closest(".container");
					if (wrap) {
						$("h2", wrap).classList.add("ghsc-header");
						repo.classList.add("ghsc-active");
					}
				}
			},
			check: el => $(".userrepos.ghsc-active, .follow-list.ghsc-active") && el.matches("h2.ghsc-header"),
			sort: el => initSortUl(el, $$(".userrepos li, .follow-list li"), ".follow-list-name")
		},
		// https://github.com/watching
		"user-watch": {
			check: (el, loc) => loc.href.indexOf("/watching") > -1 &&
				el.matches(".subscriptions-content .Box-header h3, .subscriptions-content .Box-header .text-right"),
			sort: el => initSortUl(el.closest(".Box-header"), $$(".standalone.repo-list li"))
		},
		// https://github.com/:user/repo/(stargazers|watchers)
		"repo-stars-or-watchers": {
			check: (el, loc) => (loc.href.indexOf("/stargazers") > -1 ||
				loc.href.indexOf("/watchers") > -1) &&
				$(".follow-list") && el.matches("#repos > h2"),
			sort: el => initSortUl(el, $$(".follow-list-item"), ".follow-list-name")
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
		return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(icons[type](color));
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
		if (list) {
			removeSelection();
			const dir = arrows.classList.contains(sorts[0]) ? sorts[1] : sorts[0],
				options = {
					order: dir,
					natural: true
				};
			if (selector) {
				options.selector = selector;
			}
			tinysort(list, options);
			arrows.classList.remove(...sorts);
			arrows.classList.add(dir);
		}
	}

	function getFixedHeader() {
		// Is https://github.com/StylishThemes/GitHub-FixedHeader active?
		const header = window.getComputedStyle($(".Header"));
		const height = header.position === "fixed" && parseInt(header.height, 10);
		// Adjust sort arrow position
		return height ?
			`.user-profile-nav.js-sticky.is-stuck {
				background-position:calc(100% - 5px) ${height + 20}px !important;
			}` : "";
	}

	// The paginate block is a sibling along with the items in the list...
	// it needs to be moved to the end
	function movePaginate(list) {
		list.appendChild($(".paginate-container", list));
	}

	// Own organization repo has admin stuff, so the layout needs to be
	// adjusted slightly
	function checkOwnOrg() {
		// div[data-bulk-actions-url$="people/toolbar_actions"] .subnav.org-toolbar
		const el = $(".subnav.org-toolbar");
		const wrapper = el && el.closest("div[data-bulk-actions-url]");
		if (wrapper) {
			// "/orgs/:org/people/toolbar_actions"
			const type = wrapper.getAttribute("data-bulk-actions-url").split("/")[3]
			el.classList.add("ghsc-org", `ghsc-org-${type}`);
		}
		// Own org people
		if (
			sortables["org-people"].check(el, window.location) &&
			$(".member-list-item.adminable")
		) {
			// Own org shows an admin table
			el.classList.add("ghsc-own-org");
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
				sortables[item].setup();
			}
		});
	}

	function init() {
		const color = needDarkTheme() ? "#ddd" : "#222";
		const userSortPosition = getFixedHeader();

		GM.addStyle(`
			tr.ghsc-header th, tr.ghsc-header td {
				border-bottom: #eee 1px solid;
				padding: 2px 2px 2px 10px;
			}
			/* unsorted icon */
			.markdown-body table thead th, table.files thead th {
				cursor: pointer;
				padding-right: 22px !important;
				background-image: url(${getIcon("unsorted", color)}) !important;
				background-repeat: no-repeat !important;
				background-position: calc(100% - 5px) center !important;
				text-align: left;
			}
			.js-repos-container h3.Box-title,
			#org_your_repos h3.Box-title,
			.org-profile .TableObject:first-child,
			.ghsc-org.subnav.org-toolbar,
			.user-profile-nav.js-sticky,
			.user-profile-nav.js-sticky.is-stuck,
			.org-profile.js-pinned-repos-reorder-container h2,
			.subscriptions-content .Box-header .text-right,
			#repos > h2,
			h2.ghsc-header {
				cursor:pointer;
				background-image: url(${getIcon("unsorted", color)}) !important;
				background-repeat: no-repeat !important;
				background-position: calc(100% - 5px) center !important;
			}
			/* https://github.com/ -> your repositories */
			.dashboard-sidebar .js-repos-container h3 {
				background-position: 115px 5px !important;
			}
			/* https://github.com/ -> your teams */
			.dashboard-sidebar #your_teams h3 {
				background-position: 240px 10px !important;
			}
			/* pinned repos */
			.org-profile.js-pinned-repos-reorder-container h2 {
				background-position: 150px 5px !important;
			}
			/* https://github.com/:user?tab=repositories */
			.user-profile-nav.js-sticky {
				background-position: calc(100% - 5px) 22px !important;
			}
			${userSortPosition}
			/* https://github.com/:org repos */
			.org-profile > div > .TableObject {
				width: 100%; /* Fix width of org with no pinned repos */
				padding-right: 30px;
				background-position: right 10px !important;
			}
			.org-profile form + .TableObject-item .ml-6,
			.org-profile .TableObject-item .mr-6 {
				margin-left: 2px !important;
				margin-right: 2px !important;
			}
			.org-profile .TableObject {
				background-position: calc(100% - 12px) 10px !important;
			}
			/* Own org people; collaborators page doesn't need adjusting */
			.ghsc-org-people.ghsc-own-org.subnav.org-toolbar,
			.ghsc-org-teams.subnav.org-toolbar,
			#org_your_repos h3.Box-title {
				background-position: calc(100% - 135px) center !important;
			}
			/* https://github.com/watching */
			.subscriptions-content .Box-header .text-right {
				background-position: 5px 7px !important;
			}
			/* Hide "Sorted by most recently watched" text when sorted */
			.subscriptions-content .Box-header.asc .text-right > .text-small,
			.subscriptions-content .Box-header.desc .text-right > .text-small {
				display: none;
			}
			/* https://github.com/watching */
			.subscriptions-content .Box-header {
				background-position: 160px 15px !important;
			}
			/* asc/dec icons */
			table thead th.asc,
			.js-repos-container.asc .Box-title,
			#org_your_repos.asc .Box-title,
			.org-profile .TableObject.asc,
			.js-bulk-actions-container .subnav.org-toolbar.asc,
			.user-profile-nav.asc,
			.user-profile-nav.is-stuck.asc,
			.org-profile.js-pinned-repos-reorder-container h2.asc,
			.subscriptions-content .Box-header.asc .text-right,
			#repos > h2.asc,
			h2.ghsc-header.asc {
				background-image: url(${getIcon("asc", color)}) !important;
				background-repeat: no-repeat !important;
			}
			table thead th.desc,
			.js-repos-container.desc .Box-title,
			#org_your_repos.desc .Box-title,
			.org-profile .TableObject.desc,
			.js-bulk-actions-container .subnav.org-toolbar.desc,
			.user-profile-nav.desc,
			.user-profile-nav.is-stuck.desc,
			.org-profile.js-pinned-repos-reorder-container h2.desc,
			.subscriptions-content .Box-header.desc .text-right,
			#repos > h2.desc,
			h2.ghsc-header.desc {
				background-image: url(${getIcon("desc", color)}) !important;
				background-repeat: no-repeat !important;
			}
		`);

		document.body.addEventListener("click", event => {
			const target = event.target;
			const loc = window.location;
			if (target && target.nodeType === 1) {
				Object.keys(sortables).some(item => {
					const el = sortables[item].check(target, loc);
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
