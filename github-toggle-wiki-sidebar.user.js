// ==UserScript==
// @name          GitHub Toggle Wiki Sidebar
// @version       1.0.1
// @description   A userscript that adds a button to toggle the GitHub Wiki sidebar
// @license       https://creativecommons.org/licenses/by-sa/4.0/
// @namespace     http://github.com/Mottie
// @include       https://github.com/*
// @run-at        document-idle
// @grant         GM_addStyle
// @grant         GM_getValue
// @grant         GM_setValue
// @author        Rob Garrison
// @updateURL     https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-wiki-sidebar.user.js
// @downloadURL   https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-toggle-wiki-sidebar.user.js
// ==/UserScript==
/* global GM_addStyle, GM_getValue, GM_setValue */
/*jshint unused:true */
(function() {
  "use strict";

  // disable click targeting of button SVG internals
  GM_addStyle(".ghtws-button > * { pointer-events: none; }");

  var busy = false,

  // sidebar state
  isHidden = false,

  toggleIcon = "<svg class='octicon' xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path fill='none' stroke='currentColor' stroke-miterlimit='10' d='M.5 3.5h10v9H.5z'/><path fill='currentColor' stroke='currentColor' stroke-miterlimit='10' d='M7 7.8l1.5-1.2V9zM10.5 3.5h5v9h-5v-9zm4.3 4.3l-4.3-3V11l4.3-3.2z'/></svg>",

  addToggle = function() {
    if (document.querySelector("#wiki-wrapper") && !document.querySelector(".ghtws-button")) {
      busy = true;
      var el = document.querySelector(".gh-header-actions") || document.querySelector(".gh-header-title"),
        button = document.createElement("div");
      button.className = "btn btn-sm tooltipped tooltipped-s ghtws-button";
      button.innerHTML = toggleIcon;
      button.setAttribute("aria-label", "Toggle Sidebar");
      if (el.nodeName === "H1") {
        // non-editable wiki pages
        button.style.float = "right";
        el = el.parentNode;
      }
      // editable wikis have a "header-actions" area
      // prepend button
      el.insertBefore(button, el.childNodes[0]);
      if (isHidden) {
        toggleSidebar();
      }
      busy = false;
    }
  },

  toggleSidebar = function() {
    busy = true;
    var sidebar = document.querySelector("#wiki-rightbar"),
      wrapper = sidebar && sidebar.parentNode;
    if (sidebar) {
      if (isHidden) {
        sidebar.style.display = "none";
        wrapper.classList.remove("has-rightbar");
      } else {
        sidebar.style.display = "";
        wrapper.classList.add("has-rightbar");
      }
      GM_setValue("sidebar-state", isHidden);
    }
    busy = false;
  },

  toggleEvent = function(event) {
    var target = event.target;
    if (target && target.classList.contains("ghtws-button")) {
      isHidden = !isHidden;
      toggleSidebar();
    }
  },

  init = function() {
    busy = true;
    isHidden = GM_getValue("sidebar-state", false);
    document.querySelector("body").addEventListener("click", toggleEvent);
    addToggle();
    // busy = false from addToggle();
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
          addToggle();
        }
      });
    }).observe(target, {
      childList: true,
      subtree: true
    });
  });

  init();

})();
