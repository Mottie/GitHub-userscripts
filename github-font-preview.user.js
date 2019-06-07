// ==UserScript==
// @name        GitHub Font Preview
// @version     1.0.22
// @description A userscript that adds a font file preview
// @license     MIT
// @author      Rob Garrison
// @namespace   https://github.com/Mottie
// @include     https://github.com/*
// @run-at      document-idle
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @connect     github.com
// @connect     githubusercontent.com
// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427
// @require     https://greasyfork.org/scripts/20469-opentype-js/code/opentypejs.js?version=130870
// @icon        https://github.githubassets.com/pinned-octocat.svg
// @updateURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-font-preview.user.js
// @downloadURL https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-font-preview.user.js
// ==/UserScript==
(() => {
	"use strict";

	let font;
	let showUnicode = GM_getValue("gfp-show-unicode", false);
	let showPoints = GM_getValue("gfp-show-points", true);
	let showArrows = GM_getValue("gfp-show-arrows", true);
	let currentIndex = 0;

	// supported font types
	const fontExt = /\.(otf|ttf|woff)$/i;

	// canvas colors
	const glyphFillColor = "#808080"; // (big) (mini) fill color
	const bigGlyphStrokeColor = "#111111"; // (big) stroke color
	const bigGlyphMarkerColor = "#f00"; // (big) min & max width marker
	const miniGlyphMarkerColor = "#606060"; // (mini) glyph index (bottom left corner)
	const glyphRulerColor = "#a0a0a0"; // (mini) min & max width marker & (big) glyph horizontal lines

	function startLoad() {
		const block = $(".blob-wrapper a[href*='?raw=true']");
		const body = block && block.closest(".Box-body");
		if (body) {
			body.classList.add("ghfp-body");
			body.innerHTML = "<span class='gfp-loading ghd-invert'></span>";
		}
		return block && block.href;
	}

	function getFont() {
		const url = startLoad();
		if (url) {
			// add loading indicator
			GM_xmlhttpRequest({
				method: "GET",
				url,
				responseType: "arraybuffer",
				onload: response => {
					setupFont(response.response);
				}
			});
		}
	}

	function setupFont(data) {
		const block = $(".ghfp-body");
		const el = $(".final-path");
		if (block && el) {
			try {
				font = opentype.parse(data);
				addHTML(block, el);
				showErrorMessage("");
				onFontLoaded(font);
			} catch (err) {
				block.innerHTML = "<h2 class='gfp-message cdel'></h2>";
				showErrorMessage(err.toString());
				if (err.stack) {
					console.error(err.stack);
				}
				throw (err);
			}
		}
	}

	function addHTML(block, el) {
		let name = el.textContent || "";
		block.innerHTML = `
			<div id="gfp-wrapper">
				<span class="gfp-info" id="gfp-font-name">${name}</span>
				<h2 class="gfp-message cdel"></h2>
				<hr>
				<div id="gfp-font-data">
					<div class="gfp-collapsed">Font Header table <a href="https://www.microsoft.com/typography/OTSPEC/head.htm" target="_blank">head</a></div>
					<dl id="gfp-head-table"><dt>Undefined</dt></dl>
					<div class="gfp-collapsed">Horizontal Header table <a href="https://www.microsoft.com/typography/OTSPEC/hhea.htm" target="_blank">hhea</a></div>
					<dl id="gfp-hhea-table"><dt>Undefined</dt></dl>
					<div class="gfp-collapsed">Maximum Profile table <a href="https://www.microsoft.com/typography/OTSPEC/maxp.htm" target="_blank">maxp</a></div>
					<dl id="gfp-maxp-table"><dt>Undefined</dt></dl>
					<div class="gfp-collapsed">Naming table <a href="https://www.microsoft.com/typography/OTSPEC/name.htm" target="_blank">name</a></div>
					<dl id="gfp-name-table"><dt>Undefined</dt></dl>
					<div class="gfp-collapsed">OS/2 and Windows Metrics table <a href="https://www.microsoft.com/typography/OTSPEC/os2.htm" target="_blank">OS/2</a></div>
					<dl id="gfp-os2-table"><dt>Undefined</dt></dl>
					<div class="gfp-collapsed">PostScript table <a href="https://www.microsoft.com/typography/OTSPEC/post.htm" target="_blank">post</a></div>
					<dl id="gfp-post-table"><dt>Undefined</dt></dl>
					<div class="gfp-collapsed">Character To Glyph Index Mapping Table <a href="https://www.microsoft.com/typography/OTSPEC/cmap.htm" target="_blank">cmap</a></div>
					<dl id="gfp-cmap-table"><dt>Undefined</dt></dl>
					<div class="gfp-collapsed">Font Variations table <a href="https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6fvar.html" target="_blank">fvar</a></div>
					<dl id="gfp-fvar-table"><dt>Undefined</dt></dl>
				</div>
				<hr>
				<div>
					<div>Show unicode: <input class="gfp-show-unicode" type="checkbox"${showUnicode ? " checked" : ""}></div>
					Glyphs <span id="gfp-pagination"></span>
					<br>
					<div id="gfp-glyph-list-end"></div>
				</div>
				<div style="position: relative">
					<div id="gfp-glyph-display">
						<canvas id="gfp-glyph-bg" class="ghd-invert" width="500" height="500"></canvas>
						<canvas id="gfp-glyph" class="ghd-invert" width="500" height="500"></canvas>
					</div>
					<div id="gfp-glyph-data"></div>
					<div style="clear: both"></div>
				</div>
				<span style="font-size:0.8em">Powered by <a href="https://github.com/nodebox/opentype.js">opentype.js</a></span>
			</div>
		`;
		prepareGlyphList();
		// Add bindings for collapsible font data
		let tableHeaders = document.getElementById("gfp-font-data").getElementsByTagName("div"),
			indx = tableHeaders.length;
		while (indx--) {
			tableHeaders[indx].addEventListener("click", event => {
				event.target && event.target.classList.toggle("gfp-collapsed");
			}, false);
		}
		addBindings();
	}

	function addBindings() {
		$(".gfp-show-unicode").addEventListener("change", function() {
			showUnicode = this.checked;
			GM_setValue("gfp-show-unicode", showUnicode);
			displayGlyphPage(pageSelected);
			return false;
		}, false);

		$("#gfp-glyph-data").addEventListener("change", function() {
			showPoints = $(".gfp-show-points", this).checked;
			showArrows = $(".gfp-show-arrows", this).checked;
			GM_setValue("gfp-show-points", showPoints);
			GM_setValue("gfp-show-arrows", showArrows);
			cellSelect();
			return false;
		}, false);
	}

	function $(selector, el) {
		return (el || document).querySelector(selector);
	}

	function init() {
		// get file name from bread crumb
		let el = $(".final-path");
		// font extension supported?
		if (el && fontExt.test(el.textContent || "")) {
			getFont();
		}
	}

	document.addEventListener("ghmo:container", init);
	init();

	/* Code modified from http://opentype.js.org/ demos */
	GM_addStyle(`
		#gfp-wrapper { text-align:left; padding:20px; }
		#gfp-wrapper canvas { background-image:none !important; background-color:transparent !important; }
		.gfp-message { position:relative; top:-3px; padding:1px 5px; font-weight:bold; border-radius:2px; display:none; clear:both; }
		#gfp-glyphs { width:950px; }
		.gfp-info { float:right; font-size:14px; color:#999; }
		#gfp-wrapper hr { clear:both; border:none; border-bottom:1px solid #ccc; margin:20px 0 20px 0; padding:0; }
		/* Font Inspector */
		#gfp-font-data div { font-weight:normal; margin:0; cursor:pointer; }
		#gfp-font-data div:before { font-size:85%; content:"▼"; display:inline-block; margin-right:6px; transform:unset; }
		#gfp-font-data .gfp-collapsed:before { transform:rotate(-90deg); }
		#gfp-font-data div.gfp-collapsed + dl { display:none; }
		#gfp-font-data dl { margin-top:0; padding-left:2em; color:#777; }
		#gfp-font-data dt { float:left; }
		#gfp-font-data dd { margin-left: 12em; word-break:break-all; max-height:100px; overflow-y:auto; }
		#gfp-font-data .gfp-langtag { font-size:85%; color:#999; white-space:nowrap; }
		#gfp-font-data .gfp-langname { padding-right:0.5em; }
		#gfp-font-data .gfp-underline { border-bottom:1px solid #555; }
		/* Glyph Inspector */
		#gfp-pagination span { margin:0 0.3em; cursor:pointer; }
		#gfp-pagination span.gfp-page-selected { font-weight:bold; cursor:default; -webkit-filter:brightness(150%); filter:brightness(150%); }
		canvas.gfp-item { float:left; border:solid 1px #a0a0a0; margin-right:-1px; margin-bottom:-1px; cursor:pointer; }
		canvas.gfp-item:hover { opacity:.8; }
		#gfp-glyph-list-end { clear:both; height:20px; }
		#gfp-glyph-display { float:left; border:solid 1px #a0a0a0; position:relative; width:500px; height:500px; }
		#gfp-glyph, #gfp-glyph-bg { position:absolute; top:0; left:0; border:0; }
		#gfp-glyph-data { float:left; margin-left:2em; }
		#gfp-glyph-data dl { margin:0; }
		#gfp-glyph-data dt { float:left; }
		#gfp-glyph-data dd { margin-left:12em; }
		#gfp-glyph-data pre { font-size:11px; }
		pre.gfp-path { margin:0; }
		pre.gfp-contour { margin:0 0 1em 2em; border-bottom:solid 1px #a0a0a0; }
		span.gfp-oncurve { color:blue; }
		span.gfp-offcurve { color:red; }
		.gfp-loading { display:block; margin:20px auto; border-radius:50%; border-width:2px; border-style:solid; border-color: transparent transparent #000 #000; width:30px; height:30px; animation:gfploading .5s infinite linear; }
		@keyframes gfploading { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
	`);

/*eslint-disable */
	/* Code copied from http://opentype.js.org/font-inspector.html */
	function escapeHtml(unsafe) {
		return unsafe
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/\u0022/g, '&quot;')
			.replace(/\u0027/g, '&#039;');
	}

	function displayNames(names) {
		let indx, property, translations, langs, lang, langIndx, langLen, esclang,
			html = '',
			properties = Object.keys(names),
			len = properties.length;
		for (indx = 0; indx < len; indx++) {
			property = properties[indx];
			html += '<dt>' + escapeHtml(property) + '</dt><dd>';
			translations = names[property];
			langs = Object.keys(translations);
			langLen = langs.length;
			for (langIndx = 0; langIndx < langLen; langIndx++) {
				lang = langs[langIndx];
				esclang = escapeHtml(lang);
				html += '<span class="gfp-langtag">' + esclang +
					'</span> <span class="gfp-langname" lang=' + esclang + '>' +
					escapeHtml(translations[lang]) + '</span> ';
			}
			html += '</dd>';
		}
		document.getElementById('gfp-name-table').innerHTML = html;
	}

	function displayFontData() {
		let html, tablename, table, property, value, element;
		for (tablename in font.tables) {
			if (font.tables.hasOwnProperty(tablename)) {
				table = font.tables[tablename];
				if (tablename === 'name') {
					displayNames(table);
					continue;
				}
				html = '';
				for (property in table) {
					if (table.hasOwnProperty(property)) {
						value = table[property];
						html += '<dt>' + property + '</dt><dd>';
						if (Array.isArray(value) && typeof value[0] === 'object') {
							html += value.map(item => {
								return JSON.stringify(item);
							}).join('<br>');
						} else if (typeof value === 'object') {
							html += JSON.stringify(value);
						} else {
							html += value;
						}
						html += '</dd>';
					}
				}
				element = document.getElementById('gfp-' + tablename + '-table');
				if (element) {
					element.innerHTML = html;
				}
			}
		}
	}

	/* Code copied from http://opentype.js.org/glyph-inspector.html */
	const cellCount = 100,
		cellWidth = 62,
		cellHeight = 60,
		cellMarginTop = 1,
		cellMarginBottom = 8,
		cellMarginLeftRight = 1,
		glyphMargin = 5,
		pixelRatio = window.devicePixelRatio || 1,
		arrowLength = 10,
		arrowAperture = 4;

	let pageSelected, fontScale, fontSize, fontBaseline, glyphScale, glyphSize, glyphBaseline;

	function enableHighDPICanvas(canvas) {
		let pixelRatio, oldWidth, oldHeight;
		if (typeof canvas === 'string') {
			canvas = document.getElementById(canvas);
		}
		pixelRatio = window.devicePixelRatio || 1;
		if (pixelRatio === 1) {
			return;
		}
		oldWidth = canvas.width;
		oldHeight = canvas.height;
		canvas.width = oldWidth * pixelRatio;
		canvas.height = oldHeight * pixelRatio;
		canvas.style.width = oldWidth + 'px';
		canvas.style.height = oldHeight + 'px';
		canvas.getContext('2d').scale(pixelRatio, pixelRatio);
	}

	function showErrorMessage(message) {
		let el = $('.gfp-message');
		el.style.display = (!message || message.trim().length === 0) ? 'none' : 'block';
		el.innerHTML = message;
	}

	function pathCommandToString(cmd) {
		let str = '<strong>' + cmd.type + '</strong> ' +
			((cmd.x !== undefined) ? 'x=' + cmd.x + ' y=' + cmd.y + ' ' : '') +
			((cmd.x1 !== undefined) ? 'x1=' + cmd.x1 + ' y1=' + cmd.y1 + ' ' : '') +
			((cmd.x2 !== undefined) ? 'x2=' + cmd.x2 + ' y2=' + cmd.y2 : '');
		return str;
	}

	function contourToString(contour) {
		return '<pre class="gfp-contour">' + contour.map(point => {
			// ".text-blue" class modified by GitHub Dark style
			// ".cdel" class modified by GitHub Dark style - more readable red
			return '<span class="gfp-' + (point.onCurve ? 'oncurve text-blue' : 'offcurve cdel') +
				'">x=' + point.x + ' y=' + point.y + '</span>';
		}).join('\n') + '</pre>';
	}

	function formatUnicode(unicode) {
		unicode = unicode.toString(16);
		if (unicode.length > 4) {
			return ('000000' + unicode.toUpperCase()).substr(-6);
		} else {
			return ('0000' + unicode.toUpperCase()).substr(-4);
		}
	}

	function displayGlyphData(glyphIndex) {
		let glyph, contours, html,
			container = document.getElementById('gfp-glyph-data'),
			addItem = name => {
				return glyph[name] ? `<dt>${name}</dt><dd>${glyph[name]}</dd>` : '';
			};
		if (glyphIndex < 0) {
			container.innerHTML = '';
			return;
		}
		glyph = font.glyphs.get(glyphIndex);
		html = `<dl>
			<dt>Show points</dt>
			<dd><input class="gfp-show-points" type="checkbox"${showPoints ? ' checked' : ''}></dd>
			<dt>Show arrows</dt>
			<dd><input class="gfp-show-arrows" type="checkbox"${showArrows ? ' checked' : ''}></dd>
			<dt>name</dt><dd>${glyph.name}</dd>`;

		if (glyph.unicode) {
			html += '<dt>unicode</dt><dd>' + glyph.unicodes.map(formatUnicode).join(', ') + '</dd>';
		}
		html += addItem('index') +
			addItem('xMin') +
			addItem('xMax') +
			addItem('yMin') +
			addItem('yMax') +
			addItem('advanceWidth') +
			addItem('leftSideBearing') +
			'</dl>';

		if (glyph.numberOfContours > 0) {
			contours = glyph.getContours();
			html += 'contours:<br>' + contours.map(contourToString).join('\n');
		} else if (glyph.isComposite) {
			html += '<br>This composite glyph is a combination of :<ul><li>' +
				glyph.components.map(component => {
					return 'glyph ' + component.glyphIndex + ' at dx=' + component.dx +
						', dy=' + component.dy;
				}).join('</li><li>') + '</li></ul>';
		} else if (glyph.path) {
			html += 'path:<br><pre class="gfp-path">  ' +
				glyph.path.commands.map(pathCommandToString).join('\n  ') + '\n</pre>';
		}
		container.innerHTML = html;
	}

	function drawArrow(ctx, x1, y1, x2, y2) {
		let dx = x2 - x1,
			dy = y2 - y1,
			segmentLength = Math.sqrt(dx * dx + dy * dy),
			unitx = dx / segmentLength,
			unity = dy / segmentLength,
			basex = x2 - arrowLength * unitx,
			basey = y2 - arrowLength * unity,
			normalx = arrowAperture * unity,
			normaly = -arrowAperture * unitx;
		ctx.beginPath();
		ctx.moveTo(x2, y2);
		ctx.lineTo(basex + normalx, basey + normaly);
		ctx.lineTo(basex - normalx, basey - normaly);
		ctx.lineTo(x2, y2);
		ctx.closePath();
		ctx.fill();
	}

	/**
	 * This function is Path.prototype.draw with an arrow
	 * at the end of each contour.
	 */
	function drawPathWithArrows(ctx, path) {
		let indx, cmd, x1, y1, x2, y2,
			arrows = [],
			len = path.commands.length;
		ctx.beginPath();
		for (indx = 0; indx < len; indx++) {
			cmd = path.commands[indx];
			if (cmd.type === 'M') {
				if (x1 !== undefined) {
					arrows.push([ctx, x1, y1, x2, y2]);
				}
				ctx.moveTo(cmd.x, cmd.y);
			} else if (cmd.type === 'L') {
				ctx.lineTo(cmd.x, cmd.y);
				x1 = x2;
				y1 = y2;
			} else if (cmd.type === 'C') {
				ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
				x1 = cmd.x2;
				y1 = cmd.y2;
			} else if (cmd.type === 'Q') {
				ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
				x1 = cmd.x1;
				y1 = cmd.y1;
			} else if (cmd.type === 'Z') {
				arrows.push([ctx, x1, y1, x2, y2]);
				ctx.closePath();
			}
			x2 = cmd.x;
			y2 = cmd.y;
		}
		if (path.fill) {
			ctx.fillStyle = path.fill;
			ctx.fill();
		}
		if (path.stroke) {
			ctx.strokeStyle = path.stroke;
			ctx.lineWidth = path.strokeWidth;
			ctx.stroke();
		}
		ctx.fillStyle = bigGlyphStrokeColor;
		if (showArrows) {
			arrows.forEach(arrow => {
				drawArrow.apply(null, arrow);
			});
		}
	}

	function displayGlyph(glyphIndex) {
		let glyph, glyphWidth, xmin, xmax, x0, markSize, path,
			canvas = document.getElementById('gfp-glyph'),
			ctx = canvas.getContext('2d'),
			width = canvas.width / pixelRatio,
			height = canvas.height / pixelRatio;
		ctx.clearRect(0, 0, width, height);
		if (glyphIndex < 0) {
			return;
		}
		glyph = font.glyphs.get(glyphIndex);
		glyphWidth = glyph.advanceWidth * glyphScale;
		xmin = (width - glyphWidth) / 2;
		xmax = (width + glyphWidth) / 2;
		x0 = xmin;
		markSize = 10;

		ctx.fillStyle = bigGlyphMarkerColor;
		ctx.fillRect(xmin - markSize + 1, glyphBaseline, markSize, 1);
		ctx.fillRect(xmin, glyphBaseline, 1, markSize);
		ctx.fillRect(xmax, glyphBaseline, markSize, 1);
		ctx.fillRect(xmax, glyphBaseline, 1, markSize);
		ctx.textAlign = 'center';
		ctx.fillText('0', xmin, glyphBaseline + markSize + 10);
		ctx.fillText(glyph.advanceWidth, xmax, glyphBaseline + markSize + 10);

		ctx.fillStyle = bigGlyphStrokeColor;
		path = glyph.getPath(x0, glyphBaseline, glyphSize);
		path.fill = glyphFillColor;
		path.stroke = bigGlyphStrokeColor;
		path.strokeWidth = 1.5;
		drawPathWithArrows(ctx, path);
		if (showPoints) {
			glyph.drawPoints(ctx, x0, glyphBaseline, glyphSize);
		}
	}

	function renderGlyphItem(canvas, glyphIndex) {
		const cellMarkSize = 4,
			ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, cellWidth, cellHeight);
		if (glyphIndex >= font.numGlyphs) {
			return;
		}

		ctx.fillStyle = miniGlyphMarkerColor;
		ctx.font = '10px sans-serif';
		let glyph = font.glyphs.get(glyphIndex),
			glyphWidth = glyph.advanceWidth * fontScale,
			xmin = (cellWidth - glyphWidth) / 2,
			xmax = (cellWidth + glyphWidth) / 2,
			x0 = xmin;

		ctx.fillText(showUnicode ? glyph.unicodes.map(formatUnicode).join(', ') : glyphIndex, 1, cellHeight - 1);

		ctx.fillStyle = glyphRulerColor;
		ctx.fillRect(xmin - cellMarkSize + 1, fontBaseline, cellMarkSize, 1);
		ctx.fillRect(xmin, fontBaseline, 1, cellMarkSize);
		ctx.fillRect(xmax, fontBaseline, cellMarkSize, 1);
		ctx.fillRect(xmax, fontBaseline, 1, cellMarkSize);

		ctx.fillStyle = '#000000';
		let path = glyph.getPath(x0, fontBaseline, fontSize);
		path.fill = glyphFillColor;
		path.draw(ctx);
	}

	function displayGlyphPage(pageNum) {
		pageSelected = pageNum;
		document.getElementById('gfp-p' + pageNum).className = 'gfp-page-selected';
		let indx,
			firstGlyph = pageNum * cellCount;
		for (indx = 0; indx < cellCount; indx++) {
			renderGlyphItem(document.getElementById('gfp-g' + indx), firstGlyph + indx);
		}
	}

	function pageSelect(event) {
		document.getElementsByClassName('gfp-page-selected')[0].className = 'text-blue';
		displayGlyphPage((event.target.id || '').replace('gfp-p', ''));
	}

	function initGlyphDisplay() {
		let glyphBgCanvas = document.getElementById('gfp-glyph-bg'),
			w = glyphBgCanvas.width / pixelRatio,
			h = glyphBgCanvas.height / pixelRatio,
			glyphW = w - glyphMargin * 2,
			glyphH = h - glyphMargin * 2,
			head = font.tables.head,
			maxHeight = head.yMax - head.yMin,
			ctx = glyphBgCanvas.getContext('2d');

		glyphScale = Math.min(glyphW / (head.xMax - head.xMin), glyphH / maxHeight);
		glyphSize = glyphScale * font.unitsPerEm;
		glyphBaseline = glyphMargin + glyphH * head.yMax / maxHeight;

		function hline(text, yunits) {
			let ypx = glyphBaseline - yunits * glyphScale;
			ctx.fillText(text, 2, ypx + 3);
			ctx.fillRect(80, ypx, w, 1);
		}

		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = glyphRulerColor;
		hline('Baseline', 0);
		hline('yMax', font.tables.head.yMax);
		hline('yMin', font.tables.head.yMin);
		hline('Ascender', font.tables.hhea.ascender);
		hline('Descender', font.tables.hhea.descender);
		hline('Typo Ascender', font.tables.os2.sTypoAscender);
		hline('Typo Descender', font.tables.os2.sTypoDescender);
	}

	function onFontLoaded(font) {
		let indx, link, lastIndex,
			w = cellWidth - cellMarginLeftRight * 2,
			h = cellHeight - cellMarginTop - cellMarginBottom,
			head = font.tables.head,
			maxHeight = head.yMax - head.yMin,
			pagination = document.getElementById('gfp-pagination'),
			fragment = document.createDocumentFragment(),
			numPages = Math.ceil(font.numGlyphs / cellCount);

		fontScale = Math.min(w / (head.xMax - head.xMin), h / maxHeight);
		fontSize = fontScale * font.unitsPerEm;
		fontBaseline = cellMarginTop + h * head.yMax / maxHeight;
		pagination.innerHTML = '';

		for (indx = 0; indx < numPages; indx++) {
			link = document.createElement('span');
			lastIndex = Math.min(font.numGlyphs - 1, (indx + 1) * cellCount - 1);
			link.textContent = indx * cellCount + '-' + lastIndex;
			link.id = 'gfp-p' + indx;
			link.className = 'text-blue';
			link.addEventListener('click', pageSelect, false);
			fragment.appendChild(link);
			// A white space allows to break very long lines into multiple lines.
			// This is needed for fonts with thousands of glyphs.
			fragment.appendChild(document.createTextNode(' '));
		}
		pagination.appendChild(fragment);

		displayFontData();
		initGlyphDisplay();
		displayGlyphPage(0);
		displayGlyph(-1);
		displayGlyphData(-1);
	}

	function cellSelect(event) {
		if (!font) {
			return;
		}
		let firstGlyphIndex = pageSelected * cellCount,
			cellIndex = event ? +event.target.id.replace('gfp-g', '') : currentIndex,
			glyphIndex = firstGlyphIndex + cellIndex;
		currentIndex = cellIndex;
		if (glyphIndex < font.numGlyphs) {
			displayGlyph(glyphIndex);
			displayGlyphData(glyphIndex);
		}
	}

	function prepareGlyphList() {
		let indx, canvas,
			marker = document.getElementById('gfp-glyph-list-end'),
			parent = marker.parentElement;
		for (indx = 0; indx < cellCount; indx++) {
			canvas = document.createElement('canvas');
			canvas.width = cellWidth;
			canvas.height = cellHeight;
			canvas.className = 'gfp-item ghd-invert';
			canvas.id = 'gfp-g' + indx;
			canvas.addEventListener('click', cellSelect, false);
			enableHighDPICanvas(canvas);
			parent.insertBefore(canvas, marker);
		}
	}
	/* eslint-enable */

})();
