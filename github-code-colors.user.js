// ==UserScript==
// @name        GitHub Code Colors
// @version     2.0.4
// @description A userscript that adds a color swatch next to the code color definition
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM.addStyle
// @grant       GM_addStyle
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @require     https://greasyfork.org/scripts/387811-color-bundle/code/color-bundle.js?version=719499
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-colors.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-colors.user.js
// ==/UserScript==
/* global Color */
(() => {
	"use strict";

	// whitespace:initial => overrides code-wrap css in content
	GM.addStyle(`
	.ghcc-block { width:14px; height:14px; display:inline-block;
		vertical-align:middle; margin-right:4px; border-radius:4px;
		border:1px solid rgba(119, 119, 119, 0.5); position:relative;
		background-image:none; cursor:pointer; }
	.ghcc-popup { position:absolute; background:#222; color:#eee;
		min-width:350px; top:100%; left:0px; padding:10px; z-index:100;
		white-space:pre; cursor:text; text-align:left; -webkit-user-select:text;
		-moz-user-select:text; -ms-user-select:text; user-select:text; }
	.markdown-body .highlight pre, .markdown-body pre {
		overflow-y:visible !important; }
	.ghcc-copy { padding:2px 6px; margin-right:4px; background:transparent;
		border:0; }`);

	const namedColors = Object.keys(Color.namedColors);
	const namedColorsList = namedColors.reduce((acc, name) => {
		acc[name] = `rgb(${Color.namedColors[name].join(", ")})`;
		return acc;
	}, {});

	const copyButton = document.createElement("clipboard-copy");
	copyButton.className = "btn btn-sm btn-blue tooltipped tooltipped-w ghcc-copy";
	copyButton.setAttribute("aria-label", "Copy to clipboard");
	// This hint isn't working yet (GitHub needs to fix it)
	copyButton.setAttribute("data-copied-hint", "Copied!");
	copyButton.innerHTML = `
		<svg aria-hidden="true" class="octicon octicon-clippy" height="14" viewBox="0 0 14 16" width="14">
			<path fill-rule="evenodd" d="M2 13h4v1H2v-1zm5-6H2v1h5V7zm2 3V8l-3 3 3 3v-2h5v-2H9zM4.5 9H2v1h2.5V9zM2 12h2.5v-1H2v1zm9 1h1v2c-.02.28-.11.52-.3.7-.19.18-.42.28-.7.3H1c-.55 0-1-.45-1-1V4c0-.55.45-1 1-1h3c0-1.11.89-2 2-2 1.11 0 2 .89 2 2h3c.55 0 1 .45 1 1v5h-1V6H1v9h10v-2zM2 5h8c0-.55-.45-1-1-1H8c-.55 0-1-.45-1-1s-.45-1-1-1-1 .45-1 1-.45 1-1 1H3c-.55 0-1 .45-1 1z"></path>
		</svg>`;

	// Misc regex
	const regex = {
		quotes: /['"]/g,
		unix: /^0x/,
		percent: /%%/g
	};

	// Don't use a div, because GitHub-Dark adds a :hover background
	// color definition on divs
	const block = document.createElement("button");
	block.className = "ghcc-block";
	block.tabIndex = 0;
	// prevent submitting on click in comment preview
	block.type = "button";
	block.onclick = "event => event.stopPropagation()";

	const br = document.createElement("br");

	const popup = document.createElement("span");
	popup.className = "ghcc-popup";

	const formats = {
		named: {
			regex: new RegExp("^(" + namedColors.join("|") + ")$", "i"),
			convert: color => {
				const rgb = color.rgb().toString();
				if (Object.values(namedColorsList).includes(rgb)) {
					// There may be more than one named color
					// e.g. "slategray" & "slategrey"
					return Object.keys(namedColorsList)
						.filter(n => namedColorsList[n] === rgb)
						.join("<br />");
				}
				return "";
			},
		},
		hex: {
			// Ex: #123, #123456 or 0x123456 (unix style colors, used by three.js)
			regex: /^(#|0x)([0-9A-F]{6,8}|[0-9A-F]{3,4})$/i,
			convert: color => `${color.hex().toString()}`,
		},
		rgb: {
			regex: /^rgba?(\([^\)]+\))?/i,
			regexAlpha: /rgba/i,
			find: (els, el, txt) => {
				// Color in a string contains everything
				if (el.classList.contains("pl-s")) {
					txt = txt.match(formats.rgb.regex)[0];
				} else {
					// Rgb(a) colors contained in multiple "pl-c1" spans
					let indx = formats.rgb.regexAlpha.test(txt) ? 4 : 3;
					const tmp = [];
					while (indx) {
						tmp.push(getTextContent(els.shift()));
						indx--;
					}
					txt += "(" + tmp.join(",") + ")";
				}
				addNode(el, txt);
				return els;
			},
			convert: color => {
				const rgb = color.rgb().alpha(1).toString();
				const rgba = color.rgb().toString();
				return `${rgb}${rgb === rgba ? "" : "; " + rgba}`;
			}
		},
		hsl: {
			// Ex: hsl(0,0%,0%) or hsla(0,0%,0%,0.2);
			regex: /^hsla?(\([^\)]+\))?/i,
			find: (els, el, txt) => {
				const tmp = /a$/i.test(txt);
				if (el.classList.contains("pl-s")) {
					// Color in a string contains everything
					txt = txt.match(formats.hsl.regex)[0];
				} else {
					// Traverse this HTML... & els only contains the pl-c1 nodes
					// <span class="pl-c1">hsl</span>(<span class="pl-c1">1</span>,
					// <span class="pl-c1">1</span><span class="pl-k">%</span>,
					// <span class="pl-c1">1</span><span class="pl-k">%</span>);
					// using getTextContent in case of invalid css
					txt = txt + "(" + getTextContent(els.shift()) + "," +
						getTextContent(els.shift()) + "%," +
						// Hsla needs one more parameter
						getTextContent(els.shift()) + "%" +
						(tmp ? "," + getTextContent(els.shift()) : "") + ")";
				}
				// Sometimes (previews only?) the .pl-k span is nested inside
				// the .pl-c1 span, so we end up with "%%"
				addNode(el, txt.replace(regex.percent, "%"));
				return els;
			},
			convert: color => {
				const hsl = color.hsl().alpha(1).round().toString();
				const hsla = color.hsl().round().toString();
				return `${hsl}${hsl === hsla ? "" : "; " + hsla}`;
			}
		},
		hwb: {
			convert: color => color.hwb().round().toString()
		},
		cymk: {
			convert: color => {
				const cmyk = color.cmyk().round().array(); // array of numbers
				return `device-cmyk(${cmyk.shift()}, ${cmyk.join("%, ")})`;
			}
		},
	};

	function showPopup(el) {
		const popup = createPopup(el.style.backgroundColor);
		el.appendChild(popup);
	}

	function hidePopup(el) {
		el.textContent = "";
	}

	function checkPopup(event) {
		const el = event.target;
		if (el && el.classList.contains("ghcc-block")) {
			if (event.type === "click") {
				if (el.textContent) {
					hidePopup(el)
				} else {
					showPopup(el);
				}
			}
		}
		if (event.type === "keyup" && event.key === "Escape") {
			// hide all popups
			[...document.querySelectorAll(".ghcc-block")].forEach(el => {
				el.textContent = "";
			});
		}
	}

	function createPopup(val) {
		const color = Color(val);
		const el = popup.cloneNode();
		const fragment = document.createDocumentFragment();
		Object.keys(formats).forEach(type => {
			if (typeof formats[type].convert === "function") {
				const val = formats[type].convert(color);
				if (val) {
					const button = copyButton.cloneNode(true);
					button.value = val;
					fragment.appendChild(button);
					fragment.appendChild(document.createTextNode(val));
					fragment.appendChild(br.cloneNode());
				}
			}
		});
		el.appendChild(fragment);
		return el;
	}

	function addNode(el, val) {
		const node = block.cloneNode();
		node.style.backgroundColor = val;
		// Don't add node if color is invalid
		if (node.style.backgroundColor !== "") {
			el.insertBefore(node, el.childNodes[0]);
		}
	}

	function getTextContent(el) {
		return el ? el.textContent : "";
	}

	// Loop with delay to allow user interaction
	function* addBlock(els) {
		let last = "";
		while (els.length) {
			let el = els.shift();
			let txt = el.textContent;
			if (
				// No swatch for JavaScript Math.tan
				last === "Math" ||
				// Ignore nested pl-c1 (see https://git.io/fNF3N)
				el.parentNode && el.parentNode.classList.contains("pl-c1")
			) {
				// noop
			} else if (!el.querySelector(".ghcc-block")) {
				if (el.classList.contains("pl-s")) {
					txt = txt.replace(regex.quotes, "");
				}
				if (formats.hex.regex.test(txt) || formats.named.regex.test(txt)) {
					addNode(el, txt.replace(regex.unix, "#"));
				} else if (formats.rgb.regex.test(txt)) {
					els = formats.rgb.find(els, el, txt);
				} else if (formats.hsl.regex.test(txt)) {
					els = formats.hsl.find(els, el, txt);
				}
			}
			last = txt;
			yield els;
		}
	}

	function addColors() {
		if (document.querySelector(".highlight")) {
			let status;
			// .pl-c1 targets css hex colors, "rgb" and "hsl"
			const els = [...document.querySelectorAll(".pl-c1, .pl-s")];
			const iter = addBlock(els);
			const loop = () => {
				for (let i = 0; i < 40; i++) {
					status = iter.next();
				}
				if (!status.done) {
					requestAnimationFrame(loop);
				}
			};
			loop();
		}
	}

	document.addEventListener("ghmo:container", addColors);
	document.addEventListener("ghmo:preview", addColors);
	document.addEventListener("click", checkPopup);
	document.addEventListener("keyup", checkPopup);
	addColors();

})();