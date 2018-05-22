// ==UserScript==
// @name        GitHub Files Filter
// @version     1.0.4
// @description A userscript that adds filters that toggle the view of repo files by extension
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=597950
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-files-filter.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-files-filter.user.js
// ==/UserScript==
(() => {
	"use strict";

	// Emphasize selected buttons, disable hover when all selected and remove
	// animation delay; See #46
	GM_addStyle(`
		.gff-filter .btn.selected { font-variant: small-caps; }
		.gff-filter .gff-all:not(.selected):hover,
		.gff-filter .gff-all:not(.selected) ~ .btn:hover,
		.gff-filter .gff-all:not(.selected) ~ .btn.selected:hover {
			border-color: #777 !important;
		}
		.gff-filter .btn:before, .gff-filter .btn:after {
			animation-delay: unset !important;
			filter: invert(10%);
		}
	`);

	let settings,
		list = {};
	const types = {
			// including ":" in key since it isn't allowed in a file name
			":all": {
				// return false to prevent adding files under this type
				is: () => false,
				text: "\u00ABall\u00BB"
			},
			":noExt": {
				is: name => !/\./.test(name),
				text: "\u00ABno-ext\u00BB"
			},
			":dot": {
				// this will include ".travis.yml"... should we add to "yml" instead?
				is: name => /^\./.test(name),
				text: "\u00ABdot-files\u00BB"
			},
			":min": {
				is: name => /\.min\./.test(name),
				text: "\u00ABmin\u00BB"
			}
		},
		// TODO: add toggle for submodule and dot-folders
		folderIconClasses = [
			".octicon-file-directory",
			".octicon-file-symlink-directory",
			".octicon-file-submodule"
		].join(",");

	// default to all file types visible; remember settings between sessions
	list[":all"] = true; // list gets cleared in buildList function
	settings = GM_getValue("gff-filter-settings", list);

	function updateFilter(event) {
		event.preventDefault();
		event.stopPropagation();
		const el = event.target;
		toggleBlocks(
			el.getAttribute("data-ext"),
			el.classList.contains("selected") ? "hide" : "show"
		);
	}

	function updateSettings(name, mode) {
		settings[name] = mode === "show";
		GM_setValue("gff-filter-settings", settings);
	}

	function updateAllButton() {
		if ($(".gff-filter")) {
			const buttons = $(".file-wrap .gff-filter"),
				filters = $$(".btn:not(.gff-all)", buttons),
				selected = $$(".btn:not(.gff-all).selected", buttons);
			// set "all" button
			$(".gff-all", buttons).classList.toggle(
				"selected",
				filters.length === selected.length
			);
		}
	}

	function toggleImagePreview(ext, mode) {
		if ($(".ghip-image-previews")) {
			let selector = "a",
				hasType = types[ext];
			if (!hasType) {
				selector += `[href$="${ext}"]`;
			}
			$$(`.ghip-image-previews ${selector}`).forEach(el => {
				if (!$(".ghip-folder", el)) {
					if (hasType && ext !== ":all") {
						// image preview includes the filename
						let elm = $(".ghip-file-name", el);
						if (elm && !hasType.is(elm.textContent)) {
							return;
						}
					}
					el.style.display = mode === "show" ? "" : "none";
				}
			});
		}
	}

	function toggleRow(el, mode) {
		const row = el.closest("tr.js-navigation-item");
		// don't toggle folders
		if (row && !$(folderIconClasses, row)) {
			row.style.display = mode === "show" ? "" : "none";
		}
	}

	function toggleAll(mode) {
		const files = $(".file-wrap");
		// Toggle "all" blocks
		$$("td.content .js-navigation-open", files).forEach(el => {
			toggleRow(el, mode);
		});
		// update filter buttons
		$$(".gff-filter .btn", files).forEach(el => {
			el.classList.toggle("selected", mode === "show");
		});
		updateSettings(":all", mode);
	}

	function toggleFilter(filter, mode) {
		const files = $(".file-wrap"),
			elm = $(`.gff-filter .btn[data-ext="${filter}"]`, files);
		/* list[filter] contains an array of file names */
		list[filter].forEach(name => {
			const el = $(`a[title="${name}"]`, files);
			if (el) {
				toggleRow(el, mode);
			}
		});
		if (elm) {
			elm.classList.toggle("selected", mode === "show");
		}
		updateSettings(filter, mode);
	}

	function toggleBlocks(filter, mode) {
		if (filter === ":all") {
			toggleAll(mode);
		} else if (list[filter]) {
			toggleFilter(filter, mode);
		}
		// update view for github-image-preview.user.js
		toggleImagePreview(filter, mode);
		updateAllButton();
	}

	function buildList() {
		list = {};
		Object.keys(types).forEach(item => {
			if (item !== ":all") {
				list[item] = [];
			}
		});
		// get all files
		$$("table.files tr.js-navigation-item").forEach(file => {
			if ($("td.icon .octicon-file", file)) {
				let ext,
					link = $("td.content .js-navigation-open", file),
					txt = (link.title || link.textContent || "").trim(),
					name = txt.split("/").slice(-1)[0];
				// test extension types; fallback to regex extraction
				ext = Object.keys(types).find(item => {
					return types[item].is(name);
				}) || /[^./\\]*$/.exec(name)[0];
				if (ext) {
					if (!list[ext]) {
						list[ext] = [];
					}
					list[ext].push(txt);
				}
			}
		});
	}

	function sortList() {
		return Object.keys(list).sort((a, b) => {
			// move ":" filters to the beginning, then sort the rest of the
			// extensions; test on https://github.com/rbsec/sslscan, where
			// the ".1" extension *was* appearing between ":" filters
			if (a[0] === ":") {
				return -1;
			}
			if (b[0] === ":") {
				return 1;
			}
			return a > b;
		});
	}

	function makeFilter() {
		let filters = 0;
		// get length, but don't count empty arrays
		Object.keys(list).forEach(ext => {
			filters += list[ext].length > 0 ? 1 : 0;
		});
		// Don't bother if only one extension is found
		const files = $(".file-wrap");
		if (files && filters > 1) {
			filters = $(".gff-filter-wrapper");
			if (!filters) {
				filters = document.createElement("div");
				// "commitinfo" allows GitHub-Dark styling
				filters.className = "gff-filter-wrapper commitinfo";
				filters.style = "padding:3px 5px 2px;border-bottom:1px solid #eaecef";
				files.insertBefore(filters, files.firstChild);
				filters.addEventListener("click", updateFilter);
			}
			fixWidth();
			buildHTML();
			applyInitSettings();
		}
	}

	function buildButton(name, label, ext, text) {
		return `<button type="button" ` +
			`class="btn btn-sm selected BtnGroup-item tooltipped tooltipped-n` +
			(name ? name : "") + `" ` +
			`data-ext="${ext}" aria-label="${label}">${text}</button>`;
	}

	function buildHTML() {
		let len,
			html = `<div class="BtnGroup gff-filter">` +
				// add a filter "all" button to the beginning
				buildButton(" gff-all", "Toggle all files", ":all", types[":all"].text);
		sortList().forEach(ext => {
			len = list[ext].length;
			if (len) {
				html += buildButton("", len, ext, types[ext] && types[ext].text || ext);
			}
		});
		// prepend filter buttons
		$(".gff-filter-wrapper").innerHTML = html + "</div>";
	}

	function getWidth(el) {
		return parseFloat(window.getComputedStyle(el).width);
	}

	// lock-in the table cell widths, or the navigation up link jumps when you
	// hide all files... using percentages in case someone is using GitHub wide
	function fixWidth() {
		let group, width,
			html = "",
			table = $("table.files"),
			tableWidth = getWidth(table),
			cells = $$("tbody:last-child tr:last-child td", table);
		if (table && cells.length > 1 && !$("colgroup", table)) {
			group = document.createElement("colgroup");
			table.insertBefore(group, table.childNodes[0]);
			cells.forEach(el => {
				// keep two decimal point accuracy
				width = parseInt(getWidth(el) / tableWidth * 1e4, 10) / 100;
				html += `<col style="width:${width}%">`;
			});
			group.innerHTML = html;
		}
	}

	function applyInitSettings() {
		// list doesn't include type.all entry
		if (settings[":all"] === false) {
			toggleBlocks(":all", "hide");
		} else {
			Object.keys(list).forEach(name => {
				if (settings[name] === false) {
					toggleBlocks(name, "hide");
				}
			});
		}
	}

	function init() {
		if ($("table.files")) {
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

	document.addEventListener("ghmo:container", () => {
		// init after a short delay to allow rendering of file list
		setTimeout(() => {
			init();
		}, 200);
	});
	init();

})();
