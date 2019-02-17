// ==UserScript==
// @name        GitHub Static Time
// @version     1.0.7
// @description A userscript that replaces relative times with a static time formatted as you like it
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-end
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @require     https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment-with-locales.min.js
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-static-time.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-static-time.user.js
// ==/UserScript==
(() => {
	/* global moment */
	"use strict";

	let busy = false,
		timeFormat = GM_getValue("ghst-format", "LLL"),
		locale = GM_getValue("ghst-locale", "en");

	// list copied from
	// https://github.com/moment/momentjs.com/blob/master/data/locale.js
	const locales = [
			{ "abbr": "af", "name": "Afrikaans" },
			{ "abbr": "sq", "name": "Albanian" },
			{ "abbr": "ar", "name": "Arabic" },
			{ "abbr": "ar-dz", "name": "Arabic (Algeria)" },
			{ "abbr": "ar-kw", "name": "Arabic (Kuwait)" },
			{ "abbr": "ar-ly", "name": "Arabic (Lybia)" },
			{ "abbr": "ar-ma", "name": "Arabic (Morocco)" },
			{ "abbr": "ar-sa", "name": "Arabic (Saudi Arabia)" },
			{ "abbr": "ar-tn", "name": "Arabic (Tunisia)" },
			{ "abbr": "hy-am", "name": "Armenian" },
			{ "abbr": "az", "name": "Azerbaijani" },
			{ "abbr": "eu", "name": "Basque" },
			{ "abbr": "be", "name": "Belarusian" },
			{ "abbr": "bn", "name": "Bengali" },
			{ "abbr": "bs", "name": "Bosnian" },
			{ "abbr": "br", "name": "Breton" },
			{ "abbr": "bg", "name": "Bulgarian" },
			{ "abbr": "my", "name": "Burmese" },
			{ "abbr": "km", "name": "Cambodian" },
			{ "abbr": "ca", "name": "Catalan" },
			{ "abbr": "tzm", "name": "Central Atlas Tamazight" },
			{ "abbr": "tzm-latn", "name": "Central Atlas Tamazight Latin" },
			{ "abbr": "zh-cn", "name": "Chinese (China)" },
			{ "abbr": "zh-hk", "name": "Chinese (Hong Kong)" },
			{ "abbr": "zh-tw", "name": "Chinese (Taiwan)" },
			{ "abbr": "cv", "name": "Chuvash" },
			{ "abbr": "hr", "name": "Croatian" },
			{ "abbr": "cs", "name": "Czech" },
			{ "abbr": "da", "name": "Danish" },
			{ "abbr": "nl", "name": "Dutch" },
			{ "abbr": "nl-be", "name": "Dutch (Belgium)" },
			{ "abbr": "en-au", "name": "English (Australia)" },
			{ "abbr": "en-ca", "name": "English (Canada)" },
			{ "abbr": "en-ie", "name": "English (Ireland)" },
			{ "abbr": "en-nz", "name": "English (New Zealand)" },
			{ "abbr": "en-gb", "name": "English (United Kingdom)" },
			{ "abbr": "en", "name": "English (United States)" },
			{ "abbr": "eo", "name": "Esperanto" },
			{ "abbr": "et", "name": "Estonian" },
			{ "abbr": "fo", "name": "Faroese" },
			{ "abbr": "fi", "name": "Finnish" },
			{ "abbr": "fr", "name": "French" },
			{ "abbr": "fr-ca", "name": "French (Canada)" },
			{ "abbr": "fr-ch", "name": "French (Switzerland)" },
			{ "abbr": "fy", "name": "Frisian" },
			{ "abbr": "gl", "name": "Galician" },
			{ "abbr": "ka", "name": "Georgian" },
			{ "abbr": "de", "name": "German" },
			{ "abbr": "de-at", "name": "German (Austria)" },
			{ "abbr": "de-ch", "name": "German (Switzerland)" },
			{ "abbr": "el", "name": "Greek" },
			{ "abbr": "he", "name": "Hebrew" },
			{ "abbr": "hi", "name": "Hindi" },
			{ "abbr": "hu", "name": "Hungarian" },
			{ "abbr": "is", "name": "Icelandic" },
			{ "abbr": "id", "name": "Indonesian" },
			{ "abbr": "it", "name": "Italian" },
			{ "abbr": "ja", "name": "Japanese" },
			{ "abbr": "jv", "name": "Javanese" },
			{ "abbr": "kn", "name": "Kannada" },
			{ "abbr": "kk", "name": "Kazakh" },
			{ "abbr": "tlh", "name": "Klingon" },
			{ "abbr": "gom-latn", "name": "Konkani Latin script" },
			{ "abbr": "ko", "name": "Korean" },
			{ "abbr": "ky", "name": "Kyrgyz" },
			{ "abbr": "lo", "name": "Lao" },
			{ "abbr": "lv", "name": "Latvian" },
			{ "abbr": "lt", "name": "Lithuanian" },
			{ "abbr": "lb", "name": "Luxembourgish" },
			{ "abbr": "mk", "name": "Macedonian" },
			{ "abbr": "ms-my", "name": "Malay" },
			{ "abbr": "ms", "name": "Malay" },
			{ "abbr": "ml", "name": "Malayalam" },
			{ "abbr": "dv", "name": "Maldivian" },
			{ "abbr": "mi", "name": "Maori" },
			{ "abbr": "mr", "name": "Marathi" },
			{ "abbr": "me", "name": "Montenegrin" },
			{ "abbr": "ne", "name": "Nepalese" },
			{ "abbr": "se", "name": "Northern Sami" },
			{ "abbr": "nb", "name": "Norwegian Bokmål" },
			{ "abbr": "nn", "name": "Nynorsk" },
			{ "abbr": "fa", "name": "Persian" },
			{ "abbr": "pl", "name": "Polish" },
			{ "abbr": "pt", "name": "Portuguese" },
			{ "abbr": "pt-br", "name": "Portuguese (Brazil)" },
			{ "abbr": "x-pseudo", "name": "Pseudo" },
			{ "abbr": "pa-in", "name": "Punjabi (India)" },
			{ "abbr": "ro", "name": "Romanian" },
			{ "abbr": "ru", "name": "Russian" },
			{ "abbr": "gd", "name": "Scottish Gaelic" },
			{ "abbr": "sr", "name": "Serbian" },
			{ "abbr": "sr-cyrl", "name": "Serbian Cyrillic" },
			{ "abbr": "sd", "name": "Sindhi" },
			{ "abbr": "si", "name": "Sinhalese" },
			{ "abbr": "sk", "name": "Slovak" },
			{ "abbr": "sl", "name": "Slovenian" },
			{ "abbr": "es", "name": "Spanish" },
			{ "abbr": "es-do", "name": "Spanish (Dominican Republic)" },
			{ "abbr": "sw", "name": "Swahili" },
			{ "abbr": "sv", "name": "Swedish" },
			{ "abbr": "tl-ph", "name": "Tagalog (Philippines)" },
			{ "abbr": "tzl", "name": "Talossan" },
			{ "abbr": "ta", "name": "Tamil" },
			{ "abbr": "te", "name": "Telugu" },
			{ "abbr": "tet", "name": "Tetun Dili (East Timor)" },
			{ "abbr": "th", "name": "Thai" },
			{ "abbr": "bo", "name": "Tibetan" },
			{ "abbr": "tr", "name": "Turkish" },
			{ "abbr": "uk", "name": "Ukrainian" },
			{ "abbr": "ur", "name": "Urdu" },
			{ "abbr": "uz", "name": "Uzbek" },
			{ "abbr": "uz-latn", "name": "Uzbek Latin" },
			{ "abbr": "vi", "name": "Vietnamese" },
			{ "abbr": "cy", "name": "Welsh" },
			{ "abbr": "yo", "name": "Yoruba Nigeria" },
			{ "abbr": "ss", "name": "siSwati" }
		],
		block = document.createElement("span");
	block.className = "ghst-time time";

	function staticTime(tempFormat) {
		if (busy) {
			return;
		}
		busy = true;
		let selector = typeof tempFormat === "string"
			// update existing timestamps
			? ".ghst-time"
			// process html elements
			: "relative-time, time-ago";
		if ($(selector)) {
			let indx = 0;
			const els = $$(selector),
				len = els.length;

			// loop with delay to allow user interaction
			const loop = () => {
				let el, time, node, formatted,
					// max number of DOM insertions per loop
					max = 0;
				while (max < 20 && indx < len) {
					if (indx >= len) {
						return;
					}
					el = els[indx];
					time = el.getAttribute("datetime") || "";
					if (el && time) {
						if (tempFormat) {
						    formatted = moment(time).format(tempFormat);
							el.textContent = formatted;
						    el.title = formatted;
						} else {
						    formatted = moment(time).format(timeFormat);
							node = block.cloneNode(true);
							node.setAttribute("datetime", time);
							node.textContent = formatted;
						    node.title = formatted;
							// el.parentElement may be null sometimes when using browser
							// back arrow
							if (el.parentElement) {
								// replace relative-time/time-ago element
								el.parentElement.replaceChild(node, el);
							}
						}
						max++;
					}
					indx++;
				}
				if (indx < len) {
					setTimeout(() => {
						loop();
					}, 200);
				}
			};
			loop();
		}
		busy = false;
	}

	function addPanel() {
		const div = document.createElement("div");
		GM_addStyle(`
			#ghst-settings { opacity:0; visibility:hidden; }
			#ghst-settings.ghst-open { position:fixed; z-index:65535; top:0; bottom:0;
				left:0; right:0; opacity:1; visibility:visible;
				background:rgba(0, 0, 0, .5); }
			#ghst-settings-inner { position:fixed; left:50%; top:50%; width:25rem;
				transform:translate(-50%,-50%); box-shadow:0 .5rem 1rem #111;
				color:#c0c0c0 }
			#ghst-settings-inner .boxed-group-inner { height: 205px; }
			#ghst-footer { clear:both; border-top:1px solid rgba(68, 68, 68, .3);
				padding-top:5px; }
		`);
		div.id = "ghst-settings";
		let options = "";
		locales.forEach(loc => {
			let sel = loc.abbr === locale ? " selected" : "";
			options += `<option value="${loc.abbr}"${sel}>${loc.name}</option>`;
		});
		div.innerHTML = `
			<div id="ghst-settings-inner" class="boxed-group">
				<h3>GitHub Static Time Settings</h3>
				<div class="boxed-group-inner">
					<dl class="form-group flattened">
						<dt>
							<label for="ghst-locale">Select a locale</label>
						</dt>
						<dd>
							<select id="ghst-locale" class="form-select float-right" value="${locale}">
								${options}
							</select>
							<br>
						</dd>
					</dl>
					<dl class="form-group flattened">
						<dt>
							<label for="ghst-format">
								<p>Set <a href="https://momentjs.com/docs/#/displaying/format/">
									MomentJS
								</a> format (e.g. "MMMM Do YYYY, h:mm A"):
								</p>
							</label>
						</dt>
						<dd>
							<input id="ghst-format" type="text" class="form-control" value="${timeFormat}"/>
						</dd>
					</dl>
					<div id="ghst-footer">
						<button type="button" id="ghst-cancel" class="btn btn-sm float-right">Cancel</button>
						<button type="button" id="ghst-save" class="btn btn-sm float-right">Save</button>
					</div>
				</div>
			</div>`;
		$("body").appendChild(div);
		on("#ghst-settings", "click", closePanel);
		on("body", "keyup", event => {
			if (
				event.key === "Escape" &&
				$("#ghst-settings").classList.contains("ghst-open")
			) {
				closePanel(event);
				return false;
			} else if (event.key === "Enter" && event.shiftKey) {
				closePanel();
				update("save");
			}
		});
		on("#ghst-settings-inner", "click", event => {
			event.stopPropagation();
			event.preventDefault();
		});
		on("#ghst-save", "click", () => {
			closePanel();
			update("save");
		});
		on("#ghst-locale", "change", update);
		on("#ghst-format", "change", update);
		on("#ghst-cancel", "click", closePanel);
	}

	function closePanel(event) {
		$("#ghst-settings").classList.remove("ghst-open");
		if (event) {
			return update("revert");
		}
	}

	function update(mode) {
		if (mode === "revert") {
			$("#ghst-locale").value = locale;
			$("#ghst-format").value = timeFormat;
		}
		let loc = $("#ghst-locale").value || "en",
			time = $("#ghst-format").value || "LLL";
		if (mode === "save") {
			timeFormat = time;
			locale = loc;
			GM_setValue("ghst-format", timeFormat);
			GM_setValue("ghst-locale", locale);
		}
		moment.locale(loc);
		staticTime(time);
		return false;
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	function $$(str, el) {
		return Array.from((el || document).querySelectorAll(str));
	}

	function on(el, name, handler) {
		$(el).addEventListener(name, handler);
	}

	function init() {
		addPanel();
		moment.locale(locale);
		staticTime();
	}

	// Add GM options
	GM_registerMenuCommand("Set GitHub static time format", () => {
		$("#ghst-settings").classList.add("ghst-open");
	});

	// repo file list needs additional time to render
	document.addEventListener("ghmo:container", () => {
		setTimeout(() => {
			staticTime();
		}, 100);
	});
	document.addEventListener("ghmo:preview", staticTime);
	init();

})();
