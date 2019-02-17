// ==UserScript==
// @name        Gist Raw Links
// @version     0.1.8
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
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-raw-links.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-raw-links.user.js
// ==/UserScript==
(() => {
	"use strict";

	GM.addStyle(`
		.ghrl-get-list * { pointer-events:none; }
		.ghrl-get-list, .ghrl-files a { cursor:pointer; }
		.ghrl-files div { text-align:center; }
		.gist-count-links { z-index: 21; }
	`);

	const item = document.createElement("li");
	item.className = "select-menu js-menu-container js-select-menu";

	function addButton(node) {
		const button = item.cloneNode();
		button.innerHTML = `
			<a class="select-menu-button js-menu-target ghrl-get-list" aria-expanded="false" aria-haspopup="true">
				🍣 Raw urls
			</a>
			<div class="select-menu-modal-holder">
				<div class="select-menu-modal js-menu-content">
					<div class="select-menu-header">
						<svg aria-label="Close" class="octicon octicon-x js-menu-close" height="16" role="img" version="1.1" viewBox="0 0 12 16" width="12"><path fill-rule="evenodd" d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48z"/></svg>
						<span class="select-menu-title">Files</span>
					</div>
					<div class="js-select-menu-deferred-content ghrl-files">
						<div>
							<img src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="32" alt="">
						</div>
					</div>
				</div>
			</div>`;
		node.insertBefore(button, node.childNodes[0]);
	}

	function update() {
		const gists = $$(".gist-snippet");
		let indx = gists.length;
		if (indx) {
			while (indx--) {
				// only save dabblet files from list
				if (!$(".ghrl-get-list", gists[indx])) {
					addButton($(".gist-count-links", gists[indx]));
				}
			}
		}
	}

	function addList(link, files) {
		let url,
			html = "";
		Object.keys(files).forEach(file => {
			// remove version sha from raw_url to always point at
			// the latest version of the file - see #18
			url = files[file].raw_url.replace(/raw\/\w+\//, "raw/");
			html += `
				<a class="dropdown-item ghrl-file" role="menuitem" href="${url}">
					${file}
				</a>`;
		});
		$(".ghrl-files", link.parentNode).innerHTML = html;
	}

	function loadFileList(link) {
		let url,
			el = link.closest(".select-menu");
		el = $("a", el.nextElementSibling);
		if (el) {
			url = el.href.split("/");
			GM.xmlHttpRequest({
				method : "GET",
				url : `https://api.github.com/gists/${url.pop()}`,
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
			const target = event.target;
			if (target.classList.contains("ghrl-get-list")) {
				event.preventDefault();
			 event.stopPropagation();
				if (!$(".dropdown-item", target.parentNode)) {
					loadFileList(target);
				}
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
