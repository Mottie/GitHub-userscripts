// ==UserScript==
// @name        GitHub Search Autocomplete
// @version     1.0.2
// @description A userscript that adds autocomplete search filters to GitHub
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @require     https://code.jquery.com/jquery-3.2.1.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/Caret.js/0.3.1/jquery.caret.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/at.js/1.5.4/js/jquery.atwho.min.js
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-search-autocomplete.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-search-autocomplete.user.js
// ==/UserScript==
(($) => {
	"use strict";

	const data = {},

		// search input classes used by GitHub
		selectors = [
			".header-search-input",   // main header search
			"[aria-label*='Search']", // https://github.com/search
			".search-page-input",     // https://github.com/search/advanced
			"#js-issues-search",      // https://github.com/:user/:repo/issues & pulls
			".js-search-query"        // https://gist.github.com/search?q=css
		].join(","),

		// update examples using current & previous year
		year = new Date().getFullYear(),
		/**
		 * This data was manually extracted from the pages listed on
		 * https://help.github.com/categories/search/
		 */
		filters = {
			"AND": {
				"": "search operator (max 5 of any operator)"
			},
			// Issue
			"assignee": {
				"": "search for issues assigned to the named user",
				"fred": 'search for issues assigned to "@fred"'
			},
			// Commits & Issues
			"author": {
				"": "search for issues or commits authored by the username",
				"fred": 'search for issues or commits authored by "@fred"'
			},
			"author-date": {
				"": "search commits authored before or after a date",
				">${year-1}-12-31": "search commits authored since ${year}",
				">=${year}-01-01": "search commits authored since ${year}",
				"<${year}-01-01": "search commits authored before ${year}",
				"<=${year-1}-12-31": "search commits authored before ${year}"
			},
			"author-email": {
				"": "search for a commit authored by the specified user email",
				"fred@gmail.com": "search for commits authored by gmail fred"
			},
			"author-name": {
				"": "search for a commit created using the author's actual name",
				"smith": 'search for commits authored by someone named "smith"'
			},
			// Issues
			"base": {
				"": "search pull requests to be merged into the specified branch name",
				"gh-pages": 'search pull requests being merged into the "gh-pages" branch'
			},
			// Issues
			"closed": {
				"": "search issues & pull requests closed before or after a date",
				">${year-1}-12-31": "search issues & pull requests closed since ${year}",
				">=${year}-01-01": "search issues & pull requests closed since ${year}",
				"<${year}-01-01": "search issues & pull requests closed before ${year}",
				"<=${year-1}-12-31": "search issues & pull requests closed before ${year}"
			},
			"commenter": {
				"": "search for comments authored by the named user",
				"fred": 'search for comments authored by "@fred"'
			},
			"comments": {
				"": "search issues with specified number of comments",
				"100": "search issues with exactly 100 comments",
				">100": "search issues with >100 comments",
				">=100": "search issues with >=100 comments",
				"10..20": "search issues with 10-20 comments",
				"<100": "search issues with <100 comments",
				"<=100": "search issues with <=100 comments"
			},
			"committer": {
				"": "search for commits authored by the named user",
				"fred": 'search for commits authored by "@fred"'
			},
			"committer-date": {
				"": "search commits authored before or after a date",
				">${year-1}-12-31": "search commits authored since ${year}",
				">=${year}-01-01": "search commits authored since ${year}",
				"<${year}-01-01": "search commits authored before ${year}",
				"<=${year-1}-12-31": "search commits authored before ${year}"
			},
			"committer-email": {
				"": "search for a commit authored by the specified user email",
				"fred@gmail.com": "search for commits authored by gmail fred"
			},
			"committer-name": {
				"": "search for a commit created using the author's actual name",
				"smith": 'search for commits authored by someone named "smith"'
			},
			// Issues & user
			"created": {
				"": "search issues & user accounts created at the specified date",
				">${year-1}-12-31": "search issues & user accounts created since ${year}",
				">=${year}-01-01": "search issues & user accounts created since ${year}",
				"${year}-01-01..*": "search issues & user accounts created since ${year}",
				"${year}-01-01..${year}-01-31": "search commits authored in Jan ${year}",
				"<${year}-01-01": "search issues & user accounts created before ${year}",
				"<=${year-1}-12-31": "search issues & user accounts created before ${year}",
				"*..${year-1}-12-31": "search issues & user accounts created before ${year}"
			},
			// Code
			"extension": {
				"": "search within file extensions",
				"js": "search within JavaScript files",
				"rb": "search within Ruby files",
				"css": "search within CSS files",
				"coffee": "search within CoffeeScript files",
				"md": "search within markdown files"
			},
			"-extension": {
				"": "search excludes this file extension",
				"js": "search excludes JavaScript files",
				"rb": "search excludes Ruby files",
				"css": "search excludes CSS files",
				"coffee": "search excludes CoffeeScript files",
				"md": "search excludes markdown files"
			},
			// Code
			"filename": {
				"": "search within code files named as specified",
				"test_helper": 'search within the "test_helper" code file(s)',
				".vimrc": 'search "*.vimfc*" code files named as specified'
			},
			// User
			"followers": {
				"": "search users & organizations with the specified number of followers",
				"100": "search users with exactly 100 followers",
				">100": "search users with >100 followers",
				">=100": "search users with >=100 followers",
				"10..20": "search users with 10-20 followers",
				"<100": "search users with <100 followers",
				"<=100": "search users with <=100 followers"
			},
			// Code... includes "-fork"?
			"fork": {
				"": "searches exclude forks when this filter is undefined",
				"only": "search only within forked repos",
				"true": "search includes forked repos"
			},
			// Repos, Code
			"forks": {
				"": "search repos with greater, less, or a range of forks",
				"100": "search repos with exactly 100 forks",
				">100": "search repos with >100 forks",
				">=100": "search repos with >=100 forks",
				"10..20": "search repos with 10-20 forks",
				"<100": "search repos with <100 forks",
				"<=100": "search repos with <=100 forks"
			},
			"-forks": {
				"": "search repos outside of the selected number of forks",
				"100": "search repos with that do not have exactly 100 forks",
				">100": "search repos with <=100 forks",
				">=100": "search repos with <100 forks",
				"10..20": "search repos with <10 or >20 forks",
				"<100": "search repos with >=100 forks",
				"<=100": "search repos with >100 forks"
			},
			"fullname": {
				"": "search within a user's full name",
				"linus": 'search for users with "linus" in their full name',
				'"Linus Torvalds"': "search for a full name wrapped in quotes"
			},
			// Commits
			"hash": {
				"": "search commits with the specified SHA-1 hash",
				"124a9a0ee1d8f1e15e833aff432fbb3b02632105": "search matching hash"
			},
			// Issues
			"head": {
				"": "search pull requests opened from the specified branch name",
				"fix": 'search pull requests opened from branch names containing the word "fix"'
			},
			// Repos, Issue, User
			"in": {
				"": "search within repo, issue or user meta data",
				// Repo
				"body": "search within an issue or wiki body",
				"description": "search within the repo description",
				"file": "search within the repo file contents",
				"file,path": "search within the repo file contents & path name",
				"name": "searh within a user, organization or repo name",
				"name,description" : "search within the repo name or description",
				"path": "search within the repo path name",
				"readme": "search within the repo readme",
				// Issue & Wiki
				"comments": "search within an issue comments",
				"title": "search within an issue or wiki title",
				"title,body": "search within an issue or wiki title & body",
				// User
				"email": "search within a user or organization email (not the domain name)",
				"login": "search within a user or organization username",
				"fullname": "search within a user's full name"
			},
			"involves": {
				"": "search for issues or commits that involves the named user",
				"fred": 'search for issues or commits that involve "@fred"'
			},
			// Commits
			"is": {
				"": "search commits and issues of the specified state (multiple allowed)",
				"public": "search public commits & issues",
				"private": "search private commits & issues",
				"open": "search open issues & pull requests",
				"closed": "search closed issues & pull requests",
				"issue": "search within issues",
				"pr": "search within pull requests",
				"merged": "search merged pull requests",
				"unmerged": "search unmerged pull requests"
			},
			// Issue
			"label": {
				"": "search issues & pull requests with the specified label (multiple allowed)",
				"bug": 'search for issues & pull requests labeled "bug"',
				'"in progress"': "search for multiword labels inside quotes"
			},
			"-label": {
				"": "search issues & pull requests without the specified label",
				"bug": 'search for issues & pull requests not labeled "bug"'
			},
			// Code, Issue, Repos, User
			"language": {
				"": "search within this language",
				"javascript": "search within repos containing JavaScript",
				"php": "search within repos containing PHP",
				"scss": "search within repos containing SCSS",
				"c#": "search within repos containing C#",
				"markdown": "search within repos containing markdown (.md, .markdown, etc)",
			},
			"-language": {
				"": "search excludes this language",
				"javascript": "search excludes repos with JavaScript",
				"php": "search excludes repos with PHP",
				"scss": "search excludes repos with SCSS",
				"xml": "search excludes repos with XML",
				"markdown": "search excludes repos with markdown (.md, .markdown, etc)",
			},
			"location": {
				"": "search users within a location",
				'"San Francisco, CA"': "search users in San Francisco",
				"london": "search users in london",
				"iceland": "search users in Iceland"
			},
			"-location": {
				"": "search users not in a specific location",
				'"San Francisco, CA"': "search users not in San Francisco",
				"london": "search users not in london",
				"iceland": "search users not in Iceland"
			},
			// Issues
			"mentions": {
				"": "search for issues mentioning the named user",
				"fred": 'search for issues that mention "@fred"'
			},
			// Commits
			"merge": {
				"true": "searches that match merge commits",
				"false": "searches that match non-merge commits"
			},
			"merged": {
				"": "search pull requests merged at the specified date",
				">${year-1}-12-31": "search pull requests merged since ${year}",
				">=${year}-01-01": "search pull requests merged since ${year}",
				"<${year}-01-01": "search pull requests merged before ${year}",
				"<=${year-1}-12-31": "search pull requests merged before ${year}"
			},
			"milestone": {
				"": "search for issues & pull requests within the specified milestone",
				"sprint-42": 'search for issues & pull requests in the "sprint-42" milestone'
			},
			"no": {
				"": "search issues & pull requests missing the specified association",
				"label": "search issues & pull requests that don't have a label",
				"assignee": "search issues & pull requests that don't have an assignee",
				"milestone": "search issues & pull requests that don't have a milestone",
				"project": "search issues & pull requests that don't have a project"
			},
			"NOT": {
				"": "search operator (max 5 of any operator)"
			},
			"OR": {
				"": "search operator (max 5 of any operator)"
			},
			"org": {
				"": "search within the named organization",
				"github": "search GitHub's repositories"
			},
			// Commits
			"parent": {
				"": "search children of specified SHA-1 hash",
				"124a9a0ee1d8f1e15e833aff432fbb3b02632105": "search children of hash"
			},
			"path": {
				"": "search code within the specific file path (directory)",
				"cgi-bin": 'search code within the "cgi-bin" folder',
				"test/spec": "search code within sub-folders"
			},
			"project": {
				"": "search issues within a specified repository project board",
				"github/linguist/1": "search issues in GitHub's linguist repo project board 1"
			},
			// Repos
			"pushed": {
				"": "search repo pushes before or after a date (no range)",
				">${year}-01-15": "search repos pushed to after Jan 15, ${year}",
				">=${year}-01-15": "search repos pushed to since Jan 15, ${year}",
				"<${year}-02-01": "pushed to before Feb ${year}",
				"<=${year}-02-01": "pushed to before and including Feb 1, ${year}"
			},
			"-pushed": {
				"": "search pushes opposite of selected dates (no range)",
				">${year}-01-15": "search repos pushed to after Jan 15, ${year}",
				">=${year}-01-15": "search repos pushed to since Jan 15, ${year}",
				"<${year}-02-01": "pushed to before Feb ${year}",
				"<=${year}-02-01": "pushed to before and including Feb 1, ${year}"
			},
			// Commits
			"repo": {
				"": "search within the specified user's repository",
				"torvalds/linux": "search commits within Linus' Linux repository"
			},
			"repos": {
				"": "search user or organization with specified number of repos",
				"100": "search user or org with exactly 100 repos",
				">100": "search user or org with >100 repos",
				">=100": "search user or org with >=100 repos",
				"10..20": "search user or org with 10-20 repos",
				"<100": "search user or org with <100 repos",
				"<=100": "search user or org with <=100 repos"
			},
			"review": {
				"": "search pull requests with the specified review state",
				"none": "search pull requests that have not been reviewed",
				"required": "search pull requests that require a review before merge",
				"approved": "search pull requests that have been approved",
				"changes_requested": "search pull requests where a reviewer requested changes"
			},
			"review-requested": {
				"": "search pull requests with a requested reviewer, but only before they review the PR",
				"fred": 'search pull requests where "@fred" was asked to review'
			},
			"reviewed-by": {
				"": "search pull requests that have been reviewed by the specified user",
				"fred": 'search pull requests reviewed by "@fred"'
			},
			// Repos, Code - include "-size"?
			"size": {
				"": "search repos or files with a specific size (in KB)",
				"1000": "search repos or files that are exactly 1 MB in size",
				">10000": "search repos or files that are more than 10 MB in size",
				">=10000": "search repos or files that are at least 10 MB in size",
				"1024..4096": "search repos or files between 1024 and 4096 KB in size",
				"<1000": "search repos or files less than 1 MB in size",
				"<=100": "search repos or files that are less than or equal to 100 KB in size"
			},
			"sort": {
				"": 'apply an ascending or descending sort to the specified filter; add "-asc" or "-desc"',
				"author-date-asc": "sort oldest authored date first",
				"author-date-desc": "sort newest authored date first",
				"comments-asc": "sort least comments fist",
				"comments-desc": "sort most comments first",
				"committer-date-asc": "sort oldest committer date first",
				"committer-date-desc": "sort newest committer date first",
				"created-asc": "sort oldest item first",
				"created-desc": "sort newest item first",
				"forks-asc": "sort least forks first",
				"forks-desc": "sort most forks first",
				"reactions-+1-asc": "sort least +1 reactions first",
				"reactions-+1-desc": "sort most +1 reactions first",
				"reactions--1-asc": "sort least -1 reactions first",
				"reactions--1-desc": "sort most -1 reactions first",
				"reactions-heart-asc": "sort least heart reactions first",
				"reactions-heart-desc": "sort most heart reactions first",
				"reactions-smile-asc": "sort least smile reactions first",
				"reactions-smile-desc": "sort most smile reactions first",
				"reactions-tada-asc": "sort least tada reactions first",
				"reactions-tada-desc": "sort most tada reactions first",
				"reactions-thinking_face-asc": "sort least thinking face reactions first",
				"reactions-thinking_face-desc": "sort most thinking face reactions first",
				"stars-asc": "sort least stars first",
				"stars-desc": "sort most stars first",
				"updated-asc": "sort least recently updated first",
				"updated-desc": "sort recently updated first"
			},
			"stars": {
				"": "search repos with greater, less, or a range of stars",
				"100": "search repos with exactly 100 stars",
				">100": "search repos with >100 stars",
				">=100": "search repos with >=100 stars",
				"10..20": "search repos with 10-20 stars",
				"<100": "search repos with <100 stars",
				"<=100": "search repos with <=100 stars"
			},
			"-stars": {
				"": "search repos outside of the selected number of stars",
				"100": "search repos with that do not have exactly 100 stars",
				">100": "search repos with <=100 stars",
				">=100": "search repos with <100 stars",
				"10..20": "search repos with <10 or >20 stars",
				"<100": "search repos with >=100 stars",
				"<=100": "search repos with >100 stars"
			},
			"state": {
				"closed": "search closed issues",
				"open": "search open issues"
			},
			"status": {
				"": "search pull requests with the specified status",
				"success": "search pull requests with a successful status",
				"pending": "search pull requests with a pending status",
				"failed": "search pull requests with a failed status"
			},
			"team": {
				"": "search issues or pull requests mentioning an organization team",
				"jekyll/owners": 'search issues or pull requests for team "@jekyll/owners"',
				"myorg/ops": 'search issues or pull requests for team "@myorg/ops"'
			},
			"topic": {
				"": "search repos with the specified topic",
				"jekyll": 'search for repos classified with a "jekyll" topic'
			},
			"topics": {
				"": "search repos with greater, less, or a range of topics",
				"3": "search repos with exactly 3 topics",
				">3": "search repos with more than three topics",
				">=3": "search repos with three or more topics",
				"<3": "search repos with less than 3 topics",
				"<=2": "search repos with zero to two topics"
			},
			// Commits
			"tree": {
				"": "searches commits referring to the specified tree hash",
				"99ca967": "search commits of tree hash"
			},
			"type": {
				"": "search for a user, organization, issue or pull request",
				"issue": "only search issues",
				"pr": "only search pull requests",
				"org": "only search organizations",
				"user": "only search personal accounts"
			},
			// Wiki
			"updated": {
				"": "search issue & wiki updates before or after a date (no range)",
				">${year}-01-31": "search repos pushed to after Jan 31, ${year}",
				">=${year}-01-31": "search repos pushed to since Jan 31, ${year}",
				"<${year}-02-01": "pushed to before Feb ${year}",
				"<=${year}-02-01": "pushed to before and including Feb 1, ${year}"
			},
			// User
			"user": {
				"": "search for a specific user or organization",
				"github": "search in github organization repos"
			},
			"-user": {
				"": "search excludes a specific user or organization",
				"github": "search does not include github organization repos"
			}
		},
		// array containing items that should not include a trailing colon
		noTrailingColon = [
			"AND",
			"OR",
			"NOT"
		],
		list = Object.keys(filters);

	function updateYear(string) {
		return string.replace(/(\$\{year(-1)?\})/g, function(str) {
			return {
				"${year}": year,
				"${year-1}": year - 1
			}[str];
		});
	}

	// copied from atwho.js DEFAULT_CALLBACKS.highlighter
	// https://github.com/ichord/At.js/blob/master/dist/js/jquery.atwho.js#L105
	// to add a class to the <strong> html
	function highlighter(li, query) {
		if (!query) {
			return li;
		}
		const regexp = new RegExp(
			">\\s*([^\<]*?)(" + query.replace("+", "\\+") + ")([^\<]*)\\s*<", "ig"
		);
		return li.replace(regexp, function(str, $1, $2, $3) {
			return `>${$1}<strong class="text-emphasized">${$2}</strong>${$3} <`;
		});
	}

	function escapeHTML(string) {
		return updateYear(string).replace(/[<>"&]/g, function(str) {
			return {
				"<" : "&lt;",
				">" : "&gt;",
				'"' : "&quot;",
				"&" : "&amp;"
			}[str];
		});
	}

	function addAtJs() {
		const $selectors = $(selectors);

		// add "?" to open list of filters
		$selectors.atwho({
			at: "?",
			data: list,
			insertTpl: "${name}",
			// show everything in dropdown
			limit: list.length,
			suffix: "",
			callbacks: {
				highlighter: highlighter,
				beforeInsert: function(value) {
					// add colon suffix, as needed
					return value + (noTrailingColon.includes(value) ? " " : ":");
				}
			},
		});

		// Add specific filter examples
		list.forEach(label => {
			$selectors.atwho({
				at: label + (noTrailingColon.includes(label) ? " " : ":"),
				data: data[label],
				limit: 20,
				startWithSpace: false,
				callbacks: {
					highlighter: highlighter,
					tplEval: function(tpl, map) {
						// look for default displayTpl = "<li>${name}</li>"
						if (tpl.indexOf("<li>") > -1) {
							// menu template; text-emphasized needed for GitHub-Dark userstyle
							return `
								<li class="navigation-item">
									<strong class="ghsa-key text-emphasized">
										${escapeHTML(map.name)}
									</strong>
									<small>${escapeHTML(map.description)}</small>
								</li>`;
						}
						// insert text template
						return `${map["atwho-at"]}${updateYear(map.name)}`;
					},
					sorter: function(query, items) {
						// reset suffix setting
						this.setting.suffix = " ";
						return items;
					},
					beforeInsert: function(value) {
						// don't add a space if the user chooses an empty string value
						// meaning the filter ends with a colon, e.g. "in:"
						this.setting.suffix = value.slice(-1) === ":" ? "" : " ";
						return value;
					}
				}
			});
		});
		// use classes from GitHub-Dark to make theme match GitHub-Dark
		document.querySelectorAll(".atwho-view").forEach(el => {
			el.classList.add(...["jump-to-suggestions-results-container", "Box"]);
		});
	}

	// prevent reinitializing if user clicks in the input multiple times
	function init() {
		// build data for At.js
		let array;
		list.forEach(label => {
			array = [];
			Object.keys(filters[label]).forEach(key => {
				array.push({
					"name": key,
					"description": filters[label][key]
				});
			});
			// sort empty string to top
			data[label] = array.sort((a, b) => {
				if (a.name === "") {
					return -1;
				}
				return a.name > b.name ? 1 : -1;
			});
		});

		document.querySelector("body").addEventListener("click", event => {
			const target = event.target;
			if (
				target.nodeName === "INPUT" &&
				target.matches(selectors)
			) {
				$(selectors).atwho("destroy");
				addAtJs();
			}
		});
		// remove At.js before the page refreshes
		document.querySelector("body").addEventListener("pjax:start", event => {
			const target = event.target;
			if (target.nodeName === "INPUT" && target.matches(selectors)) {
				$(selectors).atwho("destroy");
			}
		});
	}

	GM_addStyle(`
		.atwho-view { position:absolute; top:0; left:0; display:none;
			margin-top:18px; border:1px solid #ddd; border-radius:3px;
			box-shadow:0 0 5px rgba(0,0,0,0.1); max-height:225px; min-width:300px;
			max-width:none !important; overflow: auto; z-index: 11110 !important; }
		.atwho-view .cur { background:#36F; color:#fff; }
		.atwho-view .cur small { color:#fff; }
		.atwho-view strong { color:#36F; }
		.atwho-view .cur strong { color:#fff; font:bold; }
		.atwho-view ul { list-style:none; padding:0; margin:auto; max-height: 200px;
			overflow-y:auto; }
		.atwho-view ul li { display:block; padding:5px 10px;
			border-bottom: 1px solid #ddd; cursor:pointer; text-align:right; }
		.atwho-view small { font-size:smaller; color:#777; font-weight:normal; }
		.atwho-view .ghsa-key { font-style:normal; float:left; margin-right:10px; }`
	);

	init();

})(jQuery.noConflict(true));
