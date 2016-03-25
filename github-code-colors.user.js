// ==UserScript==
// @name          GitHub Code Colors
// @version       1.0.1
// @description   A userscript that adds a color swatch next to the code color definition
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @grant         GM_addStyle
// @run-at        document-idle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-colors.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-code-colors.user.js
// ==/UserScript==
/* global GM_addStyle */
(function() {
  "use strict";

  GM_addStyle(".ghcc-block { width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px; border:1px solid #555; }");

  var busy = false,

  namedColors = [
    "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanchedalmond",
    "blue", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "chocolate", "coral",
    "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray",
    "darkgreen", "darkkhaki", "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred",
    "darksalmon", "darkseagreen", "darkslateblue", "darkslategray", "darkturquoise", "darkviolet", "deeppink",
    "deepskyblue", "dimgray", "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro",
    "ghostwhite", "gold", "goldenrod", "gray", "green", "greenyellow", "honeydew", "hotpink", "indianred",
    "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue",
    "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightpink", "lightsalmon",
    "lightseagreen", "lightskyblue", "lightslategray", "lightsteelblue", "lightyellow", "lime", "limegreen",
    "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple",
    "mediumseagreen", "mediumslateblue", "mediumspringgreen", "mediumturquoise", "mediumvioletred",
    "midnightblue", "mintcream", "mistyrose", "moccasin", "navajowhite", "navy", "oldlace", "olive",
    "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise",
    "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple",
    "rebeccapurple", "red", "rosybrown", "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen",
    "seashell", "sienna", "silver", "skyblue", "slateblue", "slategray", "snow", "springgreen", "steelblue",
    "tan", "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white", "whitesmoke", "yellow",
    "yellowgreen"
  ].join("|"),

  hasClass = function(el, name) {
    if (el) {
      return el.classList ? el.classList.contains(name) : new RegExp("\\b" + name + "\\b").test(el.className);
    }
    return false;
  },

  addColors = function() {
    busy = true;
    if (document.querySelector(".highlight")) {
      var addNode, loop,
      indx = 0,
      regexNamed = new RegExp("^(" + namedColors + ")$", "i"),
      // #123, #123456 or 0x123456 (unix style colors, used by three.js)
      regexHex = /^(#|0x)([0-9A-F]{6}|[0-9A-F]{3})$/i,
      // rgb(0,0,0) or rgba(0,0,0,0.2)
      regexRGB = /^rgba?(\([^\)]+\))?/i,
      // hsl(0,0%,0%) or hsla(0,0%,0%,0.2);
      regexHSL = /^hsla?(\([^\)]+\))?/i,

      // misc regex
      regexQuotes = /[\'\"]/g,
      regexUnix = /^0x/,
      regexPercent = /%%/g,

      // .pl-c1 targets css hex colors, "rgb" and "hsl"
      // .pl-en targets p5.js function names
      els = document.querySelectorAll(".pl-c1, .pl-s"),
      len = els.length,

      // don't use a div, because GitHub-Dark adds a :hover background color definition on divs
      block = document.createElement("span");
      block.className = "ghcc-block";

      addNode = function(el, val) {
        var node = block.cloneNode();
        node.style.backgroundColor = val;
        // don't add node if color is invalid
        if (node.style.backgroundColor !== "") {
          el.insertBefore(node, el.childNodes[0]);
        }
      };

      // loop with delay to allow user interaction
      loop = function() {
        var el, txt, tmp,
        // max number of DOM insertions per loop
        max = 0;
        while ( max < 20 && indx < len ) {
          if (indx >= len) { return; }
          el = els[indx];
          txt = el.textContent;
          if (hasClass(el, "pl-s")) {
            txt = txt.replace(regexQuotes, "");
          }
          if (regexHex.test(txt) || regexNamed.test(txt)) {
            if (!el.querySelector(".ghcc-block")) {
              addNode(el, txt.replace(regexUnix, "#"));
              max++;
            }
          } else if (regexRGB.test(txt)) {
            if (!el.querySelector(".ghcc-block")) {
              txt = hasClass(el, "pl-s") ?
                // color in a string contains everything
                txt.match(regexRGB)[0] :
                txt + "(" + els[++indx].textContent + ")";
              addNode(el, txt);
              max++;
            }
          } else if (regexHSL.test(txt)) {
            if (!el.querySelector(".ghcc-block")) {
              tmp = /a$/i.test(txt);
              txt = hasClass(el, "pl-s") ?
                // color in a string contains everything
                txt.match(regexHSL)[0] :
                // traverse this HTML... & els only contains the pl-c1 nodes
                // <span class="pl-c1">hsl</span>(<span class="pl-c1">1</span>,
                // <span class="pl-c1">1</span><span class="pl-k">%</span>,
                // <span class="pl-c1">1</span><span class="pl-k">%</span>);
                txt + "(" + els[++indx].textContent + "," + els[++indx].textContent + "%," +
                  // hsla needs one more parameter
                  els[++indx].textContent + "%" + (tmp ? "," + els[++indx].textContent : "") + ")";
              // sometimes (previews only?) the .pl-k span is nested inside the .pl-c1 span,
              // so we end up with "%%"
              addNode(el, txt.replace(regexPercent, "%"));
              max++;
            }
          }
          indx++;
        }
        if (indx < len) {
          setTimeout(function(){
            loop();
          }, 200);
        }
      };
      loop();
    }
    busy = false;
  },
  targets = document.querySelectorAll("#js-repo-pjax-container, #js-pjax-container, .js-preview-body");

  Array.prototype.forEach.call(targets, function(target) {
    new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // preform checks before adding code wrap to minimize function calls
        if (!busy && mutation.target === target) {
          addColors();
        }
      });
    }).observe(target, {
      childList: true,
      subtree: true
    });
  });

  addColors();

})();
