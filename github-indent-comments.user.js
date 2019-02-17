// ==UserScript==
// @name        GitHub Indent Comments
// @version     1.0.14
// @description A userscript that allows you to indent & outdent blocks in the comment editor
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @include     https://gist.github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @connect     github.com
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @require     https://greasyfork.org/scripts/28239-rangy-inputs-mod-js/code/rangy-inputs-modjs.js?version=181769
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-indent-comments.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-indent-comments.user.js
// ==/UserScript==
(() => {
	"use strict";

	let spaceSize = GM_getValue("space-size", 2);

	const icons = {
		indent: `
			<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16">
				<path d="M12 13c0 .6 0 1-.9 1H.9c-.9 0-.9-.4-.9-1s0-1 .9-1h10.2c.88 0 .88.4.88 1zM.92 4h10.2C12 4 12 3.6 12 3s0-1-.9-1H.92c-.9 0-.9.4-.9 1s0 1 .9 1zM11.5 7h-5C6 7 6 7.4 6 8s0 1 .5 1h5c.5 0 .5-.4.5-1s0-1-.5-1zm-7 1L0 5v6z"/>
			</svg>`,
		outdent: `
			<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16">
				<path d="M12 13c0 .6 0 1-.9 1H.9c-.9 0-.9-.4-.9-1s0-1 .9-1h10.2c.88 0 .88.4.88 1zM.92 4h10.2C12 4 12 3.6 12 3s0-1-.9-1H.92c-.9 0-.9.4-.9 1s0 1 .9 1zm10.7 3H6.4c-.46 0-.4.4-.4 1s-.06 1 .4 1h5.2c.47 0 .4-.4.4-1s.07-1-.4-1zM0 8l4.5-3v6z"/>
			</svg>`
	};

	GM_addStyle(".ghio-in-outdent * { pointer-events:none; }");

	// Add indent & outdent buttons
	function addButtons() {
		createButton("Outdent");
		createButton("Indent");
	}

	function createButton(name) {
		const toolbars = $$(".toolbar-commenting"),
			nam = name.toLowerCase(),
			button = document.createElement("button");
		let el,
			indx = toolbars.length;
		if (indx) {
			button.type = "button";
			button.className = `ghio-${nam.toLowerCase()} ghio-in-outdent toolbar-item tooltipped tooltipped-n`;
			button.setAttribute("aria-label", `${name} Selected Text`);
			button.setAttribute("tabindex", "-1");
			button.innerHTML = icons[nam.toLowerCase()];
			while (indx--) {
				el = toolbars[indx];
				if (!$(`.ghio-${nam.toLowerCase()}`, el)) {
					el.insertBefore(button.cloneNode(true), el.childNodes[0]);
				}
			}
		}
	}

	function indent(text) {
		let result = [],
			block = new Array(parseInt(spaceSize, 10) + 1).join(" ");
		(text || "").split(/\r*\n/).forEach(line => {
			result.push(block + line);
		});
		return result.join("\n");
	}

	function outdent(text) {
		let regex = new RegExp(`^(\x20{1,${spaceSize}}|\xA0{1,${spaceSize}}|\x09)`),
			result = [];
		(text || "").split(/\r*\n/).forEach(line => {
			result.push(line.replace(regex, ""));
		});
		return result.join("\n");
	}

	function addBindings() {
		window.rangyInput.init();
		saveTabSize();
		$("body").addEventListener("click", event => {
			let textarea,
				target = event.target;
			if (target && target.classList.contains("ghio-in-outdent")) {
				textarea = closest(".previewable-comment-form", target);
				textarea = $(".comment-form-textarea", textarea);
				textarea.focus();
				setTimeout(() => {
					window.rangyInput.indentSelectedText(
						textarea,
						target.classList.contains("ghio-indent") ? indent : outdent
					);
				}, 100);
				return false;
			}
		});
		// Add Tab & Shift + Tab
		$("body").addEventListener("keydown", event => {
			if (event.key === "Tab") {
				let target = event.target;
				if (target && target.classList.contains("comment-form-textarea")) {
					event.preventDefault();
					target.focus();
					setTimeout(() => {
						window.rangyInput.indentSelectedText(
							target,
							// shift + tab = outdent
							event.getModifierState("Shift") ? outdent : indent
						);
					}, 100);
				}
			}
		});
	}

	function saveTabSize() {
		let $el = $(".gh-indent-size");
		if (!$el) {
			$el = document.createElement("style");
			$el.setAttribute("rel", "stylesheet");
			$el.className = "gh-indent-size";
			document.querySelector("head").appendChild($el);
		}
		$el.innerHTML = `.comment-form-textarea { tab-size:${spaceSize}; }`;
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

	// Add GM options
	GM_registerMenuCommand(
		"Indent or outdent size",
		() => {
			const spaces = GM_getValue("indentOutdentSize", spaceSize);
			let val = prompt("Enter number of spaces to indent or outdent:", spaces);
			if (val !== null && typeof val === "string") {
				spaceSize = val;
				GM_setValue("space-size", val);
				saveTabSize();
			}
		}
	);

	document.addEventListener("ghmo:container", addButtons);
	addBindings();
	addButtons();
})();
