// ==UserScript==
// @name        GitHub Code Colors
// @version     1.2.3
// @description A userscript that adds a color swatch next to the code color definition
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM.addStyle
// @grant       GM_addStyle
// @require     https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js?updated=20180103
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=634242
// @icon        https://assets-cdn.github.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-colors.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-colors.user.js
// ==/UserScript==
(() => {
	"use strict";

	GM.addStyle(`
		.ghcc-block { width:12px; height:12px; display:inline-block;
			vertical-align:middle; margin-right:4px; border-radius:3px;
			border:1px solid rgba(119, 119, 119, 0.5); }
	`);

	const namedColors = [
		"aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige",
		"bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown",
		"burlywood", "cadetblue", "chartreuse", "chocolate", "coral",
		"cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan",
		"darkgoldenrod", "darkgray", "darkgrey", "darkgreen", "darkkhaki",
		"darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred",
		"darksalmon", "darkseagreen", "darkslateblue", "darkslategray",
		"darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue",
		"dimgray", "dimgrey", "dodgerblue", "firebrick", "floralwhite",
		"forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod",
		"gray", "grey", "green", "greenyellow", "honeydew", "hotpink",
		"indianred", "indigo", "ivory", "khaki", "lavender", "lavenderblush",
		"lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan",
		"lightgoldenrodyellow", "lightgray", "lightgrey", "lightgreen",
		"lightpink", "lightsalmon", "lightseagreen", "lightskyblue",
		"lightslategray", "lightslategrey", "lightsteelblue", "lightyellow",
		"lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine",
		"mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen",
		"mediumslateblue", "mediumspringgreen", "mediumturquoise",
		"mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin",
		"navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange",
		"orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise",
		"palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum",
		"powderblue", "purple", "rebeccapurple", "red", "rosybrown", "royalblue",
		"saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna",
		"silver", "skyblue", "slateblue", "slategray", "slategrey", "snow",
		"springgreen", "steelblue", "tan", "teal", "thistle", "tomato",
		"turquoise", "violet", "wheat", "white", "whitesmoke", "yellow",
		"yellowgreen"
	].join("|");

	const regexNamed = new RegExp("^(" + namedColors + ")$", "i");
	// Ex: #123, #123456 or 0x123456 (unix style colors, used by three.js)
	const regexHex = /^(#|0x)([0-9A-F]{6,8}|[0-9A-F]{3,4})$/i;
	// Ex: rgb(0,0,0) or rgba(0,0,0,0.2)
	const regexRGB = /^rgba?(\([^\)]+\))?/i;
	const regexRGBA = /rgba/i;
	// Ex: hsl(0,0%,0%) or hsla(0,0%,0%,0.2);
	const regexHSL = /^hsla?(\([^\)]+\))?/i;

	// Misc regex
	const regexQuotes = /['"]/g;
	const regexUnix = /^0x/;
	const regexPercent = /%%/g;

	// Don't use a div, because GitHub-Dark adds a :hover background
	// color definition on divs
	const block = document.createElement("span");
	block.className = "ghcc-block";

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

	function rgb(els, el, txt) {
		// Color in a string contains everything
		if (el.classList.contains("pl-s")) {
			txt = txt.match(regexRGB)[0];
		} else {
			// Rgb(a) colors contained in multiple "pl-c1" spans
			let indx = regexRGBA.test(txt) ? 4 : 3;
			const tmp = [];
			while (indx) {
				tmp.push(getTextContent(els.shift()));
				indx--;
			}
			txt += "(" + tmp.join(",") + ")";
		}
		addNode(el, txt);
		return els;
	}

	function hsl(els, el, txt) {
		const tmp = /a$/i.test(txt);
		if (el.classList.contains("pl-s")) {
			// Color in a string contains everything
			txt = txt.match(regexHSL)[0];
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
		addNode(el, txt.replace(regexPercent, "%"));
		return els;
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
					txt = txt.replace(regexQuotes, "");
				}
				if (regexHex.test(txt) || regexNamed.test(txt)) {
					addNode(el, txt.replace(regexUnix, "#"));
				} else if (regexRGB.test(txt)) {
					els = rgb(els, el, txt);
				} else if (regexHSL.test(txt)) {
					els = hsl(els, el, txt);
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
	addColors();

})();
