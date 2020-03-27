// ==UserScript==
// @name        GitHub Download ZIP
// @version     0.2.5
// @description A userscript adds download links so that downloaded filenames include the SHA
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM.addStyle
// @grant       GM_xmlhttpRequest
// @grant       GM.xmlHttpRequest
// @connect     api.github.com
// @connect     assets-cdn.github.com
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-download-zip.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-download-zip.user.js
// ==/UserScript==
(() => {
	"use strict";

	GM.addStyle(`
		.ghdz-releases { width:100% !important; padding:10px; }
		.ghdz-releases summary { text-align:left; padding-left:16px; }
		.ghdz-files.select-menu-modal { width:100%; border:0; box-shadow:none !important; margin-bottom:0; }
		.ghdz-file { text-align:left; padding-left:16px; }
		.commit-links-cell { min-width: 375px; width: auto; }
	`);

	const zipIcon = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" class="octicon" style="vertical-align:text-top;margin-left:4px">
			<path d="M28.7 7.2a28.4 28.4 0 0 0-5.9-5.9C21.2.1 20.4 0 20 0H4.5A2.5 2.5 0 0 0 2 2.5v27C2 30.9 3.1 32 4.5 32h23c1.4 0 2.5-1.1 2.5-2.5V10c0-.4-.1-1.2-1.3-2.8zm-4.2-1.7c1 1 1.8 1.8 2.3 2.5H22V3.2c.7.5 1.6 1.3 2.5 2.3zm3.5 24c0 .3-.2.5-.5.5h-23a.5.5 0 0 1-.5-.5v-27c0-.3.2-.5.5-.5H20v7c0 .6.4 1 1 1h7v19.5z"/>
			<path d="M8 2h4v2H8V2zM12 4h4v2h-4V4zM8 6h4v2H8V6zM12 8h4v2h-4V8zM8 10h4v2H8v-2zM12 12h4v2h-4v-2zM8 14h4v2H8v-2zM12 16h4v2h-4v-2zM8 26.5c0 .8.7 1.5 1.5 1.5h5c.8 0 1.5-.7 1.5-1.5v-5c0-.8-.7-1.5-1.5-1.5H12v-2H8v8.5zm6-2.5v2h-4v-2h4z"/>
		</svg>`;
	const span = document.createElement("span");
	span.innerHTML = zipIcon;

	const link = document.createElement("a");
	link.className = "btn btn-outline BtnGroup-item tooltipped tooltipped-s ghdz-btn";
	link.setAttribute("aria-label", "Download ZIP");
	link.innerHTML = zipIcon;

	const div = document.createElement("details");
	div.className = "select-menu get-repo-btn ghdz-releases";
	div.innerHTML = `
		<summary aria-haspopup="menu">
			<span class="ghdz-get-list" data-menu-button>Latest Release Files</span>
		</summary>
		<details-menu
			class="select-menu-modal dropdown-menu-s ghdz-files"
			style="z-index: 99;"
			role="menu"
			aria-label="Releases links"
		>
			<div class="select-menu-list">
				<img src="https://github.githubassets.com/images/spinners/octocat-spinner-32.gif" width="32" alt="">
			</div>
		</details-menu>`;

	function buildURL(part) {
		const [, user, repo] = window.location.pathname.split("/");
		return `https://api.github.com/repos/${user}/${repo}/zipball/${part}`;
	}

	function buildLink(url, text) {
		return `<a href="${url}" class="dropdown-item ghdz-file" role="menuitem">
			${text}
		</a>`;
	}

	function buildReleases(result, container) {
		let html = `<h5 class="ghdz-file">${
			typeof result === "string" ? result : "No release files or assets found"
		}</h5>`;
		// Example page with release files & assets:
		// https://github.com/Maximus5/ConEmu/releases
		if (
			Array.isArray(result) &&
			result.length &&
			Object.keys(result[0] || {}).length
		) {
			html = "";
			const last = result[0];
			if (last.assets) {
				last.assets.forEach(release => {
					const url = release.browser_download_url;
					html += buildLink(url, url.split("/").slice(-1));
				});
			}
			html += buildLink(last.zipball_url, "Source code (zip)");
			html += buildLink(last.tarball_url, "Source code (tar.gz)");
		}
		$(".ghdz-files", container).innerHTML = html;
	}

	function getReleases(container) {
		if ($(".ghdz-file", container)) {
			// Already loaded
			return;
		}
		const [, user, repo] = window.location.pathname.split("/");
		GM.xmlHttpRequest({
			method : "GET",
			url : `https://api.github.com/repos/${user}/${repo}/releases`,
			onload : response => {
				if (response.status !== 200) {
					buildReleases(response.message, container);
					return console.error(response);
				}
				let json = false;
				try {
					json = JSON.parse(response.responseText);
				} catch (err) {
					return console.error(response);
				}
				if (json) {
					buildReleases(json, container);
				}
			}
		});
	}

	function addBindings() {
		document.addEventListener("click", function(event) {
			const target = event.target.closest("details");
			if (target && target.classList.contains("ghdz-releases")) {
				getReleases(target);
			}
		});
	}

	function updateLinks() {
		// Branch dropdown on main repo page
		const branch = $("summary[data-hotkey='w'] span");
		// Download link in "Clone or Download" dropdown
		const downloadLink = $("a[data-ga-click*='download zip']");
		// Repo commits page
		const commits = $(".commits-listing");

		if (downloadLink && branch && !$(".ghdz-releases", downloadLink.parentElement)) {
			const branchName = branch.textContent.indexOf("…") > -1
				// Branch selector is showing trucated text; title has full text
				? branch.parentNode.title
				: branch.textContent;
			downloadLink.href = buildURL(branchName.trim());
			downloadLink.appendChild(span.cloneNode(true));
			downloadLink.after(div.cloneNode(true));
			downloadLink.parentElement.classList.add("flex-wrap");
		}
		// Branch doesn't matter when you're using the SHA (first 7 values)
		if (commits) {
			[...document.querySelectorAll(".commit-group .commit .commit-links-group")].forEach(group => {
				if (!$(".ghdz-btn", group)) {
					const sha = $(".sha", group).textContent.trim();
					const a = link.cloneNode(true);
					a.href = buildURL(sha);
					group.appendChild(a);
				}
			});
		}
	}

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}

	// DOM targets - to detect GitHub dynamic ajax page loading
	document.addEventListener("pjax:end", updateLinks);
	updateLinks();
	addBindings();

})();
