// ==UserScript==
// @name          GitHub Show Repo Issues
// @version       2.3.2
// @description   A userscript that adds a repo issues count to the repository tab & organization page (https://github.com/:user)
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @grant         GM_addStyle
// @grant         GM_xmlhttpRequest
// @connect       api.github.com
// @run-at        document-idle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-issue-counts.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-issue-counts.user.js
// ==/UserScript==
/* global GM_addStyle, GM_xmlhttpRequest */
(function() {
	"use strict";
	var busy = false,

	addIssues = function() {

		// look for repo tab or user/organization page
		if (document.querySelectorAll(".tabnav-tab.selected, .repo-list").length &&
			// no stargazer/fork items on https://github.com/stars
			document.querySelectorAll("a.repo-list-stat-item").length &&
			// and not already applied
			!document.querySelectorAll(".repo-list-stat-item.issues").length) {

			// set busy flag to ignore mutation observer firing while adding new content
			busy = true;

			// Does not include forks & only includes the first 10 repos, or first 20 on the
			// organization page - these are the repos showing the participation graphs
			var user, len, url,
				items = document.querySelectorAll(".repo-list-item"),

				// bug icon
				icon = "<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 53 53'><path d='m39.2 0c2 0 3.7 1.5 3.7 3.4 0 1.9-1.7 3.4-3.7 3.4l-0.9-0.1-3.4 4c2.3 1.6 4.4 3.8 6 6.4-4 1.2-8.9 1.9-14.2 1.9-5.3 0-10.1-0.7-14.2-1.9 1.5-2.6 3.5-4.7 5.7-6.3l-3.5-4.1c-0.2 0-0.4 0.1-0.6 0.1-2 0-3.7-1.5-3.7-3.4 0-1.9 1.7-3.4 3.7-3.4 2 0 3.7 1.5 3.7 3.4 0 0.7-0.2 1.3-0.6 1.8l3.5 4.2c1.8-0.8 3.8-1.3 5.9-1.3 2 0 3.9 0.4 5.6 1.2l3.7-4.3c-0.3-0.5-0.4-1-0.4-1.6 0-1.9 1.6-3.4 3.7-3.4zm11.8 28.5c1.2 0 2.2 0.9 2.2 2 0 1.1-1 2-2.2 2l-6.7 0c-0.1 1.5-0.3 2.9-0.6 4.3l7.8 3.4c1.1 0.5 1.6 1.7 1.1 2.7-0.5 1-1.8 1.5-2.9 1l-7.2-3.1c-2.7 6.7-8 11.4-14.3 12.1l0-31.2c5.2-0.1 10-1 13.9-2.3l0.3 0.7 7.5-2.7c1.1-0.4 2.4 0.1 2.9 1.2 0.4 1.1-0.1 2.2-1.3 2.6l-7.9 2.8c0.3 1.4 0.6 2.9 0.7 4.5l6.7 0 0 0zm-48.7 0 6.7 0c0.1-1.5 0.3-3.1 0.7-4.5l-7.9-2.8c-1.1-0.4-1.7-1.6-1.3-2.6 0.4-1 1.7-1.6 2.9-1.2l7.5 2.7 0.3-0.7c3.9 1.3 8.7 2.1 13.9 2.3l0 31.2c-6.2-0.7-11.5-5.4-14.3-12.1l-7.2 3.1c-1.1 0.5-2.4 0-2.9-1-0.5-1 0-2.2 1.1-2.7l7.8-3.4c-0.3-1.4-0.5-2.8-0.6-4.3l-6.7 0c-1.2 0-2.2-0.9-2.2-2 0-1.1 1-2 2.2-2z' /></svg>",

				// issue count = get all repos from user => api v3 - https://api.github.com/users/:user/repos,
				// then look for "open_issues_count" in the named repos
				// previsouly used https://api.github.com/repos/:user/:repo/issues?state=open (first 30 issues only)
				api = "https://api.github.com/users";

			items = Array.prototype.filter.call(items, function(item) {
				var cl = item.classList;
				return cl.contains("public") && !cl.contains("fork");
			});
			len = items.length;

			// expecting fork link to look like this:
			// <a class="repo-list-stat-item tooltipped tooltipped-s" href="/:user/:repo/network" aria-label="Forks">
			//   <span class="octicon octicon-git-branch"></span> 1
			// </a>
			url = len ? items[ 0 ].querySelector("a.repo-list-stat-item[aria-label='Forks']").getAttribute("href") : "";
			user = (url || "").match(/^\/[^/]+/);

			if (user && user.length) {

				// add bug image background
				GM_addStyle([
					".repo-list-stats a.issues svg { position: relative; top: 2px; fill: #888; }",
					".repo-list-stats a.issues:hover svg { fill: #4078C0; }"
				].join(""));

				GM_xmlhttpRequest({
					method : "GET",
					url : api + user[ 0 ] + "/repos",
					onload : function(response) {
						var itemIndex, repoIndex, repoLen, repo, link,
							data = JSON.parse(response.responseText || "null");

						if (data) {
							repoLen = data.length;
							for (itemIndex = 0; itemIndex < len; itemIndex++) {
								link = items[ itemIndex ].querySelector("a.repo-list-stat-item[aria-label='Forks']");
								repo = (link.getAttribute("href") || "").replace("/network", "").slice(1);

								for (repoIndex = 0; repoIndex < repoLen; repoIndex++) {
									if (repo === data[ repoIndex ].full_name) {
										link.insertAdjacentHTML("afterend",
											"<a class='repo-list-stat-item tooltipped tooltipped-s issues' href='" + repo +
											"/issues' aria-label='Issues'>" + icon + " " + data[ repoIndex ].open_issues_count + "</a>"
										);
									}
								}

							}
						}
						busy = false;
					}
				});

			} else {
				busy = false;
			}
		} else {
			busy = false;
		}
	},

	containers = "#js-repo-pjax-container, #js-pjax-container, .js-contribution-activity",
	targets = document.querySelectorAll(containers);

	Array.prototype.forEach.call(targets, function(target) {
		new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				// preform checks before addIssues to minimize function calls
				if (!(busy || document.querySelectorAll(".repo-list-stat-item.issues").length) &&
					document.querySelectorAll(".tabnav-tab.selected, .repo-list").length &&
					mutation.target === target) {
					addIssues();
				}
			});
		}).observe(target, {
			childList: true,
			subtree: true
		});
	});

	addIssues();

})();
