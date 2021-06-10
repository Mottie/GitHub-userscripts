// ==UserScript==
// @name        GitHub in VSCode
// @version     0.1.2
// @description A userscript that adds a button to open a repo in VSCode using github1s
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       none
// @connect     github.com
// @connect     githubusercontent.com
// @require     https://greasyfork.org/scripts/398877-utils-js/code/utilsjs.js?version=895926
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=882023
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/meta/github-in-vscode.meta.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-in-vscode.user.js
// @supportURL  https://github.com/Mottie/GitHub-userscripts/issues
// ==/UserScript==
/* global $ on make */
(() => {
	"use strict";

	// Icon modified from https://commons.wikimedia.org/wiki/File:Visual_Studio_Code_1.35_icon.svg
	const vsCodeIcon = `
		<svg class="octicon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="none" aria-hidden="true" style="pointer-events:none">
			<mask id="a" maskUnits="userSpaceOnUse" x="0" y="0" width="256" height="256">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M181.534 254.252a15.934 15.934 0 0012.7-.488l52.706-25.361a16.002 16.002 0 009.06-14.42V42.018c0-6.15-3.522-11.754-9.06-14.42L194.234 2.238a15.939 15.939 0 00-18.185 3.097l-100.9 92.052-43.95-33.361a10.655 10.655 0 00-13.614.605L3.49 77.453c-4.648 4.227-4.653 11.54-.011 15.774L41.593 128 3.478 162.773c-4.642 4.235-4.637 11.547.011 15.775l14.097 12.822a10.655 10.655 0 0013.613.606l43.95-33.362 100.9 92.053a15.915 15.915 0 005.485 3.585zm10.505-184.367L115.479 128l76.56 58.115V69.885z" fill="#fff"/>
			</mask>
			<g mask="url(#a)">
				<path d="M246.94 27.638L194.193 2.241a15.947 15.947 0 00-18.194 3.092L3.324 162.773c-4.645 4.235-4.64 11.547.011 15.775L17.44 191.37a10.667 10.667 0 0013.622.606l207.941-157.75c6.976-5.291 16.996-.316 16.996 8.44v-.612a16 16 0 00-9.059-14.416z" fill="#0065A9"/>
				<g filter="url(#filter0_d)">
					<path d="M246.94 228.362l-52.747 25.397a15.95 15.95 0 01-18.194-3.092L3.324 93.227c-4.645-4.234-4.64-11.547.011-15.775L17.44 64.63a10.667 10.667 0 0113.622-.605l207.941 157.748c6.976 5.292 16.996.317 16.996-8.44v.613a16.001 16.001 0 01-9.059 14.416z" fill="#007ACC"/>
				</g>
				<g filter="url(#filter1_d)">
					<path d="M194.196 253.763A15.955 15.955 0 01176 250.667c5.904 5.904 16 1.722 16-6.628V11.961c0-8.35-10.096-12.532-16-6.628a15.955 15.955 0 0118.196-3.097L246.934 27.6A16 16 0 01256 42.017v171.965a16 16 0 01-9.066 14.419l-52.738 25.361z" fill="#1F9CF0"/>
				</g>
				<path fill-rule="evenodd" clip-rule="evenodd" d="M181.378 254.252a15.936 15.936 0 0012.699-.488l52.706-25.362a16 16 0 009.061-14.419V42.018c0-6.15-3.522-11.754-9.06-14.42L194.077 2.238a15.939 15.939 0 00-18.185 3.096l-100.9 92.053-43.95-33.361a10.655 10.655 0 00-13.613.605L3.333 77.452c-4.648 4.228-4.653 11.54-.011 15.775L41.436 128 3.322 162.773c-4.642 4.235-4.637 11.547.011 15.775L17.43 191.37a10.655 10.655 0 0013.614.606l43.95-33.362 100.899 92.053a15.919 15.919 0 005.486 3.585zm10.505-184.367L115.323 128l76.56 58.115V69.885z" fill="url(#paint0_linear)" opacity=".25"/>
			</g>
			<defs>
				<filter id="filter0_d" x="-21.49" y="40.523" width="298.822" height="236.149" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
					<feFlood flood-opacity="0" result="BackgroundImageFix"/>
					<feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
					<feOffset/>
					<feGaussianBlur stdDeviation="10.667"/>
					<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
					<feBlend mode="overlay" in2="BackgroundImageFix" result="effect1_dropShadow"/>
					<feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
				</filter>
				<filter id="filter1_d" x="154.667" y="-20.674" width="122.667" height="297.347" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
					<feFlood flood-opacity="0" result="BackgroundImageFix"/>
					<feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
					<feOffset/>
					<feGaussianBlur stdDeviation="10.667"/>
					<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
					<feBlend mode="overlay" in2="BackgroundImageFix" result="effect1_dropShadow"/>
					<feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
				</filter>
				<linearGradient id="paint0_linear" x1="127.844" y1=".66" x2="127.844" y2="255.34" gradientUnits="userSpaceOnUse">
					<stop stop-color="#fff"/>
					<stop offset="1" stop-color="#fff" stop-opacity="0"/>
				</linearGradient>
			</defs>
		</svg>`;

	const contentWrap = document.createElement("div");
	contentWrap.className = "ghiv-content";

	function init() {
		const goToFile = $("a[data-hotkey='t']");
		if (!goToFile || $(".ghiv-link")) {
			return;
		}

		const margin = goToFile.classList.contains("mr-2") ? "mr-2" : "ml-2";
		const link = make({
			el: "a",
			className: `ghiv-link btn ${margin} tooltipped tooltipped-n`,
			attrs: {
				href: `https://github1s.com${window.location.pathname}`,
				"aria-label": "Open this repo in VS Code using github1s",
				target: "_blank",
				rel: "noopener noreferrer"
			},
			html: vsCodeIcon
		});
		goToFile.before(link);
	}

	on(document, "ghmo:container pjax:end", init);
	init();
})();
