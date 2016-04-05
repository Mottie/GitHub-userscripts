// ==UserScript==
// @name          GitHub Remove Diff Signs
// @version       1.0.1
// @description   A userscript that removes the "+" and "-" from code diffs
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @grant         none
// @run-at        document-idle
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-remove-diff-signs.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-remove-diff-signs.user.js
// ==/UserScript==
/*jshint unused:true */
(function() {
  "use strict";

  var busy = false,

  processDiff = function() {
    busy = true;
    if (document.querySelector(".highlight")) {
      var indx = 0,

      els = document.querySelectorAll(".blob-code-deletion .blob-code-inner, .blob-code-addition .blob-code-inner"),
      len = els.length,

      // target "+" and "-" at start
      regex = /^[+-]/,

      // loop with delay to allow user interaction
      loop = function() {
        var el, txt,
        // max number of DOM insertions per loop
        max = 0;
        while ( max < 20 && indx < len ) {
          if (indx >= len) { return; }
          el = els[indx];
          txt = el.childNodes[0].textContent;
          el.childNodes[0].textContent = txt.replace(regex, " ");
          max++;
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

  init = function() {
    if (document.querySelector("#files.diff-view")) {
      processDiff();
    }
  },

  // DOM targets - to detect GitHub dynamic ajax page loading
  targets = document.querySelectorAll([
    "#js-repo-pjax-container",
    "#js-pjax-container"
  ].join(","));

  // update TOC when content changes
  Array.prototype.forEach.call(targets, function(target) {
    new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // preform checks before adding code wrap to minimize function calls
        if (!busy && mutation.target === target) {
          init();
        }
      });
    }).observe(target, {
      childList: true,
      subtree: true
    });
  });

  init();

})();
