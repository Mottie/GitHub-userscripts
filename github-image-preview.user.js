// ==UserScript==
// @name        GitHub Image Preview
// @version     2.0.8
// @description A userscript that adds clickable image thumbnails
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @match       https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @connect     github.com
// @connect     githubusercontent.com
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=1108163
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-image-preview.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-image-preview.user.js
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==

(() => {
	"use strict";

	GM_addStyle(`
		.ghip-wrapper .ghip-content { display:none; }
		.ghip-wrapper.ghip-show-previews .ghip-content { display:flex; width:100%; }
		.ghip-wrapper.ghip-show-previews .Box-row { border:0 !important;
			background-color:transparent !important; }
		.ghip-show-previews .Box-row:not(.ghsc-header):not(.hidden) > div[role] {
			display:none !important; }
		.ghip-wrapper.ghip-show-previews svg.ghip-non-image,
        .ghip-wrapper.ghip-show-previews img.ghip-non-image { height:80px; width:80px;
			margin-top:15px; }
		.ghip-wrapper.ghip-show-previews .image { width:100%; position:relative;
			overflow:hidden; text-align:center; }

		.ghip-wrapper.ghip-tiled .Box-row:not(.ghsc-header):not(.hidden) {
			width:24.5%; max-width:24.5%; justify-content:center; overflow:hidden;
			display:inline-flex !important; padding:8px !important; }
		.ghip-wrapper.ghip-tiled .image { height:180px;	margin:12px !important; }
		.ghip-wrapper.ghip-tiled .image img,
			.ghip-wrapper svg { max-height:130px; max-width:90%; }
		/* zoom doesn't work in Firefox, but "-moz-transform:scale(3);"
			doesn't limit the size of the image, so it overflows */
		.ghip-wrapper.ghip-tiled .image:hover img:not(.ghip-non-image) { zoom:3; }

		.ghip-wrapper.ghip-fullw .image { height:unset; padding-bottom:0; }

		.ghip-wrapper .image span { display:block;	position:relative; }
		.ghip-wrapper .ghip-folder { margin-bottom:2em; }
		.image .ghip-file-type { font-size:40px; top:-2em; left:0; z-index:2;
			position:relative; text-shadow:1px 1px 1px #fff, -1px 1px 1px #fff,
			1px -1px 1px #fff, -1px -1px 1px #fff; }
		.ghip-wrapper h4 { overflow:hidden; white-space:nowrap;
			text-overflow:ellipsis; margin:0 12px 5px; }

		.ghip-wrapper img, .ghip-wrapper svg { max-width:95%; }
		.ghip-wrapper img.error { border:5px solid red;
			border-radius:32px; }
		.btn.ghip-tiled > *, .btn.ghip-fullw > *, .ghip-wrapper iframe {
			pointer-events:none; vertical-align:baseline; }
		.ghip-content span.exploregrid-item .ghip-file-name { cursor:default; }
		/* override GitHub-Dark styles */
		.ghip-wrapper img[src*='octocat-spinner'], img[src='/images/spinner.gif'] {
			width:auto !important; height:auto !important; }
		.ghip-wrapper td .simplified-path { color:#888 !important; }
	`);

	// supported img types
	const imgExt = /(png|jpg|jpeg|gif|tif|tiff|bmp|webp)$/i;
	const svgExt = /svg$/i;
	const spinner = "https://github.githubassets.com/images/spinners/octocat-spinner-32.gif";

	const folderIconClasses = `
		.octicon-file-directory,
		.octicon-file-symlink-directory,
		.octicon-file-submodule`;

	const tiled = `
		<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16">
			<path d="M0 0h7v7H0zM9 9h7v7H9zM9 0h7v7H9zM0 9h7v7H0z"/>
		</svg>`;

	const fullWidth = `
		<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16">
			<path d="M0 0h16v7H0zM0 9h16v7H0z"/>
		</svg>`;

	const imgTemplate = [
		// not using backticks here; we need to minimize extra whitespace everywhere
		"<a href='${url}' class='exploregrid-item image m-3 float-left js-navigation-open' rel='nofollow'>",
		"${content}",
		"</a>"
	].join("");

	const spanTemplate = [
		"<span class='exploregrid-item image m-3 float-left'>",
		"${content}",
		"</span>"
	].join("");

	const contentWrap = document.createElement("div");
	contentWrap.className = "ghip-content";

	function setupWraper() {
		// set up wrapper
		const grid = $("div[role='grid']", $("#files").parentElement);
		if (grid) {
			grid.parentElement.classList.add("ghip-wrapper");
		}
	}

	function addToggles() {
		if ($(".gh-img-preview") || !$(".file-navigation")) {
			return;
		}
		const div = document.createElement("div");
		const btn = `btn BtnGroup-item tooltipped tooltipped-n" aria-label="Show`;
		div.className = "BtnGroup ml-2 gh-img-preview";
		div.innerHTML = `
			<button type="button" class="ghip-tiled ${btn} tiled files with image preview">${tiled}</button>
			<button type="button" class="ghip-fullw ${btn} full width files with image preview">${fullWidth}</button>
		`;
		$(".file-navigation").appendChild(div);

		$(".ghip-tiled", div).addEventListener("click", event => {
			openView("tiled", event);
		});
		$(".ghip-fullw", div).addEventListener("click", event => {
			openView("fullw", event);
		});
	}

	function setInitState() {
		const state = GM_getValue("gh-image-preview");
		if (state) {
			openView(state);
		}
	}

	function openView(name, event) {
		setupWraper();
		const wrap = $(".ghip-wrapper");
		if (!wrap) {
			return;
		}
		const el = $(".ghip-" + name);
		if (el) {
			if (event) {
				el.classList.toggle("selected");
				if (!el.classList.contains("selected")) {
					return showList();
				}
			}
			showPreview(name);
		}
	}

	function showPreview(name) {
		buildPreviews();
		const wrap = $(".ghip-wrapper");
		const selected = "ghip-" + name;
		const notSelected = "ghip-" + (name === "fullw" ? "tiled" : "fullw");
		wrap.classList.add("ghip-show-previews", selected);
		$(".btn." + selected).classList.add("selected");
		wrap.classList.remove(notSelected);
		$(".btn." + notSelected).classList.remove("selected");
		GM_setValue("gh-image-preview", name);
	}

	function showList() {
		const wrap = $(".ghip-wrapper");
		wrap.classList.remove("ghip-show-previews", "ghip-tiled", "ghip-fullw");
		$(".btn.ghip-tiled").classList.remove("selected");
		$(".btn.ghip-fullw").classList.remove("selected");
		GM_setValue("gh-image-preview", "");
	}

	function buildPreviews() {
		const wrap = $(".ghip-wrapper");
		if (!wrap) {
			return;
		}
		$$(".Box-row", wrap).forEach(row => {
			let content = "";
			// not every submodule includes a link; reference examples from
			// see https://github.com/electron/electron/tree/v1.1.1/vendor
			const el = $("div[role='rowheader'] a, div[role='rowheader'] span[title]", row);
			const url = el && el.nodeName === "A" ? el.href : "";
			// use innerHTML because some links include path - see "third_party/lss"
			const fileName = el && el.textContent.trim() || "";
			// add link color
			const title = (type = "file-name") =>
				`<h4
					class="ghip-${type}"
					title="${fileName}"
				>${fileName}</h4>`;

			if (el && el.title.includes("parent dir")) {
				// *** up tree link ***
				content = url ?
					updateTemplate(
						url,
						"<h4 class='ghip-up-tree'>&middot;&middot;</h4>"
					) : "";
			} else if (imgExt.test(url)) {
				// *** image preview ***
				content = updateTemplate(
					url,
					`${title()}<img src='${url}?raw=true'/>`
				);
			} else if (svgExt.test(url)) {
				// *** svg preview ***
				// loaded & encoded because GitHub sets content-type headers as a string
				content = updateTemplate(url, `${title()}${svgPlaceholder(url)}`);
			} else {
				// *** non-images (file/folder icons) ***
				const svg = $("[role='gridcell'] svg, [role='gridcell'] img", row);
				if (svg) {
					// non-files svg class: "directory", "submodule" or "symlink"
					// add "ghip-folder" class for file-filters userscript
					const noExt = svg.matches(folderIconClasses) ? " ghip-folder" : "";
					const clone = svg.cloneNode(true);
					clone.classList.add("ghip-non-image");
					// include "leaflet-tile-container" to invert icon for GitHub-Dark
					content = `${title("non-image")}<span class="leaflet-tile-container${noExt}">` +
						clone.outerHTML + "</span>";
					content = url ?
						updateTemplate(url, content) :
						// empty url; use non-link template
						// see "depot_tools @ 4fa73b8" at
						// https://github.com/electron/electron/tree/v1.1.1/vendor
						updateTemplate(url, content, spanTemplate);
				}
			}
			const preview = $(".ghip-content", row) || contentWrap.cloneNode();
			preview.innerHTML = content;
			row.append(preview);
		});
		lazyLoadSVGs();
	}

	function updateTemplate(url, content, template = imgTemplate) {
		return template.replace("${url}", url).replace("${content}", content);
	}

	function svgPlaceholder(url) {
		const str = url.substring(url.lastIndexOf("/") + 1, url.length);
		return `<img data-svg-holder="${str}" data-svg-url="${url}" alt="${str}" src="${spinner}" />`;
	}

	function lazyLoadSVGs() {
		const imgs = $$("[data-svg-holder]");
		if (imgs.length && "IntersectionObserver" in window) {
			let imgObserver = new IntersectionObserver(entries => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						const img = entry.target;
						setTimeout(() => {
							const bounds = img.getBoundingClientRect();
							// Don't load all svgs when the user scrolls down the page really
							// fast
							if (bounds.top <= window.innerHeight && bounds.bottom >= 0) {
								getSVG(imgObserver, img);
							}
						}, 300);
					}
				});
			});
			imgs.forEach(function(img) {
				imgObserver.observe(img);
			});
		}
	}

	function getSVG(observer, img) {
		GM_xmlhttpRequest({
			method: "GET",
			url: img.dataset.svgUrl + "?raw=true",
			onload: response => {
				const url = response.finalUrl,
					file = url.substring(url.lastIndexOf("/") + 1, url.length),
					target = $("[data-svg-holder='" + file + "']"),
					resp = response.responseText,
					// Loading too many images at once makes GitHub returns a "You have triggered
					// an abuse detection mechanism" message
					abuse = resp.includes("abuse detection");
				if (target && !abuse) {
					const encoded = window.btoa(response.responseText);
					target.src = "data:image/svg+xml;base64," + encoded;
					target.title = "";
					target.classList.remove("error");
					observer.unobserve(img);
				} else if (abuse) {
					img.title = "GitHub is reporting that too many images have been loaded at once, please wait";
					img.classList.add("error");
				}
			}
		});
	}

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}
	function $$(selector, el) {
		return [...(el || document).querySelectorAll(selector)];
	}

	function init() {
		if ($("#files")) {
			setupWraper();
			addToggles();
			setTimeout(setInitState, 0);
		}
	}

	document.addEventListener("ghmo:container", init);
	init();
})();
