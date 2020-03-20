// ==UserScript==
// @name        GitHub Update Fork
// @version     0.1.1
// @description A userscript that adds a link to update your fork
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       none
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-update-fork.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-update-fork.user.js
// ==/UserScript==
(() => {
	"use strict";

	function getUpstreamBranch(fork, info) {
		const upstreamLink = $("a", fork);
		// Look for "commit behind" or "commits behind"
		if (upstreamLink && info && /commits?\sbehind/.test(info.textContent)) {
			// forked from link text ":user/:repo"
			const user = upstreamLink.textContent.split("/")[0];
			const regexp = new RegExp(`(${user.trim()}:[-\\w.]+)`);
			// The match will include the sentence period because branch names may
			// include a version number, e.g. "user:my-branch-v1.0"
			const branch = (info.textContent.match(regexp) || [])[0];
			return branch
				? branch.substring(0, branch.length - 1)
				: null;
		}
		return null;
	}

	function getUserBranch() {
		// The branch selector may contain a truncated branch name, so use the url
		const path = window.location.pathname;
		const index = path.indexOf("/tree/");
		return index > -1
			? path.substring(index + 6, path.length)
			: "";
	}

	function addLink(fork, info) {
		const branch = getUpstreamBranch(fork, info);
		if (branch) {
			const userBranch = getUserBranch();
			const compareLink = $("a[href*='/compare']", info);
			const prLink = $("a[href*='/pull']", info);
			const link = prLink.cloneNode();
			// https://github.com/<FORK>/<REPO>/compare/<BRANCH>...<SOURCE>:<BRANCH>
			link.href = `${compareLink.href}/${userBranch}...${branch}`;
			link.classList.add("ghuf-update-link");
			link.appendChild($("svg", prLink).cloneNode(true));
			link.appendChild(document.createTextNode(" Update fork"));
			prLink.insertAdjacentElement("beforebegin", link);
		}
	}

	function init() {
		const fork = $(".fork-flag");
		const info = $(".branch-infobar");
		if (fork && info) {
			addLink(fork, info);
		}
	}

	function $(str, el = document) {
		return el.querySelector(str);
	}

	document.addEventListener("pjax:end", init);
	init();

})();