// ==UserScript==
// @name          GitHub Diff Links
// @version       1.0.0
// @description   A userscript that adds links to diff headers to jump back & forth between files
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @run-at        document-idle
// @grant         GM_addStyle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-links.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/Github-userscripts/master/github-diff-links.user.js
// ==/UserScript==
/* jshint esnext:true */
(() => {
  "use strict";

  // sometimes tooltips are too narrow...
  GM_addStyle(".gh-diff-links:after { min-width: 120px; }");

  const button = document.createElement("a"),
    // button [ InnerHTML, tooltip ]
    nextBtn = ["Next", "Jump to next file\n("],
    prevBtn = ["Prev", "Jump to previous file\n(" ];

  button.className = "btn btn-sm tooltipped tooltipped-s tooltipped-multiline gh-diff-links";
  button.setAttribute("rel", "nofollow");

  function addButton(el, content, link) {
    var txt = (link.textContent || ""),
      btn = button.cloneNode();
    // only add file name to tooltip
    txt = txt.substring(txt.lastIndexOf("/") + 1, txt.length);
    btn.innerHTML = content[0];
    btn.setAttribute("aria-label", content[1] + txt + ")" );
    btn.href = link.href;
    // prepend button
    el.insertBefore(btn, el.childNodes[0]);
  }

  function addLinks() {
    let last,
      diffLinks = $$(".gh-diff-links"),
      links = $$("#toc ol.content li > a");
    // add diff links if they don't already exist
    if (links.length !== diffLinks.length) {
      // remove old links (just in case)
      diffLinks.forEach(el => {
        el.parentNode.removeChild(el);
      });
      // links & file-actions "should" be the same length
      last = links.length - 1;
      $$(".file-actions").forEach((el, indx) => {
        if (indx === 0) {
          addButton(el, nextBtn, links[indx + 1]);
        } else if (indx === last) {
          addButton(el, prevBtn, links[indx - 1]);
        } else {
          addButton(el, nextBtn, links[indx + 1]);
          addButton(el, prevBtn, links[indx - 1]);
        }
      });
    }
  }

  function init() {
    if ($("#files.diff-view")) {
      addLinks();
    }
  }

  function $(selector, el) {
    return (el || document).querySelector(selector);
  }
  function $$(selector, el) {
    return Array.from((el || document).querySelectorAll(selector));
  }

  document.addEventListener("pjax:end", init);
  init();

})();
