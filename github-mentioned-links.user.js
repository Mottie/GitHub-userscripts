// ==UserScript==
// @name        GitHub Mentioned Links
// @version     0.1.0
// @description A userscript adds all mentioned links in the side bar
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_getValue
// @grant       GM_setValue
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=785415
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-mentioned-links.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-mentioned-links.user.js
// ==/UserScript==
(() => {
	"use strict";
	/* global $ $$ on */

	// GitHub loves to change class names
	const selectors = {
		// Insert entry after milestone in the sidebar
		sidebar: ".discussion-sidebar-item.sidebar-progress-bar",
		// Load more comments button (2 buttons; either works)
		loadMore: "form[action*='more_items'] button",
		// Issue/PR timeline element with anchor id
		timelineGroup: ".timeline-comment-group",
		// All links within a timeline comment
		links: ".comment-body a:not(.user-mention)"
	};

	const internalLinkIcon = `
		<svg aria-hidden="true" class="octicon octicon-internal-link" viewBox="0 0 12 16" height="12">
			<path d="M11 10h1v3c0 .6-.4 1-1 1H1c-.6 0-1-.4-1-1V3c0-.5.4-1 1-1h3v1H1v10h10v-3z"/>
			<path d="M11 9L8.8 6.7 12 3.5 10.5 2 7.3 5.2 5 3v6z"/>
		</svg>`

	// Sidebar item
	const item = document.createElement("details");
	item.id = "ghml-wrapper";
	item.className = "discussion-sidebar-item sidebar-mentioned-links";
	item.open = GM_getValue("mentionedOpened", false);
	item.onclick = event => {
		// Set as opposite makes it work?! DOM update delay, maybe?
		GM_setValue("mentionedOpened", !event.target.parentElement.open);
	};

	// Load more button
	const loadMoreButton = document.createElement("button");
	loadMoreButton.className = "btn btn-block btn-sm width-auto ml-2 py-0 px-1 text-normal";
	loadMoreButton.style.fontSize = "10px";
	loadMoreButton.title = "Each click loads up to 60 items";

	function getLinks() {
		const list = new Set();
		const links = [];
		$$(selectors.timelineGroup).forEach(body => {
			$$(selectors.links, body).forEach(link => {
				if (!list.has(link.href) && !$("img", link)) {
					list.add(link.href);
					links.push(
						`<li class="css-truncate css-truncate-overflow">
							<a href="#${body.id}" class="link-gray" title="Internal link">
								${internalLinkIcon}
							</a>
							${link.outerHTML}
						</li>`
					);
				}
			});
		});
		list.clear();
		buildLinks(links);
	}

	function addLoadMoreButton() {
		const formButton = $(selectors.loadMore);
		if (formButton) {
			const more = loadMoreButton.cloneNode(true);
			more.textContent = formButton.textContent;
			more.onclick = event => {
				const target = event.target;
				target.textContent = "Loading…";
				formButton.click();
			};
			$("#ghml-wrapper summary").append(more);
		}
	}

	function buildLinks(links) {
		const entry = $("#ghml-wrapper") || item.cloneNode(true);
		entry.innerHTML = `
			<summary class="discussion-sidebar-heading text-bold d-flex flex-items-center">
				Mentioned Links
			</summary>
			<ul class="list-style-none">
				${links.length ? links.join("") : "No links found"}
			</ul>`;
		$(selectors.sidebar).after(entry);
		addLoadMoreButton();
	}

	function init() {
		if ($("#discussion_bucket") && $(selectors.sidebar)) {
			getLinks();
		}
	}

	on(document, "ghmo:container ghmo:comments", init);
	init();

})();
