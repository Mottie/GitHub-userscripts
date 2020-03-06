// ==UserScript==
// @name        GitHub Issue Comments
// @version     1.4.4
// @description A userscript that toggles issues/pull request comments & messages
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-comments.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-issue-comments.user.js
// ==/UserScript==
(() => {
	"use strict";

	GM_addStyle(`
		.ghic-button { float:right; }
		.ghic-button .btn:hover div.select-menu-modal-holder { display:block; top:auto; bottom:25px; right:0; }
		.ghic-right { position:absolute; right:10px; top:9px; }
		.ghic-button .select-menu-header, .ghic-participants { cursor:default; display:block; }
		.ghic-participants { border-top:1px solid #484848; padding:15px; }
		.ghic-avatar { display:inline-block; float:left; margin: 0 2px 2px 0; cursor:pointer; position:relative; }
		.ghic-avatar:last-child { margin-bottom:5px; }
		.ghic-avatar.comments-hidden svg { display:block; position:absolute; top:-2px; left:-2px; z-index:1; }
		.ghic-avatar.comments-hidden img { opacity:0.5; }
		.ghic-button .dropdown-item { font-weight:normal; position:relative; }
		.ghic-button .dropdown-item span { font-weight:normal; opacity:.5; }
		.ghic-button .dropdown-item.ghic-has-content span { opacity:1; }
		.ghic-button .dropdown-item.ghic-checked span { font-weight:bold; }
		.ghic-button .dropdown-item.ghic-checked svg,
			.ghic-button .dropdown-item:not(.ghic-checked) .ghic-count { display:inline-block; }
		.ghic-button .dropdown-item:not(.ghic-checked) { text-decoration:line-through; }
		.ghic-button .ghic-count { margin-left:5px; }
		.ghic-button .select-menu-modal { margin:0; }
		.ghic-button .ghic-participants { margin-bottom:20px; }
		/* for testing: ".ghic-hidden { opacity: 0.3; } */
		body .ghic-hidden { display:none !important; }
		.ghic-hidden-participant, body .ghic-avatar svg, .dropdown-item.ghic-checked .ghic-count,
			.ghic-hide-reactions .TimelineItem .comment-reactions,
			.select-menu-header.ghic-active + .select-menu-list .dropdown-item:not(.ghic-has-content) { display:none; }
		.ghic-menu-wrapper input[type=checkbox] { height:0; width:0; visibility:hidden; position:absolute; }
		.ghic-menu-wrapper .ghic-toggle { cursor:pointer; text-indent:-9999px; width:20px; height:10px;
			background:grey; display:block; border-radius:10px; position:relative; }
		.ghic-menu-wrapper .ghic-toggle:after { content:''; position:absolute; top:0; left:1px; width:9px;
			height:9px; background:#fff; border-radius:9px; transition:.3s; }
		.ghic-menu-wrapper input:checked + .ghic-toggle { background:#070; }
		.ghic-menu-wrapper input:checked + .ghic-toggle:after { top:0; left:calc(100% - 1px);
			transform:translateX(-100%); }
		.ghic-menu-wrapper .ghic-toggle:active:after { width:13px; }
		.TimelineItem.ghic-highlight .comment { border-color:#800 !important; }
`);

	const regex = /(svg|path)/i;
	// ZenHub addon active (include ZenHub Enterprise)
	const hasZenHub = $(".zhio, .zhe") ? true : false;

	const exceptions = [
		"ghsr-sort-block" // sort reactions block (github-sort-reactions.user.js)
	];

	const settings = {
		// example: https://github.com/Mottie/Keyboard/issues/448
		title: {
			isHidden: false,
			name: "ghic-title",
			selector: ".TimelineItem-badge .octicon-pencil",
			containsText: "changed the title",
			label: "Title Changes"
		},
		labels: {
			isHidden: false,
			name: "ghic-labels",
			selector: ".TimelineItem-badge .octicon-tag",
			containsText: "label",
			label: "Label Changes"
		},
		state: {
			isHidden: false,
			name: "ghic-state",
			selector: `.TimelineItem-badge .octicon-primitive-dot,
				.TimelineItem-badge .octicon-circle-slash`,
			label: "State Changes (close/reopen)"
		},

		// example: https://github.com/jquery/jquery/issues/2986
		milestone: {
			isHidden: false,
			name: "ghic-milestone",
			selector: ".TimelineItem-badge .octicon-milestone",
			label: "Milestone Changes"
		},
		refs: {
			isHidden: false,
			name: "ghic-refs",
			selector: ".TimelineItem-badge .octicon-bookmark",
			containsText: "referenced",
			label: "References"
		},
		mentioned: {
			isHidden: false,
			name: "ghic-mentions",
			selector: ".TimelineItem-badge .octicon-bookmark",
			containsText: "mentioned",
			label: "Mentioned"
		},
		assigned: {
			isHidden: false,
			name: "ghic-assigned",
			selector: ".TimelineItem-badge .octicon-person",
			label: "Assignment Changes"
		},

		// Pull Requests
		commits: {
			isHidden: false,
			name: "ghic-commits",
			selector: `.TimelineItem-badge .octicon-repo-push,
				.TimelineItem-badge .octicon-git-commit`,
			wrapper: ".js-timeline-item",
			label: "Commits"
		},
		forcePush: {
			isHidden: false,
			name: "ghic-force-push",
			selector: ".TimelineItem-badge .octicon-repo-force-push",
			label: "Force Push"
		},
		// example: https://github.com/jquery/jquery/pull/3014
		reviews: {
			isHidden: false,
			name: "ghic-reviews",
			selector: `.TimelineItem-badge .octicon-eye, .TimelineItem-badge .octicon-x,
				.TimelineItem-badge .octicon-check, .js-resolvable-timeline-thread-container`,
			wrapper: ".js-timeline-item",
			label: "Reviews (All)"
		},
		outdated: {
			isHidden: false,
			name: "ghic-outdated",
			selector: ".js-resolvable-timeline-thread-container .Label--outline[title*='Outdated']",
			wrapper: ".js-resolvable-timeline-thread-container",
			label: "- Reviews (Outdated)"
		},
		resolved: {
			isHidden: false,
			name: "ghic-resolved",
			selector: ".js-resolvable-timeline-thread-container[data-resolved='true']",
			label: "- Reviews (Resolved)"
		},
		diffNew: {
			isHidden: false,
			name: "ghic-diffNew",
			selector: ".js-resolvable-timeline-thread-container",
			notSelector: ".Label--outline[title*='Outdated']",
			wrapper: ".js-resolvable-timeline-thread-container",
			label: "- Reviews (Current)"
		},
		// example: https://github.com/jquery/jquery/pull/2949
		merged: {
			isHidden: false,
			name: "ghic-merged",
			selector: ".TimelineItem-badge .octicon-git-merge",
			label: "Merged"
		},
		integrate: {
			isHidden: false,
			name: "ghic-integrate",
			selector: ".TimelineItem-badge .octicon-rocket",
			label: "Integrations"
		},
		// bot: {
		// 	isHidden: false,
		// 	name: "ghic-bot",
		// 	selector: ".Label--outline",
		// 	containsText: "bot",
		// 	label: "Bot"
		// },
		// similar comments
		similar: {
			isHidden: false,
			name: "ghic-similar",
			selector: `.js-discussion > .Details-element.details-reset:not([open]),
				#js-progressive-timeline-item-container > .Details-element.details-reset:not([open])`,
			label: "Similar comments"
		},

		// extras (special treatment - no selector)
		plus1: {
			isHidden: false,
			name: "ghic-plus1",
			label: "+1 Comments",
			callback: hidePlus1,
		},
		reactions: {
			isHidden: false,
			name: "ghic-reactions",
			label: "Reactions",
			callback: hideReactions,
		},
		projects: {
			isHidden: false,
			name: "ghic-projects",
			selector: `.discussion-item-added_to_project,
				.discussion-item-moved_columns_in_project,
				.discussion-item-removed_from_project`,
			label: "Project Changes"
		},
		// Jenkins auto-merged
		autoMerged: {
			isHidden: false,
			name: "ghic-automerged",
			selector: ".Details a[title*='auto-merged' i]",
			label: "Auto merged"
		},
		// Jenkins temp deployments that have become inactive
		inactive: {
			isHidden: false,
			name: "ghic-inactive",
			selector: ".deployment-status-label.is-inactive, .Label[title*='inactive' i]",
			label: "Inactive deployments"
		},
		// page with lots of users to hide:
		// https://github.com/isaacs/github/issues/215
		// ZenHub pipeline change
		pipeline: {
			isHidden: false,
			name: "ghic-pipeline",
			selector: ".TimelineItem-badge .zh-icon-board-small",
			label: "ZenHub Pipeline Changes"
		}
	};

	const iconHidden = `<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 9 9"><path fill="#777" d="M7.07 4.5c0-.47-.12-.9-.35-1.3L3.2 6.7c.4.25.84.37 1.3.37.35 0 .68-.07 1-.2.32-.14.6-.32.82-.55.23-.23.4-.5.55-.82.13-.32.2-.65.2-1zM2.3 5.8l3.5-3.52c-.4-.23-.83-.35-1.3-.35-.35 0-.68.07-1 .2-.3.14-.6.32-.82.55-.23.23-.4.5-.55.82-.13.32-.2.65-.2 1 0 .47.12.9.36 1.3zm6.06-1.3c0 .7-.17 1.34-.52 1.94-.34.6-.8 1.05-1.4 1.4-.6.34-1.24.52-1.94.52s-1.34-.18-1.94-.52c-.6-.35-1.05-.8-1.4-1.4C.82 5.84.64 5.2.64 4.5s.18-1.35.52-1.94.8-1.06 1.4-1.4S3.8.64 4.5.64s1.35.17 1.94.52 1.06.8 1.4 1.4c.35.6.52 1.24.52 1.94z"/></svg>`;
	const plus1Icon = `<img src="https://github.githubassets.com/images/icons/emoji/unicode/1f44d.png" class="emoji" title=":+1:" alt=":+1:" height="20" width="20" align="absmiddle">`;

	function addMenu() {
		if ($("#discussion_bucket") && !$(".ghic-button")) {
			// update "isHidden" values
			getSettings();
			let name, isHidden, isChecked,
				list = "",
				keys = Object.keys(settings),
				onlyActive = GM_getValue("onlyActive", false),
				header = $(".discussion-sidebar-item:last-child"),
				menu = document.createElement("div");

			for (name of keys) {
				if (!(name === "pipeline" && !hasZenHub)) {
					isHidden = settings[name].isHidden;
					isChecked = isHidden ? "" : "ghic-checked";
					list += `<label class="dropdown-item ${isChecked} ${settings[name].name}" data-ghic="${name}">
							<span>${settings[name].label} <span class="ghic-count"> </span></span>
							<span class="ghic-right">
								<input type="checkbox"${isHidden ? "" : " checked"}>
								<span class="ghic-toggle"></span>
							</span>
						</label>`;
				}
			}

			menu.className = "ghic-button";
			menu.innerHTML = `
				<span class="btn btn-sm" role="button" tabindex="0" aria-haspopup="true">
					<span class="tooltipped tooltipped-w" aria-label="Toggle issue comments">
						<svg class="octicon octicon-comment-discussion" height="16" width="16" role="img" viewBox="0 0 16 16">
							<path d="M15 2H6c-0.55 0-1 0.45-1 1v2H1c-0.55 0-1 0.45-1 1v6c0 0.55 0.45 1 1 1h1v3l3-3h4c0.55 0 1-0.45 1-1V10h1l3 3V10h1c0.55 0 1-0.45 1-1V3c0-0.55-0.45-1-1-1zM9 12H4.5l-1.5 1.5v-1.5H1V6h4v3c0 0.55 0.45 1 1 1h3v2z m6-3H13v1.5l-1.5-1.5H6V3h9v6z"></path>
						</svg>
					</span>
					<div class="select-menu-modal-holder ghic-menu-wrapper">
						<div class="select-menu-modal" aria-hidden="true">
							<div class="select-menu-header ${onlyActive ? "ghic-active" : ""}" tabindex="-1">
								<span class="select-menu-title">Toggle items</span>
								<label class="ghic-right tooltipped tooltipped-w" aria-label="Only show active items">
									<input id="ghic-only-active" type="checkbox" ${onlyActive ? "checked" : ""}>
									<span class="ghic-toggle"></span>
								</label>
							</div>
							<div class="select-menu-list ghic-menu" role="menu">
								${list}
								<div class="ghic-participants">
									<p><strong>Hide Comments from</strong></p>
									<div class="ghic-list"></div>
								</div>
							</div>
						</div>
					</div>
				</span>
			`;
			if (hasZenHub) {
				header.insertBefore(menu, header.childNodes[0]);
			} else {
				header.appendChild(menu);
			}
			addAvatars();
		}
		update();
	}

	function addAvatars() {
		let indx = 0;
		let str = "";
		const list = $(".ghic-list");
		const unique = $$("span.ghic-avatar", list).map(el => el.getAttribute("aria-label"));
		// get all avatars
		const avatars = $$(".TimelineItem-avatar img");
		const len = avatars.length - 1; // last avatar is the new comment with the current user
		const updateAvatars = () => {
			list.innerHTML += str;
			str = "";
		};

		const loop = () => {
			let el, name;
			let max = 0;
			while (max < 50 && indx <= len) {
				if (indx > len) {
					return updateAvatars();
				}
				el = avatars[indx];
				name = (el.getAttribute("alt") || "").replace("@", "");
				if (!unique.includes(name)) {
					str += `<span class="ghic-avatar tooltipped tooltipped-n" aria-label="${name}">
							${iconHidden}
							<img class="ghic-avatar avatar" width="24" height="24" src="${el.src}"/>
						</span>`;
					unique[unique.length] = name;
					max++;
				}
				indx++;
			}
			updateAvatars();
			if (indx < len) {
				setTimeout(() => {
					window.requestAnimationFrame(loop);
				}, 200);
			}
		};
		loop();
	}

	function getSettings() {
		const keys = Object.keys(settings);
		for (let name of keys) {
			settings[name].isHidden = GM_getValue(settings[name].name, false);
		}
	}

	function saveSettings() {
		const keys = Object.keys(settings);
		for (let name of keys) {
			GM_setValue(settings[name].name, settings[name].isHidden);
		}
	}

	function getInputValues() {
		const keys = Object.keys(settings);
		const menu = $(".ghic-menu");
		for (let name of keys) {
			if (!(name === "pipeline" && !hasZenHub)) {
				const item = $(`.${settings[name].name}`, menu).closest(".dropdown-item");
				if (item) {
					settings[name].isHidden = !$("input", item).checked;
					toggleClass(item, "ghic-checked", !settings[name].isHidden);
				}
			}
		}
	}

	function hideStuff(name, init) {
		const obj = settings[name];
		const item = $(".ghic-menu .dropdown-item." + obj.name);
		if (item) {
			const isHidden = obj.isHidden;
			if (typeof obj.callback === "function") {
				obj.callback({ obj, item, init });
			} else if (obj.selector) {
				let results = $$(obj.selector).map(el =>
					el.closest(obj.wrapper || ".TimelineItem, .Details-element")
				);
				if (obj.containsText) {
					results = results.filter(
						el => el && el.textContent.includes(obj.containsText)
					);
				}
				if (obj.notSelector) {
					results = results.filter(el => el && !$(obj.notSelector, el));
				}
				toggleClass(item, "ghic-checked", !isHidden);
				if (isHidden) {
					const count = addClass(results, "ghic-hidden");
					$(".ghic-count", item).textContent = count ? `(${count} hidden)` : " ";
				} else if (!init) {
					// no need to remove classes on initialization
					removeClass(results, "ghic-hidden");
				}
				toggleClass(item, "ghic-has-content", results.length);
			}
		}
	}

	function hideReactions({ obj, item }) {
		toggleClass($("body"), "ghic-hide-reactions", obj.isHidden);
		toggleClass(item, "ghic-has-content", $$(".has-reactions").length > 0);
		// make first comment reactions visible
		const origPost = $(".TimelineItem .comment-reactions");
		if (origPost && origPost.classList.contains("has-reactions")) {
			origPost.style.display = "block";
		}
	}

	function hidePlus1({ item, init }) {
		let max,
			indx = 0,
			count = 0,
			total = 0;
			// keep a list of post authors to prevent duplicate +1 counts
		const authors = [];
		// used https://github.com/isaacs/github/issues/215 for matches here...
		// matches "+1!!!!", "++1", "+!", "+99!!!", "-1", "+ 100", "thumbs up"; ":+1:^21425235"
		// ignoring -1's... add unicode for thumbs up; it gets replaced with an image in Windows
		const regexPlus = /([?!*,.:^[\]()\'\"+-\d]|bump|thumbs|up|\ud83d\udc4d)/gi;
		// other comments to hide - they are still counted towards the +1 counter (for now?)
		// seen "^^^" to bump posts; "bump plleeaaassee"; "eta?"; "pretty please"
		// "need this"; "right now"; "still nothing?"; "super helpful"; "for gods sake"
		const regexHide = new RegExp("(" + [
			"@\\w+",
			"\\b(it|is|a|so|the|and|no|on|oh|do|this|any|very|much|here|just|my|me|too|want|yet|image)\\b",
			"pretty",
			"pl+e+a+s+e+",
			"plz",
			"totally",
			"y+e+s+",
			"eta",
			"fix",
			"right",
			"now",
			"hope(ful)?",
			"still",
			"wait(ed|ing)?",
			"nothing",
			"really",
			"add(ed|ing)?",
			"need(ed|ing)?",
			"updat(es|ed|ing)?",
			"(months|years)\\slater",
			"back",
			"features?",
			"infinity", // +Infinity
			"useful",
			"super",
			"helpful",
			"thanks",
			"for\\sgod'?s\\ssake",
			"c['emon]+" // c'mon, com'on, comeon
		].join("|") + ")", "gi");
		// image title ":{anything}:", etc.
		const regexEmoji = /(:.*:)|[\u{1f300}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{1f900}-\u{1f9ff}]/gu;
		const regexWhitespace = /\s+/g;

		const comments = $$(".js-discussion .TimelineItem").filter(comment => {
			const classes = comment.className.split(" ");
			return !exceptions.some(ex => classes.includes(ex));
		});
		const len = comments.length;

		const loop = () => {
			let wrapper, el, tmp, txt, img, hasLink, dupe;
			max = 0;
			while (max < 20 && indx < len) {
				if (indx >= len) {
					if (init) {
						item.classList.toggle("ghic-has-content", count > 0);
					}
					return;
				}
				wrapper = comments[indx];
				// save author list to prevent repeat +1s
				el = $(".timeline-comment-header .author", wrapper);
				txt = (el ? el.textContent || "" : "").toLowerCase();
				dupe = true;
				if (txt && authors.indexOf(txt) < 0) {
					authors[authors.length] = txt;
					dupe = false;
				}
				// .js-comments-holder wraps review comments
				el = $(".comment-body, .js-comments-holder", wrapper);
				if (el) {
					// ignore quoted messages, but get all fragments
					tmp = $$(".email-fragment", el);
					// some posts only contain a link to related issues; these should not be counted as a +1
					// see https://github.com/isaacs/github/issues/618#issuecomment-200869630
					hasLink = $$(tmp.length ? ".email-fragment .issue-link" : ".issue-link", el).length;
					if (tmp.length) {
						// ignore quoted messages
						txt = getAllText(tmp);
					} else {
						txt = (el ? el.textContent || "" : "").trim();
					}
					if (!txt) {
						img = $("img", el);
						if (img) {
							txt = img.getAttribute("title") || img.getAttribute("alt");
						}
					}
					// remove fluff
					txt = (txt || "")
						.replace(regexEmoji, "")
						.replace(regexHide, "")
						.replace(regexPlus, "")
						.replace(regexWhitespace, " ")
						.trim();
					if (txt === "" || (txt.length <= 4 && !hasLink)) {
						if (init && !settings.plus1.isHidden) {
							// +1 Comments has-content
							item.classList.toggle("ghic-has-content", true);
							return;
						}
						if (settings.plus1.isHidden) {
							wrapper.classList.add("ghic-hidden", "ghic-highlight");
							total++;
							// one +1 per author
							if (!dupe) {
								count++;
							}
						} else if (!init) {
							wrapper.classList.remove("ghic-hidden");
						}
						max++;
					}
				}
				indx++;
			}
			if (indx < len) {
				setTimeout(() => {
					window.requestAnimationFrame(loop);
				}, 200);
			} else {
				if (init) {
					item.classList.toggle("ghic-has-content", count > 0);
				}
				$(".ghic-menu .ghic-plus1 .ghic-count").textContent = total
					? "(" + total + " hidden)"
					: " ";
				addCountToReaction(count);
			}
		};
		loop();
	}

	function getAllText(els) {
		let txt = "";
		let indx = els.length;
		// text order doesn't matter
		while (indx--) {
			txt += els[indx].textContent.trim();
		}
		return txt;
	}

	function addCountToReaction(count) {
		if (!count) {
			count = ($(".ghic-menu .ghic-plus1 .ghic-count").textContent || "")
				.replace(/[()]/g, "")
				.trim();
		}
		const origPost = $(".timeline-comment");
		const hasPositiveReaction = $(
			".has-reactions button[value='THUMBS_UP react'], .has-reactions button[value='THUMBS_UP unreact']",
			origPost
		);
		let el = $(".ghic-count", origPost);
		if (el) {
			// the count may have been appended to the comment & now
			// there is a reaction, so remove any "ghic-count" elements
			el.parentNode.removeChild(el);
		}
		if (count) {
			if (hasPositiveReaction) {
				el = document.createElement("span");
				el.className = "ghic-count";
				el.textContent = count ? " + " + count + " (from hidden comments)" : "";
				hasPositiveReaction.appendChild(el);
			} else {
				el = document.createElement("p");
				el.className = "ghic-count";
				el.innerHTML = "<hr>" + plus1Icon + " " + count + " (from hidden comments)";
				$(".comment-body", origPost).appendChild(el);
			}
		}
	}

	function hideParticipant(el) {
		if (el) {
			el.classList.toggle("comments-hidden");
			let name = el.getAttribute("aria-label");
			const results = $$(".TimelineItem, .commit-comment, .discussion-item")
				.filter(el => {
					const author = $(".js-discussion .author", el);
					return author ? name === author.textContent.trim() : false;
				});
			// use a different participant class name to hide timeline events
			// or unselecting all users will show everything
			if (el.classList.contains("comments-hidden")) {
				addClass(results, "ghic-hidden-participant");
			} else {
				removeClass(results, "ghic-hidden-participant");
			}
			results = [];
		}
	}

	function update() {
		if ($("#discussion_bucket") && $(".ghic-button")) {
			const keys = Object.keys(settings);
			let indx = keys.length;
			while (indx--) {
				// true flag for init - no need to remove classes
				hideStuff(keys[indx], true);
			}
			addAvatars();
		}
	}

	function checkItem(event) {
		if (document.getElementById("discussion_bucket")) {
			const menuItem = event.target;
			const wrap = menuItem && menuItem.closest(".dropdown-item, .ghic-participants");
			if (menuItem && wrap) {
				if (menuItem.nodeName === "INPUT") {
					getInputValues();
					saveSettings();
					const name = wrap.dataset.ghic;
					if (name) {
						hideStuff(name);
					}
				} else if (menuItem.classList.contains("ghic-avatar")) {
					// make sure we're targeting the span wrapping the image
					hideParticipant(menuItem.nodeName === "IMG"
						? menuItem.parentNode
						: menuItem
					);
				} else if (regex.test(menuItem.nodeName)) {
					// clicking on the SVG may target the svg or path inside
					hideParticipant(menuItem.closest(".ghic-avatar"));
				}
			} else if (menuItem.id === "ghic-only-active") {
				menuItem
					.closest(".select-menu-header")
					.classList
					.toggle("ghic-active", menuItem.checked);
				GM_setValue("onlyActive", menuItem.checked);
			}
			// Make button show if it is active
			const button = $(".ghic-button .btn");
			if (button) {
				const active = $$(".ghic-hidden, .ghic-hidden-participant").length > 0;
				button.classList.toggle("btn-outline", active);
			}
		}
	}

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}

	function $$(selector, el) {
		return [...(el || document).querySelectorAll(selector)];
	}

	function addClass(els, name) {
		let indx;
		const len = els.length;
		for (indx = 0; indx < len; indx++) {
			els[indx] && els[indx].classList.add(name);
		}
		return len;
	}

	function removeClass(els, name) {
		let indx;
		const len = els.length;
		for (indx = 0; indx < len; indx++) {
			els[indx] && els[indx].classList.remove(name);
		}
	}

	function toggleClass(els, name, flag) {
		els = Array.isArray(els) ? els : [els];
		const undef = typeof flag === "undefined";
		let indx = els.length;
		while (indx--) {
			const el = els[indx];
			if (el) {
				if (undef) {
					flag = !el.classList.contains(name);
				}
				if (flag) {
					el.classList.add(name);
				} else {
					el.classList.remove(name);
				}
			}
		}
	}

	function init() {
		getSettings();
		addMenu();
		$("body").addEventListener("click", checkItem);
		update();
	}

	// update list when content changes
	document.addEventListener("ghmo:container", addMenu);
	document.addEventListener("ghmo:comments", update);
	init();

})();
