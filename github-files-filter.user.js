// ==UserScript==
// @name        GitHub Files Filter
// @version     1.1.8
// @description A userscript that adds filters that toggle the view of repo files by extension
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-files-filter.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-files-filter.user.js
// ==/UserScript==
(() => {
	"use strict";

	// Emphasize selected buttons, disable hover when all selected and remove
	// animation delay; See #46
	GM_addStyle(`
		.gff-filter .btn.selected { font-variant: small-caps; }
		.gff-filter .btn:not(.selected) {
			text-decoration: line-through;
		}
		.gff-filter .gff-toggle:not(.selected):focus,
		.gff-filter .btn:focus,
		.gff-filter .btn.selected:focus,
		.gff-filter .gff-toggle:not(.selected):hover,
		.gff-filter .btn:hover,
		.gff-filter .btn.selected:hover {
			border-color: #777 !important;
		}
		.gff-filter .gff-toggle {
			margin-right: 4px;
		}
		.gff-filter .gff-toggle svg {
			pointer-events: none;
		}
		.gff-filter .btn:before,
		.gff-filter .btn:after {
			animation-delay: unset !important;
			filter: invert(10%);
		}
	`);

	let list = {};
	const types = {
		// Including ":" in these special keys since it isn't allowed in a file name
		":toggle": {
			// Return false to prevent adding files under this type
			is: () => false,
			className: "gff-toggle",
			title: "Invert filter state",
			text:
				`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 16" width="12" height="16" class="octicon" aria-hidden="true">
					<path d="M12 0H0v4h2V2h8v4H8l4 4M0 16h12v-4h-2v2H2v-4h2L0 6"/>
				</svg>`
		},
		":noExt": {
			is: name => !/\./.test(name),
			text: "\u00ABno-ext\u00BB"
		},
		":dot": {
			// This will include ".travis.yml"... should we add to "yml" instead?
			is: name => /^\./.test(name),
			text: "\u00ABdot-files\u00BB"
		},
		":min": {
			is: name => /\.min\./.test(name),
			text: "\u00ABmin\u00BB"
		}
	};
	// TODO: add toggle for submodule and dot-folders
	const folderIconClasses = [
		".octicon-file-directory",
		".octicon-file-symlink-directory",
		".octicon-file-submodule"
	].join(",");

	// Default to all file types visible; remember settings between sessions
	list[":toggle"] = false; // List gets cleared in buildList function
	let settings = GM_getValue("gff-filter-settings", list);

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
		if (name) {
			settings[name] = mode === "show";
		}
		GM_setValue("gff-filter-settings", settings);
	}

	// Image preview userscript support
	function toggleImagePreview(ext, mode) {
		if ($(".ghip-image-previews")) {
			let selector = "a",
				hasType = types[ext];
			if (!hasType) {
				selector += `[href$="${ext}"]`;
			}
			$$(`.ghip-image-previews ${selector}`).forEach(el => {
				if (!$(".ghip-folder, .ghip-up-tree", el)) {
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
		// Don't toggle folders
		if (row && !$(folderIconClasses, row)) {
			let state;
			if (mode) {
				state = mode === "show" ? "" : "none";
			} else {
				// Toggle
				state = row.style.display === "none" ? "" : "none";
			}
			row.style.display = state;
		}
	}

	function toggleAll() {
		const files = $("div.file-wrap");
		// Toggle all blocks
		$$("td.content .js-navigation-open", files).forEach(el => {
			toggleRow(el);
		});
		// Update filter buttons
		$$(".gff-filter .btn", files).forEach(el => {
			const name = el.dataset.ext;
			if (name !== ":toggle") {
				const modeBool = !settings[name];
				settings[name] = modeBool;
				el.classList.toggle("selected", modeBool);
			}
		});
		updateSettings();
	}

	function toggleFilter(filter, mode) {
		const files = $("div.file-wrap");
		const elm = $(`.gff-filter .btn[data-ext="${filter}"]`, files);
		/* The list[filter] contains an array of file names */
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
		if (filter === ":toggle") {
			toggleAll();
		} else if (list[filter]) {
			toggleFilter(filter, mode);
		}
		// Update view for github-image-preview.user.js
		toggleImagePreview(filter, mode);
	}

	function addExt(ext, txt) {
		if (ext) {
			if (!list[ext]) {
				list[ext] = [];
			}
			list[ext].push(txt);
		}
	}

	function buildList() {
		list = {};
		Object.keys(types).forEach(item => {
			if (item !== ":toggle") {
				list[item] = [];
			}
		});
		// Get all files
		$$("table.files tr.js-navigation-item").forEach(file => {
			if ($("td.icon .octicon-file", file)) {
				let ext, parts, sub;
				const link = $("td.content .js-navigation-open", file);
				const txt = (link.title || link.textContent || "").trim();
				const name = txt.split("/").slice(-1)[0];
				// Test extension types; fallback to regex extraction
				ext = Object.keys(types).find(item => {
					return types[item].is(name);
				}) || /[^./\\]*$/.exec(name)[0];
				parts = name.split(".");
				// Include sub-extension filters like "user.js" or "min.js"
				if (!ext.startsWith(":") && parts.length > 2 && parts[0] !== "") {
					sub = parts.slice(0, -1).join(".");
					// Prevent version numbers & "vs. " from adding a filter button
					// See https://github.com/tpn/pdfs
					if (!/[()]/.test(sub) && !/[\b\w]\.[\b\d]/.test(sub)) {
						addExt(ext, txt);
						ext = parts.slice(-2).join(".");
					}
				}
				addExt(ext, txt);
			}
		});
	}

	function sortList() {
		return Object.keys(list).sort((a, b) => {
			// Move ":" filters to the beginning, then sort the rest of the
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
		// Get length, but don't count empty arrays
		Object.keys(list).forEach(ext => {
			filters += list[ext].length > 0 ? 1 : 0;
		});
		// Don't bother showing filter if only one extension type is found
		// Sometimes "file-wrap" class is applied to fragment element
		const files = $("div.file-wrap"); console.log($('.file-wrap'));
		if (files && filters > 1) {
			filters = $(".gff-filter-wrapper");
			if (!filters) {
				filters = document.createElement("div");
				// Use "commitinfo" for GitHub-Dark styling
				filters.className = "gff-filter-wrapper commitinfo";
				filters.style = "padding:3px 5px 2px;border-bottom:1px solid #eaecef";
				files.insertBefore(filters, files.firstChild);
			}
			fixWidth();
			buildHTML();
			applyInitSettings();
		}
	}

	function buildButton(ext, title) {
		const data = types[ext] || {};
		const className = "btn btn-sm tooltipped tooltipped-n gff-btn " +
			(data.className ? data.className : "BtnGroup-item selected");
		return (
			`<button
				type="button"
				class=" ${className}"
				data-ext="${ext}"
				aria-label="${title || data.title}"
			>${data.text || ext}</button>`
		);
	}

	function buildHTML() {
		let html = `<div class="gff-filter">` +
			// Add a filter "toggle" button to the beginning
			buildButton(":toggle") +
			// Separate toggle from other filters
			"<div class='BtnGroup'>";
		// Prepend filter buttons
		sortList().forEach(ext => {
			const len = list[ext].length;
			if (len) {
				html += buildButton(ext, len);
			}
		});
		$(".gff-filter-wrapper").innerHTML = html + "</div></div>";
	}

	function getWidth(el) {
		return parseFloat(window.getComputedStyle(el).width);
	}

	// Lock-in the table cell widths, or the navigation up link jumps when you
	// hide all files... using percentages in case someone is using GitHub wide
	function fixWidth() {
		let group;
		let html = "";
		const table = $("table.files");
		const tableWidth = getWidth(table);
		const cells = $$("tbody:last-child tr:last-child td", table);
		if (table && cells.length > 1 && !$("colgroup", table)) {
			group = document.createElement("colgroup");
			table.insertBefore(group, table.childNodes[0]);
			cells.forEach(el => {
				// Keep two decimal point accuracy
				const width = parseInt(getWidth(el) / tableWidth * 1e4, 10) / 100;
				html += `<col style="width:${width}%">`;
			});
			group.innerHTML = html;
		}
	}

	function applyInitSettings() {
		Object.keys(list).forEach(name => {
			if (name !== ":toggle" && settings[name] === false) {
				toggleBlocks(name, "hide");
			}
		});
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
		return [...(el || document).querySelectorAll(str)];
	}

	document.addEventListener("click", e => {
		if (e.target.classList.contains("gff-btn")) {
			updateFilter(e);
		}
	});

	document.addEventListener("ghmo:container", () => {
		// Init after a short delay to allow rendering of file list
		setTimeout(() => {
			init();
		}, 300);
	});
	init();

})();
