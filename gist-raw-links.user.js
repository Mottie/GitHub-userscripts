// ==UserScript==
// @name        Gist Raw Links
// @version     0.2.2
// @description Add a button that contains a list of gist raw file links
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM.addStyle
// @grant       GM_xmlhttpRequest
// @grant       GM.xmlHttpRequest
// @connect     api.github.com
// @connect     assets-cdn.github.com
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-raw-links.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-raw-links.user.js
// ==/UserScript==
(() => {
	"use strict";

	GM.addStyle(`
		.ghrl-get-list, .ghrl-files a { cursor:pointer; }
		.ghrl-files div { text-align:center; }
		.gist-count-links { z-index: 21; }
	`);

	const item = document.createElement("li");
	item.className = "d-inline-block mr-3";

	function addButton(node) {
		const button = item.cloneNode();
		button.innerHTML = `
			<details class="details-reset details-overlay select-menu ghrl-wrapper">
				<summary class="select-menu-button" aria-haspopup="menu">
					<span class="ghrl-get-list" data-menu-button>🍣 Raw urls</span>
				</summary>
				<details-menu class="select-menu-modal position-absolute ghrl-files" style="z-index: 99;" role="menu" aria-label="Raw gist links">
					<div class="select-menu-list">
						<img src="https://github.githubassets.com/images/spinners/octocat-spinner-32.gif" width="32">
					</div>
				</details-menu>
			</details>`;
		node.insertBefore(button, node.childNodes[0]);
	}

	function update() {
		const gists = $$(".gist-snippet");
		let indx = gists.length;
		if (indx) {
			while (indx--) {
				// only save dabblet files from list
				if (!$(".ghrl-get-list", gists[indx])) {
					addButton($(".gist-snippet-meta ul", gists[indx]));
				}
			}
		}
	}

	function addList(link, files) {
		let html = "";
		Object.keys(files).forEach(file => {
			// remove version sha from raw_url to always point at
			// the latest version of the file - see #18
			const url = files[file].raw_url.replace(/raw\/\w+\//, "raw/");
			html += `
				<a href="${url}" class="select-menu-item ghrl-file" role="menuitem">
					${file}
				</a>`;
		});
		$(".ghrl-files", link.closest("li")).innerHTML = html;
	}

	function loadFileList(link) {
		let el = link.closest("li");
		el = $("a", el && el.nextElementSibling);
		if (el) {
			const gistid = el.href.split("/").slice(-1);
			GM.xmlHttpRequest({
				method : "GET",
				url : `https://api.github.com/gists/${gistid}`,
				onload : response => {
					if (response.status !== 200) {
						$(".ghrl-files", link.parentNode).innerHTML = response.message;
						return console.error(response);
					}
					let json = false;
					try {
						json = JSON.parse(response.responseText);
					} catch (err) {
						return console.error(`Invalid JSON for gist ${gistid}`);
					}
					if (json && json.files) {
						addList(link, json.files);
					}
				}
			});
		}
	}

	function addBindings() {
		document.addEventListener("click", function(event) {
			const target = event.target.closest("details");
			if (target && target.classList.contains("ghrl-wrapper")) {
				loadFileList(target);
			}
		});
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	function $$(str, el) {
		return Array.from((el || document).querySelectorAll(str));
	}

	document.addEventListener("pjax:end", update);
	update();
	addBindings();
})();
