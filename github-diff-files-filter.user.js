// ==UserScript==
// @name        GitHub Diff Files Filter
// @version     2.1.2
// @description A userscript that adds filters that toggle diff & PR folders, and files by extension
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// ==/UserScript==
(() => {
	"use strict";

	// Example page: https://github.com/julmot/mark.js/pull/250/files
	GM_addStyle(".gdf-extension-hidden, .gdf-folder-hidden { display: none; }");

	const allLabel = "\u00ABall\u00BB",
		rootLabel = "\u00ABroot\u00BB",
		noExtLabel = "\u00ABno-ext\u00BB",
		dotExtLabel = "\u00ABdot-files\u00BB",
		renameFileLabel = "\u00ABrenamed\u00BB",
		minFileLabel = "\u00ABmin\u00BB";

	let exts = {};
	let folders = {};

	function toggleBlocks({subgroup, type, show}) {
		if (type === allLabel) {
			// Toggle "all" blocks
			$$("#files div[id*='diff']").forEach(el => {
				el.classList.toggle(`gdf-${subgroup}-hidden`, !show);
			});
			// update filter buttons
			$$(`#files .gdf-${subgroup}-filter a`).forEach(el => {
				el.classList.toggle("selected", show);
			});
		} else if (subgroup === "folder") {
			Object.keys(folders)
				.reduce((acc, folder) => {
					if (folders[folder].length && !folder.includes("→")) {
						acc.push({
							folder,
							show: $(`.gdf-folder-filter a[data-item=${folder}]`).classList.contains("selected")
						});
					}
					return acc;
				}, [])
				// sort show:true to the end; to fix hiding files that should be shown
				.sort((a, b) => {
					if (a.show && b.show) {
						return 0;
					}
					return a.show && !b.show ? 1 : -1;
				})
				.forEach(({folder, show}) => {
					toggleGroup({group: folders[folder], subgroup, show });
				});
		} else if (exts[type]) {
			toggleGroup({group: exts[type], subgroup, show});
		}
		updateAllButton(subgroup);
	}

	function toggleGroup({group, subgroup, show}) {
		const files = $("#files");
		/* group contains an array of div ids used to target the
		 * hidden link added immediately above each file div container
		 * <a name="diff-xxxxx"></a>
		 * <div id="diff-#" class="file js-file js-details container">
		 */
		group.forEach(id => {
			const file = $(`#${id}`, files);
			if (file) {
				file.classList.toggle(`gdf-${subgroup}-hidden`, !show);
			}
		});
	}

	function updateAllButton(subgroup) {
		const buttons = $(`#files .gdf-${subgroup}-filter`),
			filters = $$(`a:not(.gdf-${subgroup}-all)`, buttons),
			selected = $$(`a:not(.gdf-${subgroup}-all).selected`, buttons);
		// set "all" button
		$(`.gdf-${subgroup}-all`, buttons).classList.toggle(
			"selected",
			filters.length === selected.length
		);
	}

	function getSHA(file) {
		return file.hash
			// #toc points to "a"
			? file.hash.slice(1)
			// .pr-toolbar points to "a > div > div.filename"
			: file.closest("a").hash.slice(1);
	}

	function buildList() {
		exts = {};
		folders = {};
		// make noExtLabel the first element in the object
		exts[noExtLabel] = [];
		exts[dotExtLabel] = [];
		exts[renameFileLabel] = [];
		exts[minFileLabel] = [];
		folders[rootLabel] = [];
		// TOC in file diffs and pr-toolbar in Pull requests
		$$(".file-header .file-info > a").forEach(file => {
			let txt = (file.title || file.textContent || "").trim();
			if (txt) {
				const path = txt.split("/");
				const filename = path.splice(-1)[0];
				// test for no extension, then get extension name
				// regexp from https://github.com/silverwind/file-extension
				let ext = /\./.test(filename) ? /[^./\\]*$/.exec(filename)[0] : noExtLabel;
				const min = /\.min\./.test(filename);
				// Add filter for renamed files: {old path} → {new path}
				if (txt.indexOf(" → ") > -1) {
					ext = renameFileLabel;
				} else if (ext === filename.slice(1)) {
					ext = dotExtLabel;
				}
				const sha = getSHA(file);
				if (ext) {
					if (!exts[ext]) {
						exts[ext] = [];
					}
					exts[ext].push(sha);
					if (min) {
						exts[minFileLabel].push(sha);
					}
				}
				if (path.length > 0) {
					path.forEach(folder => {
						if (!folders[folder]) {
							folders[folder] = [];
						}
						folders[folder].push(sha);
					});
				} else {
					folders[rootLabel].push(sha);
				}
			}
		});
	}

	function makeFilter({subgroup, label}) {
		const files = $("#files");
		let filters = 0;
		const group = subgroup === "folder" ? folders : exts;
		const keys = Object.keys(group);
		let html = `${label}: <div class="BtnGroup gdf-${subgroup}-filter">`;
		const btnClass = "btn btn-sm selected BtnGroup-item tooltipped tooltipped-n";
		// get length, but don't count empty arrays
		keys.forEach(item => {
			filters += group[item].length > 0 ? 1 : 0;
		});
		// Don't bother showing the filter if only one extension is found
		if (files && filters > 1) {
			filters = $(`.gdf-${subgroup}-filter-wrapper`);
			if (!filters) {
				filters = document.createElement("p");
				filters.className = `gdf-${subgroup}-filter-wrapper`;
				files.insertBefore(filters, files.firstChild);
				filters.addEventListener("click", event => {
					if (event.target.nodeName === "A") {
						event.preventDefault();
						event.stopPropagation();
						const el = event.target;
						el.classList.toggle("selected");
						toggleBlocks({
							subgroup: el.dataset.subgroup,
							type: el.textContent.trim(),
							show: el.classList.contains("selected")
						});
					}
				});
			}
			// add a filter "all" button to the beginning
			html += `
				<a class="${btnClass} gdf-${subgroup}-all" data-subgroup="${subgroup}" data-item="${allLabel}" aria-label="Toggle all files" href="#">
					${allLabel}
				</a>`;
			keys.forEach(item => {
				if (group[item].length) {
					html += `
						<a class="${btnClass}" aria-label="${group[item].length}" data-subgroup="${subgroup}" data-item="${item}" href="#">
							${item}
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
			makeFilter({subgroup: "folder", label: "Filter file folder"});
			makeFilter({subgroup: "extension", label: "Filter file extension"});
		}
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	function $$(str, el) {
		return [...(el || document).querySelectorAll(str)];
	}

	document.addEventListener("ghmo:container", init);
	document.addEventListener("ghmo:diff", init);
	init();

})();
