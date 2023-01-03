// ==UserScript==
// @name        GitHub Copy Raw Source
// @version     1.0.0
// @description Add a "Copy" button next to the "Raw" button when viewing source.
// @license     MIT
// @author      Dennis Skinner
// @namespace   https://github.com/Mottie
// @match       *://github.com/*
// @match       *://gist.github.com/*
// @connect     github.com
// @connect     raw.githubusercontent.com
// @connect     gist.github.com
// @connect     gist.githubusercontent.com
// @grant       GM_setClipboard
// @grant       GM_xmlhttpRequest
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-copy-raw-source.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-copy-raw-source.user.js
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==

(function () {
	var rawCopyClass = "raw-copy-button";
	var disabled = "disabled";

	var greenBg = "#a8f1c6";
	var redBg = "#f6a7a3";

	function resetCopyBg(element) {
		if (!element) {
			return;
		}
		if (element.bgTimeout) {
			window.clearTimeout(element.bgTimeout);
			element.bgTimeout = null;
		}
		element.style.background = "";
		element.classList.remove(disabled);

		var svg = element.querySelector("svg");
		if (svg) {
			svg.style.display = "none";
		}
	}

	function copyDone(success, button) {
		if (!button) {
			return;
		}
		resetCopyBg(button);

		button.style.background = success ? greenBg : redBg;
		button.bgTimeout = window.setTimeout(resetCopyBg.bind(null, button), 1000);
	}

	function copyClickedHandler(url) {
		return function copyClickedAction(e) {
			if (!e || !e.target || !e.target.classList.contains(rawCopyClass)) {
				return;
			}
			var svg = e.target.querySelector("svg");
			if (!svg) {
				return;
			}

			resetCopyBg(e.target);
			e.preventDefault();
			if (e.target.classList.contains(disabled)) {
				return;
			}
			e.target.classList.add(disabled);
			svg.style.display = "block";

			// Request the raw page
			GM_xmlhttpRequest({
				method: "GET",
				url: url,
				onload: function copyOnLoad(result) {
					GM_setClipboard(result.responseText, "text/plain");
					copyDone(true, e.target);
				},
				onerror: copyDone.bind(null, false, e.target),
			});
		};
	}

	function addCopyButton(rawButton, isGist) {
		if (!rawButton) {
			return;
		}
		/* <a class="btn-sm btn BtnGroup-item">Raw</a>*/
		var a = document.createElement("A");
		a.classList.add("btn-sm", "btn", rawCopyClass);
		if (!isGist) {
			a.classList.add("BtnGroup-item");
		}
		a.style.position = "relative";
		// https://github.com/SamHerbert/SVG-Loaders
		a.innerHTML =
			'Copy<svg stroke="currentColor" style="position: absolute; top: 0; right: 0; display: none;" width="16" height="16" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke-width="2"><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="0s" calcMode="spline" dur="1.8s" keySplines="0.165, 0.84, 0.44, 1" keyTimes="0; 1" repeatCount="indefinite" values="1; 20"/><animate attributeName="stroke-opacity" begin="0s" calcMode="spline" dur="1.8s" keySplines="0.3, 0.61, 0.355, 1" keyTimes="0; 1" repeatCount="indefinite" values="1; 0"/></circle><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="-0.9s" calcMode="spline" dur="1.8s" keySplines="0.165, 0.84, 0.44, 1" keyTimes="0; 1" repeatCount="indefinite" values="1; 20"/><animate attributeName="stroke-opacity" begin="-0.9s" calcMode="spline" dur="1.8s" keySplines="0.3, 0.61, 0.355, 1" keyTimes="0; 1" repeatCount="indefinite" values="1; 0"/></circle></g></svg>';

		a.addEventListener("click", copyClickedHandler(rawButton.href + ""));

		rawButton.parentElement.appendChild(a);
	}

	setInterval(function startGitHubRawDownload() {
		// Check if our button is on the page already
		if (document.querySelector("." + rawCopyClass)) {
			return;
		}

		if (0 == window.location.host.indexOf("gist.")) {
			// Find the  "raw" button on gists
			var elements = document.querySelectorAll(".file-actions > a");
			if (!elements) {
				return;
			}
			for (var i = 0; i < elements.length; i++) {
				if ("Raw" == elements[i].innerText) {
					addCopyButton(elements[i], true);
				}
			}
		} else {
			// "Raw" button
			var rawButton = document.getElementById("raw-url");
			addCopyButton(rawButton, false);
		}
	}, 250);
})();
