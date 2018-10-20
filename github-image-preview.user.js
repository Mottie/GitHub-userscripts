// ==UserScript==
// @name        GitHub Image Preview
// @version     1.2.0
// @description A userscript that adds clickable image thumbnails
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @connect     github.com
// @connect     githubusercontent.com
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=634242
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-image-preview.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-image-preview.user.js
// ==/UserScript==
(() => {
	"use strict";

	GM_addStyle(`
		table.files tr.ghip-image-previews,
			table.files.ghip-show-previews tbody tr.js-navigation-item {
			display:none; }
		table.files.ghip-show-previews tr.ghip-image-previews { display:table-row; }
		table.files.ghip-show-previews .ghip-non-image {
			height:80px; margin-top:15px; opacity:.2; }
		table.files.ghip-show-previews .image { position:relative; overflow:hidden;
			text-align:center; }
		.ghip-image-previews .image { padding:10px; }
		table.files.ghip-tiled .image { width:22.5%; height:180px;
			margin:12px !important; /* GitHub uses !important flags now :( */ }
		table.files.ghip-tiled .image .border-wrap img,
			.ghip-image-previews .border-wrap svg { max-height:130px; }
		table.files.ghip-fullw .image { width:97%; height:auto; }
		/* zoom doesn't work in Firefox, but "-moz-transform:scale(3);"
			doesn't limit the size of the image, so it overflows */
		table.files.ghip-tiled .image:hover img:not(.ghip-non-image) { zoom:3; }
		.ghip-image-previews .border-wrap img,
			.ghip-image-previews .border-wrap svg { max-width:95%; }
		.ghip-image-previews .border-wrap img.error { border:5px solid red;
			border-radius:32px; }
		.ghip-image-previews .border-wrap h4 { white-space:nowrap;
			text-overflow:ellipsis; margin-bottom:5px; }
		.ghip-image-previews .border-wrap h4.ghip-file-name { overflow:hidden; }
		.btn.ghip-tiled > *, .btn.ghip-fullw > *, .ghip-image-previews iframe {
			pointer-events:none; vertical-align:baseline; }
		.image .ghip-file-type { font-size:30px; top:-1.8em; position:relative;
			z-index:2; }
		.ghip-content span.exploregrid-item .ghip-file-name { cursor:default; }
		/* override GitHub-Dark styles */
		table.files img[src*='octocat-spinner'], img[src='/images/spinner.gif'] {
			width:auto !important; height:auto !important; }
		table.files td .simplified-path { color:#888 !important; }
	`);

	// supported img types
	const imgExt = /(png|jpg|jpeg|gif|tif|tiff|bmp|webp)$/i,
		svgExt = /svg$/i,
		spinner = "https://assets-cdn.github.com/images/spinners/octocat-spinner-32.gif",

		folderIconClasses = `
			.octicon-file-directory,
			.octicon-file-symlink-directory,
			.octicon-file-submodule`,

		tiled = `
			<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16">
				<path d="M0 0h7v7H0zM9 9h7v7H9zM9 0h7v7H9zM0 9h7v7H0z"/>
			</svg>
		`,
		fullWidth = `
			<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16">
				<path d="M0 0h16v7H0zM0 9h16v7H0z"/>
			</svg>
		`,
		imgTemplate = [
			// not using backticks here
			"<a href='${url}' class='exploregrid-item image m-3 float-left js-navigation-open' rel='nofollow'>",
			"<span class='border-wrap'>${image}</span>",
			"</a>"
		].join(""),
		spanTemplate = [
			"<span class='exploregrid-item image m-3 float-left'>",
			"<span class='border-wrap'>${image}</span>",
			"</span>"
		].join("");

	function addToggles() {
		if ($(".gh-img-preview")) {
			return;
		}
		const div = document.createElement("div"),
			btn = `btn btn-sm BtnGroup-item tooltipped tooltipped-n" aria-label="Show`;
		div.className = "BtnGroup float-right gh-img-preview";
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
		const table = $("table.files"),
			selected = "ghip-" + name,
			notSelected = "ghip-" + (name === "fullw" ? "tiled" : "fullw");
		table.classList.add("ghip-show-previews", selected);
		$(".btn." + selected).classList.add("selected");
		table.classList.remove(notSelected);
		$(".btn." + notSelected).classList.remove("selected");
		GM_setValue("gh-image-preview", name);
	}

	function showList() {
		$("table.files").classList.remove(
			"ghip-show-previews", "ghip-tiled", "ghip-fullw"
		);
		$(".btn.ghip-tiled").classList.remove("selected");
		$(".btn.ghip-fullw").classList.remove("selected");
		GM_setValue("gh-image-preview", "");
	}

	function buildPreviews() {
		let template, url, temp, noExt, fileName,
			imgs = "<td colspan='4' class='ghip-content'>",
			indx = 0;
		const row = document.createElement("tr"),
			table = $("table.files tbody:last-child"),
			files = $$("tr.js-navigation-item"),
			len = files.length;
		row.className = "ghip-image-previews";
		if ($(".ghip-image-previews")) {
			temp = $(".ghip-image-previews");
			temp.parentNode.removeChild(temp);
		}
		if (table) {
			for (indx = 0; indx < len; indx++) {
				// not every submodule includes a link; reference examples from
				// see https://github.com/electron/electron/tree/v1.1.1/vendor
				temp = $("td.content a", files[indx]) ||
					$("td.content span span", files[indx]);
				// use innerHTML because some links include path - see "third_party/lss"
				fileName = temp ? temp.innerHTML.trim() : "";
				// temp = temp && $("a", temp);
				url = temp && temp.nodeName === "A" ? temp.href : "";
				// add link color
				template = `<h4 class="ghip-file-name ${
					(url ? " text-blue" : "")}" title="${fileName}">
						${fileName}
					</h4>`;
				if (imgExt.test(url)) {
					// *** image preview ***
					template += "<img src='" + url + "?raw=true'/>";
					imgs += imgTemplate
						.replace("${url}", url)
						.replace("${image}", template);
				} else if (svgExt.test(url)) {
					// *** svg preview ***
					// loaded & encoded because GitHub sets content-type headers as
					// a string
					temp = url.substring(url.lastIndexOf("/") + 1, url.length);
					template += `<img data-svg-holder="${temp}" data-svg-url="${url}" alt="${temp}" src="${spinner}" />`;
					imgs += updateTemplate(url, template);
				} else {
					// *** non-images (file/folder icons) ***
					temp = $("td.icon svg", files[indx]);
					if (temp) {
						// non-files svg class: "directory", "submodule" or "symlink"
						// add "ghip-folder" class for file-filters userscript
						noExt = temp.matches(folderIconClasses) ? " ghip-folder" : "";
						// add xmlns otherwise the svg won't work inside an img
						// GitHub doesn't include this attribute on any svg octicons
						temp = temp.outerHTML
							.replace("<svg", "<svg xmlns='http://www.w3.org/2000/svg'");
						// include "leaflet-tile-container" to invert icon for GitHub-Dark
						template += `<span class="leaflet-tile-container${noExt}">` +
							`<img class="ghip-non-image" src="data:image/svg+xml;base64,` +
							window.btoa(temp) + `"/></span>`;
						// get file name + extension
						temp = url.substring(url.lastIndexOf("/") + 1, url.length);
						// don't include extension for folders, or files with no extension,
						// or files starting with a "." (e.g. ".gitignore")
						template += (!noExt && temp.indexOf(".") > 0) ?
							"<h4 class='ghip-file-type'>" +
							temp
								.substring(temp.lastIndexOf(".") + 1, temp.length)
								.toUpperCase() +
							"</h4>" : "";
						imgs += url ?
							updateTemplate(url, template) :
							// empty url; use non-link template
							// see "depot_tools @ 4fa73b8" at
							// https://github.com/electron/electron/tree/v1.1.1/vendor
							updateTemplate(url, template, spanTemplate);
					} else if (files[indx].classList.contains("up-tree")) {
						// Up tree link
						temp = $("td:nth-child(2) a", files[indx]);
						url = temp ? temp.href : "";
						imgs += url ?
							updateTemplate(
								url,
								"<h4 class='text-blue ghip-up-tree'>&middot;&middot;</h4>"
							) : "";
					}
				}
			}
			row.innerHTML = imgs + "</td>";
			table.appendChild(row);
			lazyLoadSVGs();
		}
	}

	function updateTemplate(url, img, tmpl) {
		return (tmpl || imgTemplate)
			.replace("${url}", url)
			.replace("${image}", img);
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
		} else {
			console.error("IntersectionObserver is not supported");
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
		if ($("table.files")) {
			addToggles();
			setTimeout(setInitState, 0);
		}
	}

	document.addEventListener("ghmo:container", init);
	init();
})();
