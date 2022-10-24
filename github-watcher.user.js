// ==UserScript==
// @name        GitHub Watcher
// @version     0.2.3
// @description A userscript that can check a repo, folder, file or branch for updates
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=1108163
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=1079637
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-watcher.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-watcher.user.js
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==
/* global $ $$ on make */
(() => {
	"use strict";

	GM_addStyle(`
		.ghwr-list-wrap { max-height:30em; overflow-y:auto; }
		.ghwr-item-entry .error,	.ghwr-item-status {
			width:14px; height:14px; color: var(--color-text-white, #111);
			background-image: linear-gradient(#54a3ff, #006eed);
			background-clip: padding-box; border: 2px solid #181818;
			border-radius: 50%; display:inline-block; }
		.ghwr-item-status { position:absolute; top:1px;	left:6px; z-index:2;
			display:none; }
		.ghwr-item-entry .btn-panel { top:-10em; opacity:0; }
		.ghwr-item-entry .error,	.ghwr-item-status.error {
			background-image: linear-gradient(#e00, #703); }
		.ghwr-item-status.unread { display:inline-block; }
		.ghwr-item-entry:hover, .ghwr-item-entry:focus-within,
			.ghwr-item-entry:hover .btn-panel, .ghwr-item-entry:focus-within .btn-panel {
			background-color: var(--color-state-hover-primary-bg);
			color:var(--color-text); }
		.ghwr-item-entry:hover .octicon, .ghwr-item-entry:focus-within .octicon {
			color:var(--color-text); }
		.ghwr-item-entry:hover .btn-panel, .ghwr-item-entry:focus-within .btn-panel {
			top:auto; opacity:1; }
		.ghwr-item-entry .btn-panel, .ghwr-last-checked .ghwr-right-panel {
			position:absolute; right:0; }
		.ghwr-last-checked { color:var(--color-text-primary);	padding:4px 8px; }
		.ghwr-item-entry { position:relative; }
		.ghwr-item-entry:hover a, .ghwr-item-entry:focus-within a,
		.ghwr-item-entry:hover button, .ghwr-item-entry:focus-within button {
			color:var(--color-state-hover-primary-text); }
		.ghwr-item-entry > button:hover, .ghwr-item-entry > button:focus {
				color:var(--color-btn-text); }
		.ghwr-item-entry label { width:75%; }
		.ghwr-item-entry input[type="text"] { width:100%; }
		.ghwr-item-entry .editing { justify-content:space-between; }
		.ghwr-items button { border:1px solid var(--color-btn-border); padding:0;
			border-radius:4px; }
		.ghwr-items button:not(:hover):not(:focus),
		.ghwr-item-entry:not(.editing) button:not([aria-checked="true"]) {
			background:#0000; border-color:#0000; }
		.ghwr-items button:hover, .ghwr-items button:focus, .ghwr-last-checked a:hover,
			.ghwr-last-checked a:focus { border-color:var(--color-btn-focus-border);
			outline:none; box-shadow:var(--color-btn-focus-shadow); }
		.ghwr-items .btn-panel button:hover, .ghwr-items .btn-panel button:focus {
			border-color:#eee; box-shadow:#eee; }
		.ghwr-last-checked button:not([aria-checked="true"]) { border-color:#0000;
			background:#0000; }
		.ghwr-items button[data-type="check"]:not([aria-checked="true"]) {
			cursor:auto; }
		.btn-panel button { color:var(--color-state-hover-primary-text);
			filter:brightness(90%); }
		.btn-panel button:hover, .btn-panel button:focus { filter:brightness(110%); }
		.ghwr-items li svg { pointer-events:none; fill:currentColor; }
		.ghwr-items li .btn[data-type="check"][aria-checked="false"] svg {
			visibility:hidden; }
		.ghwr-settings { padding:4px 8px 4px 16px; }
		.ghwr-settings input[type="number"] { width:5em; }
		.ghwr-items { --color-tooltip-bg:#343434; }
		.ghwr-items { width:50vw; min-width:500px; }
		@media (max-width:768px) { .ghwr-items { width:100vw; min-width:unset; }
			.hide-small { display:none; } }
		@media (max-width:1260px) { .ghwr-items { width:75vw; } }`
	);

	let token = GM_getValue("github-token");
	let timer;
	let timer2;
	let focus;
	let options;
	let wrap = null;
	let showSettings = !token;

	const encodedChars = /[&"'<>\n]/g;
	const sanitize = text => text.replace(
		encodedChars,
		r => `&#${r.charCodeAt(0)};`
	);

	const timeElement = time =>
		`<relative-time datetime="${time}" class="no-wrap"></relative-time>`;

	const watcherIcon = `
		<svg class="octicon octicon-spy" width="20" height="20" viewBox="0 0 24 24">
			<path d="M14.8 4c-1.3-.2-2.5 1.2-3.8.5-1-.6-2.9-.8-3.7.4C6.2 6.3 6.2 8.3 5.6 10c-.5 1.1-2 .3-2.8 1-1 .6-.5 2 .3 2.5.6.6 1.7.5 2 1.2.3.4 1.1 1.4.4 1.6l-4.1 2 3.1 5.3 1-.6-2.6-4.3 3.3-1.5c.9 2.1 2 4.2 4 5.5 1.6 1 3.7.2 4.8-1.1a12 12 0 002.5-4.2l3.7 1.6-2.7 4.3.9.6 3.4-5.4-5-2c.5-.6.3-1.8 1-2 1.2-.3 2.6-1 2.8-2.3 0-1.5-1.7-1.3-2.7-1.5-.5-1-.6-2-1-3-1-2.3-1.7-3.6-3-3.7zm.5 1c1.3 1 1.5 2.5 1.9 3.9.3 1 1 2.4-.6 2.4-2 .7-4.2.9-6.3.7-1.3-.2-2.6-.7-3.8-1.3.7-1.8.6-3.9 1.9-5.4 1-.7 2.1.5 3.2.5 1.4.3 2.4-1 3.7-.7zm-9.4 6.5c1.8 1.3 4 1.8 6.3 1.7 1.2 0 2.5-.3 3.7-.5 1.1-.3 2.2-1 3.4-.8.8-.3 1.8.4.7 1-1.3.7-3 1-4.4 1.3-4 .7-8.1.1-11.8-1.4-.8-.4-.4-1 .4-1.1.5 0 1.1 0 1.7-.2zM7 14.8c1.1.3 3 .4 4.1.7-.9 1.1-3.3.7-4-.7zm9.6.1c-1 .8-2.1 2-3.8.6 1.2 0 2.7-.3 3.8-.6zm-10 .8c1 .8 2.1 2.2 5.3.4 1.7 1.5 3.1.8 4.9 0-.8 2.2-1.8 4.7-4.1 5.8-1.3.6-2.7-.3-3.4-1.3-1.2-1.5-2-3.2-2.7-5z"/>
		</svg>`;

	const buttonCheck = (label, index) => `
		<button type="button" data-type="check" data-index="${index}" class="btn btn-sm tooltipped-e" aria-label="${label}">
			<svg class="octicon octicon-check" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
				<path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
			</svg>
		</button>`;

	const buttonPanel = index => `
		<span class="btn-panel px-2">
		<button type="button" data-type="edit" data-index="${index}" class="ml-1" aria-label="Edit">
			<svg class="octicon octicon-pencil" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
				<path fill-rule="evenodd" d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25a1.75 1.75 0 01.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"></path>
			</svg>
		</button>
		<button type="button" data-type="delete" data-index="${index}" class="ml-1 color-text-danger" aria-label="Delete">
			<svg class="octicon octicon-trashcan" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
				<path fill-rule="evenodd" d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675a.75.75 0 10-1.492.15l.66 6.6A1.75 1.75 0 005.405 15h5.19c.9 0 1.652-.681 1.741-1.576l.66-6.6a.75.75 0 00-1.492-.149l-.66 6.6a.25.25 0 01-.249.225h-5.19a.25.25 0 01-.249-.225l-.66-6.6z"></path>
			</svg>
		</button>
		</span>`;

	const editRow = (item, index) => `
		<label class="d-flex ml-3 pl-1 pr-2">
			URL:&nbsp;
			<input type="text" class="form-control input-sm" value="${item.url || ""}" autofocus />
		</label>
		<button type="button" data-type="save" data-index="${index}" class="btn px-2">
			Save
		</button>
		<button type="button" data-type="cancel" data-index="${index}" class="btn px-2 ml-2">
			Cancel
		</button>`;

	const errorRow = (item, index) => `
		<span role="alert" class="d-flex flex-items-center">
			<span class="error mr-1" aria-hidden="true"></span>
			Error: ${item.error || "Please enter a GitHub URL"}
			${buttonPanel(index)}
		</span>`;

	const itemRow = (item, index) => {
		const { org, repo, branch = "master", path } = getItemDataFromUrl(item);
		const message = sanitize(item.message?.trim() || "");
		return `
			${buttonCheck("Clear this watched update", index)}
			<span title="${org}/${repo}...${path || ""}\n\n${message}">
				<span class="hide-small">Updated </span>
				${timeElement(item.date)}
				&ndash;
				<a href="${item.url}">
					${path?.split("/").slice(-1) ||
						`${org}/${repo}${branch === "master" ? "" : ` (${branch})`}`}
				</a>
				&ndash; by ${item.name} &ndash;
				${message}
			</span>
			${buttonPanel(index)}`;
	};

	// Easier to maintain 3 separate than one big one
	const regexes = [
		/github.com\/(?<org>.+?)\/(?<repo>.+?)\/(.+?)\/(?<branch>.+?)\/(?<path>.+$)/,
		/github.com\/(?<org>.+?)\/(?<repo>.+?)\/(.+?)\/(?<branch>.+?)$/,
		/github.com\/(?<org>.+?)\/(?<repo>.+?)$/
	];
	const getItemDataFromUrl = ({ url = "" }) => {
		const match = regexes.reduce((match, regex) => {
			const test = url.match(regex);
			if (!match.done && test) {
				return { done: true, ...test };
			}
			return match;
		}, { done: false });
		return match?.groups || {};
	};

	const buildQuery = () => options.items.map((item, index) => {
		const { org, repo, branch, path } = getItemDataFromUrl(item);
		const pathQuery = (path || "") !== "" ? `, path: "${path}"` : "";
		return org && repo
			? `item${index}: repository(name: "${repo}", owner: "${org}") {
			ref(qualifiedName: "${branch || "master"}") {
				target {
					...on Commit{
						history(first:1${pathQuery}) {
							nodes {
								author {
									name
									date
								}
								message
							}
						}
					}
				}
			}
		}` : null;
	});

	const calculatedInterval = (minutes = options.interval) => minutes * 60 * 1000;

	const setLastCheckedTime = () => {
		options.lastChecked =
			token && options.items.filter(item => item.url).length > 0
				? Date.now()
				: null;
	};

	const setOptions = () => {
		GM_setValue("options", options);
	};

	const getOptions = () => {
		options = Object.assign({}, {
			interval: 60, // check status every x minutes
			lastChecked: null,
			items: []
		}, GM_getValue("options") || {});
	};

	const updateOptions = ({ data, errors }) => {
		$(".ghwr-details", wrap).classList.toggle("error", errors?.length);
		if (data || errors) {
			const emptyUrl = "Please enter a GitHub URL";
			// Update stored data
			options.items = options.items
				.map((item, index) => {
					const { author: { name, date } = {}, message } =
						data[`item${index}`]?.ref?.target?.history?.nodes[0] || {};
					const hasError = !name || !date
						? { message: `${item.url ? `${item.url} is not a valid URL` : emptyUrl}` }
						: errors?.find(err => err.path[0] === `item${index}`);

					return {
						...item,
						name,
						message,
						date,
						unread: item.unread || date !== item.date,
						error: hasError ? hasError.message : "",
						editing: false
					};
				})
				// Sort by date to make the rendered list easy to read
				.sort((a, b) => new Date(b.date) - new Date(a.date));
			setLastCheckedTime();
			setOptions();
			showStatusIndicator();
		}
	};

	// item list is resorted after every update; so find row by url
	const findRow = (index, selector) => {
		const url = options.items[index]?.url
		return url
			? `.dropdown-item[data-url="${url}"] ${selector}`
			: null;
	}

	const trailingSlashRegex = /\/$/g;
	const removeTrailingSlash = url => url.replace(trailingSlashRegex, "");

	const handleClick = async ({ type, index } = {}) => {
		let value;
		if (type) {
			switch (type) {
			case "check":
				if (index === "all") {
					options.items = options.items.map(item => (
						{ ...item, unread: false }
					));
					focus = "button[data-type='refresh']";
				} else {
					options.items[index].unread = false;
					focus = findRow(index, "a");
				}
				break;
			case "add":
				options.items.push({ editing: true });
				break;
			case "delete":
				options.items.splice(index, 1);
				focus = findRow(index, "a");
				break;
			case "cancel":
				options.items[index].editing = false;
				focus = findRow(index, "button[data-type='edit']");
				break;
			case "edit":
				options.items[index].editing = true;
				focus = findRow(index, "input[type='text']");
				break;
			case "save":
				value = $("input", $$(".ghwr-item-entry")[index])?.value;
				if (value && value !== options.items[index].url) {
					options.items[index] = { url: removeTrailingSlash(value) };
					options.lastChecked = null;
				}
				options.items[index].editing = false;
				focus = "button[data-type='add']";
				break;
			case "refresh":
				options.lastChecked = null;
				focus = "button[data-type='refresh']";
				break;
			case "settings":
				showSettings = !showSettings;
				focus = "input[type='password']";
				break;
			case "save-settings":
				options.error = "";
				value = parseInt($("input[type='number']", wrap).value, 10);
				if (!isNaN(value) && value > 1 && value !== options.interval) {
					options.interval = value;
					options.lastChecked = null;
				}
				value = $("input[type='password']", wrap).value;
				if (value && value !== token) {
					token = value;
					GM_setValue("github-token", value);
					options.lastChecked = null;
				}
				showSettings = false;
				focus = "button[data-type='settings']";
				break;
			case "cancel-settings":
				showSettings = false;
				focus = "button[data-type='settings']";
				break;
			}
			setOptions();
			renderStatus();
		}
	}

	const setFocus = () => {
		setTimeout(() => {
			if (focus) {
				$(focus, wrap)?.focus();
				focus = "";
			}
		});
	};

	const getStatus = () => options.items
		.filter(item => item.unread)
		.length > 0;

	const setStatus = () => {
		$$(".ghwr-item-entry button[data-type='check']", wrap)?.forEach(btn => {
			const indx = btn.dataset.index;
			const isChecked = options.items[indx]?.unread;
			btn.setAttribute("aria-checked", isChecked);
			btn.disabled = !isChecked;
			// toggle tooltips
			btn.classList.toggle("tooltipped", isChecked);
		});
		const isChecked = getStatus();
		const lastChkBtn = $(".ghwr-last-checked button[data-type='check']", wrap);
		lastChkBtn.setAttribute("aria-checked", isChecked);
		lastChkBtn.classList.toggle("tooltipped", isChecked);
		lastChkBtn.disabled = !isChecked;
		showStatusIndicator();
	};

	const renderStatus = async () => {
		if (!$(".ghwr-details")?.open) {
			return;
		}

		await fetchStatus();
		const list = options.items
			.map((item, index) => {
				let content = `<span class="ml-4">Unknown</span>${buttonPanel(index)}`;
				if (item.editing) {
					content = editRow(item, index);
				} else if (item.error || !item.url) {
					content = errorRow(item, index);
				} else if (item.url) {
					content = itemRow(item, index);
				}
				const rowClass = [
					"d-flex flex-items-center dropdown-item ghwr-item-entry mr-2 px-2",
					item.editing ? " editing" : "",
				].join("")
				return `<li class="${rowClass}" data-url="${item.url}">${content}</li>`;
			})
			.join("");

		const dateTime = token && options.lastChecked
			? timeElement(new Date(options.lastChecked).toISOString())
			: "Unknown";

		let error;
		if (token) {
			error = options.items.length
				? options.error
				: "Please add some items to watch";
		} else {
			error = `
				<span class='text-gray-light'>
					Please
					<a href='https://github.com/settings/tokens/new'>
						add a GitHub personal access token
					</a>
				</span>`;
		}

		$(".ghwr-items", wrap).innerHTML = `
			<ul>
				<li class="ghwr-header ml-2 text-gray-light">${watcherIcon} GitHub Watcher</li>
				<li class="dropdown-divider" role="separator"></li>
				${list.length ? `
					<li class="ghwr-list-wrap"><ul>${list}</ul></li>
					<li class='dropdown-divider' role='separator'></li>` : ""}
				${!token || showSettings ? `
					<li class="ghwr-settings text-gray-light d-flex flex-items-center border-bottom pr-4">
						<label class="ml-3 pl-1 pr-2">
							GitHub Token: <input type="password" class="form-control input-sm" value="${token || ""}" />
						</label>
						<label class="pl-4 pr-2" aria-label="Check interval in minutes">
							Interval (min):
							<input type="number" class="form-control input-sm" value="${options.interval}" min="5" max="9999" step="1" />
						</label>
						<button type="button" data-type="save-settings" class="btn px-2 ml-2">Save</button>
						<button type="button" data-type="cancel-settings" class="btn px-2 ml-2">Cancel</button>
					</li>` : ""}
				<li class="ghwr-last-checked text-gray-light d-flex flex-items-center flex-justify-between">
					<span class="d-flex flex-items-center flex-start">
						${buttonCheck("Clear all watched updates", "all")}
						Last checked:&nbsp;${dateTime}
						<button type="button" data-type="refresh" class="btn px-2 ml-1 tooltipped tooltipped-e" aria-label="Check again now">
							<svg class="octicon octicon-sync" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
								<path d="M3.38 8A9.502 9.502 0 0112 2.5a9.502 9.502 0 019.215 7.182.75.75 0 101.456-.364C21.473 4.539 17.15 1 12 1a10.995 10.995 0 00-9.5 5.452V4.75a.75.75 0 00-1.5 0V8.5a1 1 0 001 1h3.75a.75.75 0 000-1.5H3.38zm-.595 6.318a.75.75 0 00-1.455.364C2.527 19.461 6.85 23 12 23c4.052 0 7.592-2.191 9.5-5.451v1.701a.75.75 0 001.5 0V15.5a1 1 0 00-1-1h-3.75a.75.75 0 000 1.5h2.37A9.502 9.502 0 0112 21.5c-4.446 0-8.181-3.055-9.215-7.182z"/>
							</svg>
						</button>
						<button type="button" data-type="settings" class="btn px-2 ml-1 tooltipped tooltipped-e" aria-label="Settings">
							<svg class="octicon octicon-gear" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
								<path fill-rule="evenodd" d="M7.429 1.525a6.593 6.593 0 011.142 0c.036.003.108.036.137.146l.289 1.105c.147.56.55.967.997 1.189.174.086.341.183.501.29.417.278.97.423 1.53.27l1.102-.303c.11-.03.175.016.195.046.219.31.41.641.573.989.014.031.022.11-.059.19l-.815.806c-.411.406-.562.957-.53 1.456a4.588 4.588 0 010 .582c-.032.499.119 1.05.53 1.456l.815.806c.08.08.073.159.059.19a6.494 6.494 0 01-.573.99c-.02.029-.086.074-.195.045l-1.103-.303c-.559-.153-1.112-.008-1.529.27-.16.107-.327.204-.5.29-.449.222-.851.628-.998 1.189l-.289 1.105c-.029.11-.101.143-.137.146a6.613 6.613 0 01-1.142 0c-.036-.003-.108-.037-.137-.146l-.289-1.105c-.147-.56-.55-.967-.997-1.189a4.502 4.502 0 01-.501-.29c-.417-.278-.97-.423-1.53-.27l-1.102.303c-.11.03-.175-.016-.195-.046a6.492 6.492 0 01-.573-.989c-.014-.031-.022-.11.059-.19l.815-.806c.411-.406.562-.957.53-1.456a4.587 4.587 0 010-.582c.032-.499-.119-1.05-.53-1.456l-.815-.806c-.08-.08-.073-.159-.059-.19a6.44 6.44 0 01.573-.99c.02-.029.086-.075.195-.045l1.103.303c.559.153 1.112.008 1.529-.27.16-.107.327-.204.5-.29.449-.222.851-.628.998-1.189l.289-1.105c.029-.11.101-.143.137-.146zM8 0c-.236 0-.47.01-.701.03-.743.065-1.29.615-1.458 1.261l-.29 1.106c-.017.066-.078.158-.211.224a5.994 5.994 0 00-.668.386c-.123.082-.233.09-.3.071L3.27 2.776c-.644-.177-1.392.02-1.82.63a7.977 7.977 0 00-.704 1.217c-.315.675-.111 1.422.363 1.891l.815.806c.05.048.098.147.088.294a6.084 6.084 0 000 .772c.01.147-.038.246-.088.294l-.815.806c-.474.469-.678 1.216-.363 1.891.2.428.436.835.704 1.218.428.609 1.176.806 1.82.63l1.103-.303c.066-.019.176-.011.299.071.213.143.436.272.668.386.133.066.194.158.212.224l.289 1.106c.169.646.715 1.196 1.458 1.26a8.094 8.094 0 001.402 0c.743-.064 1.29-.614 1.458-1.26l.29-1.106c.017-.066.078-.158.211-.224a5.98 5.98 0 00.668-.386c.123-.082.233-.09.3-.071l1.102.302c.644.177 1.392-.02 1.82-.63.268-.382.505-.789.704-1.217.315-.675.111-1.422-.364-1.891l-.814-.806c-.05-.048-.098-.147-.088-.294a6.1 6.1 0 000-.772c-.01-.147.039-.246.088-.294l.814-.806c.475-.469.679-1.216.364-1.891a7.992 7.992 0 00-.704-1.218c-.428-.609-1.176-.806-1.82-.63l-1.103.303c-.066.019-.176.011-.299-.071a5.991 5.991 0 00-.668-.386c-.133-.066-.194-.158-.212-.224L10.16 1.29C9.99.645 9.444.095 8.701.031A8.094 8.094 0 008 0zm1.5 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM11 8a3 3 0 11-6 0 3 3 0 016 0z"></path>
							</svg>
						</button>
						${error && `<span class="ghwr-api-error ml-2 color-text-danger" role="alert">${error}</span>`}
					</span>
					<span class="d-flex flex-items-center flex-end">
						<a href="https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-watcher" class="px-2 border-0 tooltipped tooltipped-w" aria-label="Click to learn how to use GitHub watcher">
							<svg class="octicon" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="14" height="16" viewBox="0 0 14 16">
								<path d="M6 10h2v2H6V10z m4-3.5c0 2.14-2 2.5-2 2.5H6c0-0.55 0.45-1 1-1h0.5c0.28 0 0.5-0.22 0.5-0.5v-1c0-0.28-0.22-0.5-0.5-0.5h-1c-0.28 0-0.5 0.22-0.5 0.5v0.5H4c0-1.5 1.5-3 3-3s3 1 3 2.5zM7 2.3c3.14 0 5.7 2.56 5.7 5.7S10.14 13.7 7 13.7 1.3 11.14 1.3 8s2.56-5.7 5.7-5.7m0-1.3C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7S10.86 1 7 1z"></path>
							</svg>
						</a>
						<button type="button" data-type="add" class="btn px-2 ml-1 tooltipped tooltipped-w" aria-label="Add new watched item">
							<svg class="octicon octicon-plus" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
								<path fill-rule="evenodd" d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 110 1.5H8.5v4.25a.75.75 0 11-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z"></path>
							</svg>
						</button>
					</span>
				</li>
			</ul>`;

		setStatus();
		setFocus();
	}

	const showError = error => {
		setLastCheckedTime();
		options.error = error.errorMessage || error.message;
		setOptions();
	}

	const showStatusIndicator = () => {
		// show unread indicator
		const indicator = $(".ghwr-item-status", wrap);
		const hasError = options.items.some(item => item.error);
		indicator.classList.toggle("unread", hasError || getStatus());
		indicator.classList.toggle("error", hasError);
	};

	const shouldFetch = () => {
		getOptions();
		const hasItems = options.items.filter(item => item.url).length > 0;
		const needsCheck = !options.lastChecked ||
			options.lastChecked + calculatedInterval() < Date.now();
		return !!token && hasItems && needsCheck;
	};

	const fetchStatus = () => {
		getOptions();
		if (shouldFetch()) {
			return fetch(
				"https://api.github.com/graphql",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"Authorization": `bearer ${token}`
					},
					body: JSON.stringify({ query: `{${buildQuery()}}` }),
				})
				.then(res => res.json())
				.then(res => {
					if (res.message) {
						throw new Error(res.message);
					}
					options.error = "";
					return updateOptions(res);
				})
				.catch(err => showError(err));
		}
		return Promise.resolve();
	};

	const init = async () => {
		getOptions();
		const header = $(".Header .notification-indicator");
		if (header && !$(".ghwr-header-notification")) {
			wrap = make({
				el: "div",
				className: "Header-item position-relative d-md-flex ghwr-header-notification",
				html: `
					<details class="details-overlay details-reset ghwr-details">
						<summary class="Header-link" aria-label="see watched items" aria-haspopup="menu" role="button">
							<span class="ghwr-item-status"></span>
							${watcherIcon}
							<span class="dropdown-caret"></span>
						</summary>
						<details-menu class="dropdown-menu dropdown-menu-sw ghwr-items" role="menu">
							<div class="d-flex flex-justify-center py-md-2">
								<img src="https://github.githubassets.com/images/spinners/octocat-spinner-32.gif" width="32" alt="">
							</div>
						</details-menu>
					</details>`
			});
			header.closest(".Header-item")?.before(wrap);
			on($(".ghwr-details", wrap), "toggle", () => {
				renderStatus();
			});
			on($(".ghwr-items", wrap), "click", event => {
				const { target } = event;
				if (target.type === "button") {
					event.preventDefault();
					handleClick(target.dataset);
				} else if (target.type === "text") {
					event.preventDefault();
				}
			});
			await fetchStatus();
			showStatusIndicator();
		}
	}

	function setTimer() {
		clearTimeout(timer);
		clearInterval(timer2);
		timer = setTimeout(async () => {
			if (shouldFetch()) {
				setLastCheckedTime();
				await fetchStatus();
			}
			renderStatus();
			setTimer();
		}, calculatedInterval());
		timer2 = setInterval(() => {
			// Update indicator every 5 minutes because of multiple tabs
			getOptions();
			showStatusIndicator();
		}, calculatedInterval(5));
	}

	getOptions();
	init();
	setTimer();

	on(document, "ghmo:container", init);

})();
