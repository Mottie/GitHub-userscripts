// ==UserScript==
// @name        GitHub Custom Hotkeys
// @version     1.0.26
// @description A userscript that allows you to add custom GitHub keyboard hotkeys
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @include     https://*.github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-custom-hotkeys.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-custom-hotkeys.user.js
// ==/UserScript==
(() => {
	"use strict";
	/* "g p" here overrides the GitHub default "g p" which takes you to the Pull Requests page
	{
		"all": [
			{ "f1" : "#hotkey-settings" },
			{ "g g": "{repo}/graphs/code-frequency" },
			{ "g p": "{repo}/pulse" },
			{ "g u": "{user}" },
			{ "g s": "{upstream}" }
		],
		"{repo}/issues": [
			{ "g right": "{issue+1}" },
			{ "g left" : "{issue-1}" }
		],
		"{root}/search": [
			{ "g right": "{page+1}" },
			{ "g left" : "{page-1}" }
		]
	}
	*/
	let data = GM_getValue("github-hotkeys", {
			all: [{
				f1: "#hotkey-settings"
			}]
		}),
		lastHref = window.location.href;

	const openHash = "#hotkey-settings",

		templates = {
			remove: "<svg class='ghch-remove octicon' fill='currentColor' xmlns='http://www.w3.org/2000/svg' width='9' height='9' viewBox='0 0 9 9'><path d='M9 1L5.4 4.4 9 8 8 9 4.6 5.4 1 9 0 8l3.6-3.5L0 1l1-1 3.5 3.6L8 0l1 1z'/></svg>",
			hotkey: "Hotkey: <input type='text' class='ghch-hotkey form-control'>&nbsp; URL: <input type='text' class='ghch-url form-control'>",
			scope: "<ul><li class='ghch-hotkey-add'>+ Click to add a new hotkey</li></ul>"
		},

		// https://github.com/{nonUser}
		// see https://github.com/Mottie/github-reserved-names
		nonUser = new RegExp("^(" + [
			/* BUILD:RESERVED-NAMES-START (v1.1.8) */
			"400", "401", "402", "403", "404", "405", "406", "407", "408", "409", 
			"410", "411", "412", "413", "414", "415", "416", "417", "418", "419", 
			"420", "421", "422", "423", "424", "425", "426", "427", "428", "429", 
			"430", "431", "500", "501", "502", "503", "504", "505", "506", "507", 
			"508", "509", "510", "511", "about", "access", "account", "admin", 
			"anonymous", "any", "api", "apps", "attributes", "auth", "billing", 
			"blob", "blog", "bounty", "branches", "business", "businesses", "c", 
			"cache", "case-studies", "categories", "central", "certification", 
			"changelog", "cla", "cloud", "codereview", "collection", 
			"collections", "comments", "commit", "commits", "community", 
			"companies", "compare", "contact", "contributing", "cookbook", 
			"coupons", "customer", "customers", "dashboard", "dashboards", 
			"design", "develop", "developer", "diff", "discover", "discussions", 
			"docs", "downloads", "downtime", "editor", "editors", "edu", 
			"enterprise", "events", "explore", "featured", "features", "files", 
			"fixtures", "forked", "garage", "ghost", "gist", "gists", "graphs", 
			"guide", "guides", "help", "help-wanted", "home", "hooks", "hosting", 
			"hovercards", "identity", "images", "inbox", "individual", "info", 
			"integration", "interfaces", "introduction", "invalid-email-address", 
			"investors", "issues", "jobs", "join", "journal", "journals", "lab", 
			"labs", "languages", "launch", "layouts", "learn", "legal", "library", 
			"linux", "listings", "lists", "login", "logos", "logout", "mac", 
			"maintenance", "malware", "man", "marketplace", "mention", 
			"mentioned", "mentioning", "mentions", "migrating", "milestones", 
			"mine", "mirrors", "mobile", "navigation", "network", "new", "news", 
			"none", "nonprofit", "nonprofits", "notices", "notifications", 
			"oauth", "offer", "open-source", "organisations", "organizations", 
			"orgs", "pages", "partners", "payments", "personal", "plans", 
			"plugins", "popular", "popularity", "posts", "press", "pricing", 
			"professional", "projects", "pulls", "raw", "readme", 
			"recommendations", "redeem", "releases", "render", "reply", 
			"repositories", "resources", "restore", "revert", 
			"save-net-neutrality", "saved", "scraping", "search", "security", 
			"services", "sessions", "settings", "shareholders", "shop", 
			"showcases", "signin", "signup", "site", "spam", "sponsors", "ssh", 
			"staff", "starred", "stars", "static", "status", "statuses", 
			"storage", "store", "stories", "styleguide", "subscriptions", 
			"suggest", "suggestion", "suggestions", "support", "suspended", 
			"talks", "teach", "teacher", "teachers", "teaching", "teams", "ten", 
			"terms", "timeline", "topic", "topics", "tos", "tour", "train", 
			"training", "translations", "tree", "trending", "updates", "username", 
			"users", "visualization", "w", "watching", "wiki", "windows", 
			"works-with", "www0", "www1", "www2", "www3", "www4", "www5", "www6", 
			"www7", "www8", "www9"
			/* BUILD:RESERVED-NAMES-END */
		].join("|") + ")$");

	function getUrlParts() {
		const loc = window.location,
			root = "https://github.com",
			parts = {
				root,
				origin: loc.origin,
				page: ""
			};
		// me
		let tmp = $("meta[name='user-login']");
		parts.m = tmp && tmp.getAttribute("content") || "";
		parts.me = parts.m ? parts.root + "/" + parts.m : "";

		// pathname "should" always start with a "/"
		tmp = loc.pathname.split("/");

		// user name
		if (nonUser.test(tmp[1] || "")) {
			// invalid user! clear out the values
			tmp = [];
		}
		parts.u = tmp[1] || "";
		parts.user = tmp[1] ? root + "/" + tmp[1] : "";
		// repo name
		parts.r = tmp[2] || "";
		parts.repo = tmp[1] && tmp[2] ? parts.user + "/" + tmp[2] : "";
		// tab?
		parts.t = tmp[3] || "";
		parts.tab = tmp[3] ? parts.repo + "/" + tmp[3] : "";
		if (parts.t === "issues" || parts.t === "pulls") {
			// issue number
			parts.issue = tmp[4] || "";
		}
		// branch/tag?
		if (parts.t === "tree" || parts.t === "blob") {
			parts.branch = tmp[4] || "";
		} else if (parts.t === "releases" && tmp[4] === "tag") {
			parts.branch = tmp[5] || "";
		}
		// commit hash?
		if (parts.t === "commit") {
			parts.commit = tmp[4] || "";
		}
		// forked from
		tmp = $(".repohead .fork-flag a");
		parts.upstream = tmp ? tmp.getAttribute("href") : "";
		// current page
		tmp = loc.search.match(/[&?]p(?:age)?=(\d+)/);
		parts.page = tmp ? tmp[1] || "1" : "";
		return parts;
	}

	// pass true to initialize; false to remove everything
	function checkScope() {
		removeElms($("body"), ".ghch-link");
		const parts = getUrlParts();
		Object.keys(data).forEach(key => {
			const url = fixUrl(parts, key === "all" ? "{root}" : key);
			if (window.location.href.indexOf(url) > -1) {
				debug("Checking custom hotkeys for " + key);
				addHotkeys(parts, url, data[key]);
			}
		});
	}

	function fixUrl(parts, url) {
		let valid = true; // use true in case a full URL is used
		url = url
			// allow {issues+#} to go inc or desc
			.replace(/\{issue([\-+]\d+)?\}/, (s, n) => {
				const val = n ? parseInt(parts.issue || "", 10) + parseInt(n, 10) : "";
				valid = val !== "" && val > 0;
				return valid ? parts.tab + "/" + val : "";
			})
			// allow {page+#} to change results page
			.replace(/\{page([\-+]\d+)?\}/, (s, n) => {
				const loc = window.location,
					val = n ? parseInt(parts.page || "", 10) + parseInt(n, 10) : "";
				let search;
				valid = val !== "" && val > 0;
				if (valid) {
					search = loc.origin + loc.pathname;
					if (loc.search.match(/[&?]p?=\d+/)) {
						search += loc.search.replace(/([&?]p=)\d+/, (s, n) => {
							return n + val;
						});
					} else {
						// started on page 1 (no &p=1) available to replace
						search += loc.search + "&p=" + val;
					}
				}
				return valid ? search : "";
			})
			// replace placeholders
			.replace(/\{\w+\}/gi, matches => {
				const val = parts[matches.replace(/[{}]/g, "")] || "";
				valid = val !== "";
				return val;
			});
		return valid ? url : "";
	}

	function removeElms(src, selector) {
		const links = $$(selector, src);
		let len = links.length;
		while (len--) {
			src.removeChild(links[len]);
		}
	}

	function addHotkeys(parts, scope, hotkeys) {
		// Shhh, don't tell anyone, but GitHub checks the data-hotkey attribute
		// of any link on the page, so we only need to add dummy links :P
		let indx, url, key, link;
		const len = hotkeys.length,
			body = $("body");
		for (indx = 0; indx < len; indx++) {
			key = Object.keys(hotkeys[indx])[0];
			url = fixUrl(parts, hotkeys[indx][key]);
			if (url) {
				link = document.createElement("a");
				link.className = "ghch-link";
				link.href = url;
				link.setAttribute("data-hotkey", key);
				body.appendChild(link);
				debug("Adding '" + key + "' keyboard hotkey linked to: " + url);
			}
		}
	}

	function addHotkey(el) {
		const li = document.createElement("li");
		li.className = "ghch-hotkey-set";
		li.innerHTML = templates.hotkey + templates.remove;
		el.parentNode.insertBefore(li, el);
		return li;
	}

	function addScope(el) {
		const scope = document.createElement("fieldset");
		scope.className = "ghch-scope-custom";
		scope.innerHTML = `
			<legend>
				<span class="simple-box" contenteditable>Enter Scope</span>&nbsp;
				${templates.remove}
			</legend>
			${templates.scope}
		`;
		el.parentNode.insertBefore(scope, el);
		return scope;
	}

	function addMenu() {
		GM_addStyle(`
			#ghch-open-menu { cursor:pointer; }
			#ghch-menu { position:fixed; z-index: 65535; top:0; bottom:0; left:0; right:0; opacity:0; visibility:hidden; }
			#ghch-menu.ghch-open { opacity:1; visibility:visible; background:rgba(0,0,0,.5); }
			#ghch-settings-inner { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); width:25rem; box-shadow:0 .5rem 1rem #111; }
			#ghch-settings-inner h3 .btn { float:right; font-size:.8em; padding:0 6px 2px 6px; margin-left:3px; }
			.ghch-remove, .ghch-remove svg, #ghch-settings-inner .ghch-close svg { vertical-align:middle; cursor:pointer; }
			.ghch-menu-inner { max-height:60vh; overflow-y:auto; }
			.ghch-menu-inner ul { list-style:none; }
			.ghch-menu-inner li { white-space:pre; margin-bottom:4px; }
			.ghch-scope-all, .ghch-scope-add, .ghch-scope-custom { width:100%; border:2px solid rgba(85,85,85,0.5); border-radius:4px; padding:10px; margin:0; }
			.ghch-scope-add, .ghch-hotkey-add { border:2px dashed #555; border-radius:4px; opacity:0.6; text-align:center; cursor:pointer; margin-top:10px; }
			.ghch-scope-add:hover, .ghch-hotkey-add:hover { opacity:1;  }
			.ghch-menu-inner legend span { padding:0 6px; min-width:30px; border:0; }
			.ghch-hotkey { width:60px; }
			.ghch-menu-inner li .ghch-remove { margin-left:10px; }
			.ghch-menu-inner li .ghch-remove:hover, .ghch-menu-inner legend .ghch-remove:hover { color:#800; }
			.ghch-json-code { display:none; font-family:Menlo, Inconsolata, 'Droid Mono', monospace; font-size:1em; }
			.ghch-json-code.ghch-open { position:absolute; top:37px; bottom:0; left:2px; right:2px; z-index:0; width:396px; max-width:396px; max-height:calc(100% - 37px); display:block; }
		`);

		// add menu
		let menu = document.createElement("div");
		menu.id = "ghch-menu";
		menu.innerHTML = `
			<div id="ghch-settings-inner" class="boxed-group">
				<h3>
					GitHub Custom Hotkey Settings
					<button type="button" class="btn btn-sm ghch-close tooltipped tooltipped-n" aria-label="Close";>
						${templates.remove}
					</button>
					<button type="button" class="ghch-code btn btn-sm tooltipped tooltipped-n" aria-label="Toggle JSON data view">{ }</button>
					<a href="https://github.com/Mottie/GitHub-userscripts/wiki/GitHub-custom-hotkeys" class="ghch-help btn btn-sm tooltipped tooltipped-n" aria-label="Get Help">?</a>
				</h3>
				<div class="ghch-menu-inner boxed-group-inner">
					<fieldset class="ghch-scope-all">
						<legend>
							<span class="simple-box" data-scope="all">All of GitHub &amp; subdomains</span>
						</legend>
						${templates.scope}
					</fieldset>
					<div class="ghch-scope-add">+ Click to add a new scope</div>
					<textarea class="ghch-json-code"></textarea>
				</div>
			</div>
		`;
		$("body").appendChild(menu);
		// Create our menu entry
		menu = document.createElement("a");
		menu.id = "ghch-open-menu";
		menu.className = "dropdown-item";
		menu.innerHTML = "GitHub Hotkey Settings";

		const els = $$(`
			.header .dropdown-item[href="/settings/profile"],
			.header .dropdown-item[data-ga-click*="go to profile"],
			.Header .dropdown-item[href="/settings/profile"],
			.Header .dropdown-item[data-ga-click*="go to profile"],
			.js-header-wrapper .dropdown-item[href="/settings/profile"],
			.js-header-wrapper .dropdown-item[data-ga-click*="go to profile"]
		`);
		if (els.length) {
			els[els.length - 1].parentNode.insertBefore(menu, els[els.length - 1].nextSibling);
		}
		addBindings();
	}

	function openPanel() {
		updateMenu();
		$("#ghch-menu").classList.add("ghch-open");
		return false;
	}

	function closePanel() {
		const menu = $("#ghch-menu");
		if (menu.classList.contains("ghch-open")) {
			// update data in case a "change" event didn't fire
			refreshData();
			checkScope();
			menu.classList.remove("ghch-open");
			$(".ghch-json-code", menu).classList.remove("ghch-open");
			window.location.hash = "";
			return false;
		}
	}

	function addJSON() {
		const textarea = $(".ghch-json-code");
		textarea.value = JSON
			.stringify(data, null, 2)
			// compress JSON a little
			.replace(/\n\s{4}\}/g, " }")
			.replace(/\{\n\s{6}/g, "{ ");
	}

	function processJSON() {
		let val;
		const textarea = $(".ghch-json-code");
		try {
			val = JSON.parse(textarea.value);
			data = val;
		} catch (err) {}
	}

	function updateMenu() {
		const menu = $(".ghch-menu-inner");
		removeElms(menu, ".ghch-scope-custom");
		removeElms($(".ghch-scope-all ul", menu), ".ghch-hotkey-set");
		let scope, selector;
		// Add scopes
		Object.keys(data).forEach(key => {
			if (key === "all") {
				selector = "all";
				scope = $(".ghch-scope-all .ghch-hotkey-add", menu);
			} else if (key !== selector) {
				selector = key;
				scope = addScope($(".ghch-scope-add"));
				$("legend span", scope).innerHTML = key;
				scope = $(".ghch-hotkey-add", scope);
			}
			// add hotkey entries
			// eslint-disable-next-line no-loop-func
			data[key].forEach(val => {
				const target = addHotkey(scope),
					tmp = Object.keys(val)[0];
				$(".ghch-hotkey", target).value = tmp;
				$(".ghch-url", target).value = val[tmp];
			});
		});
	}

	function refreshData() {
		data = {};
		let tmp, scope, sIndx, hotkeys, scIndx, scLen, val;
		const menu = $(".ghch-menu-inner"),
			scopes = $$("fieldset", menu),
			sLen = scopes.length;
		for (sIndx = 0; sIndx < sLen; sIndx++) {
			tmp = $("legend span", scopes[sIndx]);
			if (tmp) {
				scope = tmp.getAttribute("data-scope") || tmp.textContent.trim();
				hotkeys = $$(".ghch-hotkey-set", scopes[sIndx]);
				scLen = hotkeys.length;
				data[scope] = [];
				for (scIndx = 0; scIndx < scLen; scIndx++) {
					tmp = $$("input", hotkeys[scIndx]);
					val = (tmp[0] && tmp[0].value) || "";
					if (val) {
						data[scope][scIndx] = {};
						data[scope][scIndx][val] = tmp[1].value || "";
					}
				}
			}
		}
		GM_setValue("github-hotkeys", data);
		debug("Data refreshed", data);
	}

	function addBindings() {
		let tmp;
		const menu = $("#ghch-menu");

		// open menu
		on($("#ghch-open-menu"), "click", openPanel);
		// close menu
		on(menu, "click", closePanel);
		on($("body"), "keydown", event => {
			if (event.which === 27) {
				closePanel();
			}
		});
		// stop propagation
		on($("#ghch-settings-inner", menu), "keydown", event => {
			event.stopPropagation();
		});
		on($("#ghch-settings-inner", menu), "click", event => {
			event.stopPropagation();
			let target = event.target;
			// add hotkey
			if (target.classList.contains("ghch-hotkey-add")) {
				addHotkey(target);
			} else if (target.classList.contains("ghch-scope-add")) {
				addScope(target);
			}
			// svg & path nodeName may be lowercase
			tmp = target.nodeName.toLowerCase();
			if (tmp === "path") {
				target = target.parentNode;
			}
			// target should now point at svg
			if (target.classList.contains("ghch-remove")) {
				tmp = target.parentNode;
				// remove fieldset
				if (tmp.nodeName === "LEGEND") {
					tmp = tmp.parentNode;
				}
				// remove li; but not the button in the header
				if (tmp.nodeName !== "BUTTON") {
					tmp.parentNode.removeChild(tmp);
					refreshData();
				}
			}
		});
		on(menu, "change", refreshData);
		// contenteditable scope title
		on(menu, "input", event => {
			if (event.target.classList.contains("simple-box")) {
				refreshData();
			}
		});
		on($("button.ghch-close", menu), "click", closePanel);
		// open JSON code textarea
		on($(".ghch-code", menu), "click", () => {
			$(".ghch-json-code", menu).classList.toggle("ghch-open");
			addJSON();
		});
		// close JSON code textarea
		tmp = $(".ghch-json-code", menu);
		on(tmp, "focus", function () {
			this.select();
		});
		on(tmp, "paste", () => {
			setTimeout(() => {
				processJSON();
				updateMenu();
				$(".ghch-json-code").classList.remove("ghch-open");
			}, 200);
		});

		// This is crazy! But window.location.search changes do not fire the
		// "popstate" or "hashchange" event, so we're stuck with a setInterval
		setInterval(() => {
			const loc = window.location;
			if (lastHref !== loc.href) {
				lastHref = loc.href;
				checkScope();
				// open panel via hash
				if (loc.hash === openHash) {
					openPanel();
				}
			}
		}, 1000);
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	function $$(str, el) {
		return Array.from((el || document).querySelectorAll(str));
	}

	function on(els, name, callback) {
		els = Array.isArray(els) ? els : [els];
		const events = name.split(/\s+/);
		els.forEach(el => {
			if (el) {
				events.forEach(ev => {
					el.addEventListener(ev, callback);
				});
			}
		});
	}

	// include a "debug" anywhere in the browser URL (search parameter) to enable debugging
	function debug() {
		if (/debug/.test(window.location.search)) {
			console.log.apply(console, arguments);
		}
	}

	// initialize
	checkScope();
	addMenu();
})();
