// ==UserScript==
// @name        Gist Raw Links
// @version     0.1.5
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
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-raw-links.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-raw-links.user.js
// ==/UserScript==
(() => {
	"use strict";

	GM.addStyle(`
		.ghrl-get-list * { pointer-events:none; }
		.ghrl-files > div { text-align:center; pointer-events:none; }
		.ghrl-files a { cursor:pointer; }
		.gist-count-links { z-index: 20; }
	`);

	const item = document.createElement("li");
	item.className = "dropdown js-menu-container";

	function addButton(node) {
		const button = item.cloneNode();
		button.innerHTML = `
			<a href="#" class="js-menu-target tooltipped tooltipped-n ghrl-get-list" aria-label="Open list of raw urls">
				🍣 Raw urls <span class="dropdown-caret"></span>
			</a>
			<div class="dropdown-menu-content">
				<ul class="dropdown-menu dropdown-menu-sw ghrl-files">
					<div>
						<img src="https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif" width="32" alt="">
					</div>
				</ul>
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
				<a class="dropdown-item ghrl-file" href="${url}">
					${file}
				</a>`;
		});
		$(".ghrl-files", link.parentNode).innerHTML = html;
	}

	function loadFileList(link) {
		let url,
			el = link.closest(".dropdown");
		el = $("a", el.nextElementSibling);
		if (el) {
			url = el.href.split("/");
			GM.xmlHttpRequest({
				method : "GET",
				url : `https://api.github.com/gists/${url.pop()}`,
				onload : function(response) {
					let json = false;
					try {
						json = JSON.parse(response.responseText);
					} catch (err) {
						console.error(`Invalid JSON for gist ${gistid}`);
						return false;
					}
					if (json && json.files) {
						addList(link, json.files);
					}
				}
			});
		}
	}

	function removeBackdrop(event) {
		event.preventDefault();
		const el = $(".modal-backdrop");
		if (el) {
			el.removeEventListener("click", removeBackdrop);
			el.parentNode.removeChild(el);
			$$(".ghrl-get-list").forEach(el => {
				el.classList.remove("selected");
				el.parentNode.classList.remove("active");
			});
		}
	}

	function addBindings() {
		document.addEventListener("click", function(event) {
			const target = event.target;
			if (target.classList.contains("ghrl-get-list")) {
				event.preventDefault();
				if (!$(".dropdown-item", target.parentNode)) {
					loadFileList(target);
				}
				// let GitHub process the elements
				setTimeout(() => {
					const el = $(".modal-backdrop");
					if (el) {
						el.addEventListener("click", removeBackdrop);
					}
				}, 100);
			} else if (
				target.classList.contains("ghrl-file") &&
				// left mouse click only
				event.button === 0 &&
				// check for keyboard modifier + left click - the browser handles these
				// clicks differently
				!(event.shiftKey || event.ctrlKey || event.metaKey)
			) {
				// allow left click to pass through
				window.location.href = target.href;
			}
		}, false);
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
