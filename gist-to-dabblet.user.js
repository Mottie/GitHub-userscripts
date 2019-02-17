// ==UserScript==
// @name        Gist to dabblet
// @version     2.1.5
// @description Add a dabblet.com link button to any gist with dabblet information
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       none
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-to-dabblet.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/gist-to-dabblet.user.js
// ==/UserScript==
(() => {
	"use strict";

	const content = `
		<a href="http://dabblet.com/gist/{gistid}" class="{class} tooltipped tooltipped-s" aria-label="Open at Dabblet.com">
			<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="10" viewBox="0 0 16 10">
				<path d="M1.42 6.64c0-.46.1-.88.27-1.3.16-.4.4-.74.7-1.04.3-.3.65-.54 1.05-.7.4-.18.84-.27 1.3-.27.24 0 .48.03.7.08.23.06.45.14.66.23V1.2c0-.15.04-.28.1-.4s.1-.2.2-.3.2-.16.3-.2.25-.1.4-.1c.13 0 .25.04.37.1.12.04.22.1.3.2.1.1.17.2.22.3s.06.25.06.4V6.66c0 .3-.04.6-.12.87s-.2.55-.34.8-.32.46-.52.65c-.2.2-.43.36-.67.5s-.5.26-.78.34c-.28.07-.58.1-.88.1-.3 0-.6-.03-.88-.1s-.54-.2-.8-.34c-.23-.15-.46-.32-.66-.52s-.38-.42-.52-.67c-.15-.23-.26-.5-.34-.78-.08-.28-.12-.58-.12-.88zm1.96 0c0 .2.03.36.1.53s.17.3.3.43c.12.13.27.23.43.3.18.07.36.1.54.1.2 0 .37-.03.53-.1.17-.07.3-.17.44-.3.13-.12.23-.27.3-.43s.1-.34.1-.53c0-.2-.03-.36-.1-.53-.07-.15-.17-.3-.3-.42-.12-.13-.26-.22-.43-.3-.16-.07-.34-.1-.53-.1-.18 0-.36.03-.53.1-.15.08-.3.17-.42.3-.13.12-.22.27-.3.43-.07.18-.1.35-.1.54zM12.6 9.97c-.3 0-.6-.04-.88-.12s-.55-.2-.8-.34c-.24-.13-.47-.3-.67-.5-.2-.2-.37-.43-.52-.68-.14-.24-.26-.5-.33-.8s-.12-.56-.12-.87V1c0-.13.02-.26.07-.37.06-.12.13-.22.2-.3.1-.1.2-.17.32-.22.12-.04.25-.07.38-.07.14 0 .27.03.4.08.1.06.2.13.3.22.08.1.15.2.2.3.06.13.08.25.08.4v5.63c0 .2.04.37.1.53s.18.3.3.44c.13.12.27.22.44.3.16.06.34.1.53.1.13 0 .26.02.38.07s.22.12.3.2c.1.1.16.2.22.3s.07.26.07.4c0 .13-.02.26-.07.37-.06.12-.13.22-.2.3-.1.1-.2.17-.32.22s-.25.07-.38.07zm.42-6.22c0 .13-.03.25-.08.36-.05.12-.12.22-.2.3-.1.1-.2.15-.3.2-.12.05-.24.07-.37.07s-.25-.03-.36-.08c-.1-.06-.2-.13-.3-.22-.07-.08-.14-.18-.2-.3s-.05-.23-.05-.36.03-.25.08-.36.12-.22.2-.3c.1-.08.2-.15.3-.2s.24-.07.37-.06c.13 0 .25.03.36.08.1.05.2.12.3.2.08.1.15.2.2.3.04.12.06.24.06.37z"/>
			</svg>
			dabblet
		</a>`;

	function findDabbletGist() {
		let indx, el, button;
		const list = [],
			// main gist page
			gist = $("#file-dabblet-css"),
			// list of gists page
			lists = $$(".css-truncate-target");

		if ($$(".gist-snippet").length) {
			indx = lists.length;
			while (indx--) {
				// only save dabblet files from list
				if (lists[indx].textContent.indexOf("dabblet.css") > -1) {
					list[list.length] = lists[indx];
				}
			}
		}
		const len = list.length;
		if (gist || len) {
			if (len) {
				for (indx = 0; indx < len; indx++) {
					button = document.createElement("li");
					button.innerHTML = content
						.replace("{gistid}", list[indx].parentNode.href.match(/[a-f\d]+$/))
						.replace("{class}", "");
					el = $(".gist-count-links li", closest(".gist-snippet-meta", list[indx]));
					el.parentNode.insertBefore(button, el);
					el.parentNode.style.zIndex = 1;
				}
			} else if (gist) {
				button = document.createElement("li");
				button.innerHTML = content
					.replace("{gistid}", window.location.pathname.match(/[a-f\d]+$/))
					.replace("{class}", "btn btn-sm");
				el = $(".pagehead-actions li");
				el.parentNode.insertBefore(button, el);
			}
		}
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	function $$(str, el) {
		return Array.from((el || document).querySelectorAll(str));
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

	document.addEventListener("pjax:end", findDabbletGist);
	findDabbletGist();
})();
