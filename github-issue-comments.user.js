// ==UserScript==
// @name        GitHub Toggle Issue Comments
// @version     1.3.1
// @description A userscript that toggles issues/pull request comments & messages
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=597950
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
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
		.ghic-button .ghic-count { margin-left:5px; }
		.ghic-button .select-menu-modal { margin:0; }
		.ghic-button .ghic-participants { margin-bottom:20px; }
		/* for testing: ".ghic-hidden { opacity: 0.3; } */
		.ghic-hidden, .ghic-hidden-participant, .ghic-avatar svg, .ghic-button .ghic-count,
			.ghic-hideReactions .comment-reactions,
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
		.timeline-comment-wrapper.ghic-highlight .comment { border-color:#800 !important; }
`);

	const regex = /(svg|path)/i,
		// ZenHub addon active (include ZenHub Enterprise)
		hasZenHub = $(".zhio, .zhe") ? true : false,

		exceptions = [
			"ghsr-sort-block" // sort reactions block (github-sort-reactions.user.js)
		],

		settings = {
			// example: https://github.com/Mottie/Keyboard/issues/448
			title: {
				isHidden: false,
				name: "ghic-title",
				selector: ".discussion-item-renamed",
				label: "Title Changes"
			},
			labels: {
				isHidden: false,
				name: "ghic-labels",
				selector: ".discussion-item-labeled, .discussion-item-unlabeled",
				label: "Label Changes"
			},
			state: {
				isHidden: false,
				name: "ghic-state",
				selector: ".discussion-item-reopened, .discussion-item-closed",
				label: "State Changes (close/reopen)"
			},

			// example: https://github.com/jquery/jquery/issues/2986
			milestone: {
				isHidden: false,
				name: "ghic-milestone",
				selector: ".discussion-item-milestoned",
				label: "Milestone Changes"
			},
			refs: {
				isHidden: false,
				name: "ghic-refs",
				selector: ".discussion-item",
				contains: ".discussion-item-ref-title",
				label: "References"
			},
			assigned: {
				isHidden: false,
				name: "ghic-assigned",
				selector: ".discussion-item-assigned",
				label: "Assignment Changes"
			},

			// Pull Requests
			commits: {
				isHidden: false,
				name: "ghic-commits",
				selector: ".discussion-commits",
				label: "Commits"
			},
			reviews: {
				isHidden: false,
				name: "ghic-reviews",
				selector: ".discussion-item-review, .discussion-item-review_requested",
				label: "Reviews (All)"
			},
			outdated: {
				isHidden: false,
				name: "ghic-outdated",
				selector: ".discussion-item-review",
				contains: ".outdated-comment-label",
				label: "Reviews (Outdated)"
			},
			// example: https://github.com/jquery/jquery/pull/3014
			diffOld: {
				isHidden: false,
				name: "ghic-diffOld",
				selector: ".outdated-diff-comment-container",
				label: "Diff (outdated) Comments"
			},
			diffNew: {
				isHidden: false,
				name: "ghic-diffNew",
				selector: "[id^=diff-for-comment-]:not(.outdated-diff-comment-container)",
				label: "Diff (current) Comments"
			},
			// example: https://github.com/jquery/jquery/pull/2949
			merged: {
				isHidden: false,
				name: "ghic-merged",
				selector: ".discussion-item-merged",
				label: "Merged"
			},
			integrate: {
				isHidden: false,
				name: "ghic-integrate",
				selector: ".discussion-item-integrations-callout",
				label: "Integrations"
			},

			// extras (special treatment - no selector)
			plus1: {
				isHidden: false,
				name: "ghic-plus1",
				label: "+1 Comments"
			},
			reactions: {
				isHidden: false,
				name: "ghic-reactions",
				label: "Reactions"
			},
			// page with lots of users to hide:
			// https://github.com/isaacs/github/issues/215

			// ZenHub pipeline change
			pipeline: {
				isHidden: false,
				name: "ghic-pipeline",
				selector: ".discussion-item.zh-discussion-item",
				label: "ZenHub Pipeline Changes"
			}
		};

	const iconHidden = `<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 9 9"><path fill="#777" d="M7.07 4.5c0-.47-.12-.9-.35-1.3L3.2 6.7c.4.25.84.37 1.3.37.35 0 .68-.07 1-.2.32-.14.6-.32.82-.55.23-.23.4-.5.55-.82.13-.32.2-.65.2-1zM2.3 5.8l3.5-3.52c-.4-.23-.83-.35-1.3-.35-.35 0-.68.07-1 .2-.3.14-.6.32-.82.55-.23.23-.4.5-.55.82-.13.32-.2.65-.2 1 0 .47.12.9.36 1.3zm6.06-1.3c0 .7-.17 1.34-.52 1.94-.34.6-.8 1.05-1.4 1.4-.6.34-1.24.52-1.94.52s-1.34-.18-1.94-.52c-.6-.35-1.05-.8-1.4-1.4C.82 5.84.64 5.2.64 4.5s.18-1.35.52-1.94.8-1.06 1.4-1.4S3.8.64 4.5.64s1.35.17 1.94.52 1.06.8 1.4 1.4c.35.6.52 1.24.52 1.94z"/></svg>`,
		plus1Icon = `<img src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f44d.png" class="emoji" title=":+1:" alt=":+1:" height="20" width="20" align="absmiddle">`;

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
								<div class="ghic-participants"></div>
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
		let indx = 0,

			str = "<p><strong>Hide Comments from</strong></p>",
			unique = [],
			// get all avatars
			avatars = $$(".timeline-comment-avatar img"),
			len = avatars.length - 1, // last avatar is the new comment with the current user

			loop = (callback) => {
				let el, name,
					max = 0;
				while (max < 50 && indx < len) {
					if (indx >= len) {
						return callback();
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
				if (indx < len) {
					setTimeout(() => {
						loop(callback);
					}, 200);
				} else {
					callback();
				}
			};
		loop(() => {
			$(".ghic-participants").innerHTML = str;
		});
	}

	function getSettings() {
		let name,
			keys = Object.keys(settings);
		for (name of keys) {
			settings[name].isHidden = GM_getValue(settings[name].name, false);
		}
	}

	function saveSettings() {
		let name,
			keys = Object.keys(settings);
		for (name of keys) {
			GM_setValue(settings[name].name, settings[name].isHidden);
		}
	}

	function getInputValues() {
		let name, item,
			keys = Object.keys(settings),
			menu = $(".ghic-menu");
		for (name of keys) {
			if (!(name === "pipeline" && !hasZenHub)) {
				item = closest(".dropdown-item", $("." + settings[name].name, menu));
				if (item) {
					settings[name].isHidden = !$("input", item).checked;
					toggleClass(item, "ghic-checked", !settings[name].isHidden);
				}
			}
		}
	}

	function hideStuff(name, init) {
		const obj = settings[name],
			isHidden = obj.isHidden;
		let count, results,
			item = $(".ghic-menu .dropdown-item." + obj.name);
		if (name === "plus1") {
			hidePlus1(init, item);
		} else if (item && name === "reactions") {
			toggleClass($("body"), "ghic-hideReactions", isHidden);
			toggleClass(item, "ghic-has-content", $$(".has-reactions").length - 1);
			// make first comment reactions visible
			item = $(".has-reactions", $(".timeline-comment-wrapper"));
			if (item) {
				item.style.display = "block";
			}
		} else if (item && obj.selector) {
			results = $$(obj.selector);
			if (obj.contains) {
				results = results.filter(el => {
					return !!$(obj.contains, el);
				});
			}
			toggleClass(item, "ghic-checked", !isHidden);
			if (isHidden) {
				count = addClass(results, "ghic-hidden");
				$(".ghic-count", item).textContent = count ? "(" + count + " hidden)" : " ";
			} else if (!init) {
				// no need to remove classes on initialization
				removeClass(results, "ghic-hidden");
			}
			toggleClass(item, "ghic-has-content", results.length);
		}
	}

	function hidePlus1(init, item) {
		let max,
			indx = 0,
			count = 0,
			total = 0,
			// keep a list of post authors to prevent duplicate +1 counts
			authors = [],
			// used https://github.com/isaacs/github/issues/215 for matches here...
			// matches "+1!!!!", "++1", "+!", "+99!!!", "-1", "+ 100", "thumbs up"; ":+1:^21425235"
			// ignoring -1's... add unicode for thumbs up; it gets replaced with an image in Windows
			regexPlus = /([?!*,.:^[\]()\'\"+-\d]|bump|thumbs|up|\ud83d\udc4d)/gi,
			// other comments to hide - they are still counted towards the +1 counter (for now?)
			// seen "^^^" to bump posts; "bump plleeaaassee"; "eta?"; "pretty please"
			// "need this"; "right now"; "still nothing?"; "super helpful"; "for gods sake"
			regexHide = new RegExp("(" + [
				"@\\w+",
				"\\b(it|is|a|so|the|and|no|on|oh|do|this|any|very|much|here|just|my|me|too|want|yet|image)\\b",
				"pretty",
				"pl+e+a+s+e+",
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
				"back",
				"features?",
				"infinity", // +Infinity
				"useful",
				"super",
				"helpful",
				"thanks",
				"for\\sgod'?s\\ssake",
				"c['emon]+" // c'mon, com'on, comeon
			].join("|") + ")", "gi"),
			// image title ":{anything}:", etc.
			regexEmoji = /(:.*:)|[\u{1f300}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{1f900}-\u{1f9ff}]/gu,
			regexWhitespace = /\s+/g,

			comments = $$(".js-discussion .timeline-comment-wrapper")
				.filter(comment => {
					const classes = comment.className.split(" ");
					return !exceptions.some(ex => classes.includes(ex));
				}),
			len = comments.length,

			loop = () => {
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
					el = $(".comment-body", wrapper);
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
					$(".ghic-menu .ghic-plus1 .ghic-count").textContent = total ? "(" + total + " hidden)" : " ";
					addCountToReaction(count);
				}
			};
		loop();
	}

	function getAllText(el) {
		let txt = "",
			indx = el.length;
		// text order doesn't matter
		while (indx--) {
			txt += el[indx].textContent.trim();
		}
		return txt;
	}

	function addCountToReaction(count) {
		if (!count) {
			count = ($(".ghic-menu .ghic-plus1 .ghic-count").textContent || "")
				.replace(/[()]/g, "")
				.trim();
		}
		let comment = $(".timeline-comment"),
			tmp = $(
				".has-reactions button[value='+1 react'], .has-reactions button[value='+1 unreact']",
				comment
			),
			el = $(".ghic-count", comment);
		if (el) {
			// the count may have been appended to the comment & now
			// there is a reaction, so remove any "ghic-count" elements
			el.parentNode.removeChild(el);
		}
		if (count) {
			if (tmp) {
				el = document.createElement("span");
				el.className = "ghic-count";
				el.textContent = count ? " + " + count + " (from hidden comments)" : "";
				tmp.appendChild(el);
			} else {
				el = document.createElement("p");
				el.className = "ghic-count";
				el.innerHTML = "<hr>" + plus1Icon + " " + count + " (from hidden comments)";
				$(".comment-body", comment).appendChild(el);
			}
		}
	}

	function hideParticipant(el) {
		if (el) {
			el.classList.toggle("comments-hidden");
			let name = el.getAttribute("aria-label"),
				results = $$(
					".timeline-comment-wrapper, .commit-comment, .discussion-item"
				).filter(el => {
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
			let keys = Object.keys(settings),
				indx = keys.length;
			while (indx--) {
				// true flag for init - no need to remove classes
				hideStuff(keys[indx], true);
			}
		}
	}

	function checkItem(event) {
		if (document.getElementById("discussion_bucket")) {
			let name,
				target = event.target,
				wrap = target && target.closest(".dropdown-item");
			if (target && wrap) {
				if (target.nodeName === "INPUT") {
					getInputValues();
					saveSettings();
					name = wrap.dataset.ghic;
					if (name) {
						hideStuff(name);
					}
				} else if (target.classList.contains("ghic-avatar")) {
					// make sure we're targeting the span wrapping the image
					hideParticipant(target.nodeName === "IMG" ? target.parentNode : target);
				} else if (regex.test(target.nodeName)) {
					// clicking on the SVG may target the svg or path inside
					hideParticipant(closest(".ghic-avatar", target));
				}
			} else if (target.id === "ghic-only-active") {
				closest(".select-menu-header", target).classList.toggle("ghic-active", target.checked);
				GM_setValue("onlyActive", target.checked);
			}
			// Make button show if it is active
			target = $(".ghic-button .btn");
			if (target) {
				const active = $$(".ghic-hidden, .ghic-hidden-participant").length > 0;
				target.classList.toggle("btn-outline", active);
			}
		}
	}

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}

	function $$(selector, el) {
		return Array.from((el || document).querySelectorAll(selector));
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

	function addClass(els, name) {
		let indx,
			len = els.length;
		for (indx = 0; indx < len; indx++) {
			els[indx].classList.add(name);
		}
		return len;
	}

	function removeClass(els, name) {
		let indx,
			len = els.length;
		for (indx = 0; indx < len; indx++) {
			els[indx].classList.remove(name);
		}
	}

	function toggleClass(els, name, flag) {
		els = Array.isArray(els) ? els : [els];
		let el,
			indx = els.length;
		while (indx--) {
			el = els[indx];
			if (el) {
				if (typeof flag === "undefined") {
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
