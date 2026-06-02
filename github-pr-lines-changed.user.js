// ==UserScript==
// @name        GitHub PR lines changed
// @version     1.0.0
// @description A userscript that shows added/removed line counts on pull request lists and adds a "lines changed" sort option
// @license     MIT
// @author      karthikeyann
// @namespace   https://github.com/Mottie
// @match       https://github.com/*
// @run-at      document-idle
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_xmlhttpRequest
// @connect     api.github.com
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-pr-lines-changed.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-pr-lines-changed.user.js
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==

/*
 * Line counts (additions/deletions) are only available from the GitHub API per
 * pull request, so this script needs a personal access token. It is requested
 * once via the userscript manager menu and stored locally (never in this file):
 *
 *   1. Create a token at https://github.com/settings/tokens
 *      - A classic token with NO scopes is enough for public repositories.
 *      - For private repos use "repo" (classic) or read-only fine-grained access.
 *   2. Open the userscript manager menu and click "Set GitHub token".
 *   3. Paste the token. Counts then load with a single GraphQL request per repo.
 *
 * Without a token the script stays dormant and makes no requests.
 */

(() => {
	"use strict";

	const NS = "ghplc";
	const STAT_CLASS = `${NS}-diffstat`;
	const SORT_ITEM_CLASS = `${NS}-sort-item`;
	const SORT_PREF_KEY = `${NS}:sort`;
	const TOKEN_KEY = "token";
	const CACHE_PREFIX = `${NS}:cache:`;
	const MAX_CACHE_AGE = 30 * 24 * 60 * 60 * 1000;
	const GRAPHQL_CHUNK = 50;
	const CONCURRENCY = 4;
	const REFRESH_DELAY = 200;
	const API = "https://api.github.com";

	const SORT_MODES = {
		DESC: "lines-desc",
		ASC: "lines-asc"
	};

	const checkIcon = `<svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" class="octicon octicon-check SelectMenu-icon SelectMenu-icon--check">
			<path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
		</svg>`;

	// *** DOM helpers ***
	const $ = (selector, el) => (el || document).querySelector(selector);
	const $$ = (selector, el) =>
		Array.from((el || document).querySelectorAll(selector));

	// Our own injections and row reordering mutate the DOM; pause observation
	// around them so the MutationObserver never reacts to itself.
	const OBSERVE_OPTS = { childList: true, subtree: true };
	let observer = null;

	function withoutObserver(fn) {
		if (observer) {
			observer.disconnect();
		}
		try {
			return fn();
		} finally {
			if (observer && document.body) {
				observer.observe(document.body, OBSERVE_OPTS);
			}
		}
	}

	function addStyle() {
		if (document.getElementById(`${NS}-style`)) {
			return;
		}
		const style = document.createElement("style");
		style.id = `${NS}-style`;
		style.textContent = `
			.${STAT_CLASS} { font-size: 12px; font-weight: 600; white-space: nowrap; }
			.${STAT_CLASS} .additions { color: #1a7f37; }
			.${STAT_CLASS} .deletions { color: #cf222e; }
		`;
		(document.head || document.documentElement).appendChild(style);
	}

	// *** Token (per-user; stored by the userscript manager, not in this file) ***
	function getToken() {
		try {
			return (GM_getValue(TOKEN_KEY, "") || "").trim();
		} catch (err) {
			return "";
		}
	}

	function setToken() {
		const entered = window.prompt(
			"Paste your GitHub token (no scopes needed for public repos).\n" +
			"It is stored only by your userscript manager on this machine.",
			""
		);
		if (entered === null) {
			return;
		}
		const value = entered.trim();
		if (value) {
			GM_setValue(TOKEN_KEY, value);
			window.alert("Token saved. Reloading line counts.");
			scheduleRefresh();
		}
	}

	function clearToken() {
		GM_deleteValue(TOKEN_KEY);
		window.alert("GitHub token cleared.");
	}

	// *** Cache (instant paint on revisits; refreshed by each response) ***
	const cache = {
		read(key) {
			try {
				const raw = localStorage.getItem(CACHE_PREFIX + key);
				if (!raw) {
					return null;
				}
				const entry = JSON.parse(raw);
				if (!entry || Date.now() - entry.time > MAX_CACHE_AGE) {
					localStorage.removeItem(CACHE_PREFIX + key);
					return null;
				}
				return entry;
			} catch (err) {
				return null;
			}
		},
		write(key, value) {
			try {
				localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
					additions: value.additions,
					deletions: value.deletions,
					updatedAt: value.updatedAt || null,
					time: Date.now()
				}));
			} catch (err) {
				// storage full or unavailable - ignore
			}
		}
	};

	// *** GitHub GraphQL API (one request per repo) ***
	const toNumber = value => (typeof value === "number" ? value : 0);

	function gmRequest(options) {
		return new Promise((resolve, reject) => {
			GM_xmlhttpRequest({
				method: options.method,
				url: options.url,
				headers: options.headers,
				data: options.data,
				onload: resolve,
				onerror: () => reject(new Error("network-error")),
				ontimeout: () => reject(new Error("timeout"))
			});
		});
	}

	function buildQuery(owner, repo, numbers) {
		const aliases = numbers.map((number, index) =>
			`p${index}: pullRequest(number: ${number}) ` +
			"{ number additions deletions updatedAt }"
		).join(" ");
		return `query { repository(owner: "${owner}", name: "${repo}") { ${aliases} } }`;
	}

	function graphqlBatch(owner, repo, numbers) {
		const token = getToken();
		if (!token) {
			return Promise.reject(new Error("no-token"));
		}
		return gmRequest({
			method: "POST",
			url: `${API}/graphql`,
			headers: {
				Authorization: `bearer ${token}`,
				"Content-Type": "application/json"
			},
			data: JSON.stringify({ query: buildQuery(owner, repo, numbers) })
		}).then(response => {
			if (response.status === 401) {
				throw new Error("bad-token");
			}
			if (response.status !== 200) {
				throw new Error(`HTTP ${response.status}`);
			}
			const json = JSON.parse(response.responseText);
			const repoData = json && json.data && json.data.repository;
			const result = {};
			if (repoData) {
				Object.keys(repoData).forEach(alias => {
					const pull = repoData[alias];
					if (pull && typeof pull.number !== "undefined") {
						result[String(pull.number)] = {
							additions: toNumber(pull.additions),
							deletions: toNumber(pull.deletions),
							updatedAt: pull.updatedAt || null
						};
					}
				});
			}
			return result;
		});
	}

	// *** Rows ***
	function getTitleLink(row) {
		return (
			$("a[data-hovercard-type=\"pull_request\"].markdown-title", row) ||
			$("a.markdown-title[href*=\"/pull/\"]", row) ||
			$("a.js-navigation-open[href*=\"/pull/\"]", row)
		);
	}

	function parsePull(link) {
		if (!link) {
			return null;
		}
		const href = link.getAttribute("href") || link.href || "";
		const match = href.match(/\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:[/?#]|$)/);
		return match
			? { owner: match[1], repo: match[2], number: match[3] }
			: null;
	}

	function getPullRows() {
		return $$(".js-issue-row").filter(getTitleLink);
	}

	function getMetaContainer(row) {
		return $(".opened-by", row) || $("div.mt-1.text-small", row);
	}

	function statHtml(additions, deletions) {
		return `<span class="${STAT_CLASS}">` +
			`<span class="additions">+${additions}</span> ` +
			`<span class="deletions">-${deletions}</span></span>`;
	}

	function renderStats(row, additions, deletions) {
		const meta = getMetaContainer(row);
		if (!meta) {
			return;
		}
		row.dataset[`${NS}Loaded`] = "1";
		row.dataset[`${NS}Total`] = String(additions + deletions);

		withoutObserver(() => {
			const existing = $(`.${STAT_CLASS}`, row);
			if (existing) {
				existing.outerHTML = statHtml(additions, deletions);
			} else {
				meta.insertAdjacentHTML("beforeend", ` &bull; ${statHtml(additions, deletions)}`);
			}
		});
	}

	function pendingDescriptors() {
		const result = [];
		getPullRows().forEach(row => {
			if (row.dataset[`${NS}Loaded`] === "1") {
				return;
			}
			const pull = parsePull(getTitleLink(row));
			if (pull) {
				result.push({
					row,
					pull,
					key: `${pull.owner}/${pull.repo}/${pull.number}`
				});
			}
		});
		return result;
	}

	function runPool(items, worker, concurrency) {
		let index = 0;
		const next = () => {
			if (index >= items.length) {
				return Promise.resolve();
			}
			const item = items[index++];
			return Promise.resolve(worker(item)).then(next);
		};
		const starters = [];
		const count = Math.min(concurrency, items.length);
		for (let i = 0; i < count; i++) {
			starters.push(next());
		}
		return Promise.all(starters);
	}

	function groupByRepo(descriptors) {
		const groups = {};
		descriptors.forEach(d => {
			const repoKey = `${d.pull.owner}/${d.pull.repo}`;
			(groups[repoKey] = groups[repoKey] || []).push(d);
		});
		return groups;
	}

	function chunk(items, size) {
		const chunks = [];
		for (let i = 0; i < items.length; i += size) {
			chunks.push(items.slice(i, i + size));
		}
		return chunks;
	}

	function processAllRows() {
		if (!getToken()) {
			return Promise.resolve();
		}
		const descriptors = pendingDescriptors();
		if (!descriptors.length) {
			return Promise.resolve();
		}

		// Optimistic paint from cache so revisits show instantly.
		descriptors.forEach(d => {
			const cached = cache.read(d.key);
			if (cached) {
				renderStats(d.row, cached.additions, cached.deletions);
			}
		});

		const groups = groupByRepo(descriptors);
		const repoJobs = Object.keys(groups).map(repoKey => {
			const items = groups[repoKey];
			const { owner, repo } = items[0].pull;
			const byNumber = {};
			items.forEach(d => {
				byNumber[d.pull.number] = d;
			});

			const numberChunks = chunk(Object.keys(byNumber), GRAPHQL_CHUNK);
			return runPool(numberChunks, numbers =>
				graphqlBatch(owner, repo, numbers)
					.then(stats => {
						numbers.forEach(number => {
							const entry = stats[number];
							if (entry) {
								cache.write(byNumber[number].key, entry);
								renderStats(byNumber[number].row, entry.additions, entry.deletions);
							}
						});
					})
					.catch(err => {
						if (err && err.message === "bad-token") {
							console.warn(`[${NS}] GitHub token rejected; set a valid token from the menu.`);
						}
						// Leave optimistic/cached values in place on failure.
					})
			, CONCURRENCY);
		});

		return Promise.all(repoJobs);
	}

	// *** Sorting ***
	function sortRows(descending) {
		const container = $(".js-navigation-container");
		if (!container) {
			return;
		}
		const ordered = getPullRows().slice().sort((a, b) => {
			const aLoaded = a.dataset[`${NS}Loaded`] === "1";
			const bLoaded = b.dataset[`${NS}Loaded`] === "1";
			if (aLoaded !== bLoaded) {
				return aLoaded ? -1 : 1;
			}
			const aTotal = Number(a.dataset[`${NS}Total`]) || 0;
			const bTotal = Number(b.dataset[`${NS}Total`]) || 0;
			return descending ? bTotal - aTotal : aTotal - bTotal;
		});

		withoutObserver(() => {
			ordered.forEach(row => container.appendChild(row));
		});
	}

	function markActiveSort(mode) {
		const menu = $("#sort-select-menu");
		if (!menu) {
			return;
		}
		$$(".SelectMenu-item", menu).forEach(item => {
			item.setAttribute("aria-checked", "false");
		});
		const active = $(`.${SORT_ITEM_CLASS}[data-sort="${mode}"]`, menu);
		if (active) {
			active.setAttribute("aria-checked", "true");
		}
	}

	function closeSortMenu() {
		const menu = $("#sort-select-menu");
		if (menu) {
			menu.removeAttribute("open");
		}
	}

	function savePref(mode) {
		try {
			sessionStorage.setItem(SORT_PREF_KEY, mode);
		} catch (err) {
			// ignore
		}
	}

	function readPref() {
		try {
			return sessionStorage.getItem(SORT_PREF_KEY);
		} catch (err) {
			return null;
		}
	}

	function applySort(mode) {
		const descending = mode === SORT_MODES.DESC;
		processAllRows().then(() => {
			sortRows(descending);
			markActiveSort(mode);
			savePref(mode);
			closeSortMenu();
		});
	}

	function sortItemHtml(mode, label) {
		return `<button type="button" class="SelectMenu-item ${SORT_ITEM_CLASS}" role="menuitemradio" data-sort="${mode}" aria-checked="false">${checkIcon}<span>${label}</span></button>`;
	}

	// Re-added whenever missing (GitHub re-renders wipe injected nodes).
	function addSortMenu() {
		const list = $("#sort-select-menu .SelectMenu-list");
		if (!list || $(`.${SORT_ITEM_CLASS}`, list)) {
			return;
		}
		withoutObserver(() => {
			list.insertAdjacentHTML("beforeend",
				"<div class=\"SelectMenu-divider\">Lines changed</div>" +
				sortItemHtml(SORT_MODES.DESC, "Most lines changed") +
				sortItemHtml(SORT_MODES.ASC, "Least lines changed")
			);
		});
		const pref = readPref();
		if (pref) {
			markActiveSort(pref);
		}
	}

	// One delegated handler so re-rendered buttons keep working.
	function installSortHandler() {
		if (document.documentElement.dataset[`${NS}SortHandler`] === "1") {
			return;
		}
		document.documentElement.dataset[`${NS}SortHandler`] = "1";
		document.addEventListener("click", event => {
			const item = event.target.closest(`.${SORT_ITEM_CLASS}`);
			if (!item) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			applySort(item.getAttribute("data-sort"));
		}, true);
	}

	// *** Controller ***
	let refreshTimer = null;
	let refreshing = false;
	let refreshQueued = false;

	function refresh() {
		if (!getToken() || !getPullRows().length) {
			return;
		}
		if (refreshing) {
			refreshQueued = true;
			return;
		}
		refreshing = true;

		addSortMenu();
		processAllRows().then(() => {
			const pref = readPref();
			if (pref === SORT_MODES.DESC || pref === SORT_MODES.ASC) {
				sortRows(pref === SORT_MODES.DESC);
				markActiveSort(pref);
			}
		}).finally(() => {
			refreshing = false;
			if (refreshQueued) {
				refreshQueued = false;
				scheduleRefresh();
			}
		});
	}

	function scheduleRefresh() {
		clearTimeout(refreshTimer);
		refreshTimer = setTimeout(refresh, REFRESH_DELAY);
	}

	function observeMutations() {
		observer = new MutationObserver(mutations => {
			for (const mutation of mutations) {
				for (const node of mutation.addedNodes) {
					if (node.nodeType === 1) {
						scheduleRefresh();
						return;
					}
				}
			}
		});
		observer.observe(document.body, OBSERVE_OPTS);
	}

	function init() {
		GM_registerMenuCommand("Set GitHub token for PR line counts", setToken);
		GM_registerMenuCommand("Clear GitHub token", clearToken);
		addStyle();
		installSortHandler();
		observeMutations();

		["turbo:load", "turbo:render", "turbo:frame-render", "pjax:end"].forEach(name => {
			document.addEventListener(name, scheduleRefresh);
		});

		if (!getToken()) {
			console.info(
				`[${NS}] No GitHub token set. Use the userscript manager menu ` +
				"(\"Set GitHub token for PR line counts\") to enable line counts."
			);
		}

		scheduleRefresh();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
