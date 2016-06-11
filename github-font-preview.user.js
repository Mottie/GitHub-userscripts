// ==UserScript==
// @name          GitHub Font Preview
// @version       1.0.0
// @description   A userscript that adds a font file preview
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @run-at        document-idle
// @grant         GM_addStyle
// @grant         GM_xmlhttpRequest
// @connect       github.com
// @connect       githubusercontent.com
// @require       https://greasyfork.org/scripts/20469-opentype-js/code/opentypejs.js?version=130870
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-font-preview.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-font-preview.user.js
// ==/UserScript==
/* global GM_addStyle, GM_xmlhttpRequest, opentype */
/*jshint unused:true, esnext:true */
(function() {
  'use strict';

  let timer, targets, font,
    busy = false;

  // supported font types
  const fontExt = /\.(otf|ttf|woff)$/i,

  // canvas colors
  bigGlyphStrokeColor  = '#111111', // (big) stroke color
  bigGlyphFillColor    = '#808080', // (big) fill color
  bigGlyphMarkerColor  = '#f00',    // (big) min & max width marker
  miniGlyphMarkerColor = '#606060', // (mini) glyph index (bottom left corner)
  glyphRulerColor      = '#a0a0a0'; // (mini) min & max width marker & (big) glyph horizontal lines

  function getFont(url) {
    if (url) {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        onload : function(response) {
          setupFont(response.response);
        }
      });
    }
  }

  function setupFont(data) {
    busy = true;
    let target = document.querySelector('.file .image');
    if (target) {
      addHTML(target);
      try {
        font = opentype.parse(data);
        showErrorMessage('');
        onFontLoaded(font);
      } catch (err) {
        showErrorMessage(err.toString());
        if (err.stack) {
          console.error(err.stack);
        }
        throw(err);
      }
    }
    busy = false;
  }

  function addHTML(target) {
    let name = document.querySelector('.final-path').textContent || '';
    target.innerHTML = `
      <div id="gfp-wrapper">
        <span class="gfp-info" id="gfp-font-name">${name}</span>
        <div id="gfp-message"></div>
        <hr>
        <div id="gfp-font-data">
          <div class="gfp-collapsed">Font Header table <a href="https://www.microsoft.com/typography/OTSPEC/head.htm" target="_blank">head</a></div>
          <dl id="gfp-head-table"></dl>
          <div class="gfp-collapsed">Horizontal Header table <a href="https://www.microsoft.com/typography/OTSPEC/hhea.htm" target="_blank">hhea</a></div>
          <dl id="gfp-hhea-table"></dl>
          <div class="gfp-collapsed">Maximum Profile table <a href="https://www.microsoft.com/typography/OTSPEC/maxp.htm" target="_blank">maxp</a></div>
          <dl id="gfp-maxp-table"></dl>
          <div class="gfp-collapsed">Naming table <a href="https://www.microsoft.com/typography/OTSPEC/name.htm" target="_blank">name</a></div>
          <dl id="gfp-name-table"></dl>
          <div class="gfp-collapsed">OS/2 and Windows Metrics table <a href="https://www.microsoft.com/typography/OTSPEC/os2.htm" target="_blank">OS/2</a></div>
          <dl id="gfp-os2-table"></dl>
          <div class="gfp-collapsed">PostScript table <a href="https://www.microsoft.com/typography/OTSPEC/post.htm" target="_blank">post</a></div>
          <dl id="gfp-post-table"></dl>
          <div class="gfp-collapsed">Character To Glyph Index Mapping Table <a href="https://www.microsoft.com/typography/OTSPEC/cmap.htm" target="_blank">cmap</a></div>
          <dl id="gfp-cmap-table"></dl>
          <div class="gfp-collapsed">Font Variations table <a href="https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6fvar.html" target="_blank">fvar</a></div>
          <dl id="gfp-fvar-table"></dl>
        </div>
        <hr>
        <div>
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
    let tableHeaders = document.getElementById('gfp-font-data').getElementsByTagName('div'),
      indx = tableHeaders.length;
    while (indx--) {
      tableHeaders[indx].addEventListener('click', function(e) {
        e.target.classList.toggle('gfp-collapsed');
      }, false);
    }
  }

  function init() {
    let name,
      el = document.querySelector('.file .image');
    if (el) {
      name = document.querySelector('.final-path').textContent || '';
      if (name && fontExt.test(name)) {
        getFont(el.querySelector('a').href || '');
      }
    }
  }

  // DOM targets - to detect GitHub dynamic ajax page loading
  targets = document.querySelectorAll([
    '#js-repo-pjax-container',
    '.context-loader-container',
    '[data-pjax-container]'
  ].join(','));

  Array.prototype.forEach.call(targets, function(target) {
    new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // preform checks before adding code wrap to minimize function calls
        if (!busy && mutation.target === target) {
          clearTimeout(timer);
          timer = setTimeout(init, 200);
        }
      });
    }).observe(target, {
      childList: true,
      subtree: true
    });
  });

  init();

  /* Code modified from http://opentype.js.org/ demos */
  GM_addStyle(`
    #gfp-wrapper { text-align:left; }
    #gfp-wrapper canvas { background-image:none !important; background-color:transparent !important; }
    #gfp-message { position:relative; top:-3px; background:red; color:white; padding:1px 5px; font-weight:bold; border-radius:2px; display:none; clear:both; }
    #gfp-glyphs { width:950px; }
    .gfp-info { float:right; font-size:11px; color:#999; }
    hr { clear:both; border:none; border-bottom:1px solid #ccc; margin:20px 0 20px 0; padding:0; }
    /* Font Inspector */
    #gfp-font-data div { font-weight:normal; margin:0; cursor:pointer; }
    #gfp-font-data div:before { font-size:85%; content:'▼ '; }
    #gfp-font-data div.gfp-collapsed:before { font-size:85%; content:'► '; }
    #gfp-font-data div.gfp-collapsed + dl { display:none; }
    #gfp-font-data dl { margin-top:0; padding-left:2em; color:#707070; }
    #gfp-font-data dt { float:left; }
    #gfp-font-data dd { margin-left: 12em; }
    #gfp-font-data .gfp-langtag { font-size:85%; color:#999; white-space:nowrap; }
    #gfp-font-data .gfp-langname { padding-right:0.5em; }
    /* Glyph Inspector */
    #gfp-pagination span { margin:0 0.3em; color:#505050; cursor:pointer; }
    #gfp-pagination span.gfp-page-selected { font-weight:bold; -webkit-filter:brightness(150%); filter:brightness(150%); }
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
  `);

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
              html += value.map(function(item) {
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
    cellWidth = 44,
    cellHeight = 40,
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
    if (pixelRatio === 1) { return; }
    oldWidth = canvas.width;
    oldHeight = canvas.height;
    canvas.width = oldWidth * pixelRatio;
    canvas.height = oldHeight * pixelRatio;
    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';
    canvas.getContext('2d').scale(pixelRatio, pixelRatio);
  }

  function showErrorMessage(message) {
    let el = document.getElementById('gfp-message');
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
    return '<pre class="gfp-contour">' + contour.map(function(point) {
      // ".alert.tip" class modified by GitHub Dark style - more readable blue
      // ".cdel" class modified by GitHub Dark style - more readable red
      return '<span class="gfp-' + (point.onCurve ? 'oncurve alert tip' : 'offcurve cdel') +
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
      container = document.getElementById('gfp-glyph-data');
    if (glyphIndex < 0) {
      container.innerHTML = '';
      return;
    }
    glyph = font.glyphs.get(glyphIndex);
    html = '<dt>name</dt><dd>' + glyph.name + '</dd>';
    if (glyph.unicodes.length > 0) {
      html += '<dt>unicode</dt><dd>' + glyph.unicodes.map(formatUnicode).join(', ') + '</dd>';
    }
    html += '<dl><dt>index</dt><dd>' + glyph.index + '</dd>';
    if (glyph.xMin !== 0 || glyph.xMax !== 0 || glyph.yMin !== 0 || glyph.yMax !== 0) {
      html += '<dt>xMin</dt><dd>' + glyph.xMin + '</dd>' +
        '<dt>xMax</dt><dd>' + glyph.xMax + '</dd>' +
        '<dt>yMin</dt><dd>' + glyph.yMin + '</dd>' +
        '<dt>yMax</dt><dd>' + glyph.yMax + '</dd>';
    }
    html += '<dt>advanceWidth</dt><dd>' + glyph.advanceWidth + '</dd>';
    if (glyph.leftSideBearing !== undefined) {
      html += '<dt>leftSideBearing</dt><dd>' + glyph.leftSideBearing + '</dd>';
    }
    html += '</dl>';
    if (glyph.numberOfContours > 0) {
      contours = glyph.getContours();
      html += 'contours:<br>' + contours.map(contourToString).join('\n');
    } else if (glyph.isComposite) {
      html += '<br>This composite glyph is a combination of :<ul><li>' +
        glyph.components.map(function(component) {
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
    arrows.forEach(function(arrow) {
      drawArrow.apply(null, arrow);
    });
  }

  function displayGlyph(glyphIndex) {
    let glyph, glyphWidth, xmin, xmax, x0, markSize, path,
      canvas = document.getElementById('gfp-glyph'),
      ctx = canvas.getContext('2d'),
      width = canvas.width / pixelRatio,
      height = canvas.height / pixelRatio;
    ctx.clearRect(0, 0, width, height);
    if (glyphIndex < 0) { return; }
    glyph = font.glyphs.get(glyphIndex);
    glyphWidth = glyph.advanceWidth * glyphScale;
    xmin = (width - glyphWidth)/2;
    xmax = (width + glyphWidth)/2;
    x0 = xmin;
    markSize = 10;

    ctx.fillStyle = bigGlyphMarkerColor;
    ctx.fillRect(xmin-markSize+1, glyphBaseline, markSize, 1);
    ctx.fillRect(xmin, glyphBaseline, 1, markSize);
    ctx.fillRect(xmax, glyphBaseline, markSize, 1);
    ctx.fillRect(xmax, glyphBaseline, 1, markSize);
    ctx.textAlign = 'center';
    ctx.fillText('0', xmin, glyphBaseline + markSize + 10);
    ctx.fillText(glyph.advanceWidth, xmax, glyphBaseline + markSize + 10);

    ctx.fillStyle = bigGlyphStrokeColor;
    path = glyph.getPath(x0, glyphBaseline, glyphSize);
    path.fill = bigGlyphFillColor;
    path.stroke = bigGlyphStrokeColor;
    path.strokeWidth = 1.5;
    drawPathWithArrows(ctx, path);
    glyph.drawPoints(ctx, x0, glyphBaseline, glyphSize);
  }

  function renderGlyphItem(canvas, glyphIndex) {
    const cellMarkSize = 4,
      ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, cellWidth, cellHeight);
    if (glyphIndex >= font.numGlyphs) { return; }

    ctx.fillStyle = miniGlyphMarkerColor;
    ctx.font = '9px sans-serif';
    ctx.fillText(glyphIndex, 1, cellHeight-1);
    let glyph = font.glyphs.get(glyphIndex),
      glyphWidth = glyph.advanceWidth * fontScale,
      xmin = (cellWidth - glyphWidth) / 2,
      xmax = (cellWidth + glyphWidth) / 2,
      x0 = xmin;

    ctx.fillStyle = glyphRulerColor;
    ctx.fillRect(xmin-cellMarkSize+1, fontBaseline, cellMarkSize, 1);
    ctx.fillRect(xmin, fontBaseline, 1, cellMarkSize);
    ctx.fillRect(xmax, fontBaseline, cellMarkSize, 1);
    ctx.fillRect(xmax, fontBaseline, 1, cellMarkSize);

    ctx.fillStyle = '#000000';
    glyph.draw(ctx, x0, fontBaseline, fontSize);
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
    document.getElementsByClassName('gfp-page-selected')[0].className = '';
    displayGlyphPage((event.target.id || '').replace('gfp-p', ''));
  }

  function initGlyphDisplay() {
    let glyphBgCanvas = document.getElementById('gfp-glyph-bg'),
      w = glyphBgCanvas.width / pixelRatio,
      h = glyphBgCanvas.height / pixelRatio,
      glyphW = w - glyphMargin*2,
      glyphH = h - glyphMargin*2,
      head = font.tables.head,
      maxHeight = head.yMax - head.yMin,
      ctx = glyphBgCanvas.getContext('2d');

    glyphScale = Math.min(glyphW/(head.xMax - head.xMin), glyphH/maxHeight);
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

    fontScale = Math.min(w/(head.xMax - head.xMin), h/maxHeight);
    fontSize = fontScale * font.unitsPerEm;
    fontBaseline = cellMarginTop + h * head.yMax / maxHeight;
    pagination.innerHTML = '';

    for (indx = 0; indx < numPages; indx++) {
      link = document.createElement('span');
      lastIndex = Math.min(font.numGlyphs - 1, (indx + 1) * cellCount - 1);
      link.textContent = indx * cellCount + '-' + lastIndex;
      link.id = 'gfp-p' + indx;
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
    if (!font) { return; }
    let firstGlyphIndex = pageSelected * cellCount,
      cellIndex = +event.target.id.replace('gfp-g', ''),
      glyphIndex = firstGlyphIndex + cellIndex;
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

})();
