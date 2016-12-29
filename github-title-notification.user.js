// ==UserScript==
// @name          GitHub Title Notification
// @version       1.0.1
// @description   A userscript that changes the document title if there are unread messages
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @run-at        document-idle
// @grant         GM_registerMenuCommand
// @grant         GM_getValue
// @grant         GM_setValue
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-title-notification.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-title-notification.user.js
// ==/UserScript==
/* jshint unused:true, esnext:true */
(function() {
	"use strict";

	let timer,
		// indicator added to document title (it will be wrapped in parentheses)
		indicator = GM_getValue("indicator", "♥"),
		// check every 30 seconds
		interval = GM_getValue("interval", 30);

	function hasClass(el, name) {
		if (el) {
			return el.classList ? el.classList.contains(name) : new RegExp("\\b" + name + "\\b").test(el.className);
		}
		return false;
	}

	function check() {
		let title = document.title,
			hasUnread = hasClass(document.querySelector(".mail-status"), "unread");
		//
		if (!/^\(\d+\)/.test(title)) {
			title = title.replace(/^\([^)]+\)\s/, "");
		}
		document.title = hasUnread ? "(" + indicator + ") " + title : title;
	}

	function setTimer() {
		clearInterval(timer);
		if (document.querySelector(".mail-status")) {
			timer = setInterval(function() {
				check();
			}, interval * 1000);
			check();
		}
	}

	// Add GM options
	GM_registerMenuCommand("Set GitHub Title Notification Indicator", function() {
		indicator = prompt("Indicator Value (it will be wrapped in parentheses)?", indicator);
		GM_setValue("indicator", indicator);
		check();
	});
	GM_registerMenuCommand("Set GitHub Title Notification Interval", function() {
		interval = prompt("Interval Value (in seconds)?", interval);
		GM_setValue("interval", interval);
		setTimer();
	});

	setTimer();

})();
