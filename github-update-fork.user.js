// ==UserScript==
// @name        GitHub Update Fork
// @version     0.2.0
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
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==
(() => {
	"use strict";

	function getUpstreamBranch(compareLink, info) {
		// Look for "commit behind" or "commits behind"
		if (compareLink && info && /commits?\sbehind/.test(info.textContent)) {
			// forked from link text ":user/:repo"
			const regexp = /behind\s*(.+:[-\w.]+)/;
			// The match will include the sentence period because branch names may
			// include a version number, e.g. "user:my-branch-v1.0"
			const branch = (info.textContent.match(regexp) || [])[1];
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
			: "master";
	}

	function addLink(compareLink, info) {
		const branch = getUpstreamBranch(compareLink, info);
		if (branch) {
			const userBranch = getUserBranch();
			const prLink = compareLink.previousElementSibling;
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
		const compareLink = $("a[href*='pull/new'] + a[href$='/compare']");
		const info = compareLink?.closest(".Box")?.firstElementChild;
		if (compareLink && info) {
			addLink(compareLink, info);
		}
	}

	function $(str, el = document) {
		return el.querySelector(str);
	}

	document.addEventListener("pjax:end", init);
	init();

})();
