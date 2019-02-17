// ==UserScript==
// @name        GitHub Issue Show Status
// @version     1.0.6
// @description A userscript that adds an obvious indicator showing if an issue or pull request is open or closed
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-end
// @grant       GM_addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-show-status.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-issue-show-status.user.js
// ==/UserScript==
(() => {
	"use strict";

	// classes added to the body in case you want to add extra styling
	// via a userstyle
	const bodyClasses = [
			"github-issue-status-open",
			"github-issue-status-closed",
			"github-issue-status-merged"
		],
		// class names applied to the issue status label
		states = {
			"State--red": "Closed",
			"State--purple": "Merged",
			"State--green": "Open"
		};

	/* Make the sidebar sticky;
	 * support: http://caniuse.com/#search=sticky
	 */
	GM_addStyle(`
		.discussion-sidebar {
			position: sticky;
		}
		.github-issue-show-status {
			width:100%;
			margin-top:5px;
		}
	`);

	function getStatus() {
		const statusElm = $("#partial-discussion-header .gh-header-meta .State"),
			status = statusElm.className.match(/(State--\w+)/);
		return status && status[0] || "";
	}

	function addLabel(status) {
		$("body").classList.remove(...bodyClasses);
		const sidebar = $(".discussion-sidebar");
		let el = $(".github-issue-show-status", sidebar),
			txt = states[status] || "";
		// remove previous indicator, just in case this function is called
		// multiple times
		if (el) {
			el.parentNode.removeChild(el);
		}
		if (status && sidebar) {
			el = document.createElement("div");
			el.className = "github-issue-show-status State " + status;
			el.textContent = txt;
			sidebar.insertBefore(el, sidebar.childNodes[0]);
			$("body").classList.add("github-issue-status-" + txt.toLowerCase());
		}
	}

	function checkPage() {
		if ($("#partial-discussion-header")) {
			const status = getStatus();
			addLabel(status);
		}
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	document.addEventListener("ghmo:container", checkPage);
	// needed in case the issue is closed while the issue is shown in the browser
	document.addEventListener("ghmo:comments", checkPage);
	checkPage();
})();
