// ==UserScript==
// @name        GitHub Issue Counts
// @version     3.0.17
// @description A userscript that adds a repo issues count to the repository tab & organization page (https://github.com/:user)
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_xmlhttpRequest
// @connect     api.github.com
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-issue-counts.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-issue-counts.user.js
// ==/UserScript==
(() => {
	"use strict";

	// issue count = get all repos from user => api v3
	// https://api.github.com/users/:user/repos
	// then look for "open_issues_count" in the named repos
	const api = "https://api.github.com/users",
		// bug icon
		icon = `<svg class="octicon octicon-repo-issues" xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 53 53">
				<path d="m39.2 0c2 0 3.7 1.5 3.7 3.4 0 1.9-1.7 3.4-3.7 3.4l-0.9-0.1-3.4 4c2.3 1.6 4.4 3.8 6 6.4-4 1.2-8.9 1.9-14.2 1.9-5.3 0-10.1-0.7-14.2-1.9 1.5-2.6 3.5-4.7 5.7-6.3l-3.5-4.1c-0.2 0-0.4 0.1-0.6 0.1-2 0-3.7-1.5-3.7-3.4 0-1.9 1.7-3.4 3.7-3.4 2 0 3.7 1.5 3.7 3.4 0 0.7-0.2 1.3-0.6 1.8l3.5 4.2c1.8-0.8 3.8-1.3 5.9-1.3 2 0 3.9 0.4 5.6 1.2l3.7-4.3c-0.3-0.5-0.4-1-0.4-1.6 0-1.9 1.6-3.4 3.7-3.4zm11.8 28.5c1.2 0 2.2 0.9 2.2 2 0 1.1-1 2-2.2 2l-6.7 0c-0.1 1.5-0.3 2.9-0.6 4.3l7.8 3.4c1.1 0.5 1.6 1.7 1.1 2.7-0.5 1-1.8 1.5-2.9 1l-7.2-3.1c-2.7 6.7-8 11.4-14.3 12.1l0-31.2c5.2-0.1 10-1 13.9-2.3l0.3 0.7 7.5-2.7c1.1-0.4 2.4 0.1 2.9 1.2 0.4 1.1-0.1 2.2-1.3 2.6l-7.9 2.8c0.3 1.4 0.6 2.9 0.7 4.5l6.7 0 0 0zm-48.7 0 6.7 0c0.1-1.5 0.3-3.1 0.7-4.5l-7.9-2.8c-1.1-0.4-1.7-1.6-1.3-2.6 0.4-1 1.7-1.6 2.9-1.2l7.5 2.7 0.3-0.7c3.9 1.3 8.7 2.1 13.9 2.3l0 31.2c-6.2-0.7-11.5-5.4-14.3-12.1l-7.2 3.1c-1.1 0.5-2.4 0-2.9-1-0.5-1 0-2.2 1.1-2.7l7.8-3.4c-0.3-1.4-0.5-2.8-0.6-4.3l-6.7 0c-1.2 0-2.2-0.9-2.2-2 0-1.1 1-2 2.2-2z" />
			</svg>`,

		repoSelectors = `
			#user-repositories-list li,
			#org-repositories li,
			ol.pinned-repos-list li
		`;

	// add bug image styling
	GM_addStyle(`
		.repo-list-stats a.issues svg {
			position: relative;
			top: 2px;
			fill: #888;
		}
		.repo-list-stats a.issues:hover svg {
			fill: #4078C0;
		}
	`);

	/*
	 * Org repos
	 *   container = div#org-repositories > div > div.org-repos.repo-list > li
	 * User repos
	 *   container = div#user-repositories-list > div.js-repo-list > li
	 * Common org/user
	 *   repo url = container h3 a (first a)
	 *   issue link location = container div[3] a[last]:after
	 *   fork link HTML - both user/org (Dec 2016)
	 *     <a class="muted-link tooltipped tooltipped-s mr-3" href="/:user/:repo/network" aria-label="Forks">
	 *       <svg class="octicon octicon-repo-forked">...</svg> :fork-count
	 *     </a>
	 *
	 * Pinned repos
	 *   container = ol.pinned-repos-list li.pinned-repo-item
	 *   repo url = container span span a (first a)
	 *   issue link location = container > span.pinned-repo-item-content p[last] a[last]:after
	 *   fork link HTML
	 *     <a href="/:user/:repo/network" class="pinned-repo-meta muted-link">
	 *       <svg aria-label="forks" class="octicon octicon-repo-forked">...</svg> :fork-count
	 *     </a>
	*/
	function addLinks(data, repos) {
		repos.forEach(repo => {
			let wrapper, el, html, setClass;
			const url = ($("a", repo).getAttribute("href") || "").slice(1),
				result = url && data.find(item => {
					return item.full_name === url;
				});
			// pinned
			if (repo.classList.contains("pinned-repo-item")) {
				el = $$(".pinned-repo-item-content p:last-child", repo);
				setClass = "muted-link ghic2-issue-link";
			} else {
				// user/org list = last div in repo list contains links
				wrapper = $$("div", repo);
				el = wrapper && $$("a", wrapper[wrapper.length - 1]);
				setClass = "muted-link tooltipped tooltipped-s mr-3 ghic2-issue-link";
			}
			if (el) {
				if (result && typeof result.open_issues_count === "number") {
					html = `<a class="${setClass}" href="/${url}/issues" aria-label="Issues">
							${icon} ${result.open_issues_count}
						</a>`;
					// target the last "a"
					el = el[el.length - 1];
					// add after last link, sometimes there is no fork
					if (el) {
						if (el.tagName === "P") {
							wrapper = document.createElement("span");
							wrapper.className = "ghic-link pinned-repo-meta";
							el.appendChild(wrapper);
							el.querySelector(".ghic-link").innerHTML = html;
						} else {
							el.insertAdjacentHTML("afterend", html);
						}
					}
				}
			}
		});
	}

	function addIssues() {
		let user, url,
			repos = $$(repoSelectors);
		if (
			// look for user overview, user repositories & organization repo page
			repos.length &&
			// and not already applied
			!$$(".ghic2-issue-link").length
		) {
			// no issue count for non-public & forks
			repos = repos.filter(repo => {
				let list = repo.classList;
				return list.contains("public") && !list.contains("fork");
			});
			if (repos.length) {
				url = $("a", repos[ 0 ]).getAttribute("href");
				user = (url || "").match(/^\/[^/]+/);

				if (user && user.length) {
					GM_xmlhttpRequest({
						method : "GET",
						url : api + user[0] + "/repos",
						onload : response => {
							const data = JSON.parse(response.responseText || "null");
							if (data) {
								addLinks(data, repos);
							}
						}
					});
				}
			}
		}
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	function $$(str, el) {
		return Array.from((el || document).querySelectorAll(str));
	}

	document.addEventListener("ghmo:container", addIssues);
	addIssues();

})();
