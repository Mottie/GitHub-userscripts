// ==UserScript==
// @name        GitHub Files Filter
// @version     2.1.1
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
		.Box-row.hidden {
			display: none !important;
		}
	`);

	// list[":dot"] = [".gitignore", ".gitattributes", ...]
	let list = {};

	// Special filter buttons
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

	// settings[":dot"] = true; // dot files are visible
	let settings = GM_getValue("gff-filter-settings", list);

	// Update filter button state using settings
	function updateAllFilters({ invert = false }) {
		$$(".gff-filter .btn").forEach(el => {
			const ext = el.dataset.ext;
			if (ext !== ":toggle") {
				const modeBool = invert ? !settings[ext] : settings[ext];
				settings[ext] = modeBool;
				el.classList.toggle("selected", modeBool);
			}
		});
	}

	function updateSettings(ext, mode) {
		if (ext) {
			settings[ext] = mode === "show";
		}
		GM_setValue("gff-filter-settings", settings);
	}

	function toggleRows(ext, mode) {
		const files = $(".gff-wrapper");
		/* The list[ext] contains an array of file names */
		list[ext].forEach(fileName => {
			const el = $(`a[title="${fileName}"]`, files);
			if (el) {
				toggleRow(el, mode);
			}
		});
	}

	function toggleRow(el, mode) {
		const row = el.closest("div.Box-row");
		if (
			row &&
			// Don't toggle folders or link to parent folder row
			!($(folderIconClasses, row) || $("a[title*='parent dir']", row))
		) {
			if (mode) {
				row.classList.toggle("hidden", mode !== "show");
			} else {
				// Toggle
				row.classList.toggle("hidden");
			}
		}
	}

	function toggleAll() {
		const files = $(".gff-wrapper");
		// Toggle all blocks
		$$(".Box-row", files).forEach(el => {
			toggleRow(el);
		});
		updateAllFilters({ invert: true });
		updateSettings();
	}

	function toggleFilter(ext, mode) {
		updateSettings(ext, mode);
		toggleRows(ext, mode);
		const elm = $(`.gff-filter .btn[data-ext="${ext}"]`);
		if (elm) {
			elm.classList.toggle("selected", mode === "show");
		}
	}

	// Disable all except current filter (initial ctrl + click)
	function toggleSet(ext) {
		Object.keys(list).forEach(block => {
			const modeBool = block === ext;
			settings[block] = modeBool;
			toggleRows(block, modeBool ? "show" : "hide");
		});
		updateAllFilters({ invert: false });
		updateSettings();
	}

	function toggleBlocks(ext, mode, modKey) {
		if (ext === ":toggle") {
			toggleAll();
		} else if (list[ext]) {
			if (modKey) {
				toggleSet(ext, mode);
			} else {
				toggleFilter(ext, mode);
			}
		}
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
		const wrapper = $(".gff-wrapper");
		if (wrapper) {
			// Get all files
			$$(".Box-row", wrapper).forEach(file => {
				const fileWrap = $("div[role='rowheader']", file);
				if (fileWrap) {
					let ext, parts, sub;
					const link = $("a, span[title]", fileWrap);
					const txt = link && (link.title || link.textContent || "").trim();
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
		const wrapper = $(".gff-wrapper");
		if (wrapper && filters > 1) {
			filters = $(".gff-filter-wrapper");
			if (!filters) {
				filters = document.createElement("div");
				// Use "commitinfo" for GitHub-Dark styling
				filters.className = "gff-filter-wrapper commitinfo";
				filters.style = "padding:3px 5px 2px;border-bottom:1px solid #eaecef";
				wrapper.prepend(filters);
			}
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

	function applyInitSettings() {
		Object.keys(list).forEach(ext => {
			if (ext !== ":toggle" && settings[ext] === false) {
				toggleBlocks(ext, "hide");
			}
		});
	}

	function init() {
		const files = $("#files");
		// h2#files is a sibling of the div wrapping role="grid"
		const grid = $("div[role='grid']", files && files.parentElement);
		if (files && grid) {
			grid.parentElement.classList.add("gff-wrapper");
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

	document.addEventListener("click", event => {
		const el = event.target;
		if (el && el.classList.contains("gff-btn")) {
			event.preventDefault();
			event.stopPropagation();
			toggleBlocks(
				el.getAttribute("data-ext"),
				el.classList.contains("selected") ? "hide" : "show",
				event.ctrlKey
			);
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
