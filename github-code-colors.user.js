// ==UserScript==
// @name          GitHub Code Colors
// @version       1.1.1
// @description   A userscript that adds a color swatch next to the code color definition
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     https://github.com/Mottie
// @include       https://github.com/*
// @grant         GM_addStyle
// @run-at        document-idle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-colors.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-colors.user.js
// ==/UserScript==
(() => {
	"use strict";

	GM_addStyle(`
		.ghcc-block { width:12px; height:12px; display:inline-block;
			vertical-align:middle; margin-right:4px; border:1px solid #555; }
	`);

	const namedColors = [
			"aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige",
			"bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown",
			"burlywood", "cadetblue", "chartreuse", "chocolate", "coral",
			"cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan",
			"darkgoldenrod", "darkgray", "darkgrey", "darkgreen", "darkkhaki",
			"darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred",
			"darksalmon", "darkseagreen", "darkslateblue", "darkslategray",
			"darkslagegrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue",
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
		].join("|"),

		// don't use a div, because GitHub-Dark adds a :hover background
		// color definition on divs
		block = document.createElement("span");
	block.className = "ghcc-block";

	function addNode(el, val) {
		const node = block.cloneNode();
		node.style.backgroundColor = val;
		// don't add node if color is invalid
		if (node.style.backgroundColor !== "") {
			el.insertBefore(node, el.childNodes[0]);
		}
	}

	function addColors() {
		if (document.querySelector(".highlight")) {
			let indx = 0;
			const regexNamed = new RegExp("^(" + namedColors + ")$", "i"),
				// #123, #123456 or 0x123456 (unix style colors, used by three.js)
				regexHex = /^(#|0x)([0-9A-F]{6}|[0-9A-F]{3})$/i,
				// rgb(0,0,0) or rgba(0,0,0,0.2)
				regexRGB = /^rgba?(\([^\)]+\))?/i,
				// hsl(0,0%,0%) or hsla(0,0%,0%,0.2);
				regexHSL = /^hsla?(\([^\)]+\))?/i,

				// misc regex
				regexQuotes = /['"]/g,
				regexUnix = /^0x/,
				regexPercent = /%%/g,

				// .pl-c1 targets css hex colors, "rgb" and "hsl"
				els = document.querySelectorAll(".pl-c1, .pl-s"),
				len = els.length;

			// loop with delay to allow user interaction
			const loop = () => {
				let el, txt, tmp,
					// max number of DOM insertions per loop
					max = 0;
				while (max < 20 && indx < len) {
					if (indx >= len) {
						return;
					}
					el = els[indx];
					txt = el.textContent;
					if (el.classList.contains("pl-s")) {
						txt = txt.replace(regexQuotes, "");
					}
					if (regexHex.test(txt) || regexNamed.test(txt)) {
						if (!el.querySelector(".ghcc-block")) {
							addNode(el, txt.replace(regexUnix, "#"));
							max++;
						}
					} else if (regexRGB.test(txt)) {
						if (!el.querySelector(".ghcc-block")) {
							txt = el.classList.contains("pl-s") ?
								// color in a string contains everything
								txt.match(regexRGB)[0] :
								txt + "(" + els[++indx].textContent + ")";
							addNode(el, txt);
							max++;
						}
					} else if (regexHSL.test(txt)) {
						if (!el.querySelector(".ghcc-block")) {
							tmp = /a$/i.test(txt);
							txt = el.classList.contains("pl-s") ?
								// color in a string contains everything
								txt.match(regexHSL)[0] :
								// traverse this HTML... & els only contains the pl-c1 nodes
								// <span class="pl-c1">hsl</span>(<span class="pl-c1">1</span>,
								// <span class="pl-c1">1</span><span class="pl-k">%</span>,
								// <span class="pl-c1">1</span><span class="pl-k">%</span>);
								txt + "(" + els[++indx].textContent + "," +
								els[++indx].textContent + "%," +
								// hsla needs one more parameter
								els[++indx].textContent + "%" +
								(tmp ? "," + els[++indx].textContent : "") + ")";
							// sometimes (previews only?) the .pl-k span is nested inside
							// the .pl-c1 span, so we end up with "%%"
							addNode(el, txt.replace(regexPercent, "%"));
							max++;
						}
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
	}

	document.addEventListener("pjax:end", addColors);
	// "preview:render" only fires when using the hotkey :(
	// "preview:setup" fires on hover & click of comment preview tab
	document.addEventListener("preview:setup", () => {
		setTimeout(() => {
			// must include some rendering time...
			// 200 ms seems to be enough for a 1100+ line markdown file
			addColors();
		}, 500);
	});
	addColors();
})();
