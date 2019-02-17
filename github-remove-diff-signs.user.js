// ==UserScript==
// @name        GitHub Remove Diff Signs
// @version     1.3.2
// @description A userscript that hides the "+" and "-" from code diffs
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-remove-diff-signs.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-remove-diff-signs.user.js
// ==/UserScript==
(() => {
	"use strict";

	GM_addStyle(`
		.blob-code-inner:before,
		.blob-code-marker-context:before,
		.blob-code-marker-addition:before,
		.blob-code-marker-deletion:before {
			visibility: hidden !important;
		}`
	);

})();
