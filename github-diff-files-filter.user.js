// ==UserScript==
// @name        GitHub Diff Files Filter
// @version     1.1.1
// @description A userscript that adds filters that toggle diff & PR files by extension
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       none
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=634242
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-diff-files-filter.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-diff-files-filter.user.js
// ==/UserScript==
(() => {
	"use strict";

	const allExtLabel = "\u00ABall\u00BB",
		noExtLabel = "\u00ABno-ext\u00BB",
		dotExtLabel = "\u00ABdot-files\u00BB",
		renameFileLabel = "\u00ABrenamed\u00BB";

	let list = {};

	function toggleBlocks(extension, type) {
		const files = $("#files"),
			view = type === "show" ? "" : "none";
		if (extension === allExtLabel) {
			// Toggle "all" blocks
			$$("#files div[id*='diff']").forEach(el => {
				el.style.display = view;
			});
			// update filter buttons
			$$("#files .gdf-filter a").forEach(el => {
				el.classList.toggle("selected", type === "show");
			});
		} else if (list[extension]) {
			/* list[extension] contains an array of anchor names used to target the
			 * hidden link added immediately above each file div container
			 * <a name="diff-xxxxx"></a>
			 * <div id="diff-#" class="file js-file js-details container">
			 */
			list[extension].forEach(anchor => {
				const file = $(`a[name="${anchor}"]`, files);
				if (file && file.nextElementSibling) {
					file.nextElementSibling.style.display = view;
				}
			});
		}
		updateAllButton();
	}

	function updateAllButton() {
		const buttons = $("#files .gdf-filter"),
			filters = $$("a:not(.gdf-all)", buttons),
			selected = $$("a:not(.gdf-all).selected", buttons);
		// set "all" button
		$(".gdf-all", buttons).classList.toggle(
			"selected",
			filters.length === selected.length
		);
	}

	function buildList() {
		list = {};
		// make noExtLabel the first element in the object
		list[noExtLabel] = [];
		list[dotExtLabel] = [];
		list[renameFileLabel] = [];
		// TOC in file diffs and pr-toolbar in Pull requests
		$$(".file-header .file-info > a").forEach(file => {
			let txt = (file.title || file.textContent || "").trim(),
				filename = txt.split("/").splice(-1)[0],
				// test for no extension, then get extension name
				// regexp from https://github.com/silverwind/file-extension
				ext = /\./.test(filename) ? /[^./\\]*$/.exec(filename)[0] : noExtLabel;
			// Add filter for renamed files: {old path} → {new path}
			if (txt.indexOf(" → ") > -1) {
				ext = renameFileLabel;
			} else if (ext === filename.slice(1)) {
				ext = dotExtLabel;
			}
			if (ext) {
				if (!list[ext]) {
					list[ext] = [];
				}
				list[ext].push(
					file.hash
						// #toc points to "a"
						? file.hash.slice(1)
						// .pr-toolbar points to "a > div > div.filename"
						: closest("a", file).hash.slice(1)
				);
			}
		});
	}

	function makeFilter() {
		const files = $("#files");
		let filters = 0,
			keys = Object.keys(list),
			html = "Filter file extension: <div class='BtnGroup gdf-filter'>",
			btnClass = "btn btn-sm selected BtnGroup-item tooltipped tooltipped-n";
		// get length, but don't count empty arrays
		keys.forEach(ext => {
			filters += list[ext].length > 0 ? 1 : 0;
		});
		// Don't bother if only one extension is found
		if (files && filters > 1) {
			filters = $(".gdf-filter-wrapper");
			if (!filters) {
				filters = document.createElement("p");
				filters.className = "gdf-filter-wrapper";
				files.insertBefore(filters, files.firstChild);
				filters.addEventListener("click", event => {
					event.preventDefault();
					event.stopPropagation();
					const el = event.target;
					el.classList.toggle("selected");
					toggleBlocks(
						el.textContent.trim(),
						el.classList.contains("selected") ? "show" : "hide"
					);
				});
			}
			// add a filter "all" button to the beginning
			html += `
				<a class="${btnClass} gdf-all" aria-label="Toggle all files" href="#">
					${allExtLabel}
				</a>`;
			keys.forEach(ext => {
				if (list[ext].length) {
					html += `
						<a class="${btnClass}" aria-label="${list[ext].length}" href="#">
							${ext}
						</a>`;
				}
			});
			// prepend filter buttons
			filters.innerHTML = html + "</div>";
		}
	}

	function init() {
		if ($("#files.diff-view") || $(".pr-toolbar")) {
			buildList();
			makeFilter();
		}
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	function $$(str, el) {
		return Array.from((el || document).querySelectorAll(str));
	}

	function closest(selector, el) {
		while (el && el.nodeType === 1) {
			if (el.matches(selector)) {
				return el;
			}
			el = el.parentNode;
		}
		return null;
	}

	document.addEventListener("ghmo:container", init);
	document.addEventListener("ghmo:diff", init);
	init();

})();
